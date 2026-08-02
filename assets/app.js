
document.querySelectorAll('[data-page]').forEach(a=>a.addEventListener('click',e=>{
 e.preventDefault();
 document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
 document.querySelector('#'+a.dataset.page).classList.add('active');
 window.scrollTo({top:0,behavior:'smooth'});
}));
document.querySelectorAll('.plan-switch').forEach(s=>{
 const day=s.closest('.day');
 s.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
  s.querySelectorAll('button').forEach(x=>x.classList.remove('active'));
  day.querySelectorAll('.plan').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  day.querySelector('#'+b.dataset.target).classList.add('active');
 }));
});
document.querySelectorAll('textarea[data-note]').forEach(el=>{
 const k='note:'+el.dataset.note;
 el.value=localStorage.getItem(k)||'';
 el.addEventListener('input',()=>localStorage.setItem(k,el.value));
});
const defaultItems=[
{id:crypto.randomUUID(),name:'柯南限定周邊',category:'動漫周邊',place:'USJ／讀賣電視台',note:'先確認限購與庫存',done:false},
{id:crypto.randomUUID(),name:'任天堂限定商品',category:'動漫周邊',place:'Nintendo OSAKA／USJ',note:'依現場庫存決定',done:false},
{id:crypto.randomUUID(),name:'日本藥妝',category:'藥妝美妝',place:'心齋橋',note:'最後一天補買',done:false},
{id:crypto.randomUUID(),name:'大阪伴手禮',category:'食品伴手禮',place:'梅田／心齋橋',note:'確認保存期限',done:false}
];
let items=JSON.parse(localStorage.getItem('buyItems')||'null')||defaultItems;
let currentFilter='全部';
const list=document.querySelector('#buyList');
const form=document.querySelector('#buyForm');
function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function save(){localStorage.setItem('buyItems',JSON.stringify(items));render();}
function render(){
 const filtered=items.filter(x=>currentFilter==='全部'||x.category===currentFilter);
 list.innerHTML=filtered.length?filtered.map(x=>`<div class="buy-item ${x.done?'done':''}">
 <input type="checkbox" ${x.done?'checked':''} onchange="toggleItem('${x.id}')">
 <div><div class="item-name">${esc(x.name)}</div><div class="item-meta">${esc(x.category)}｜${esc(x.place)}</div>${x.note?`<div class="item-note">${esc(x.note)}</div>`:''}</div>
 <div class="item-actions"><button class="iconbtn" onclick="editItem('${x.id}')">編輯</button><button class="iconbtn" onclick="deleteItem('${x.id}')">刪除</button></div>
 </div>`).join(''):'<div class="empty">目前沒有項目</div>';
 document.querySelector('#totalCount').textContent=items.length;
 document.querySelector('#doneCount').textContent=items.filter(x=>x.done).length;
 document.querySelector('#leftCount').textContent=items.filter(x=>!x.done).length;
}
window.toggleItem=id=>{const x=items.find(i=>i.id===id);if(x)x.done=!x.done;save();}
window.deleteItem=id=>{if(confirm('確定刪除此項目？')){items=items.filter(i=>i.id!==id);save();}}
window.editItem=id=>{const x=items.find(i=>i.id===id);if(!x)return;const name=prompt('商品名稱',x.name);if(name===null)return;const place=prompt('購買地點',x.place);if(place===null)return;const note=prompt('備註',x.note||'');if(note===null)return;x.name=name.trim()||x.name;x.place=place.trim();x.note=note.trim();save();}
form.addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(form);const name=fd.get('name').trim();if(!name)return;items.unshift({id:crypto.randomUUID(),name,category:fd.get('category'),place:fd.get('place').trim(),note:fd.get('note').trim(),done:false});form.reset();save();});
document.querySelectorAll('.filter').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');currentFilter=b.dataset.filter;render();}));
document.querySelector('#clearDone').addEventListener('click',()=>{if(confirm('刪除所有已完成項目？')){items=items.filter(x=>!x.done);save();}});
render();
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js'));}
