'use strict';
// Este archivo conecta cada pantalla con el servidor. Los permisos se validan también allí.
(async function () {
  await Siar.ready;
  if (!Siar.user) return;
  const $ = selector => document.querySelector(selector);
  const esc = Siar.escape;
  const money = Siar.money;
  const date = Siar.date;
  const page = document.body.dataset.page;
  const isAdmin = Siar.user.role === 'administrador';
  const button = (label, action, id) => `<button type="button" class="button button-light" data-action="${action}" data-id="${id}">${label}</button>`;
  const badge = state => `<span class="badge state-${state.replaceAll(' ', '-')}">${esc(state)}</span>`;
  const table = (headers, rows, empty = 'Todavía no hay registros.') => rows.length ? `<div class="data-scroll" tabindex="0"><table><thead><tr>${headers.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : `<p class="empty-state">${empty}</p>`;
  const total = order => order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const errorIn = (form, error = '') => { form.querySelector('.form-error').textContent = error.message || error; };
  const option = (id, name) => `<option value="${id}">${esc(name)}</option>`;
  let editingId = null;
  let draft = [];
  let invoiceDraft = [];
  let invoiceOrderId = null;
  let previewSequence = 0;
  let previewTimer;

  function renderOrders(state) {
    const all = $('#order-filter').value === 'all';
    const orders = [...state.orders].reverse().filter(o => all || !['Facturado', 'Cancelado'].includes(o.status));
    $('#order-list').innerHTML = table(['Pedido / cliente', 'Mesa', 'Estado', 'Total', 'Acciones'], orders.map(o => {
      let actions = button('Detalle', 'detail', o.id);
      if (o.status === 'Pendiente') {
        if (!o.sent) actions += button('Editar', 'edit', o.id) + button('Enviar a cocina', 'send', o.id);
        actions += button('Cancelar', 'cancel', o.id);
      }
      if (o.status === 'Listo') actions += button('Entregar', 'deliver', o.id);
      if (o.status === 'Entregado' && isAdmin) actions += '<a class="button button-light" href="facturacion.html">Facturar</a>';
      return [`<strong>#${o.id}</strong><br>${esc(o.customer || 'Sin nombre')}<small>${esc(o.author)}</small>`, String(o.tableId).padStart(2, '0'), badge(o.status) + (o.status === 'Pendiente' ? `<small>${o.sent ? 'Enviado a cocina' : 'Por enviar'}</small>` : ''), money(total(o)), `<div class="row-actions">${actions}</div>`];
    }), 'Aún no hay pedidos. Crea el primero con “Nuevo pedido”.');
  }
  function openOrder(id = null) {
    const state = Siar.state;
    const order = state.orders.find(o => o.id === id);
    editingId = id; draft = order ? structuredClone(order.items) : [];
    const form = $('#order-form'); form.reset(); errorIn(form);
    $('#order-title').textContent = id ? 'Editar pedido #' + id : 'Nuevo pedido';
    const available = state.tables.filter(t => !state.reservations.some(r=>r.tableId===t.id&&r.status==='Reservada')).filter(t => !state.orders.some(o => o.tableId === t.id && !['Facturado', 'Cancelado'].includes(o.status) && o.id !== id));
    form.elements.tableId.innerHTML = available.map(t => option(t.id, `Mesa ${t.id} · Piso ${t.floor}${t.occupied ? ' · Ocupada' : ''}`)).join('');
    form.elements.customer.value = order?.customer || ''; form.elements.notes.value = order?.notes || '';
    if (order) form.elements.tableId.value = order.tableId;
    else { const proposed = new URLSearchParams(location.search).get('mesa'); if (available.some(t => String(t.id) === proposed)) form.elements.tableId.value = proposed; }
    $('#product-choice').innerHTML = state.products.filter(p=>p.available).map(p => option(p.id, p.name + ' · ' + money(p.price))).join('');
    $('#product-quantity').value = 1;
    $('#save-order').disabled = !available.length;
    if (!available.length) errorIn(form, 'Todas las mesas tienen un pedido activo.');
    renderDraft(); $('#order-dialog').showModal();
  }
  function renderDraft() {
    $('#draft-items').innerHTML = table(['Producto', 'Cantidad', 'Importe', ''], draft.map(i => [esc(i.name), `<input class="quantity" type="number" min="1" max="1000" step="1" aria-label="Cantidad de ${esc(i.name)}" value="${i.quantity}" data-product="${i.productId}">`, money(i.quantity * i.price), button('Quitar', 'remove-product', i.productId)]), 'Agrega al menos un producto.');
    $('#draft-total').textContent = 'Total: ' + money(total({ items: draft }));
  }
  function showDetail(id) {
    const order = Siar.state.orders.find(o => o.id === id); if (!order) return;
    $('#detail-heading').textContent = 'Pedido #' + id + ' · Mesa ' + order.tableId;
    $('#order-detail-body').innerHTML = `<p>${esc(order.customer || 'Sin nombre')} · ${esc(order.status)}</p>${table(['Producto', 'Cantidad', 'Importe'], order.items.map(i => [esc(i.name), i.quantity, money(i.price * i.quantity)]))}<p class="total">Total: ${money(total(order))}</p><p>Observaciones: ${esc(order.notes || 'Sin observaciones')}</p>`;
    $('#order-detail').showModal();
  }
  function renderKitchen(state) {
    $('#kitchen-board').innerHTML = ['Pendiente', 'En preparación', 'Listo'].map(status => {
      const orders = state.orders.filter(o => o.sent && o.status === status);
      return `<section class="module-panel"><h2>${status} <span class="counter">${orders.length}</span></h2>${orders.map(o => `<article class="order-card"><span class="eyebrow">PEDIDO #${o.id}</span><h3>Mesa ${o.tableId}</h3><ul>${o.items.map(i => `<li>${i.quantity} × ${esc(i.name)}</li>`).join('')}</ul><p class="muted">${esc(o.notes || 'Sin observaciones')}</p><small>${esc(date(o.at))}</small>${status === 'Pendiente' ? button('Iniciar preparación', 'prepare', o.id) : status === 'En preparación' ? button('Marcar listo', 'ready', o.id) : '<p class="ready-note">El mesero puede entregarlo.</p>'}</article>`).join('') || '<p class="empty-state">Sin pedidos en este estado.</p>'}</section>`;
    }).join('');
  }
  function renderInventory(state) {
    $('#inventory-list').innerHTML = table(['Insumo', 'Categoría', 'Existencia', 'Mínimo', 'Estado', 'Acciones'], state.inventory.map(i => [esc(i.name), esc(i.category), `${i.stock} ${esc(i.unit)}`, `${i.minimum} ${esc(i.unit)}`, badge(i.stock <= i.minimum ? 'Stock bajo' : 'Disponible'), `<button class="button button-light" data-edit-stock="${i.id}">Editar</button> <button class="button button-light" data-delete-stock="${i.id}">Eliminar</button>`]));
    $('#movements-list').innerHTML = table(['Fecha', 'Insumo', 'Movimiento', 'Cantidad', 'Motivo', 'Usuario'], state.movements.map(m => [esc(date(m.at)), esc(m.name), esc(m.type), `${m.quantity} ${esc(m.unit)}`, esc(m.reason), esc(m.actor)]));
  }
  function invoiceBody() {
    const f = $('#invoice-form');
    return { orderId: Number(f.elements.orderId.value), customer: f.elements.customer.value, document: f.elements.document.value, method: f.elements.method.value, received: f.elements.received.value, discount: f.elements.discount.value, taxRate: Number(f.elements.taxRate.value), items: invoiceDraft.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })) };
  }
  function selectInvoiceOrder() {
    const f = $('#invoice-form'); const o = Siar.state.orders.find(o => o.id === Number(f.elements.orderId.value));
    invoiceOrderId = o?.id || null; previewSequence++;
    invoiceDraft = o ? o.items.map(i => ({ ...i, unitPrice: (i.price / 100).toFixed(2) })) : [];
    f.elements.customer.value = o?.customer || ''; f.elements.document.value = ''; f.elements.discount.value = '0'; f.elements.taxRate.value = '0'; f.elements.received.value = '';
    errorIn(f);
    $('#invoice-items').innerHTML = invoiceDraft.length ? `<div class="invoice-lines">${invoiceDraft.map(i => `<div class="invoice-line"><strong>${esc(i.name)}</strong><label>Cantidad<input type="number" min="1" max="1000" step="1" required value="${i.quantity}" data-invoice-id="${i.productId}" data-field="quantity"></label><label>Precio unitario ($ COP)<input type="number" min="0" step="0.01" required value="${i.unitPrice}" data-invoice-id="${i.productId}" data-field="unitPrice"></label></div>`).join('')}</div>` : '<p class="empty-state">No hay pedidos entregados pendientes de cobro.</p>';
    $('#issue-invoice').disabled = !o; $('#calculate-invoice').disabled = !o;
    if (o) calculateInvoice(); else $('#invoice-preview').textContent = 'El pedido aparecerá aquí cuando el mesero lo marque como entregado.';
  }
  async function calculateInvoice() {
    if (!invoiceOrderId) return;
    const sequence = ++previewSequence;
    try {
      const data = await Siar.api('/api/invoices/preview', 'POST', invoiceBody());
      if (sequence !== previewSequence) return;
      $('#invoice-preview').innerHTML = `<dl class="invoice-total"><div><dt>Subtotal</dt><dd>${money(data.subtotal)}</dd></div><div><dt>Descuento</dt><dd>− ${money(data.discount)}</dd></div><div><dt>Impuesto (${data.taxRate} %)</dt><dd>${money(data.tax)}</dd></div><div><dt>Total</dt><dd>${money(data.total)}</dd></div></dl><p class="muted">Valor exacto para el pago: ${(data.total / 100).toFixed(2)}</p>`;
      errorIn($('#invoice-form'));
    } catch(error) { if (sequence === previewSequence) { $('#invoice-preview').textContent = 'Revisa los valores antes de emitir.'; errorIn($('#invoice-form'), error); } }
  }
  function renderInvoices(state) {
    const select = $('#invoice-order');
    const eligible = state.orders.filter(o => o.status === 'Entregado');
    const last = select.value;
    // Actualizar la lista sin borrar los precios que el usuario está editando.
    select.innerHTML = '<option value="">Selecciona un pedido</option>' + eligible.map(o => option(o.id, `#${o.id} · Mesa ${o.tableId} · ${o.customer || 'Sin nombre'}`)).join('');
    if (eligible.some(o => String(o.id) === last)) select.value = last;
    else if (invoiceOrderId) { select.value = ''; selectInvoiceOrder(); }
    $('#invoice-history').innerHTML = table(['Comprobante', 'Fecha', 'Cliente', 'Pedido', 'Total', ''], [...state.invoices].reverse().map(i => [`SIAR-${String(i.id).padStart(4, '0')}`, esc(date(i.at)), esc(i.customer), '#' + i.orderId, money(i.total), button('Ver / imprimir', 'receipt', i.id)]));
  }
  function showReceipt(invoice) {
    $('#receipt').innerHTML = `<p class="eyebrow">SIAR · COMPROBANTE ACADÉMICO</p><h3>SIAR-${String(invoice.id).padStart(4, '0')}</h3><p>Sin validez fiscal · No es factura electrónica DIAN</p><p>${esc(date(invoice.at))}<br>Cliente: ${esc(invoice.customer)}<br>Documento: ${esc(invoice.document || 'No indicado')}<br>Pedido #${invoice.orderId} · Mesa ${invoice.tableId}</p>${table(['Producto', 'Cant.', 'Precio', 'Importe'], invoice.items.map(i => [esc(i.name), i.quantity, money(i.price), money(i.price * i.quantity)]))}<dl class="invoice-total"><div><dt>Subtotal</dt><dd>${money(invoice.subtotal)}</dd></div><div><dt>Descuento</dt><dd>${money(invoice.discount)}</dd></div><div><dt>Impuesto (${invoice.taxRate} %)</dt><dd>${money(invoice.tax)}</dd></div><div><dt>Total pagado</dt><dd>${money(invoice.total)}</dd></div></dl><p>Medio: ${esc(invoice.method)}<br>Recibido: ${money(invoice.received)}<br>Cambio: ${money(invoice.change)}<br>Registrado por: ${esc(invoice.actor)}</p>`;
    $('#receipt-dialog').showModal();
  }
  function renderAudit(state) {
    $('#admin-summary').innerHTML = `<div class="summary-item"><span>Pedidos activos</span><strong>${state.orders.filter(o => !['Cancelado', 'Facturado'].includes(o.status)).length}</strong></div><div class="summary-item"><span>Comprobantes</span><strong>${state.invoices.length}</strong></div><div class="summary-item"><span>Total cobrado</span><strong>${money(state.invoices.reduce((sum, i) => sum + i.total, 0))}</strong></div>`;
    $('#audit-list').innerHTML = table(['Fecha', 'Usuario', 'Rol', 'Acción', 'Referencia'], state.audit.map(a => [esc(date(a.at)), esc(a.actor), esc(a.role), esc(a.action), esc(a.record)]));
  }
  const renderers = { pedidos: renderOrders, cocina: renderKitchen, inventario: renderInventory, facturacion: renderInvoices, actividad: renderAudit };
  Siar.listeners.push(renderers[page]);
  renderers[page](Siar.state);

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-action]'); if (!b) return;
    const id = Number(b.dataset.id); const action = b.dataset.action;
    if (action === 'detail') return showDetail(id);
    if (action === 'edit') return openOrder(id);
    if (action === 'remove-product') { draft = draft.filter(i => i.productId !== id); return renderDraft(); }
    if (action === 'receipt') return showReceipt(Siar.state.invoices.find(i => i.id === id));
    if (action === 'cancel' && !confirm('¿Cancelar este pedido?')) return;
    Siar.action(b, async () => { await Siar.api(`/api/orders/${id}/action`, 'POST', { action }); Siar.notify('Pedido actualizado.'); });
  });
  if (page === 'pedidos') {
    $('#new-order').addEventListener('click', () => openOrder());
    $('#order-filter').addEventListener('change', () => renderOrders(Siar.state));
    $('#add-product').addEventListener('click', () => {
      const quantity = Number($('#product-quantity').value);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) return errorIn($('#order-form'), 'La cantidad debe ser un entero entre 1 y 1000.');
      const p = Siar.state.products.find(p => p.id === Number($('#product-choice').value) && p.available);
      if(!p)return errorIn($('#order-form'),'No hay productos disponibles para agregar.');
      const item = draft.find(i => i.productId === p.id);
      if (item && item.quantity + quantity > 1000) return errorIn($('#order-form'), 'Máximo 1000 unidades por producto.');
      if (item) item.quantity += quantity; else draft.push({ productId: p.id, name: p.name, price: p.price, quantity });
      errorIn($('#order-form')); renderDraft();
    });
    $('#draft-items').addEventListener('change', e => {
      if (!e.target.matches('[data-product]')) return;
      const quantity = Number(e.target.value);
      const item = draft.find(i => i.productId === Number(e.target.dataset.product));
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) { errorIn($('#order-form'), 'Cantidad inválida.'); e.target.value=item.quantity; return; }
      item.quantity=quantity;
      e.target.closest('tr').children[2].textContent=money(item.quantity*item.price);
      $('#draft-total').textContent='Total: '+money(total({items:draft}));
      errorIn($('#order-form'));
    });
    $('#order-form').addEventListener('submit', async e => {
      e.preventDefault(); const f = e.currentTarget; const b = $('#save-order'); b.disabled = true; errorIn(f);
      try {
        await Siar.api('/api/orders' + (editingId ? '/' + editingId : ''), editingId ? 'PUT' : 'POST', { tableId: Number(f.elements.tableId.value), customer: f.elements.customer.value, notes: f.elements.notes.value, items: draft.map(i => ({ productId: i.productId, quantity: i.quantity })) });
        f.closest('dialog').close(); await Siar.refresh(); Siar.notify('Pedido guardado. Ya puedes enviarlo a cocina.');
      } catch(error) { errorIn(f, error); } finally { b.disabled = false; }
    });
  }
  if (page === 'inventario') {
    $('#new-item').addEventListener('click', () => { $('#item-form').reset(); errorIn($('#item-form')); $('#item-dialog').showModal(); });
    $('#new-movement').addEventListener('click', () => {
      const f = $('#movement-form'); f.reset(); errorIn(f);
      f.elements.itemId.innerHTML = Siar.state.inventory.map(i => option(i.id, `${i.name} · ${i.stock} ${i.unit}`)).join('');
      $('#movement-dialog').showModal();
    });
    for (const [selector, route, makeBody] of [
      ['#item-form', '/api/inventory', f => ({ name: f.elements.name.value, category: f.elements.category.value, unit: f.elements.unit.value, minimum: Number(f.elements.minimum.value) })],
      ['#movement-form', '/api/movements', f => ({ itemId: Number(f.elements.itemId.value), type: f.elements.type.value, quantity: Number(f.elements.quantity.value), reason: f.elements.reason.value })]
    ]) $(selector).addEventListener('submit', async e => {
      e.preventDefault(); const f = e.currentTarget; const b = f.querySelector('button[type="submit"]'); b.disabled = true; errorIn(f);
      try { await Siar.api(route, 'POST', makeBody(f)); f.closest('dialog').close(); await Siar.refresh(); Siar.notify('Registro guardado.'); }
      catch(error) { errorIn(f, error); } finally { b.disabled = false; }
    });
  }
  if (page === 'facturacion') {
    selectInvoiceOrder();
    $('#invoice-order').addEventListener('change', selectInvoiceOrder);
    $('#invoice-items').addEventListener('input', e => {
      const input = e.target; if (!input.dataset.invoiceId) return;
      const item = invoiceDraft.find(i => i.productId === Number(input.dataset.invoiceId));
      item[input.dataset.field] = input.dataset.field === 'quantity' ? Number(input.value) : input.value;
    });
    $('#invoice-form').addEventListener('input', e => {
      if (e.target.matches('[data-invoice-id], [name="taxRate"], [name="discount"]')) { previewSequence++; clearTimeout(previewTimer); previewTimer = setTimeout(calculateInvoice, 250); }
    });
    $('#calculate-invoice').addEventListener('click', calculateInvoice);
    $('#invoice-form').addEventListener('submit', async e => {
      e.preventDefault(); const f = e.currentTarget; const b = $('#issue-invoice'); errorIn(f);
      if (!confirm('¿Registrar el pago y emitir el comprobante con estos valores? No podrás cobrar este pedido otra vez.')) return;
      b.disabled = true;
      try {
        const invoice = await Siar.api('/api/invoices', 'POST', invoiceBody());
        clearTimeout(previewTimer); previewSequence++;
        f.reset(); invoiceOrderId = null; await Siar.refresh(); selectInvoiceOrder(); showReceipt(invoice);
      } catch(error) { errorIn(f, error); } finally { b.disabled = !invoiceOrderId; }
    });
    $('#print-receipt').addEventListener('click', () => window.print());
  }
})();
