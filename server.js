'use strict';

// El servidor valida los permisos y guarda los cambios. La pantalla no decide los permisos.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const PORT = Number(process.env.PORT || 3000);
const HOST = '127.0.0.1';
const storage = require('./database/db');
const restaurant = require('./services/restaurant');
const PUBLIC = path.join(__dirname, 'public');
const sessions = new Map();
const attempts = new Map();
const roles = ['administrador', 'cajero', 'mesero', 'cocinero'];
const active = o => !['Cancelado', 'Facturado'].includes(o.status);

function passwordHash(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}
function initialData() {
  const users = [];
  return {
    users,
    tables: Array.from({ length: 24 }, (_, i) => ({ id: i + 1, floor: i < 12 ? 1 : 2, capacity: [8, 11].includes(i % 12) ? 6 : 4, occupied: false })),
    products: [
      { id: 1, name: 'Hamburguesa de la casa', price: 2100000 },
      { id: 2, name: 'Pasta con pollo', price: 2800000 },
      { id: 3, name: 'Limonada natural', price: 700000 },
      { id: 4, name: 'Plato del día', price: 2800000 }
    ],
    inventory: [
      { id: 1, name: 'Carne de hamburguesa', unit: 'unidades', category: 'Proteínas', stock: 24, minimum: 10 },
      { id: 2, name: 'Pan de hamburguesa', unit: 'unidades', category: 'Panadería', stock: 8, minimum: 12 },
      { id: 3, name: 'Limón', unit: 'kg', category: 'Frutas', stock: 5, minimum: 2 }
    ],
    reservations: [], orders: [], movements: [], invoices: [], audit: [], version: 1
  };
}
let db;
const setupToken = crypto.randomBytes(16).toString('hex');

const {fail,allow,textValue,numberValue,money,nextId,find}=require('./services/validation');
function publicUser(u) { return { id: u.id, username: u.username, name: u.name, role: u.role }; }
async function commit(user, action, record) {
  db.audit.push({ id: nextId(db.audit), at: new Date().toISOString(), actor: user.username, role: user.role, action, record });
  db.version++;
  await storage.save(db);
}
function freeTableIfUnused(id) { if (!db.orders.some(o => o.tableId === id && active(o))) find(db.tables, id).occupied = false; }
const {orderItems,invoicePreview}=require('./services/sales');
function currentSession(req) {
  const token = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('siar_session='))?.slice(13);
  const s = sessions.get(token);
  if (!s || s.expires < Date.now()) { sessions.delete(token); return null; }
  const user = db.users.find(u => u.id === s.userId && u.enabled && !u.deleted);
  if (!user) { sessions.delete(token); return null; }
  return { ...s, token, user };
}
function send(res, status, value) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); }
async function readBody(req) {
  if (!(req.headers['content-type'] || '').startsWith('application/json')) fail('Se requiere JSON.', 415);
  let value = '';
  for await (const chunk of req) { value += chunk; if (Buffer.byteLength(value) > 65536) fail('Solicitud demasiado grande.', 413); }
  try { const b = JSON.parse(value); if (!b || typeof b !== 'object' || Array.isArray(b)) fail('Datos inválidos.'); return b; }
  catch { fail('JSON inválido.'); }
}
function throttle(req, route) {
  const key = route + ':' + req.socket.remoteAddress;
  let a=attempts.get(key);
  if(!a || a.until < Date.now()) { a={count:0,until:Date.now()+60000}; attempts.set(key,a); }
  if(++a.count > 10) fail('Demasiados intentos. Espera un minuto.',429);
}
function setPassword(u,password) {
  const value=textValue(password,'contraseña',200);
  if(value.length<10) fail('La contraseña debe tener al menos 10 caracteres.');
  u.salt=crypto.randomBytes(16).toString('hex'); u.hash=passwordHash(value,u.salt);
}
function codeHash(code) { return crypto.createHash('sha256').update(code.trim().toUpperCase()).digest('hex'); }
function newRecovery(u, temporary=false) {
  const code=crypto.randomBytes(16).toString('hex').toUpperCase();
  u.recoveryHash=codeHash(code); u.recoveryExpires=temporary ? Date.now()+15*60000 : null;
  return code;
}
function invalidate(id) { for(const [token,s] of sessions) if(s.userId===id) sessions.delete(token); }
function makeUser(b,role,enabled) {
  const username=textValue(b.username,'usuario',40).toLowerCase();
  if(!/^[a-z0-9._-]{3,40}$/.test(username)) fail('Usuario: entre 3 y 40 letras, números, puntos, guiones o guiones bajos.');
  if(db.users.some(u=>u.username===username)) fail('Este usuario ya existe.');
  const u={id:nextId(db.users),username,name:textValue(b.name,'nombre'),role,enabled,deleted:false};
  setPassword(u,b.password); return u;
}
async function api(req, res, url) {
  const method = req.method;
  const route = url.pathname;
  const write = method !== 'GET';
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) fail('Método no permitido.', 405);
  if (write && req.headers.origin && req.headers.origin !== 'http://' + req.headers.host) fail('Origen no permitido.', 403);
  if (write && req.headers['sec-fetch-site'] === 'cross-site') fail('Origen no permitido.', 403);
  if (route === '/api/setup' && method === 'GET') return send(res,200,{needsAdmin:db.users.length===0});
  if (['/api/register','/api/recover'].includes(route) && method === 'POST') {
    throttle(req, route);
    const b = await readBody(req);
    const before = structuredClone(db);
    let result;
    try {
      if(route === '/api/register') {
        const first = db.users.length === 0;
        if(first && b.setupToken !== setupToken) fail('Copia el código de instalación que aparece en la ventana del servidor.',403);
        const u = makeUser(b, first ? 'administrador' : 'mesero', first);
        const code = newRecovery(u);
        db.users.push(u);
        await commit(u, first ? 'Creó administrador inicial' : 'Solicitó una cuenta', u.username);
        result = {message:first ? 'Administrador creado. Ya puedes iniciar sesión.' : 'Cuenta solicitada. El administrador debe activarla y asignarle un rol.',recoveryCode:code};
      } else {
        const u = db.users.find(u=>u.username === String(b.username).trim().toLowerCase() && !u.deleted && u.enabled);
        const digest = codeHash(String(b.code || ''));
        if(!u || !u.recoveryHash || (u.recoveryExpires && Date.now() > u.recoveryExpires) || !crypto.timingSafeEqual(Buffer.from(digest,'hex'),Buffer.from(u.recoveryHash,'hex'))) fail('Usuario o código inválido, vencido o ya utilizado.',400);
        setPassword(u,b.password);
        const code = newRecovery(u);
        await commit(u,'Recuperó contraseña',u.username);
        invalidate(u.id);
        result={message:'Contraseña actualizada. Guarda el nuevo código; el anterior ya no funciona.',recoveryCode:code};
      }
    } catch(e) { db=before; throw e; }
    return send(res,200,result);
  }
  if (route === '/api/login' && method === 'POST') {
    const body = await readBody(req);
    const username = textValue(body.username, 'usuario', 40).toLowerCase();
    const password = textValue(body.password, 'contraseña', 200);
    const key = req.socket.remoteAddress;
    let rate = attempts.get(key);
    if (!rate || rate.until < Date.now()) { rate = { count: 0, until: Date.now() + 60000 }; attempts.set(key, rate); }
    if (rate.count >= 15) fail('Demasiados intentos. Espera un minuto.', 429);
    const user = db.users.find(u => u.username === username);
    const hash = passwordHash(password, user?.salt || 'usuario-inexistente');
    if (!user || !user.enabled || user.deleted || !crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(user.hash, 'hex'))) { rate.count++; fail('Usuario o contraseña incorrectos.', 401); }
    const old = currentSession(req); if (old) sessions.delete(old.token);
    attempts.delete(key);
    const token = crypto.randomBytes(32).toString('hex');
    const csrf = crypto.randomBytes(24).toString('hex');
    sessions.set(token, { userId: user.id, csrf, expires: Date.now() + 8 * 3600000 });
    res.setHeader('Set-Cookie', `siar_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`);
    return send(res, 200, { user: publicUser(user), csrf });
  }
  const session = currentSession(req);
  if (!session) fail('Inicia sesión para continuar.', 401);
  const user = session.user;
  if (write && req.headers['x-csrf-token'] !== session.csrf) fail('Sesión inválida. Vuelve a iniciar sesión.', 403);
  if (route === '/api/me' && method === 'GET') return send(res, 200, { user: publicUser(user), csrf: session.csrf });
  if (route === '/api/logout' && method === 'POST') {
    sessions.delete(session.token); res.setHeader('Set-Cookie', 'siar_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); return send(res, 200, { ok: true });
  }
  if (route === '/api/state' && method === 'GET') {
    const kitchen = user.role === 'cocinero';
    return send(res, 200, {
      version: db.version, user: publicUser(user), products: db.products.filter(p=>!p.deleted),
      users: user.role === 'administrador' ? db.users.filter(u=>!u.deleted).map(u=>({...publicUser(u),enabled:u.enabled})) : [],
      tables: kitchen ? [] : db.tables,
      reservations: ['administrador','mesero'].includes(user.role) ? db.reservations : [],
      orders: kitchen ? db.orders.filter(o => o.sent && active(o)).map(o => ({ id: o.id, tableId: o.tableId, status: o.status, items: o.items.map(({ productId, name, quantity }) => ({ productId, name, quantity })), notes: o.notes, sent: o.sent, at: o.at })) : db.orders,
      inventory: ['mesero','cajero'].includes(user.role) ? [] : db.inventory.filter(i=>!i.deleted),
      movements: ['mesero','cajero'].includes(user.role) ? [] : db.movements.slice(-100).reverse(),
      invoices: ['administrador','cajero'].includes(user.role) ? db.invoices : [],
      audit: user.role === 'administrador' ? db.audit.slice(-100).reverse() : []
    });
  }
  if (route === '/api/password' && method === 'POST') {
    const b = await readBody(req);
    const current = textValue(b.current, 'contraseña actual', 200);
    const next = textValue(b.next, 'nueva contraseña', 200);
    if (next.length < 10) fail('La nueva contraseña debe tener al menos 10 caracteres.');
    if (!crypto.timingSafeEqual(Buffer.from(passwordHash(current, user.salt), 'hex'), Buffer.from(user.hash, 'hex'))) fail('La contraseña actual es incorrecta.');
    const before = structuredClone(db);
    try { user.salt = crypto.randomBytes(16).toString('hex'); user.hash = passwordHash(next, user.salt); await commit(user, 'Cambió su contraseña', user.username); }
    catch(e) { db = before; throw e; }
    for (const [key, s] of sessions) if (s.userId === user.id && key !== session.token) sessions.delete(key);
    return send(res, 200, { ok: true });
  }
  // La copia permite deshacer una operación si la validación o el guardado fallan.
  const body = write ? await readBody(req) : {};
  const before = structuredClone(db);
  let result;
  try {
    let m;
    if (route === '/api/recovery-code' && method === 'POST') {
      if(passwordHash(textValue(body.password,'contraseña',200),user.salt)!==user.hash) fail('Contraseña incorrecta.');
      const code=newRecovery(user); await commit(user,'Renovó código de recuperación',user.username); result={recoveryCode:code};
    } else if(route === '/api/users' && method === 'POST') {
      allow(user,['administrador']);
      if(!roles.includes(body.role)) fail('Rol inválido.');
      const u=makeUser(body,body.role,true); const code=newRecovery(u); db.users.push(u);
      await commit(user,'Creó usuario',u.username); result={user:publicUser(u),recoveryCode:code};
    } else if((m=route.match(/^\/api\/users\/(\d+)(\/recovery)?$/)) && ['PUT','DELETE','POST'].includes(method)) {
      allow(user,['administrador']); const u=find(db.users,m[1]);
      if(u.deleted) fail('Usuario eliminado.');
      if(m[2] && method === 'POST') {
        const code=newRecovery(u,true); await commit(user,'Generó recuperación temporal',u.username); result={recoveryCode:code};
      } else if(!m[2] && ['PUT','DELETE'].includes(method)) {
        if(u.id===user.id && (method==='DELETE' || body.enabled!==true || body.role!=='administrador')) fail('No puedes eliminar, desactivar o quitar el rol de tu propia cuenta.');
        if(method==='DELETE') { u.deleted=true; u.enabled=false; }
        else {
          if(!roles.includes(body.role) || typeof body.enabled!=='boolean') fail('Rol o estado inválido.');
          u.name=textValue(body.name,'nombre'); u.role=body.role; u.enabled=body.enabled;
        }
        if(!db.users.some(x=>!x.deleted && x.enabled && x.role==='administrador')) fail('Debe quedar un administrador activo.');
        await commit(user,method==='DELETE' ? 'Eliminó usuario' : 'Editó usuario',u.username);
        invalidate(u.id); result={ok:true};
      } else fail('Operación inválida.');
    } else if((route==='/api/products' && method==='POST') || ((m=route.match(/^\/api\/products\/(\d+)$/)) && ['PUT','DELETE'].includes(method))) {
      allow(user,['administrador']); const previous=m ? find(db.products,m[1]) : null;
      if(previous?.deleted) fail('Producto eliminado.');
      if(method==='DELETE') { previous.deleted=true; result={ok:true}; }
      else {
        const name=textValue(body.name,'nombre');
        if(db.products.some(p=>!p.deleted && p.id!==previous?.id && p.name.toLowerCase()===name.toLowerCase())) fail('Ya existe un producto con ese nombre.');
        if(body.available!==undefined && typeof body.available!=='boolean') fail('Disponibilidad inválida.');
        const product={available:body.available ?? previous?.available ?? true,id:previous?.id || nextId(db.products),name,category:textValue(body.category,'categoría'),price:money(body.price,'precio'),deleted:false};
        if(previous) Object.assign(previous,product); else db.products.push(product);
        result=product;
      }
      await commit(user,method==='DELETE' ? 'Eliminó producto' : 'Guardó producto',previous?.name || result.name);
    } else if((m=route.match(/^\/api\/inventory\/(\d+)$/)) && ['PUT','DELETE'].includes(method)) {
      allow(user,['administrador','cocinero']); const item=find(db.inventory,m[1]);
      if(item.deleted) fail('Insumo eliminado.');
      if(method==='DELETE') {
        if(item.stock!==0) fail('Registra la salida de las existencias antes de eliminar el insumo.');
        item.deleted=true;
      } else {
        const name=textValue(body.name,'nombre');
        if(db.inventory.some(i=>!i.deleted && i.id!==item.id && i.name.toLowerCase()===name.toLowerCase())) fail('Ya existe un insumo con ese nombre.');
        item.name=name; item.category=textValue(body.category,'categoría'); item.minimum=numberValue(body.minimum,'mínimo',0,1000000);
      }
      await commit(user,method==='DELETE' ? 'Eliminó insumo' : 'Editó insumo',item.name); result={ok:true};
    } else if(route==='/api/tables' && method==='POST') {
      allow(user,['administrador']);
      const table={id:nextId(db.tables),...restaurant.tableData(body),occupied:false};
      db.tables.push(table);await commit(user,'Creó mesa',table.id);result=table;
    } else if((m=route.match(/^\/api\/tables\/(\d+)\/details$/)) && method==='PUT') {
      allow(user,['administrador']);const table=find(db.tables,m[1]);
      if(restaurant.busy(db,table))fail('Libera la mesa y termina sus pedidos o reservas antes de modificarla.',409);
      Object.assign(table,restaurant.tableData(body));await commit(user,'Editó mesa',table.id);result=table;
    } else if(route==='/api/reservations' && method==='POST') {
      allow(user,['administrador','mesero']);const table=find(db.tables,body.tableId);
      const reservation={id:nextId(db.reservations),...restaurant.reservationData(db,table,body),actor:user.username};
      db.reservations.push(reservation);await commit(user,'Reservó mesa',table.id);result=reservation;
    } else if((m=route.match(/^\/api\/reservations\/(\d+)\/action$/)) && method==='POST') {
      allow(user,['administrador','mesero']);const reservation=find(db.reservations,m[1]);
      if(reservation.status!=='Reservada')fail('Esta reserva ya terminó.',409);
      if(!['attend','cancel'].includes(body.action))fail('Acción de reserva inválida.');
      reservation.status=body.action==='attend'?'Atendida':'Cancelada';
      if(body.action==='attend')find(db.tables,reservation.tableId).occupied=true;
      await commit(user,body.action==='attend'?'Recibió reserva':'Canceló reserva',reservation.id);result=reservation;
    } else if ((m = route.match(/^\/api\/tables\/(\d+)$/)) && method === 'PUT') {
      allow(user, ['administrador', 'mesero']); const b = body; const t = find(db.tables, m[1]);
      if(restaurant.pendingReservation(db,t.id))fail('Atiende o cancela la reserva antes de cambiar la mesa.',409);
      if (typeof b.occupied !== 'boolean') fail('Estado de mesa inválido.');
      if (!b.occupied && db.orders.some(o => o.tableId === t.id && active(o))) fail('La mesa tiene un pedido activo. Cancélalo o factura antes de liberarla.', 409);
      t.occupied = b.occupied; await commit(user, t.occupied ? 'Ocupó mesa' : 'Liberó mesa', t.id); result = t;
    } else if ((route === '/api/orders' && method === 'POST') || ((m = route.match(/^\/api\/orders\/(\d+)$/)) && method === 'PUT')) {
      allow(user, ['administrador', 'mesero']); const b = body;
      const previous = m ? find(db.orders, m[1]) : null;
      if (previous && (previous.status !== 'Pendiente' || previous.sent)) fail('Solo se puede editar antes de enviar a cocina.', 409);
      const table = find(db.tables, b.tableId);
      if(restaurant.pendingReservation(db,table.id))fail('Confirma la llegada de la reserva antes de crear el pedido.',409);
      if (db.orders.some(o => o.tableId === table.id && active(o) && o.id !== previous?.id)) fail('Esta mesa ya tiene un pedido activo.', 409);
      const order = { id: previous?.id || nextId(db.orders), tableId: table.id, customer: textValue(b.customer || '', 'cliente', 100, false), notes: textValue(b.notes || '', 'observaciones', 500, false), items: orderItems(db,b.items), status: 'Pendiente', sent: false, at: previous?.at || new Date().toISOString(), author: previous?.author || user.username };
      if (previous) { db.orders[db.orders.indexOf(previous)] = order; freeTableIfUnused(previous.tableId); } else db.orders.push(order);
      table.occupied = true; await commit(user, previous ? 'Editó pedido' : 'Creó pedido', order.id); result = order;
    } else if ((m = route.match(/^\/api\/orders\/(\d+)\/action$/)) && method === 'POST') {
      const b = body; const o = find(db.orders, m[1]);
      const actions = { send: { roles: ['administrador', 'mesero'], from: 'Pendiente', to: 'Pendiente' }, prepare: { roles: ['administrador', 'cocinero'], from: 'Pendiente', to: 'En preparación' }, ready: { roles: ['administrador', 'cocinero'], from: 'En preparación', to: 'Listo' }, deliver: { roles: ['administrador', 'mesero'], from: 'Listo', to: 'Entregado' }, cancel: { roles: ['administrador', 'mesero'], from: 'Pendiente', to: 'Cancelado' } };
      const a = Object.hasOwn(actions, b.action) ? actions[b.action] : null;
      if (!a) fail('Acción inválida.'); allow(user, a.roles);
      if (o.status !== a.from || (b.action === 'send' && o.sent) || (b.action === 'prepare' && !o.sent)) fail('El pedido cambió de estado. Actualiza la pantalla.', 409);
      o.status = a.to; if (b.action === 'send') o.sent = true;
      if (b.action === 'cancel') freeTableIfUnused(o.tableId);
      const labels = { send: 'Envió a cocina', prepare: 'Inició preparación', ready: 'Marcó listo', deliver: 'Entregó pedido', cancel: 'Canceló pedido' };
      await commit(user, labels[b.action], o.id); result = o;
    } else if (route === '/api/inventory' && method === 'POST') {
      allow(user, ['administrador', 'cocinero']); const b = body;
      if (!['unidades', 'kg', 'litros'].includes(b.unit)) fail('Unidad inválida.');
      const item = { id: nextId(db.inventory), name: textValue(b.name, 'insumo'), category: textValue(b.category, 'categoría'), unit: b.unit, stock: 0, minimum: numberValue(b.minimum, 'mínimo', 0, 1000000) };
      if (db.inventory.some(i => !i.deleted && i.name.toLowerCase() === item.name.toLowerCase())) fail('Este insumo ya existe.');
      db.inventory.push(item); await commit(user, 'Creó insumo', item.name); result = item;
    } else if (route === '/api/movements' && method === 'POST') {
      allow(user, ['administrador', 'cocinero']); const b = body; const item = find(db.inventory, b.itemId);
      if (item.deleted) fail('El insumo fue eliminado.');
      if (!['Entrada', 'Salida'].includes(b.type)) fail('Tipo de movimiento inválido.');
      const quantity = numberValue(b.quantity, 'cantidad', 0.001, 1000000, item.unit === 'unidades');
      if (Math.abs(quantity * 1000 - Math.round(quantity * 1000)) > 0.000001) fail('Usa máximo tres decimales.');
      const reason = textValue(b.reason, 'motivo', 200);
      if (b.type === 'Salida' && quantity > item.stock) fail('No hay suficientes existencias.');
      item.stock = Math.round((item.stock + (b.type === 'Entrada' ? quantity : -quantity)) * 1000) / 1000;
      const movement = { id: nextId(db.movements), itemId: item.id, name: item.name, unit: item.unit, type: b.type, quantity, reason, actor: user.username, at: new Date().toISOString() };
      db.movements.push(movement); await commit(user, 'Registró ' + b.type.toLowerCase(), item.name); result = movement;
    } else if (route === '/api/invoices/preview' && method === 'POST') {
      allow(user, ['administrador','cajero']); result = invoicePreview(db,body);
    } else if (route === '/api/invoices' && method === 'POST') {
      allow(user, ['administrador','cajero']); const b = body; const calculated = invoicePreview(db,b);
      if (!['Efectivo', 'Tarjeta', 'Transferencia'].includes(b.method)) fail('Medio de pago inválido.');
      const received = money(b.received, 'valor recibido');
      if (received < calculated.total) fail('El valor recibido es menor al total.');
      if (b.method !== 'Efectivo' && received !== calculated.total) fail('En tarjeta o transferencia registra el valor exacto.');
      const invoice = { ...calculated, id: nextId(db.invoices), customer: textValue(b.customer || 'Consumidor final', 'cliente', 100), document: textValue(b.document || '', 'documento', 40, false), method: b.method, received, change: received - calculated.total, actor: user.username, at: new Date().toISOString() };
      db.invoices.push(invoice); const order = find(db.orders, invoice.orderId); order.status = 'Facturado'; freeTableIfUnused(order.tableId);
      await commit(user, 'Facturó y registró pago', invoice.id); result = invoice;
    } else fail('Ruta no encontrada.', 404);
  } catch(e) { db = before; throw e; }
  return send(res, 200, result);
}
const pageRoles = { 'index.html': ['administrador', 'mesero'], 'pedidos.html': ['administrador', 'mesero'], 'cocina.html': ['administrador', 'cocinero'], 'inventario.html': ['administrador', 'cocinero'], 'facturacion.html': ['administrador','cajero'], 'usuarios.html': ['administrador'], 'menu.html': ['administrador'], 'actividad.html': ['administrador'] };
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  try {
    if (![`localhost:${PORT}`, `127.0.0.1:${PORT}`].includes(req.headers.host)) fail('Host no permitido.', 403);
    const url = new URL(req.url, 'http://' + req.headers.host);
    if (url.pathname.startsWith('/api/')) return await enqueue(() => api(req, res, url));
    if (req.method !== 'GET') fail('Método no permitido.', 405);
    let file = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'login.html';
    if (file.includes('..') || file.includes('\\')) fail('Ruta inválida.', 404);
    if (Object.hasOwn(pageRoles, file)) {
      const s = currentSession(req);
      if (!s) { res.writeHead(302, { Location: '/login.html' }); return res.end(); }
      if (!pageRoles[file].includes(s.user.role)) { res.writeHead(302, { Location: home(s.user.role) }); return res.end(); }
    }
    const ext = path.extname(file);
    const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
    if (!types[ext]) fail('Archivo no encontrado.', 404);
    const full = path.join(PUBLIC, file);
    if (!fs.existsSync(full) || !fs.statSync(full).isFile()) fail('Archivo no encontrado.', 404);
    res.writeHead(200, { 'Content-Type': types[ext], 'Cache-Control': 'no-store' }); res.end(fs.readFileSync(full));
  } catch(e) { if (!res.headersSent) send(res, e.status || 500, { error: e.status ? e.message : 'No se pudo guardar o procesar la operación.' }); else res.end(); }
});
// La cola evita que dos solicitudes sobrescriban cambios durante una transacción.
let queue = Promise.resolve();
function enqueue(work) { const task = queue.then(work); queue = task.catch(()=>{}); return task; }
function home(role) { return role === 'cocinero' ? '/cocina.html' : role === 'cajero' ? '/facturacion.html' : '/index.html'; }
async function start() {
  await storage.open();
  db = await storage.load();
  if (!db) throw new Error('Ejecuta npm run db:init antes de iniciar SIAR.');
  server.listen(PORT, HOST, () => {
    console.log(`SIAR: http://localhost:${PORT} | Base: ${storage.config.database}`);
    if(!db.users.length) console.log('Código para crear el primer administrador: ' + setupToken);
  });
}
if (require.main === module) start().catch(async e=> { console.error('No se pudo iniciar SIAR:',e.message,'\nRevisa MySQL de XAMPP y config.json.'); await storage.close(); process.exitCode=1; });
module.exports = {initialData, money, numberValue, passwordHash};

if(require.main===module)process.on('SIGTERM',()=>{
 server.close(async()=>{await queue;await storage.close();process.exit(0);});
 server.closeIdleConnections();
});
