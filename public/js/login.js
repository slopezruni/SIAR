'use strict';
const form = document.querySelector('#login-form');
document.querySelector('#show-password').addEventListener('change', event => {
  form.elements.password.type = event.target.checked ? 'text' : 'password';
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button');
  button.disabled = true;
  document.querySelector('#login-error').textContent = '';
  try {
    const response = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: form.elements.username.value, password: form.elements.password.value }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    location.replace(data.user.role === 'cocinero' ? '/cocina.html' : data.user.role === 'cajero' ? '/facturacion.html' : '/index.html');
  } catch (error) { document.querySelector('#login-error').textContent = error.message || 'No se pudo conectar.'; }
  finally { button.disabled = false; }
});
const $=s=>document.querySelector(s);
async function setupState() {
 try {const r=await fetch('/api/setup'); const data=await r.json(); $('#setup-field').hidden=!data.needsAdmin; $('#setup-field input').required=data.needsAdmin; $('#setup-hint').textContent=data.needsAdmin ? 'Crea el primer administrador con el código que aparece en la ventana del servidor.' : 'Las cuentas nuevas necesitan aprobación del administrador.';} catch {$('#setup-hint').textContent='No se pudo consultar el servidor.';}
}
setupState();
$('#open-register').onclick=()=>$('#register-dialog').showModal();
$('#open-recovery').onclick=()=>$('#recover-dialog').showModal();
document.addEventListener('click',e=>{if(e.target.closest('[data-close]'))e.target.closest('dialog').close();});
for(const [selector,url] of [['#register-form','/api/register'],['#recover-form','/api/recover']]) {
 $(selector).addEventListener('submit',async e=>{
  e.preventDefault(); const f=e.currentTarget; const button=f.querySelector('button'); button.disabled=true; f.querySelector('.form-error').textContent='';
  try {const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(f)))}); const data=await r.json();if(!r.ok)throw new Error(data.error);
   f.reset();f.closest('dialog').close();$('#auth-message').textContent=data.message;$('#auth-code').value=data.recoveryCode;$('#auth-result').showModal();await setupState();
  } catch(e){f.querySelector('.form-error').textContent=e.message;}finally{button.disabled=false;}
 });
}
