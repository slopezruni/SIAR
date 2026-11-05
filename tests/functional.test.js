'use strict';
const test=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'), os=require('node:os'), path=require('node:path');
const {spawn,spawnSync}=require('node:child_process');
const mysql=require('mysql2/promise');
const root=path.resolve(__dirname,'..');
test('SIAR: usuarios, roles, recuperación, menú, inventario, venta y persistencia MySQL', {timeout:120000}, async()=>{
 const settings=JSON.parse(fs.readFileSync(process.env.SIAR_CONFIG || path.join(root,fs.existsSync(path.join(root,'config.json'))?'config.json':'config.example.json')));
 const database='siar_test_'+Date.now();const dir=fs.mkdtempSync(path.join(os.tmpdir(),'siar-test-'));const configFile=path.join(dir,'config.json');
 fs.writeFileSync(configFile,JSON.stringify({...settings,database}));
 const env={...process.env,SIAR_CONFIG:configFile,PORT:'3097'};
 const timings=[];
 let child;let admin;let setupCode;
 async function start(){child=spawn(process.execPath,['server.js'],{cwd:root,env,stdio:['ignore','pipe','pipe']});let output='';await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error(output || 'Servidor no inició')),15000);child.stdout.on('data',b=>{output+=b;if(output.includes('SIAR:'))setTimeout(()=>{clearTimeout(timer);setupCode=output.match(/administrador: ([A-Fa-f0-9]+)/)?.[1];resolve();},30);});child.stderr.on('data',b=>output+=b);child.once('exit',()=>{clearTimeout(timer);reject(new Error(output));});});}
 async function stop(){if(child && child.exitCode===null)await new Promise(r=>{child.once('exit',r);child.kill();});}
 async function request(url,method='GET',body,session,status=200){const started=performance.now();const r=await fetch('http://localhost:3097'+url,{method,headers:{'Content-Type':'application/json',...(session?{Cookie:session.cookie,'X-CSRF-Token':session.csrf}:{})},body:body===undefined?undefined:JSON.stringify(body)});const data=await r.json();timings.push(performance.now()-started);assert.equal(r.status,status,JSON.stringify({url,data}));return {data,cookie:r.headers.get('set-cookie')?.split(';')[0]};}
 async function login(username,password){const r=await request('/api/login','POST',{username,password});return {cookie:r.cookie,csrf:r.data.csrf};}
 try {
  const initialized=spawnSync(process.execPath,['scripts/init-db.js'],{cwd:root,env,encoding:'utf8'});assert.equal(initialized.status,0,initialized.stderr);
  await start();assert(setupCode);
  await request('/api/state','GET',undefined,null,401);
  await request('/api/register','POST',{name:'Admin',username:'admin',password:'Administrador2026!',setupToken:'wrong'},null,403);
  const created=await request('/api/register','POST',{name:'Admin',username:'admin',password:'Administrador2026!',setupToken:setupCode});assert(created.data.recoveryCode);
  admin=await login('admin','Administrador2026!');
  await request('/api/users','POST',{name:'Sin permiso'},{...admin,csrf:'bad'},403);
  const pending=await request('/api/register','POST',{name:'Mesera',username:'mesera',password:'Mesera2026!',role:'administrador'});
  await request('/api/login','POST',{username:'mesera',password:'Mesera2026!'},null,401);
  let state=(await request('/api/state','GET',undefined,admin)).data;const mesera=state.users.find(u=>u.username==='mesera');assert.equal(mesera.role,'mesero');assert.equal(mesera.enabled,false);assert(!JSON.stringify(state).includes('recoveryHash'));
  await request('/api/users/'+mesera.id,'PUT',{name:'Mesera',role:'mesero',enabled:true},admin);
  const waiter=await login('mesera','Mesera2026!');
  const cook=(await request('/api/users','POST',{name:'Cocinero',username:'cocina',password:'Cocina2026!',role:'cocinero'},admin)).data.user;
  const cashier=(await request('/api/users','POST',{name:'Caja',username:'caja',password:'Cajero2026!',role:'cajero'},admin)).data.user;
  const kitchen=await login('cocina','Cocina2026!');const cash=await login('caja','Cajero2026!');
  await request('/api/users/'+1,'DELETE',{},admin,400);
  await request('/api/users','POST',{name:'Hack',username:'hack',password:'Password2026!',role:'administrador'},waiter,403);
  await request('/api/inventory','POST',{name:'No',category:'No',unit:'kg',minimum:0},cash,403);
  const reset=(await request('/api/users/'+cook.id+'/recovery','POST',{},admin)).data.recoveryCode;
  await request('/api/recover','POST',{username:'cocina',code:'bad',password:'NuevaCocina2026!'},null,400);
  const recovered=await request('/api/recover','POST',{username:'cocina',code:reset,password:'NuevaCocina2026!'});assert(recovered.data.recoveryCode);
  await request('/api/recover','POST',{username:'cocina',code:reset,password:'OtraCocina2026!'},null,400);
  await request('/api/state','GET',undefined,kitchen,401);
  const newKitchen=await login('cocina','NuevaCocina2026!');
  const product=(await request('/api/products','POST',{name:'Arroz',category:'Platos',price:'12345.67'},admin)).data;
  await request('/api/products/'+product.id,'PUT',{name:'Arroz especial',category:'Platos',price:'15000'},admin);
  await request('/api/products','POST',{name:'Arroz especial',category:'Platos',price:'3'},admin,400);
  await request('/api/products/'+product.id,'PUT',{name:'Arroz especial',category:'Platos',price:'15000',available:false},admin);
  await request('/api/orders','POST',{tableId:2,items:[{productId:product.id,quantity:1}]},waiter,400);
  await request('/api/products/'+product.id,'PUT',{name:'Arroz especial',category:'Platos',price:'15000',available:true},admin);
  await request('/api/tables','POST',{floor:1,capacity:4},waiter,403);
  const newTable=(await request('/api/tables','POST',{floor:1,capacity:4},admin)).data;
  await request('/api/tables/'+newTable.id+'/details','PUT',{floor:2,capacity:6},admin);
  const reservationBody={tableId:newTable.id,customer:'Reserva prueba',partySize:4,at:new Date(Date.now()+3600000).toISOString()};
  const reservation=(await request('/api/reservations','POST',reservationBody,waiter)).data;
  await request('/api/reservations','POST',reservationBody,waiter,409);
  await request('/api/tables/'+newTable.id+'/details','PUT',{floor:1,capacity:5},admin,409);
  await request('/api/tables/'+newTable.id,'PUT',{occupied:true},waiter,409);
  await request('/api/orders','POST',{tableId:newTable.id,items:[{productId:1,quantity:1}]},waiter,409);
  await request('/api/reservations/'+reservation.id+'/action','POST',{action:'cancel'},waiter);
  await request('/api/reservations/'+reservation.id+'/action','POST',{action:'attend'},waiter,409);
  const second=(await request('/api/reservations','POST',reservationBody,waiter)).data;
  await request('/api/reservations/'+second.id+'/action','POST',{action:'attend'},waiter);
  await request('/api/tables/'+newTable.id,'PUT',{occupied:false},waiter);
  const item=(await request('/api/inventory','POST',{name:'Sal prueba',category:'Condimentos',unit:'kg',minimum:1},newKitchen)).data;
  await request('/api/inventory/'+item.id,'PUT',{name:'Sal fina',category:'Condimentos',minimum:2},newKitchen);
  await request('/api/movements','POST',{itemId:item.id,type:'Entrada',quantity:5,reason:'Compra'},newKitchen);
  await request('/api/inventory/'+item.id,'DELETE',{},admin,400);
  await request('/api/movements','POST',{itemId:item.id,type:'Salida',quantity:6,reason:'Uso'},newKitchen,400);
  await request('/api/movements','POST',{itemId:item.id,type:'Salida',quantity:5,reason:'Uso'},newKitchen);
  await request('/api/inventory/'+item.id,'DELETE',{},admin);
  await request('/api/movements','POST',{itemId:item.id,type:'Entrada',quantity:1,reason:'Error'},newKitchen,400);
  const order=(await request('/api/orders','POST',{tableId:1,customer:'Cliente prueba',notes:'Sin salsa',items:[{productId:product.id,quantity:2}]},waiter)).data;
  await request('/api/orders','POST',{tableId:1,items:[{productId:1,quantity:1}]},waiter,409);
  await request('/api/orders/'+order.id+'/action','POST',{action:'ready'},waiter,403);
  await request('/api/orders/'+order.id+'/action','POST',{action:'send'},waiter);
  await request('/api/orders/'+order.id+'/action','POST',{action:'prepare'},newKitchen);
  await request('/api/orders/'+order.id+'/action','POST',{action:'ready'},newKitchen);
  await request('/api/orders/'+order.id+'/action','POST',{action:'deliver'},waiter);
  const body={orderId:order.id,customer:'Cliente prueba',document:'TEST',method:'Efectivo',received:'40000',discount:'1000',taxRate:8,items:[{productId:product.id,quantity:2,unitPrice:'15000'}]};
  await request('/api/invoices','POST',body,waiter,403);
  const preview=(await request('/api/invoices/preview','POST',body,cash)).data;assert.equal(preview.total,3132000);
  await request('/api/invoices','POST',{...body,received:'1'},cash,400);
  const invoice=(await request('/api/invoices','POST',body,cash)).data;assert.equal(invoice.change,868000);
  await request('/api/invoices','POST',body,cash,409);
  await request('/api/products/'+product.id,'DELETE',{},admin);
  state=(await request('/api/state','GET',undefined,admin)).data;assert(!state.products.some(p=>p.id===product.id));assert(!state.inventory.some(i=>i.id===item.id));assert(state.movements.some(m=>m.itemId===item.id));assert.equal(state.tables[0].occupied,false);assert.equal(state.invoices[0].items[0].name,'Arroz especial');
  await request('/api/users/'+cashier.id,'DELETE',{},admin);await request('/api/state','GET',undefined,cash,401);
  // Solicitudes concurrentes no pierden entradas.
  await Promise.all([1,2].map(n=>request('/api/movements','POST',{itemId:1,type:'Entrada',quantity:n,reason:'Concurrencia'},admin)));
  await stop();await start();admin=await login('admin','Administrador2026!');state=(await request('/api/state','GET',undefined,admin)).data;
  assert.equal(state.invoices[0].total,3132000);assert.equal(state.inventory.find(i=>i.id===1).stock,27);assert(!state.users.some(u=>u.id===cashier.id));
  if(process.env.SIAR_EVIDENCE_DIR){fs.mkdirSync(process.env.SIAR_EVIDENCE_DIR,{recursive:true});fs.writeFileSync(path.join(process.env.SIAR_EVIDENCE_DIR,'rendimiento.json'),JSON.stringify({ambiente:'Prueba local, datos ficticios, sin carga masiva',solicitudes:timings.length,maximoMs:Math.round(Math.max(...timings)*100)/100,promedioMs:Math.round(timings.reduce((a,b)=>a+b,0)/timings.length*100)/100,todasMenoresATresSegundos:timings.every(t=>t<3000)},null,2));}
  console.log('OK: registro, aprobación, 4 roles, recuperación de un uso, CRUD, límites de stock, flujo de venta, factura, concurrencia y reinicio SQL.');
 } finally {
  await stop();const c=await mysql.createConnection({...settings,database:undefined});await c.query('DROP DATABASE IF EXISTS `'+database+'`');await c.end();fs.rmSync(dir,{recursive:true,force:true});
 }
});
