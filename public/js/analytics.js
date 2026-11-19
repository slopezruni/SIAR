'use strict';
// Funciones puras compartidas por reportes, dashboard y pruebas.
(function(root){
 function day(value){const d=new Date(value);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
 function summarize(state,from,to){
  const inside=v=>{const d=day(v);return (!from||d>=from)&&(!to||d<=to);};
  const invoices=state.invoices.filter(i=>inside(i.at)),movements=state.movements.filter(m=>inside(m.at));
  const products=new Map();
  for(const i of invoices)for(const item of i.items){let r=products.get(item.productId)||{id:item.productId,name:item.name,quantity:0,gross:0};r.quantity+=item.quantity;r.gross+=item.price*item.quantity;products.set(item.productId,r);}
  return {invoices,movements,count:invoices.length,total:invoices.reduce((s,i)=>s+i.total,0),subtotal:invoices.reduce((s,i)=>s+i.subtotal,0),discount:invoices.reduce((s,i)=>s+i.discount,0),tax:invoices.reduce((s,i)=>s+i.tax,0),products:[...products.values()].sort((a,b)=>b.quantity-a.quantity||a.id-b.id)};
 }
 function csv(rows){return '\uFEFF'+rows.map(row=>row.map(v=>{let s=String(v??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}).join(';')).join('\r\n');}
 const api={day,summarize,csv};if(typeof module!=='undefined')module.exports=api;else root.SiarAnalytics=api;
})(typeof window==='undefined'?globalThis:window);
