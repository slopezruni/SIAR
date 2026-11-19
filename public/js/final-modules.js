'use strict';
const $=s=>document.querySelector(s), A=SiarAnalytics, esc=Siar.escape;
const localInput=value=>{const d=new Date(value);return A.day(d)+'T'+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');};
function table(headers,rows){return '<div class="data-scroll"><table><thead><tr>'+headers.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+(rows.length?rows.map(r=>'<tr>'+r.map(c=>'<td>'+c+'</td>').join('')+'</tr>').join(''):'<tr><td colspan="'+headers.length+'">No hay registros para este periodo.</td></tr>')+'</tbody></table></div>';}
function metric(label,value){return '<div class="metric">'+esc(label)+'<strong>'+esc(value)+'</strong></div>';}
let state,editing=null,lastVersion=null,lastPeriod=null;
function render(){
 if(!state)return;
 if($('#booking-list')){
  const rows=state.reservations.filter(r=>(!$('#booking-date').value||A.day(r.at)===$('#booking-date').value)&&(!$('#booking-status').value||r.status===$('#booking-status').value)).sort((a,b)=>a.at.localeCompare(b.at));
  $('#booking-list').innerHTML=table(['Mesa','Cliente','Personas','Inicio','Fin','Estado','Acciones'],rows.map(r=>{
   const end=r.endAt||new Date(Date.parse(r.at)+7200000).toISOString(),pending=r.status==='Reservada',expired=Date.parse(end)<=Date.now(),current=Date.parse(r.at)<=Date.now()&&!expired;
   const actions=pending?'<button data-edit="'+r.id+'">Editar</button> <button data-action="cancel" data-id="'+r.id+'">Cancelar</button> '+(current?'<button data-action="attend" data-id="'+r.id+'">Confirmar llegada</button>':''):'';
   return [r.tableId,esc(r.customer),r.partySize,esc(Siar.date(r.at)),esc(Siar.date(end)),esc(pending&&expired?'Vencida (sin llegada)':r.status),actions];
  }));
 }
 if($('#report-output')){
  const from=$('#from-date').value,to=$('#to-date').value;
  if(from&&to&&from>to){$('#page-error').textContent='La fecha inicial no puede ser posterior a la final.';$('#report-output').innerHTML='';return;}
  $('#page-error').textContent='';
  const r=A.summarize(state,from,to);
  $('#report-output').innerHTML='<div class="metric-grid">'+metric('Comprobantes',r.count)+metric('Total cobrado',Siar.money(r.total))+metric('Descuentos',Siar.money(r.discount))+metric('Impuestos',Siar.money(r.tax))+'</div><h2>Ventas</h2>'+table(['Comprobante','Fecha','Cliente','Medio','Total'],r.invoices.map(i=>['SIAR-'+String(i.id).padStart(4,'0'),esc(Siar.date(i.at)),esc(i.customer),esc(i.method),Siar.money(i.total)]))+'<h2>Productos más vendidos</h2><p>Unidades facturadas. Valor bruto antes de descuentos e impuestos.</p>'+table(['Producto','Unidades','Valor bruto'],r.products.map(p=>[esc(p.name),p.quantity,Siar.money(p.gross)]))+'<h2>Movimientos de inventario</h2>'+table(['Fecha','Insumo','Tipo','Cantidad','Motivo'],r.movements.map(m=>[esc(Siar.date(m.at)),esc(m.name),esc(m.type),esc(m.quantity+' '+m.unit),esc(m.reason)]));
 }
 if($('#dashboard-output')){
  const today=A.day(new Date()),r=A.summarize(state,today,today);
  const pending=state.orders.filter(o=>!['Facturado','Cancelado'].includes(o.status)).length,occupied=state.tables.filter(t=>t.occupied).length,reserved=state.reservations.filter(b=>b.status==='Reservada'&&A.day(b.at)===today&&Date.parse(b.endAt||new Date(Date.parse(b.at)+7200000).toISOString())>Date.now()).length;
  const low=state.inventory.filter(i=>i.stock<=i.minimum),top=r.products.slice(0,5),max=Math.max(1,...top.map(p=>p.quantity));
  $('#dashboard-output').innerHTML='<div class="metric-grid">'+metric('Ventas de hoy',Siar.money(r.total))+metric('Pedidos sin cerrar',pending)+metric('Mesas ocupadas',occupied)+metric('Reservas pendientes hoy',reserved)+'</div><h2>Productos más vendidos hoy</h2>'+(top.length?top.map(p=>'<div class="chart-row"><span>'+esc(p.name)+'</span><div><div class="chart-bar" style="width:'+Math.round(p.quantity/max*100)+'%"></div></div><strong>'+p.quantity+'</strong></div>').join(''):'<p>Aún no hay ventas hoy.</p>')+'<h2>Insumos por reponer</h2>'+table(['Insumo','Existencia','Mínimo'],low.map(i=>[esc(i.name),esc(i.stock+' '+i.unit),esc(i.minimum+' '+i.unit)]));
 }
}
function openBooking(id=null){
 editing=id;const f=$('#booking-form');f.reset();f.querySelector('.form-error').textContent='';
 f.elements.tableId.innerHTML=state.tables.map(t=>'<option value="'+t.id+'">Mesa '+t.id+' · Piso '+t.floor+' · '+t.capacity+' personas</option>').join('');
 const r=state.reservations.find(r=>r.id===id),at=new Date(Date.now()+3600000);
 for(const key of ['tableId','customer','partySize'])if(r)f.elements[key].value=r[key];
 f.elements.at.value=localInput(r?r.at:at);f.elements.endAt.value=localInput(r?(r.endAt||new Date(Date.parse(r.at)+7200000)):new Date(at.getTime()+7200000));if(!r)f.elements.partySize.value=2;
 $('#booking-title').textContent=id?'Editar reserva #'+id:'Nueva reserva';$('#booking-dialog').showModal();
}
function download(name,rows){const blob=new Blob([A.csv(rows)],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
Siar.ready.then(()=>{
 if(!Siar.user)return;
 if($('#booking-date')){
  $('#booking-date').value=A.day(new Date());$('#booking-date').onchange=render;$('#booking-status').onchange=render;
  $('#all-bookings').onclick=()=>{$('#booking-date').value='';render();};
  $('#new-booking').onclick=()=>openBooking();
  $('#booking-list').onclick=async e=>{
   const b=e.target.closest('button');if(!b)return;
   if(b.dataset.edit)return openBooking(Number(b.dataset.edit));
   if(!confirm(b.dataset.action==='cancel'?'¿Cancelar esta reserva?':'¿Confirmar la llegada del cliente?'))return;
   await Siar.action(b,()=>Siar.api('/api/reservations/'+b.dataset.id+'/action','POST',{action:b.dataset.action}));
  };
  $('#booking-form').onsubmit=async e=>{
   e.preventDefault();const f=e.currentTarget,b=f.querySelector('button');b.disabled=true;
   try{
    const body={tableId:Number(f.elements.tableId.value),customer:f.elements.customer.value,partySize:Number(f.elements.partySize.value),at:new Date(f.elements.at.value).toISOString(),endAt:new Date(f.elements.endAt.value).toISOString()};
    await Siar.api('/api/reservations'+(editing?'/'+editing:''),editing?'PUT':'POST',body);$('#booking-date').value=A.day(body.at);$('#booking-status').value='';f.closest('dialog').close();await Siar.refresh();
   }catch(err){f.querySelector('.form-error').textContent=err.message;}finally{b.disabled=false;}
  };
 }
 if($('#from-date')){
  const now=new Date();$('#from-date').value=A.day(new Date(now.getFullYear(),now.getMonth(),1));$('#to-date').value=A.day(now);$('#run-report').onclick=render;
  for(const kind of ['report','movements'])$('#download-'+kind).onclick=()=>{
   const from=$('#from-date').value,to=$('#to-date').value;if(from&&to&&from>to){Siar.notify('Revisa el intervalo de fechas.');return;}
   const r=A.summarize(state,from,to);
   download(kind==='report'?'ventas.csv':'inventario.csv',kind==='report'?[['Comprobante','Fecha','Cliente','Medio','Total COP'],...r.invoices.map(i=>[i.id,Siar.date(i.at),i.customer,i.method,(i.total/100).toFixed(2)])]:[['Fecha','Insumo','Tipo','Cantidad','Unidad','Motivo'],...r.movements.map(m=>[Siar.date(m.at),m.name,m.type,m.quantity,m.unit,m.reason])]);
  };
 }
 const update=s=>{
  state=s;
  // Evita reconstruir tablas cada cinco segundos si los datos no cambiaron.
  // El minuto también se considera para actualizar los horarios de reserva.
  const period=Math.floor(Date.now()/60000);
  if(s.version!==lastVersion||period!==lastPeriod){lastVersion=s.version;lastPeriod=period;render();}
 };
 Siar.listeners.push(update);if(Siar.state)update(Siar.state);
});
