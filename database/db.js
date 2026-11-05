'use strict';
const mysql = require('mysql2/promise');
const fs = require('node:fs');
const path = require('node:path');
const columns = require('./columns.json');
const configPath = process.env.SIAR_CONFIG || path.join(__dirname, '../config.json');
const config = JSON.parse(fs.readFileSync(fs.existsSync(configPath) ? configPath : path.join(__dirname, '../config.example.json'), 'utf8'));
if (!/^[a-zA-Z0-9_]+$/.test(config.database)) throw new Error('Nombre de base de datos inválido.');
let connection;
const booleanFields = new Set(['enabled','deleted','occupied','sent','available']);
function normalize(db) {
  db.users.forEach(u => { u.enabled ??= true; u.deleted ??= false; u.recoveryHash ??= null; u.recoveryExpires ??= null; });
  db.products.forEach(p => { p.available ??= true; p.category ??= 'General'; p.deleted ??= false; });
  db.inventory.forEach(i => i.deleted ??= false);
  db.reservations ??= [];
  return db;
}
async function open(create = false) {
  connection = await mysql.createConnection({...config, database: create ? undefined : config.database, decimalNumbers:true});
  if (create) { await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`); await connection.query(`USE \`${config.database}\``); }
  // Solo un servidor SIAR puede modificar esta base a la vez.
  const [[lock]] = await connection.execute('SELECT GET_LOCK(?, 0) AS acquired', ['siar_' + config.database]);
  if (lock.acquired !== 1) { await connection.end(); throw new Error('Esta base está abierta en otro servidor SIAR. Ciérralo primero.'); }
  if (create) for (const sql of fs.readFileSync(path.join(__dirname,'schema.sql'),'utf8').split(';').filter(s=>s.trim())) await connection.query(sql);
  if(create) {
    const [fields]=await connection.execute('SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?',[config.database,'products','available']);
    if(!fields.length)await connection.query('ALTER TABLE products ADD COLUMN available BOOLEAN NOT NULL DEFAULT 1');
  }
}
async function load() {
  const [[meta]] = await connection.query('SELECT version FROM meta WHERE id=1');
  if (!meta) return null;
  const db = {version:meta.version};
  for (const [table, fields] of Object.entries(columns)) {
    const [rows] = await connection.query(`SELECT * FROM \`${table}\` ORDER BY id`);
    db[table] = rows.map(row => { for (const key of fields) if(booleanFields.has(key)) row[key] = Boolean(row[key]); return row; });
  }
  for (const table of ['orders','invoices']) {
    const [items] = await connection.query(`SELECT * FROM \`${table}_items\` ORDER BY parentId, productId`);
    db[table].forEach(o => o.items = items.filter(i=>i.parentId === o.id).map(({parentId,...item})=>item));
  }
  return normalize(db);
}
async function save(db, replaceEmpty = false) {
  normalize(db);
  await connection.beginTransaction();
  try {
    if(replaceEmpty) for(const table of ['reservations','invoices_items','orders_items','invoices','movements','orders','audit','inventory','products','tables','users','meta']) await connection.query('DELETE FROM `'+table+'`');
    for (const [table, fields] of Object.entries(columns)) {
      for (const row of db[table]) {
        const keys=['id',...fields];
        await connection.execute(`INSERT INTO \`${table}\` (${keys.map(k=>'`'+k+'`').join(',')}) VALUES (${keys.map(()=>'?').join(',')}) ON DUPLICATE KEY UPDATE ${fields.map(k=>'`'+k+'`=VALUES(`'+k+'`)').join(',')}`, keys.map(k=>row[k] === undefined ? null : typeof row[k] === 'boolean' ? Number(row[k]) : k === 'record' ? String(row[k]) : row[k]));
      }
    }
    for (const table of ['orders','invoices']) for (const o of db[table]) {
      await connection.execute(`DELETE FROM \`${table}_items\` WHERE parentId=?`, [o.id]);
      for(const i of o.items) await connection.execute(`INSERT INTO \`${table}_items\` (parentId,productId,name,price,quantity) VALUES (?,?,?,?,?)`, [o.id,i.productId,i.name,i.price,i.quantity]);
    }
    await connection.execute('INSERT INTO meta (id,version) VALUES (1,?) ON DUPLICATE KEY UPDATE version=VALUES(version)', [db.version]);
    await connection.commit();
  } catch(e) { await connection.rollback(); throw e; }
}
async function close() { if(connection) await connection.end(); }
module.exports = {open,load,save,close,normalize,config};
