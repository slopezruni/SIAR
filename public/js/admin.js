'use strict';
(async()=>{
 await Siar.ready;if(!Siar.user)return;
 const $=s=>document.querySelector(s), esc=Siar.escape, users=document.body.dataset.page==='usuarios';
 const route=users?'/api/users':'/api/products';let editing=null;
 const form=$('#record-form');
 const buttons=row=>`<button class="button button-light" data-edit="${row.id}">Editar</button> <button class="button button-light" data-delete="${row.id}">Eliminar</button>${users ? ` <button class="button button-light" data-recovery="${row.id}">Recuperar acceso</button>` : ''}`;
 function render(state){
  const records=users?state.users:state.products;
  const headings=users?['Nombre','Usuario','Rol','Estado','Acciones']:['Producto','Categoría','Precio','Disponibilidad','Acciones'];
  $('#record-list').innerHTML=records.length?`<div class="data-scroll"><table><thead><tr>${headings.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${records.map(r=>`<tr>${(users?[esc(r.name),esc(r.username),esc(r.role),r.enabled?'Activo':'Pendiente / inactivo',buttons(r)]:[esc(r.name),esc(r.category),Siar.money(r.price),r.available?'Disponible':'Agotado',buttons(r)]).map(v=>`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'<p>No hay registros.</p>';
 }
 Siar.listeners.push(render);render(Siar.state);
 function open(id=null){editing=id;form.reset();form.querySelector('.form-error').textContent='';const record=(users?Siar.state.users:Siar.state.products).find(r=>r.id===id);
  $('#record-title').textContent=(id?'Editar ':'Nuevo ')+(users?'usuario':'producto');
  if(users){form.elements.username.disabled=Boolean(id);$('#initial-password').hidden=Boolean(id);form.elements.password.required=!id;form.elements.enabled.disabled=!id;}
  if(record)for(const name of users?['name','username','role','enabled']:['name','category','price','available'])form.elements[name].value=name==='price'?(record.price/100).toFixed(2):String(record[name]);
  $('#record-dialog').showModal();
 }
 function showCode(code,temporary){$('#recovery-output').value=code;$('#code-message').textContent=temporary?'Vence en 15 minutos y sirve una sola vez.':'Guárdalo: sirve una sola vez y no volverá a mostrarse.';$('#code-dialog').showModal();}
 $('#new-record').onclick=()=>open();
 $('#record-list').onclick=async e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.edit)return open(Number(b.dataset.edit));
  if(b.dataset.delete){if(!confirm('¿Eliminar este registro? Se conservará el historial.'))return;await Siar.action(b,async()=>{await Siar.api(route+'/'+b.dataset.delete,'DELETE',{});Siar.notify('Registro eliminado.');});}
  if(b.dataset.recovery){if(!confirm('¿Generar un código temporal? Reemplazará el código anterior de esta cuenta.'))return;await Siar.action(b,async()=>{const r=await Siar.api(route+'/'+b.dataset.recovery+'/recovery','POST',{});showCode(r.recoveryCode,true);});}
 };
 form.onsubmit=async e=>{e.preventDefault();const b=form.querySelector('button');b.disabled=true;const body=Object.fromEntries(new FormData(form));if(users)body.enabled=form.elements.enabled.value==='true';else body.available=form.elements.available.value==='true';
  try{const r=await Siar.api(route+(editing?'/'+editing:''),editing?'PUT':'POST',body);form.closest('dialog').close();await Siar.refresh();if(r.recoveryCode)showCode(r.recoveryCode,false);else Siar.notify('Cambios guardados.');}
  catch(e){form.querySelector('.form-error').textContent=e.message;}finally{b.disabled=false;}
 };
})();
