
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


function getHiddenItems(){return JSON.parse(localStorage.getItem('hiddenFixedItems')||'[]');}
function setHiddenItems(v){localStorage.setItem('hiddenFixedItems',JSON.stringify(v));}
function fixedTitle(el){return el.querySelector('.event strong')?.textContent?.trim()||'未命名行程';}
function compressImage(file,maxSide=1200,quality=.72){
 return new Promise((resolve,reject)=>{
  const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{
   let w=img.width,h=img.height,s=Math.min(1,maxSide/Math.max(w,h));w=Math.round(w*s);h=Math.round(h*s);
   const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);
   resolve(c.toDataURL('image/jpeg',quality));
  };img.onerror=reject;img.src=r.result};r.onerror=reject;r.readAsDataURL(file);
 });
}
function setupFixedItems(){
 document.querySelectorAll('.fixed-item').forEach(el=>{
  const id=el.dataset.itemId,event=el.querySelector('.event');if(!event||event.querySelector('.item-tools'))return;
  const tools=document.createElement('div');tools.className='item-tools';
  tools.innerHTML='<button class="manage-btn photo-btn">上傳入口照片／地圖</button><button class="manage-btn danger hide-btn">從行程隱藏</button><input type="file" accept="image/*" hidden>';
  event.appendChild(tools);
  const area=document.createElement('div');area.className='photo-area';area.innerHTML='<img class="photo-preview"><div class="photo-caption">入口照片／地圖（只儲存在目前裝置）</div><button class="manage-btn danger remove-photo">刪除照片</button>';event.appendChild(area);
  const stored=localStorage.getItem('fixedPhoto:'+id);if(stored){area.classList.add('has-photo');area.querySelector('img').src=stored}
  if(getHiddenItems().includes(id))el.style.display='none';
  tools.querySelector('.hide-btn').onclick=()=>{const h=getHiddenItems();if(!h.includes(id))h.push(id);setHiddenItems(h);el.style.display='none';renderRestore()};
  tools.querySelector('.photo-btn').onclick=()=>tools.querySelector('input').click();
  tools.querySelector('input').onchange=async e=>{if(!e.target.files[0])return;const data=await compressImage(e.target.files[0]);try{localStorage.setItem('fixedPhoto:'+id,data)}catch(err){alert('儲存空間不足')}area.classList.add('has-photo');area.querySelector('img').src=data;e.target.value=''};
  area.querySelector('.remove-photo').onclick=()=>{localStorage.removeItem('fixedPhoto:'+id);area.classList.remove('has-photo');area.querySelector('img').src=''};
 });
 document.querySelectorAll('.restore-toggle').forEach(b=>b.onclick=()=>b.closest('.restore-panel').classList.toggle('open'));
 renderRestore();
}
function renderRestore(){
 const hidden=getHiddenItems();
 document.querySelectorAll('[data-restore-day]').forEach(panel=>{
  const day=panel.dataset.restoreDay,list=panel.querySelector('.restore-list');
  const els=[...document.querySelectorAll(`#day${day} .fixed-item`)].filter(x=>hidden.includes(x.dataset.itemId));
  list.innerHTML=els.length?els.map(x=>`<div class="restore-entry"><span>${esc(fixedTitle(x))}</span><button data-r="${x.dataset.itemId}">還原</button></div>`).join(''):'<div class="empty">沒有已隱藏的行程</div>';
  list.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{const id=b.dataset.r;setHiddenItems(getHiddenItems().filter(x=>x!==id));document.querySelector(`[data-item-id="${id}"]`).style.display='';renderRestore()});
 });
}
let wishes=JSON.parse(localStorage.getItem('wishItems')||'[]');
const wishForm=document.querySelector('#wishForm'),wishList=document.querySelector('#wishList');
function wmap(p){return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p||'')}
function saveWishes(){localStorage.setItem('wishItems',JSON.stringify(wishes));renderWishes();renderWishRoutes()}
function renderWishes(){
 if(!wishList)return;
 wishList.innerHTML=wishes.length?wishes.map(w=>`<div class="wish-card"><div class="wish-top"><div><div class="wish-name">${esc(w.name)}</div><div class="wish-meta">${esc(w.type)}｜${w.day?'Day '+w.day:'未排行程'}｜${esc(w.time||'彈性')}｜${esc(w.place)}</div></div><span class="priority">${esc(w.priority)}優先</span></div>${w.note?`<div class="item-note">${esc(w.note)}</div>`:''}${w.photo?`<div class="wish-photo"><img src="${w.photo}"></div>`:''}<div class="wish-actions"><a target="_blank" href="${wmap(w.place)}">Google Maps</a><button data-p="${w.id}">上傳照片／地圖</button><button data-e="${w.id}">編輯</button><button class="danger" data-d="${w.id}">刪除</button><input data-i="${w.id}" type="file" accept="image/*" hidden></div></div>`).join(''):'<div class="empty">尚未新增想去景點</div>';
 wishList.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>wishList.querySelector(`[data-i="${b.dataset.p}"]`).click());
 wishList.querySelectorAll('[data-i]').forEach(i=>i.onchange=async e=>{const w=wishes.find(x=>x.id===i.dataset.i);if(!w||!e.target.files[0])return;w.photo=await compressImage(e.target.files[0]);saveWishes()});
 wishList.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{if(confirm('刪除此景點？')){wishes=wishes.filter(x=>x.id!==b.dataset.d);saveWishes()}});
 wishList.querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>{const w=wishes.find(x=>x.id===b.dataset.e);if(!w)return;const n=prompt('景點名稱',w.name);if(n===null)return;const p=prompt('地點',w.place);if(p===null)return;const d=prompt('Day 1–6；留白不排行程',w.day||'');if(d===null)return;const t=prompt('時間 HH:MM',w.time||'');if(t===null)return;const no=prompt('備註',w.note||'');if(no===null)return;w.name=n.trim()||w.name;w.place=p.trim();w.day=/^[1-6]$/.test(d.trim())?d.trim():'';w.time=/^\d{2}:\d{2}$/.test(t.trim())?t.trim():'';w.note=no.trim();saveWishes()});
}
function renderWishRoutes(){
 for(let day=1;day<=6;day++){
  let box=document.querySelector(`#wishRouteDay${day}`);const note=document.querySelector(`#day${day} .note`);if(!note)continue;
  if(!box){box=document.createElement('div');box.className='wish-route';box.id=`wishRouteDay${day}`;box.innerHTML=`<div class="wish-route-head"><h3>想去景點</h3><span id="wishRouteCount${day}"></span></div><div class="wish-route-list" id="wishRouteList${day}"></div>`;note.parentNode.insertBefore(box,note)}
  const arr=wishes.filter(w=>String(w.day)===String(day)).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99'));
  box.querySelector(`#wishRouteCount${day}`).textContent=`${arr.length} 項`;
  box.querySelector(`#wishRouteList${day}`).innerHTML=arr.length?arr.map(w=>`<div class="wish-route-item"><div class="wish-route-time">${esc(w.time||'彈性')}</div><div class="wish-route-main"><b>${esc(w.name)}</b><span>${esc(w.place)}｜${esc(w.priority)}優先</span></div><a class="wish-route-nav" target="_blank" href="${wmap(w.place)}">導航</a></div>`).join(''):'<div class="smart-route-empty">尚未安排想去景點</div>';
 }
}
if(wishForm)wishForm.onsubmit=e=>{e.preventDefault();const f=new FormData(wishForm);wishes.unshift({id:crypto.randomUUID(),name:f.get('name').trim(),type:f.get('type'),place:f.get('place').trim(),day:f.get('day'),time:f.get('time'),priority:f.get('priority'),note:f.get('note').trim(),photo:''});wishForm.reset();saveWishes()};
document.querySelector('#exportBackup')?.addEventListener('click',()=>{
 const data={version:1,storage:{}};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('note:')||k.startsWith('fixedPhoto:')||['buyItems','wishItems','hiddenFixedItems'].includes(k))data.storage[k]=localStorage.getItem(k)}
 const blob=new Blob([JSON.stringify(data)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='OSAKA2026_JanicesJourney_backup.json';a.click();URL.revokeObjectURL(a.href)
});
document.querySelector('#importBackup')?.addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);Object.entries(d.storage||{}).forEach(([k,v])=>localStorage.setItem(k,v));alert('匯入完成');location.reload()}catch(err){alert('備份格式錯誤')}};r.readAsText(f)});
setupFixedItems();renderWishes();renderWishRoutes();


const weatherCodes={
  0:['☀️','晴朗'],1:['🌤️','大致晴朗'],2:['⛅','局部多雲'],3:['☁️','陰天'],
  45:['🌫️','有霧'],48:['🌫️','霧淞'],51:['🌦️','毛毛雨'],53:['🌦️','毛毛雨'],
  55:['🌧️','較強毛毛雨'],61:['🌧️','小雨'],63:['🌧️','中雨'],65:['🌧️','大雨'],
  71:['🌨️','小雪'],73:['🌨️','中雪'],75:['❄️','大雪'],80:['🌦️','陣雨'],
  81:['🌧️','陣雨'],82:['⛈️','強陣雨'],95:['⛈️','雷雨'],96:['⛈️','雷雨冰雹'],99:['⛈️','強雷雨冰雹']
};
function weatherLabel(code){return weatherCodes[code]||['🌡️','天氣資訊'];}
async function loadWeatherCard(card){
  const {lat,lon,date,city}=card.dataset;
  const body=card.querySelector('.weather-card-body');
  body.innerHTML='<span class="weather-loading">正在更新…</span>';
  try{
    const url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTokyo&start_date=${date}&end_date=${date}`;
    const r=await fetch(url,{cache:'no-store'});
    if(!r.ok)throw new Error('weather');
    const d=await r.json();
    const dailyCode=d.daily?.weather_code?.[0];
    const [icon,label]=weatherLabel(dailyCode);
    const max=d.daily?.temperature_2m_max?.[0];
    const min=d.daily?.temperature_2m_min?.[0];
    const rain=d.daily?.precipitation_probability_max?.[0];
    const todayTokyo=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo'}).format(new Date());
    const currentAvailable=todayTokyo===date && d.current;
    const mainTemp=currentAvailable?`${Math.round(d.current.temperature_2m)}°`:`${Math.round(max)}°`;
    const sub=currentAvailable?`體感 ${Math.round(d.current.apparent_temperature)}°C`:'預報最高溫';
    body.innerHTML=`<div class="weather-icon">${icon}</div>
      <div class="weather-main"><div><b>${label}</b><span>${sub}｜資料更新 ${new Date().toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'})}</span></div><div class="weather-temp">${mainTemp}</div></div>
      <div class="weather-meta"><div><b>最高</b><span>${Math.round(max)}°C</span></div><div><b>最低</b><span>${Math.round(min)}°C</span></div><div><b>降雨</b><span>${rain??'—'}%</span></div></div>`;
    localStorage.setItem('weatherCache:'+date,JSON.stringify({html:body.innerHTML,ts:Date.now(),city}));
  }catch(e){
    const cached=localStorage.getItem('weatherCache:'+date);
    if(cached){body.innerHTML=JSON.parse(cached).html+'<div class="weather-error">目前顯示上次成功更新的資料</div>'}
    else body.innerHTML='<span class="weather-error">暫時無法取得天氣，請確認網路後重試。</span>';
  }
}
function loadHeroWeather(){
  const el=document.querySelector('#heroWeather');if(!el)return;
  const tokyoDate=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo'}).format(new Date());
  const cards=[...document.querySelectorAll('.weather-card')];
  let target=cards.find(c=>c.dataset.date===tokyoDate);
  if(!target)target=cards[0];
  const {lat,lon,city}=target.dataset;
  fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code&timezone=Asia%2FTokyo`,{cache:'no-store'})
   .then(r=>r.json()).then(d=>{
     const [icon,label]=weatherLabel(d.current.weather_code);
     el.innerHTML=`<div class="hero-weather-grid"><div class="hero-weather-icon">${icon}</div><div class="hero-weather-main"><b>${city}目前 ${label}</b><span>體感 ${Math.round(d.current.apparent_temperature)}°C｜自動更新</span></div><div class="hero-weather-temp">${Math.round(d.current.temperature_2m)}°</div></div>`;
   }).catch(()=>{el.innerHTML='<div class="weather-loading">當地天氣需要網路連線才能更新</div>'});
}
document.querySelectorAll('.weather-card').forEach(card=>{
  const cached=localStorage.getItem('weatherCache:'+card.dataset.date);
  if(cached){
    const c=JSON.parse(cached);
    if(Date.now()-c.ts<30*60*1000)card.querySelector('.weather-card-body').innerHTML=c.html;
    else loadWeatherCard(card);
  }else loadWeatherCard(card);
});
document.querySelectorAll('[data-weather-refresh]').forEach(btn=>btn.addEventListener('click',()=>loadWeatherCard(document.querySelector('#weatherDay'+btn.dataset.weatherRefresh))));
loadHeroWeather();
setInterval(()=>{document.querySelectorAll('.weather-card').forEach(loadWeatherCard);loadHeroWeather();},30*60*1000);
