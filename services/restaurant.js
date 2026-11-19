'use strict';
// Reglas de mesas y reservas. No dependen de HTML ni de MySQL.
function reject(message, status=400) { const e=new Error(message);e.status=status;throw e; }
function tableData(body) {
 if(![1,2].includes(body.floor))reject('Elige el piso 1 o 2.');
 if(!Number.isInteger(body.capacity)||body.capacity<1||body.capacity>30)reject('La capacidad debe ser un entero entre 1 y 30.');
 return {floor:body.floor,capacity:body.capacity};
}
function endTime(r) { return Date.parse(r.endAt || new Date(Date.parse(r.at)+7200000).toISOString()); }
function pendingReservation(db,id,now=Date.now()) {return db.reservations.find(r=>r.tableId===id&&r.status==='Reservada'&&Date.parse(r.at)<=now&&endTime(r)>now);}
function attendable(db,r,now=Date.now()) {
 if(r.status!=='Reservada')reject('Esta reserva ya terminó.',409);
 if(now<Date.parse(r.at)||now>=endTime(r))reject('Confirma la llegada dentro del horario reservado.',409);
 const t=db.tables.find(t=>t.id===r.tableId);
 if(t.occupied||db.orders.some(o=>o.tableId===t.id&&!['Cancelado','Facturado'].includes(o.status)))reject('La mesa todavía está ocupada.',409);
}
function busy(db,table) {return table.occupied || db.orders.some(o=>o.tableId===table.id&&!['Cancelado','Facturado'].includes(o.status)) || db.reservations.some(r=>r.tableId===table.id&&r.status==='Reservada'&&endTime(r)>Date.now());}
function reservationData(db,table,body,now=Date.now(),excludeId=null) {
 const customer=typeof body.customer==='string'?body.customer.trim():'';
 if(!customer||customer.length>100)reject('Escribe el nombre de la reserva (máximo 100 caracteres).');
 if(!Number.isInteger(body.partySize)||body.partySize<1||body.partySize>table.capacity)reject('La cantidad de personas supera la capacidad o es inválida.');
 const time=Date.parse(body.at);
 if(!Number.isFinite(time)||time<now)reject('Selecciona una fecha y hora futura.');
 const end=body.endAt ? Date.parse(body.endAt) : time+7200000;
 if(!Number.isFinite(end)||end<=time||end-time>8*3600000)reject('La reserva debe durar entre 1 minuto y 8 horas.');
 if(end-time<60000)reject('La duración mínima es de un minuto.');
 if(db.reservations.some(r=>r.id!==excludeId&&r.tableId===table.id&&r.status==='Reservada'&&time<endTime(r)&&end>Date.parse(r.at)))reject('La mesa ya tiene una reserva en ese horario.',409);
 return {tableId:table.id,customer,partySize:body.partySize,at:new Date(time).toISOString(),endAt:new Date(end).toISOString(),status:'Reservada'};
}
module.exports={endTime,attendable,tableData,pendingReservation,busy,reservationData};
