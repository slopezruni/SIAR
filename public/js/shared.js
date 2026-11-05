'use strict';
// Utilidades comunes: sesión, peticiones, mensajes y actualización de datos.
window.Siar = {
  state: null, user: null, csrf: '', listeners: [],
  escape(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); },
  money(cents) { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 2 }).format(cents / 100); },
  date(value) { return new Date(value).toLocaleString('es-CO'); },
  async api(url, method = 'GET', body) {
    const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': this.csrf }, body: body === undefined ? undefined : JSON.stringify(body) });
    const data = await response.json();
    if (response.status === 401) { location.replace('/login.html'); throw new Error('La sesión terminó.'); }
    if (!response.ok) throw new Error(data.error || 'No se pudo realizar la operación.');
    return data;
  },
  async refresh() {
    if (this.refreshing) return;
    this.refreshing = true;
    try {
      this.state = await this.api('/api/state');
      document.querySelector('#connection').textContent = 'Conectado · ' + this.user.role;
      document.querySelector('#page-error').textContent = '';
      for (const listener of this.listeners) listener(this.state);
    } catch (error) { document.querySelector('#page-error').textContent = error.message; document.querySelector('#connection').textContent = 'Sin actualizar'; }
    finally { this.refreshing = false; }
  },
  notify(message) {
    const box = document.querySelector('#notification');
    const dialog = document.querySelector('dialog[open]');
    (dialog || document.body).append(box);
    box.textContent = message; box.hidden = false;
    clearTimeout(this.timer); this.timer = setTimeout(() => { box.hidden = true; }, 5000);
  },
  async action(button, work) {
    button.disabled = true;
    try { await work(); await this.refresh(); }
    catch(error) { this.notify(error.message); }
    finally { button.disabled = false; }
  }
};
Siar.ready = (async () => {
  try {
    const session = await Siar.api('/api/me');
    Siar.user = session.user; Siar.csrf = session.csrf;
    document.querySelector('#session-name').textContent = session.user.name + ' · ' + session.user.role;
    document.querySelectorAll('[data-roles]').forEach(link => { link.hidden = !link.dataset.roles.split(' ').includes(session.user.role); if (link.getAttribute('href') === location.pathname.slice(1)) link.setAttribute('aria-current', 'page'); });
    document.querySelector('#logout').addEventListener('click', async () => { try { await Siar.api('/api/logout', 'POST', {}); location.replace('/login.html'); } catch(e) { Siar.notify(e.message); } });
    document.querySelector('#change-password').addEventListener('click', () => document.querySelector('#password-dialog').showModal());
    document.addEventListener('click', e => { const b = e.target.closest('[data-close]'); if (b) b.closest('dialog').close(); });
    document.querySelector('#password-form').addEventListener('submit', async e => {
      e.preventDefault(); const f = e.currentTarget; const button = f.querySelector('button'); button.disabled = true;
      try { await Siar.api('/api/password', 'POST', Object.fromEntries(new FormData(f))); f.reset(); f.closest('dialog').close(); Siar.notify('Contraseña actualizada.'); }
      catch(error) { f.querySelector('.form-error').textContent = error.message; }
      finally { button.disabled = false; }
    });
    document.querySelector('#refresh')?.addEventListener('click', () => Siar.refresh());
    await Siar.refresh();
    setInterval(() => { if (!document.hidden) Siar.refresh(); }, 5000);
  } catch(e) { document.querySelector('#page-error').textContent = e.message; }
})();
Siar.ready.then(()=>{
 if(!Siar.user)return;
 document.querySelector('#recovery-settings').onclick=()=>{document.querySelector('#personal-code').hidden=true;document.querySelector('#personal-recovery-form').reset();document.querySelector('#personal-recovery').showModal();};
 document.querySelector('#personal-recovery-form').onsubmit=async e=>{
  e.preventDefault();const f=e.currentTarget;const b=f.querySelector('button');b.disabled=true;
  try {const result=await Siar.api('/api/recovery-code','POST',{password:f.elements.password.value});f.reset();const out=document.querySelector('#personal-code');out.value=result.recoveryCode;out.hidden=false;f.querySelector('.form-error').textContent='Guárdalo ahora. El código anterior ya no sirve.';}catch(e){f.querySelector('.form-error').textContent=e.message;}finally{b.disabled=false;}
 };
});
