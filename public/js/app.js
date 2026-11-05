"use strict";

// Las coordenadas corresponden al plano de referencia (800 por 580).
// El segundo piso usa la misma distribución hasta tener su propio boceto.
const positions = [
  [250, 112], [385, 112], [520, 112],
  [250, 218], [385, 218], [520, 218],
  [275, 345], [455, 345], [635, 345],
  [275, 455], [455, 455], [635, 455]
];

// Las mesas se recuperan del servidor; no hay estados inventados en la pantalla.
let tables = [];
let currentFloor = 1;
let selectedId = null;
let tablePage = 0;
const reservationFor = id => Siar.state?.reservations.find(r=>r.tableId===id && r.status==='Reservada');

const byId = (id) => document.getElementById(id);
const floorButtons = document.querySelectorAll("[data-floor]");
const layer = byId("tables-layer");
const floorNames = { 1: "Primer piso", 2: "Segundo piso" };
const statusName = (table) => table.occupied ? "Ocupada" : reservationFor(table.id) ? "Reservada" : "Disponible";
const statusClass = (table) => table.occupied ? "occupied" : reservationFor(table.id) ? "reserved" : "available";
const tableNumber = (id) => String(id).padStart(2, "0");

function announce(message) {
  byId("announcement").textContent = message;
}

function renderTables() {
  layer.replaceChildren();
  const floorTables = tables.filter((table) => table.floor === currentFloor);

  const pages=Math.max(1,Math.ceil(floorTables.length/12));
  tablePage=Math.min(tablePage,pages-1);
  byId('tables-page').textContent=`Grupo ${tablePage+1} de ${pages}`;
  byId('previous-tables').disabled=tablePage===0;
  byId('next-tables').disabled=tablePage===pages-1;
  for (const [index, table] of floorTables.slice(tablePage*12,tablePage*12+12).entries()) {
    const [x,y]=positions[index];
    const button = document.createElement("button");
    button.type = "button";
    button.className = `table-button ${statusClass(table)}`;
    button.dataset.tableId = table.id;
    button.style.left = `${x / 8}%`;
    button.style.top = `${y / 5.8}%`;
    button.setAttribute("aria-pressed", String(table.id === selectedId));
    button.setAttribute("aria-label", `Mesa ${tableNumber(table.id)}, ${statusName(table).toLowerCase()}, ${table.capacity} personas`);
    // Solo se insertan valores numéricos y etiquetas de estado controladas.
    button.innerHTML = `
      <i class="chair chair-top" aria-hidden="true"></i><i class="chair chair-bottom" aria-hidden="true"></i>
      <i class="chair chair-left" aria-hidden="true"></i><i class="chair chair-right" aria-hidden="true"></i>
      <span class="table-number">${tableNumber(table.id)}</span>
      <span class="table-capacity"><svg class="icon" aria-hidden="true"><use href="#icon-people"/></svg>${table.capacity}</span>
      <span class="table-status">${statusName(table)}</span>`;
    button.addEventListener("click", () => selectTable(table.id));
    layer.append(button);
  }

  const occupied = floorTables.filter((table) => table.occupied).length;
  byId("total-count").textContent = floorTables.length;
  byId("available-count").textContent = floorTables.filter(t=>!t.occupied && !reservationFor(t.id)).length;
  byId('reserved-count').textContent=floorTables.filter(t=>reservationFor(t.id)).length;
  byId("occupied-count").textContent = occupied;
  layer.setAttribute("aria-label", `Mesas del ${floorNames[currentFloor].toLowerCase()}`);
}

function renderDetails() {
  const table = tables.find((item) => item.id === selectedId && item.floor === currentFloor);
  byId("empty-detail").hidden = Boolean(table);
  byId("selected-detail").hidden = !table;
  if (!table) return;

  byId("table-order-link").href = 'pedidos.html?mesa=' + table.id;
  byId("selected-number").textContent = tableNumber(table.id);
  byId("selected-floor").textContent = floorNames[table.floor];
  byId("selected-capacity").textContent = `${table.capacity} personas`;
  byId("selected-status").textContent = statusName(table);
  byId("selected-status").className = `status-label ${statusClass(table)}`;
  byId("selected-description").textContent = table.occupied
    ? "Esta mesa está ocupada. Solo se puede liberar si no tiene pedidos activos."
    : "Esta mesa está disponible para recibir clientes.";
  const reservation=reservationFor(table.id);
  byId('toggle-status').disabled=Boolean(reservation);
  byId('reserve-table').hidden=Boolean(reservation)||table.occupied;
  byId('attend-reservation').hidden=!reservation;
  byId('cancel-reservation').hidden=!reservation;
  byId('reservation-detail').textContent=reservation ? `${reservation.customer} · ${reservation.partySize} personas · ${Siar.date(reservation.at)}` : '';
  if(reservation)byId('selected-description').textContent='Mesa apartada. Confirma la llegada antes de crear el pedido.';
  byId("toggle-status").textContent = table.occupied ? "Liberar mesa" : "Marcar como ocupada";
}

function selectTable(id) {
  selectedId = id;
  for (const button of layer.querySelectorAll("button")) {
    button.setAttribute("aria-pressed", String(Number(button.dataset.tableId) === id));
  }
  renderDetails();
  const table = tables.find((item) => item.id === id);
  announce(`Mesa ${tableNumber(id)} seleccionada. ${statusName(table)}. Capacidad: ${table.capacity} personas.`);
}

function changeFloor(floor) {
  if (floor === currentFloor) return;
  currentFloor = floor; tablePage=0;
  selectedId = null;
  renderFloor();
  announce(`${floorNames[floor]}. Selecciona una mesa del plano.`);
}

function renderFloor() {
  byId("plan-title").textContent = floorNames[currentFloor];
  byId("floor-description").textContent = currentFloor === 1 ? "Salón principal" : "Distribución de ejemplo";
  byId("floor-footer").textContent = `Piso ${currentFloor} de 2`;
  byId("stairs-label").innerHTML = currentFloor === 1 ? "Subir al<br>piso 2" : "Bajar al<br>piso 1";
  byId("stairs-button").setAttribute("aria-label", currentFloor === 1 ? "Subir al segundo piso" : "Bajar al primer piso");
  document.querySelector(".stairs-arrow").classList.toggle("is-down", currentFloor === 2);
  for (const button of floorButtons) {
    button.setAttribute("aria-pressed", String(Number(button.dataset.floor) === currentFloor));
  }
  renderTables();
  renderDetails();
}

floorButtons.forEach((button) => button.addEventListener("click", () => changeFloor(Number(button.dataset.floor))));
byId("stairs-button").addEventListener("click", () => changeFloor(currentFloor === 1 ? 2 : 1));
byId("toggle-status").addEventListener("click", () => {
  const table = tables.find(item => item.id === selectedId);
  if (!table) return;
  Siar.action(byId("toggle-status"), async () => {
    await Siar.api('/api/tables/' + table.id, 'PUT', { occupied: !table.occupied });
    announce('Estado de mesa actualizado.');
  });
});
byId("reset-demo").addEventListener("click", () => Siar.refresh());

Siar.ready.then(() => {
  function update(state) {
    tables = state.tables;
    renderFloor();
  }
  Siar.listeners.push(update);
  if (Siar.state) update(Siar.state);
});

for(const [id,step] of [['previous-tables',-1],['next-tables',1]])byId(id).onclick=()=>{tablePage+=step;selectedId=null;renderFloor();};
let editingTable=null;
function openTableForm(edit=false){
 editingTable=edit ? selectedId : null;
 const form=byId('table-form');form.reset();form.querySelector('.form-error').textContent='';
 const t=tables.find(t=>t.id===editingTable);
 form.elements.floor.value=t?.floor || currentFloor;form.elements.capacity.value=t?.capacity || 4;
 byId('table-form-title').textContent=edit?'Editar mesa '+selectedId:'Nueva mesa';byId('table-dialog').showModal();
}
byId('new-table').onclick=()=>openTableForm();byId('edit-table').onclick=()=>openTableForm(true);
byId('table-form').onsubmit=async e=>{
 e.preventDefault();const f=e.currentTarget,b=f.querySelector('button');b.disabled=true;
 try{const t=await Siar.api('/api/tables'+(editingTable?'/'+editingTable+'/details':''),editingTable?'PUT':'POST',{floor:Number(f.elements.floor.value),capacity:Number(f.elements.capacity.value)});f.closest('dialog').close();currentFloor=t.floor;await Siar.refresh();tablePage=Math.floor(tables.filter(x=>x.floor===currentFloor).findIndex(x=>x.id===t.id)/12);selectedId=t.id;renderFloor();}
 catch(e){f.querySelector('.form-error').textContent=e.message;}finally{b.disabled=false;}
};
byId('reserve-table').onclick=()=>{const f=byId('reserve-form');f.reset();f.querySelector('.form-error').textContent='';f.elements.partySize.max=tables.find(t=>t.id===selectedId).capacity;f.elements.partySize.value=1;byId('reserve-dialog').showModal();};
byId('reserve-form').onsubmit=async e=>{
 e.preventDefault();const f=e.currentTarget,b=f.querySelector('button');b.disabled=true;
 try{await Siar.api('/api/reservations','POST',{tableId:selectedId,customer:f.elements.customer.value,partySize:Number(f.elements.partySize.value),at:new Date(f.elements.at.value).toISOString()});f.closest('dialog').close();await Siar.refresh();}catch(e){f.querySelector('.form-error').textContent=e.message;}finally{b.disabled=false;}
};
for(const [id,action] of [['attend-reservation','attend'],['cancel-reservation','cancel']])byId(id).onclick=()=>{
 const r=reservationFor(selectedId);if(!r)return;if(action==='cancel'&&!confirm('¿Cancelar esta reserva?'))return;
 Siar.action(byId(id),async()=>{await Siar.api('/api/reservations/'+r.id+'/action','POST',{action});Siar.notify(action==='attend'?'Llegada confirmada. Ya puedes crear el pedido.':'Reserva cancelada.');});
};
