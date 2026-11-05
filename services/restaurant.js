'use strict';
// Reglas de mesas y reservas. No dependen de HTML ni de MySQL.
function reject(message, status=400) { const e=new Error(message);e.status=status;throw e; }
function tableData(body) {
 if(![1,2].includes(body.floor))reject('Elige el piso 1 o 2.');
 if(!Number.isInteger(body.capacity)||body.capacity<1||body.capacity>30)reject('La capacidad debe ser un entero entre 1 y 30.');
 return {floor:body.floor,capacity:body.capacity};
}
function pendingReservation(db,id) {return db.reservations.find(r=>r.tableId===id&&r.status==='Reservada');}
function busy(db,table) {return table.occupied || db.orders.some(o=>o.tableId===table.id&&!['Cancelado','Facturado'].includes(o.status)) || Boolean(pendingReservation(db,table.id));}
function reservationData(db,table,body,now=Date.now()) {
 if(busy(db,table))reject('La mesa está ocupada o reservada.',409);
 const customer=typeof body.customer==='string'?body.customer.trim():'';
 if(!customer||customer.length>100)reject('Escribe el nombre de la reserva (máximo 100 caracteres).');
 if(!Number.isInteger(body.partySize)||body.partySize<1||body.partySize>table.capacity)reject('La cantidad de personas supera la capacidad o es inválida.');
 const time=Date.parse(body.at);
 if(!Number.isFinite(time)||time<now)reject('Selecciona una fecha y hora futura.');
 return {tableId:table.id,customer,partySize:body.partySize,at:new Date(time).toISOString(),status:'Reservada'};
}
module.exports={tableData,pendingReservation,busy,reservationData};
