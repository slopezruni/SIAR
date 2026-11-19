'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),os=require('os'),path=require('path');const {spawnSync}=require('child_process');const mysql=require('mysql2/promise');const {initialData,passwordHash}=require('../server');
test('Actualización v4 e importación v3 conservan los registros',async()=>{
 const root=path.resolve(__dirname,'..'),settings=JSON.parse(fs.readFileSync(process.env.SIAR_CONFIG||path.join(root,fs.existsSync(path.join(root,'config.json'))?'config.json':'config.example.json')));const name='siar_migration_'+Date.now(),dir=fs.mkdtempSync(path.join(os.tmpdir(),'siar-migration-'));const cfg=path.join(dir,'config.json');fs.writeFileSync(cfg,JSON.stringify({...settings,database:name}));const env={...process.env,SIAR_CONFIG:cfg};const c=await mysql.createConnection({...settings,database:undefined});
 const run=(script,args=[])=>spawnSync(process.execPath,[script,...args],{cwd:root,env,encoding:'utf8'});
 try {
  let result=run('scripts/init-db.js');assert.equal(result.status,0,result.stderr);
  await c.query('ALTER TABLE `'+name+'`.products DROP COLUMN available');await c.query('DROP TABLE `'+name+'`.reservations');
  result=run('scripts/init-db.js');assert.equal(result.status,0,result.stderr);
  const [[row]]=await c.query('SELECT COUNT(*) AS total,SUM(available) AS available FROM `'+name+'`.products');assert.equal(row.total,4);assert.equal(Number(row.available),4);
  const d=initialData();delete d.reservations;d.users=[{id:1,name:'Admin',username:'admin',role:'administrador',salt:'test',hash:passwordHash('Admin2026!','test')}];d.orders=[{id:1,tableId:1,customer:'Ejemplo',notes:'',items:[{productId:1,name:'Hamburguesa',price:2100000,quantity:1}],status:'Facturado',sent:true,at:new Date().toISOString(),author:'admin'}];d.invoices=[{id:1,orderId:1,tableId:1,items:d.orders[0].items,subtotal:2100000,discount:0,taxRate:0,tax:0,total:2100000,customer:'Ejemplo',document:'',method:'Efectivo',received:2200000,change:100000,actor:'admin',at:new Date().toISOString()}];const original=JSON.stringify(d),file=path.join(dir,'v3.json');fs.writeFileSync(file,original);
  result=run('scripts/import-v3.js',[file]);assert.equal(result.status,0,result.stderr);assert.equal(fs.readFileSync(file,'utf8'),original);const [[invoice]]=await c.query('SELECT total FROM `'+name+'`.invoices WHERE id=1');assert.equal(invoice.total,2100000);assert.equal(run('scripts/import-v3.js',[file]).status,1);
  result=run('scripts/init-db.js');assert.equal(result.status,0,result.stderr);const [[after]]=await c.query('SELECT COUNT(*) AS total FROM `'+name+'`.invoices');assert.equal(after.total,1);
 }finally{await c.query('DROP DATABASE IF EXISTS `'+name+'`');await c.end();fs.rmSync(dir,{recursive:true,force:true});}
});
