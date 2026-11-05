'use strict';
(async()=>{
 await Siar.ready;if(!Siar.user)return;
 const form=document.querySelector('#edit-stock-form');let id;
 document.querySelector('#inventory-list').addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.editStock){id=Number(b.dataset.editStock);const item=Siar.state.inventory.find(i=>i.id===id);for(const key of ['name','category','minimum'])form.elements[key].value=item[key];form.querySelector('.form-error').textContent='';form.closest('dialog').showModal();}
  if(b.dataset.deleteStock && confirm('¿Eliminar el insumo? Debe tener existencia cero. Su historial se conserva.'))await Siar.action(b,async()=>{await Siar.api('/api/inventory/'+b.dataset.deleteStock,'DELETE',{});Siar.notify('Insumo eliminado.');});
 });
 form.onsubmit=async e=>{e.preventDefault();const button=form.querySelector('button');button.disabled=true;try{await Siar.api('/api/inventory/'+id,'PUT',{name:form.elements.name.value,category:form.elements.category.value,minimum:Number(form.elements.minimum.value)});form.closest('dialog').close();await Siar.refresh();}catch(e){form.querySelector('.form-error').textContent=e.message;}finally{button.disabled=false;}};
})();
