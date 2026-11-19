'use strict';
const storage=require('../database/db');
const {initialData}=require('../server');
(async()=>{try {await storage.open(true); if(await storage.load()) console.log('La base ya existe. No se modificaron sus datos.'); else {await storage.save(initialData()); console.log('Base creada. Ejecuta npm start y crea el primer administrador.');}} finally {await storage.close();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
