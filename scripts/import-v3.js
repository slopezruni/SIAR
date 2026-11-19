'use strict';
const fs=require('node:fs');
const storage=require('../database/db');
(async()=>{try {
 const file=process.argv[2]; if(!file) throw new Error('Uso: npm run importar -- "ruta/siar.json"');
 const data=JSON.parse(fs.readFileSync(file,'utf8'));
 for(const key of ['users','tables','products','inventory','orders','movements','invoices','audit']) if(!Array.isArray(data[key])) throw new Error('El archivo no es una copia completa de SIAR v3.');
 if(!data.users.some(u=>u.role==='administrador' && u.enabled!==false && !u.deleted)) throw new Error('La copia necesita un administrador activo.');
 await storage.open(true); const existing=await storage.load();
 if(existing && (existing.users.length || existing.orders.length || existing.movements.length || existing.invoices.length || existing.audit.length || existing.reservations.length)) throw new Error('Solo se importa sobre una base nueva, antes de crear cuentas o registrar operaciones. Usa otra base vacía.');
 await storage.save(data,true); console.log('Importación terminada. Se conservaron usuarios, contraseñas e historial. El JSON original no se modificó.');
 } finally {await storage.close();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
