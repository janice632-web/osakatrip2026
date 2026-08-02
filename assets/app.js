
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
{id:crypto.randomUUID(),name:'柯南限定周邊',category:'動漫周邊',place:'USJ／讀賣電視台',day:'4',time:'18:30',note:'先確認限購與庫存',done:false},
{id:crypto.randomUUID(),name:'任天堂限定商品',category:'動漫周邊',place:'Nintendo OSAKA',day:'5',time:'10:30',note:'依現場庫存決定',done:false},
{id:crypto.randomUUID(),name:'日本藥妝',category:'藥妝美妝',place:'心齋橋',day:'6',time:'10:00',note:'最後一天補買',done:false},
{id:crypto.randomUUID(),name:'大阪伴手禮',category:'食品伴手禮',place:'梅田',day:'5',time:'13:30',note:'確認保存期限',done:false}
];
let items=JSON.parse(localStorage.getItem('buyItems')||'null')||defaultItems;
let currentFilter='全部';
const list=document.querySelector('#buyList');
const form=document.querySelector('#buyForm');

function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function mapUrl(place){return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(place||'');}
function save(){localStorage.setItem('buyItems',JSON.stringify(items));render();renderSmartRoutes();}
function routeLabel(x){
 const day = x.day ? `Day ${x.day}` : '未排入';
 const time = x.time || '未設定時間';
 return `${day}｜${time}`;
}
function render(){
 const filtered=items.filter(x=>currentFilter==='全部'||x.category===currentFilter);
 list.innerHTML=filtered.length?filtered.map(x=>`<div class="buy-item ${x.done?'done':''}">
 <input type="checkbox" ${x.done?'checked':''} onchange="toggleItem('${x.id}')">
 <div>
   <div class="item-name">${esc(x.name)}</div>
   <div class="item-meta">${esc(x.category)}｜${esc(x.place)}</div>
   <div class="item-route-meta">${esc(routeLabel(x))}</div>
   ${x.note?`<div class="item-note">${esc(x.note)}</div>`:''}
   ${x.place?`<a class="inline-map" target="_blank" href="${mapUrl(x.place)}">Google Maps 導航 ↗</a>`:''}
 </div>
 <div class="item-actions">
   <button class="iconbtn" onclick="editItem('${x.id}')">編輯</button>
   <button class="iconbtn" onclick="deleteItem('${x.id}')">刪除</button>
 </div>
 </div>`).join(''):'<div class="empty">目前沒有項目</div>';
 document.querySelector('#totalCount').textContent=items.length;
 document.querySelector('#doneCount').textContent=items.filter(x=>x.done).length;
 document.querySelector('#leftCount').textContent=items.filter(x=>!x.done).length;
}
function renderSmartRoutes(){
 for(let day=1;day<=6;day++){
   const target=document.querySelector(`#smartRouteList${day}`);
   const count=document.querySelector(`#smartRouteCount${day}`);
   if(!target||!count)continue;
   const dayItems=items
     .filter(x=>String(x.day)===String(day))
     .sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
   count.textContent=`${dayItems.length} 項`;
   target.innerHTML=dayItems.length?dayItems.map(x=>`
     <div class="smart-route-item ${x.done?'done':''}">
       <div class="smart-route-time">${esc(x.time||'彈性')}</div>
       <div class="smart-route-main">
         <b>${esc(x.name)}</b>
         <span>${esc(x.place)}</span>
         ${x.note?`<small>${esc(x.note)}</small>`:''}
       </div>
       <a class="smart-route-nav" target="_blank" href="${mapUrl(x.place)}">導航</a>
     </div>`).join(''):'<div class="smart-route-empty">尚未加入必買行程</div>';
 }
}
window.toggleItem=id=>{const x=items.find(i=>i.id===id);if(x)x.done=!x.done;save();}
window.deleteItem=id=>{if(confirm('確定刪除此項目？')){items=items.filter(i=>i.id!==id);save();}}
window.editItem=id=>{
 const x=items.find(i=>i.id===id);if(!x)return;
 const name=prompt('商品名稱',x.name);if(name===null)return;
 const place=prompt('購買地點',x.place);if(place===null)return;
 const day=prompt('加入哪一天？請輸入 1–6；留白代表不加入行程',x.day||'');if(day===null)return;
 const time=prompt('建議時間（HH:MM）',x.time||'');if(time===null)return;
 const note=prompt('備註',x.note||'');if(note===null)return;
 x.name=name.trim()||x.name;
 x.place=place.trim();
 x.day=/^[1-6]$/.test(day.trim())?day.trim():'';
 x.time=/^\d{2}:\d{2}$/.test(time.trim())?time.trim():'';
 x.note=note.trim();
 save();
}
form.addEventListener('submit',e=>{
 e.preventDefault();
 const fd=new FormData(form);
 const name=fd.get('name').trim();
 const place=fd.get('place').trim();
 if(!name||!place)return;
 items.unshift({
   id:crypto.randomUUID(),
   name,
   category:fd.get('category'),
   place,
   day:fd.get('day'),
   time:fd.get('time'),
   note:fd.get('note').trim(),
   done:false
 });
 form.reset();
 save();
});
document.querySelectorAll('.filter').forEach(b=>b.addEventListener('click',()=>{
 document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));
 b.classList.add('active');
 currentFilter=b.dataset.filter;
 render();
}));
document.querySelector('#clearDone').addEventListener('click',()=>{
 if(confirm('刪除所有已完成項目？')){
   items=items.filter(x=>!x.done);
   save();
 }
});
render();
renderSmartRoutes();
if('serviceWorker' in navigator){
 window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js'));
}
