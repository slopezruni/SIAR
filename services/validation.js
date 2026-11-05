'use strict';
function fail(message, status = 400) { const e = new Error(message); e.status = status; throw e; }
function allow(user, list) { if (!user || !list.includes(user.role)) fail('No tienes permiso para realizar esta acción.', 403); }
function textValue(v, name, max = 100, required = true) {
  if (typeof v !== 'string' || v.length > max || (required && !v.trim())) fail('Revisa el campo ' + name + '.');
  return v.trim();
}
function numberValue(v, name, min, max, integer = false) {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max || (integer && !Number.isInteger(v))) fail('Valor inválido: ' + name + '.');
  return v;
}
// Todos los importes se guardan en centavos para evitar errores de coma flotante.
function money(v, name) {
  if (typeof v !== 'string' || !/^\d{1,9}(\.\d{1,2})?$/.test(v)) fail('Importe inválido: ' + name + '.');
  const [whole, fraction = ''] = v.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}
function nextId(list) { return list.reduce((m, x) => Math.max(m, x.id), 0) + 1; }
function find(list, id) { const item = list.find(x => x.id === Number(id)); if (!item) fail('Registro no encontrado.', 404); return item; }

module.exports={fail,allow,textValue,numberValue,money,nextId,find};
