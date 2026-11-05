'use strict';
const {fail,find,money,numberValue}=require('./validation');
function orderItems(db,items) {
  if (!Array.isArray(items) || !items.length || items.length > 50) fail('Agrega entre 1 y 50 productos.');
  const ids = new Set();
  return items.map(item => {
    if (!item || typeof item !== 'object') fail('Producto inválido.');
    const p = find(db.products, item.productId);
    if (p.deleted || p.available === false) fail('El producto ya no está disponible.');
    if (ids.has(p.id)) fail('Cada producto debe aparecer una sola vez.');
    ids.add(p.id);
    return { productId: p.id, name: p.name, price: p.price, quantity: numberValue(item.quantity, 'cantidad', 1, 1000, true) };
  });
}
function invoicePreview(db,body) {
  const order = find(db.orders, body.orderId);
  if (order.status !== 'Entregado') fail('Solo se puede facturar un pedido entregado.', 409);
  if (db.invoices.some(i => i.orderId === order.id)) fail('Este pedido ya tiene factura.', 409);
  if (!Array.isArray(body.items) || body.items.length !== order.items.length) fail('Revisa los productos de la factura.');
  const ids = new Set();
  const items = body.items.map(item => {
    if (!item || typeof item !== 'object') fail('Producto inválido.');
    const original = order.items.find(p => p.productId === item.productId);
    if (!original || ids.has(item.productId)) fail('Producto inválido o repetido.');
    ids.add(item.productId);
    return { productId: original.productId, name: original.name, quantity: numberValue(item.quantity, 'cantidad', 1, 1000, true), price: money(item.unitPrice, 'precio') };
  });
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.price, 0);
  const discount = money(body.discount, 'descuento');
  if (discount > subtotal) fail('El descuento no puede superar el subtotal.');
  const rate = numberValue(body.taxRate, 'porcentaje de impuesto', 0, 100);
  if (Math.abs(rate * 100 - Math.round(rate * 100)) > 0.000001) fail('Usa máximo dos decimales en el impuesto.');
  const base = subtotal - discount;
  const tax = Math.round(base * Math.round(rate * 100) / 10000);
  const total = base + tax;
  if (!Number.isSafeInteger(total) || total > 99999999900) fail('El total es demasiado alto.');
  return { orderId: order.id, tableId: order.tableId, items, subtotal, discount, taxRate: rate, tax, total };
}

module.exports={orderItems,invoicePreview};
