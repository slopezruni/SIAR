'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const rules=require('../services/restaurant'),A=require('../public/js/analytics');
const table={id:1,capacity:4,occupied:false},now=Date.parse('2030-01-01T10:00:00Z');
const body={customer:'Ana',partySize:3,at:'2030-01-01T12:00:00Z',endAt:'2030-01-01T14:00:00Z'};
function db(){return {tables:[{...table}],orders:[],reservations:[{id:1,...body,tableId:1,status:'Reservada'}]};}
test('Agenda: bloquea solapamiento parcial, total y contenido',()=>{
 for(const [at,endAt] of [['11:00','13:00'],['13:00','15:00'],['12:30','13:00'],['11:00','15:00']]){
  assert.throws(()=>rules.reservationData(db(),table,{...body,at:'2030-01-01T'+at+':00Z',endAt:'2030-01-01T'+endAt+':00Z'},now),/horario/);
 }
});
test('Agenda: permite intervalos contiguos, otra mesa y cancelar',()=>{
 assert.equal(rules.reservationData(db(),table,{...body,at:body.endAt,endAt:'2030-01-01T16:00:00Z'},now).status,'Reservada');
 assert.equal(rules.reservationData(db(),{...table,id:2},body,now).tableId,2);
 const d=db();d.reservations[0].status='Cancelada';assert.doesNotThrow(()=>rules.reservationData(d,table,body,now));
});
test('Agenda: edición excluye solo su registro y mantiene conflictos ajenos',()=>{
 assert.doesNotThrow(()=>rules.reservationData(db(),table,body,now,1));
 const d=db();d.reservations.push({...d.reservations[0],id:2});
 assert.throws(()=>rules.reservationData(d,table,body,now,1),/horario/);
});
test('Agenda: rechaza fechas, duración, nombre y capacidad inválidos',()=>{
 for(const b of [{...body,endAt:body.at},{...body,endAt:'invalid'},{...body,endAt:'2030-01-02T12:00:00Z'},{...body,at:'2029-01-01'},{...body,customer:' '},{...body,partySize:5}])assert.throws(()=>rules.reservationData({reservations:[]},table,b,now));
});
test('Plano: solo bloquea durante el intervalo; conserva reservas antiguas por dos horas',()=>{
 const d=db();assert.equal(rules.pendingReservation(d,1,now),undefined);
 assert.equal(rules.pendingReservation(d,1,Date.parse(body.at)).id,1);
 assert.equal(rules.pendingReservation(d,1,Date.parse(body.endAt)),undefined);
 delete d.reservations[0].endAt;assert.equal(rules.endTime(d.reservations[0]),Date.parse(body.endAt));
});
test('Llegada: requiere horario actual y mesa sin pedidos ni ocupación',()=>{
 const d=db(),r=d.reservations[0],at=Date.parse(body.at);
 assert.doesNotThrow(()=>rules.attendable(d,r,at));
 assert.throws(()=>rules.attendable(d,r,now),/horario/);
 assert.throws(()=>rules.attendable(d,r,Date.parse(body.endAt)),/horario/);
 d.tables[0].occupied=true;assert.throws(()=>rules.attendable(d,r,at),/ocupada/);
 d.tables[0].occupied=false;d.orders.push({tableId:1,status:'Entregado'});assert.throws(()=>rules.attendable(d,r,at),/ocupada/);
});
test('Reportes: filtra fechas, suma centavos y agrupa productos por ID',()=>{
 const base={at:'2030-01-02T12:00:00Z',subtotal:2000,discount:200,tax:180,total:1980,items:[{productId:1,name:'Plato',quantity:2,price:1000}]};
 const data={invoices:[base,{...base,items:[{productId:1,name:'Renombrado',quantity:1,price:2000}]},{...base,at:'2031-01-02T12:00:00Z'}],movements:[{at:base.at},{at:'2031-01-02T12:00:00Z'}]};
 const r=A.summarize(data,'2030-01-01','2030-01-31');assert.equal(r.total,3960);assert.equal(r.discount,400);assert.equal(r.tax,360);assert.equal(r.products.length,1);assert.equal(r.products[0].quantity,3);assert.equal(r.products[0].gross,4000);assert.equal(r.movements.length,1);
});
test('Reportes: periodo sin datos y CSV con comillas o fórmulas',()=>{
 assert.equal(A.summarize({invoices:[],movements:[]},'','').total,0);
 const csv=A.csv([['=SUM(1)','Ana "A"','normal']]);assert(csv.includes("'=SUM(1)"));assert(csv.includes('Ana ""A""'));assert(csv.startsWith('\uFEFF'));
});
