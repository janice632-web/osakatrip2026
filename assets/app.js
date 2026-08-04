
window.addEventListener("error", function(e){
  var boot=document.getElementById("boot");
  if(boot){
    boot.innerHTML='<div style="padding:24px;text-align:center"><b>網站程式載入失敗</b><p style="font-size:13px;color:#766f67">'+
      String(e.message||"未知錯誤")+
      '</p><button onclick="location.reload()" style="border:0;border-radius:12px;padding:10px 14px;font-weight:900">重新整理</button></div>';
  }
});
window.addEventListener("unhandledrejection", function(e){
  var boot=document.getElementById("boot");
  if(boot){
    boot.innerHTML='<div style="padding:24px;text-align:center"><b>資料讀取失敗</b><p style="font-size:13px;color:#766f67">'+
      String((e.reason&&e.reason.message)||e.reason||"未知錯誤")+
      '</p><button onclick="location.reload()" style="border:0;border-radius:12px;padding:10px 14px;font-weight:900">重新整理</button></div>';
  }
});
setTimeout(function(){
  var boot=document.getElementById("boot");
  if(boot && !boot.classList.contains("hidden")){
    boot.innerHTML='<div style="padding:24px;text-align:center"><b>載入時間過久</b><p style="font-size:13px;color:#766f67">請點重新整理；若仍失敗，畫面會顯示實際錯誤。</p><button onclick="location.reload()" style="border:0;border-radius:12px;padding:10px 14px;font-weight:900">重新整理</button></div>';
  }
},10000);


const SUPABASE_URL="https://eazjagzkarvuutxgjekd.supabase.co";
const SUPABASE_KEY="sb_publishable_eqWE0FG39PYSXJRlhh4sRw_psKKFHc_";
const STORAGE_BUCKET="travel-images";


const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const params=new URLSearchParams(location.search);
let tripId=params.get("trip"), editToken=params.get("key"), readToken=params.get("view");
let readonly=!!readToken&&!editToken;
let trip,hotel,defaultShopping,defaultLuggage,activeDay=1,weatherCache={},cloudTimer=null,lastCloudUpdated=null;
let edits={
  version:3,
  itemOverrides:{},
  hiddenItems:[],
  addedItems:[],
  hotelImage:"",
  hotelBooking:{},
  selectedDay6Plan:0,
  dayOrders:{},
  favorites:[],
  shopping:[],
  luggage:{outbound:[],return:[]},
  diary:[],
  currencyRate:0.205,
  lastModified:null
};

const headers={"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Content-Type":"application/json"};
const cityCoords={Osaka:{lat:34.6937,lon:135.5023,label:"大阪"},Kyoto:{lat:35.0116,lon:135.7681,label:"京都"},Kobe:{lat:34.6901,lon:135.1955,label:"神戶"}};
const weatherCodes={0:["☀️","晴朗"],1:["🌤️","大致晴朗"],2:["⛅","局部多雲"],3:["☁️","陰天"],45:["🌫️","有霧"],48:["🌫️","霧淞"],51:["🌦️","毛毛雨"],53:["🌦️","毛毛雨"],55:["🌧️","較強毛毛雨"],61:["🌧️","小雨"],63:["🌧️","中雨"],65:["🌧️","大雨"],80:["🌦️","陣雨"],81:["🌧️","陣雨"],82:["⛈️","強陣雨"],95:["⛈️","雷雨"],96:["⛈️","雷雨冰雹"],99:["⛈️","強雷雨冰雹"]};

function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function mapUrl(q){return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(q||"")}
function directionUrl(q,mode="transit"){return "https://www.google.com/maps/dir/?api=1&destination="+encodeURIComponent(q||"")+"&travelmode="+encodeURIComponent(mode)}
function nearbyFoodUrl(q){return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent("restaurants near "+(q||""))}
function dateKey(){return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Tokyo"}).format(new Date())}
function token(bytes=24){const a=new Uint8Array(bytes);crypto.getRandomValues(a);return [...a].map(v=>v.toString(16).padStart(2,"0")).join("")}
function activeToken(){return editToken||readToken}
function localKey(){return tripId?`tc-edits:${tripId}`:"tc-edits:local"}
function setSync(text){$("#syncStatus").textContent=text}
function dateTimeText(){return new Date().toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit"})}

async function loadJson(path){const r=await fetch(path,{cache:"no-store"});if(!r.ok)throw new Error(path+" 載入失敗");return r.json()}
async function rpc(name,args){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{method:"POST",headers,body:JSON.stringify(args)});
  const text=await r.text();let body=null;try{body=text?JSON.parse(text):null}catch{body=text}
  if(!r.ok)throw new Error(body?.message||body?.hint||body||`HTTP ${r.status}`);
  return body;
}
async function compressImage(file){
  return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{let w=img.width,h=img.height,s=Math.min(1,1400/Math.max(w,h));w=Math.round(w*s);h=Math.round(h*s);const c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(img,0,0,w,h);c.toBlob(b=>b?resolve(b):reject(new Error("圖片壓縮失敗")),"image/webp",.78)};img.onerror=reject;img.src=reader.result};reader.onerror=reject;reader.readAsDataURL(file)})
}
async function uploadImage(file,folder){
  const path=`${tripId||"local"}/${folder}/${crypto.randomUUID()}.webp`,blob=await compressImage(file);
  const r=await fetch(`${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${path}`,{
    method:"POST",
    headers:{"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Content-Type":"image/webp","x-upsert":"false"},
    body:blob
  });
  const text=await r.text();if(!r.ok){let msg=text;try{msg=JSON.parse(text).message}catch{}throw new Error(msg)}
  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}

function loadLocalEdits(){
  try{edits={...edits,...JSON.parse(localStorage.getItem(localKey())||"{}")}}catch{}
}
function persistLocal(){
  edits.lastModified=new Date().toISOString();
  localStorage.setItem(localKey(),JSON.stringify(edits));
}
function queueCloudSave(){
  persistLocal();renderAll();
  if(readonly||!tripId||!editToken)return;
  clearTimeout(cloudTimer);cloudTimer=setTimeout(saveCloud,900);
}
async function saveCloud(){
  if(readonly||!tripId||!editToken)return;
  setSync("同步中…");
  try{
    lastCloudUpdated=await rpc("tc_update_private_trip",{p_trip_id:tripId,p_edit_token:editToken,p_payload:edits});
    setSync("已同步 "+dateTimeText());
  }catch(e){setSync("同步失敗，已保存本機");console.error(e)}
}
async function fetchCloud(){
  const rows=await rpc("tc_get_private_trip",{p_trip_id:tripId,p_token:activeToken()});
  if(!rows?.length)throw new Error("私人連結無效或旅程不存在");
  readonly=!rows[0].can_edit;
  const cloud=rows[0].payload||{};
  const cloudTime=Date.parse(cloud.lastModified||0),localTime=Date.parse(edits.lastModified||0);
  if(cloudTime>=localTime)edits={...edits,...cloud};
  persistLocal();lastCloudUpdated=rows[0].updated_at;
}
async function createCloudTrip(){
  const e=token(),r=token();
  try{
    const id=await rpc("tc_create_private_trip",{p_title:"Osaka 2026",p_edit_token:e,p_read_token:r,p_payload:{...edits,shareToken:r}});
    const u=new URL(location.href);u.search="";u.searchParams.set("trip",id);u.searchParams.set("key",e);location.href=u.toString();
  }catch(err){alert("建立失敗："+err.message)}
}
function editLink(){const u=new URL(location.href);u.search="";u.searchParams.set("trip",tripId);u.searchParams.set("key",editToken);return u.toString()}
function readLink(){const u=new URL(location.href);u.search="";u.searchParams.set("trip",tripId);u.searchParams.set("view",edits.shareToken||readToken);return u.toString()}
async function copyText(text){try{await navigator.clipboard.writeText(text);alert("已複製")}catch{prompt("請複製網址",text)}}

function mergedItem(item){
  return {...item,...(edits.itemOverrides[item.id]||{})};
}
function isHidden(id){return edits.hiddenItems.includes(id)}
function dayFromToday(){const key=dateKey();return trip.days.find(d=>d.date===key)?.day||null}
function baseItemsForDay(day,planIndex=edits.selectedDay6Plan||0){
  const base=[...(day.items||[])];
  if(day.plans?.length)base.unshift(...day.plans[planIndex].items);
  return base;
}
function orderKey(day,planIndex=edits.selectedDay6Plan||0){return "day-"+day.day+"-plan-"+planIndex}
function itemsForDay(day,planIndex=edits.selectedDay6Plan||0){
  const base=baseItemsForDay(day,planIndex).filter(x=>!isHidden(x.id)).map(mergedItem);
  const added=edits.addedItems.filter(x=>Number(x.day)===Number(day.day) && !isHidden(x.id)).map(mergedItem);
  const all=[...base,...added];
  const custom=edits.dayOrders?.[orderKey(day,planIndex)]||[];
  if(custom.length){
    const rank=new Map(custom.map((id,i)=>[id,i]));
    return all.sort((a,b)=>(rank.has(a.id)?rank.get(a.id):9999)-(rank.has(b.id)?rank.get(b.id):9999)||String(a.time||"99:99").localeCompare(String(b.time||"99:99")));
  }
  return all.sort((a,b)=>String(a.time||"99:99").localeCompare(String(b.time||"99:99")));
}
function travelReminder(max,rain){const a=[];if(max>=32)a.push("高溫，建議攜帶水與手持風扇");if(rain>=50)a.push("建議攜帶輕便雨具");return a.length?a.join("；"):"注意防曬並適時補充水分"}
function weatherHtml(day){
  const w=weatherCache[day.date];
  if(!w||w.wait)return `<div class="day-weather"><div class="weather-wait">預報尚未開放，接近出發日期後自動更新。</div></div>`;
  return `<div class="day-weather ${w.rain>=50?"rain-alert":""}"><div class="weather-main"><div><b>${w.icon} ${esc(w.label)}</b><div style="font-size:12px;color:var(--muted)">${travelReminder(w.max,w.rain)}</div></div><strong>${Math.round(w.min)}–${Math.round(w.max)}°C</strong></div><div class="weather-meta"><div><b>最高</b><span>${Math.round(w.max)}°C</span></div><div><b>最低</b><span>${Math.round(w.min)}°C</span></div><div><b>降雨</b><span>${w.rain}%</span></div></div></div>`;
}

function renderNav(){
  const editNav=[
    ["homePage","⌂","首頁"],["todayPage","◎","今日"],["itineraryPage","▣","行程"],["mapPage","⌖","地圖"],["toolsPage","☰","工具"],["morePage","•••","更多"]
  ];
  const readNav=[["homePage","⌂","首頁"],["itineraryPage","▣","行程"],["mapPage","⌖","地圖"]];
  const nav=readonly?readNav:editNav;
  $("#bottomNav").style.gridTemplateColumns=`repeat(${nav.length},1fr)`;
  $("#bottomNav").innerHTML=nav.map((n,i)=>`<button data-page="${n[0]}" class="${i===0?"active":""}"><span>${n[1]}</span>${n[2]}</button>`).join("");
  $$("#bottomNav button").forEach(b=>b.onclick=()=>switchPage(b.dataset.page,b));
}
function switchPage(page,button){
  $$("#bottomNav button").forEach(x=>x.classList.remove("active"));button?.classList.add("active");
  $$(".page").forEach(x=>x.classList.remove("active"));$("#"+page)?.classList.add("active");scrollTo({top:0,behavior:"smooth"});
}
function renderDashboard(){
  const dep=new Date(trip.trip.startDate+"T00:00:00+08:00"),diff=Math.ceil((dep-new Date())/86400000);
  $("#countdown").textContent=diff>0?diff+" 天":diff===0?"今天":"旅程中";
  const today=dayFromToday();
  if(today){const d=trip.days.find(x=>x.day===today),first=itemsForDay(d)[0];$("#todayLabel").textContent=`Day ${today}`;$("#todaySummary").textContent=first?`${first.time}｜${first.title}`:d.title}
}
function currentHotel(){
  return {...hotel,...(edits.hotelBooking||{})};
}
function renderHotel(){
  const h=currentHotel();
  const detailRows=[
    ["訂房平台",h.bookingPlatform],
    ["訂單編號",h.bookingNumber],
    ["房型",h.roomType],
    ["入住人",h.guestName],
    ["入住日期",h.checkIn],
    ["退房日期",h.checkOut],
    ["電話",h.phone],
    ["地址",h.address]
  ].filter(x=>x[1]);
  $("#hotelCard").innerHTML=`<h3>${esc(h.name||hotel.name)}</h3>
    <p>${esc(h.nameEn||hotel.nameEn||"")}</p>
    <p>${h.checkIn?`入住：${esc(h.checkIn)}`:"尚未輸入入住日期"}${h.checkOut?`｜退房：${esc(h.checkOut)}`:""}</p>
    ${h.bookingPlatform||h.bookingNumber?`<p>${esc(h.bookingPlatform||"")} ${h.bookingNumber?`｜訂單 ${esc(h.bookingNumber)}`:""}</p>`:""}
    ${edits.hotelImage?`<img class="user-image" src="${edits.hotelImage}" loading="lazy">`:""}
    <div class="hotel-actions">
      <a class="pill-link" target="_blank" href="${mapUrl(h.mapsQuery||h.address||h.name)}">Google Maps</a>
      <button class="small-action" onclick="toggleHotelDetails()">展開訂房資料</button>
      ${!readonly?'<button class="small-action" onclick="editHotelBooking()">編輯訂房資料</button><button class="small-action" onclick="uploadHotelImage()">上傳入口照片</button>':""}
    </div>
    <div id="hotelDetails" class="details">
      <div class="detail-grid">
        ${detailRows.length?detailRows.map(([k,v])=>`<div class="detail-row"><b>${esc(k)}</b><span>${esc(v)}</span></div>`).join(""):'<div class="detail-note">尚未輸入訂房資料。</div>'}
      </div>
      ${h.bookingNotes?`<div class="detail-note">${esc(h.bookingNotes)}</div>`:""}
    </div>`;
}
window.editHotelBooking=()=>{const h=currentHotel();openEditor("編輯訂房資料",[
  {name:"name",label:"飯店名稱",type:"text",value:h.name||""},
  {name:"bookingPlatform",label:"訂房平台",type:"text",value:h.bookingPlatform||""},
  {name:"bookingNumber",label:"訂單編號",type:"text",value:h.bookingNumber||""},
  {name:"roomType",label:"房型",type:"text",value:h.roomType||""},
  {name:"guestName",label:"入住人",type:"text",value:h.guestName||""},
  {name:"checkIn",label:"入住日期／時間",type:"text",value:h.checkIn||""},
  {name:"checkOut",label:"退房日期／時間",type:"text",value:h.checkOut||""},
  {name:"phone",label:"飯店電話",type:"text",value:h.phone||""},
  {name:"address",label:"地址",type:"text",value:h.address||""},
  {name:"bookingNotes",label:"訂房備註",type:"textarea",value:h.bookingNotes||""}
],v=>{edits.hotelBooking={...(edits.hotelBooking||{}),...v,mapsQuery:v.address||h.mapsQuery};queueCloudSave()})}
window.toggleHotelDetails=()=>$("#hotelDetails").style.display=$("#hotelDetails").style.display==="block"?"none":"block";
window.uploadHotelImage=()=>pickImage(async file=>{try{setSync("上傳圖片中…");edits.hotelImage=await uploadImage(file,"hotel");queueCloudSave()}catch(e){alert("上傳失敗："+e.message)}});

function renderTabs(){
  $("#dayTabs").innerHTML=trip.days.map(d=>`<button data-day="${d.day}" class="${d.day===activeDay?"active":""}">Day ${d.day}</button>`).join("");
  $$("#dayTabs button").forEach(b=>b.onclick=()=>{activeDay=Number(b.dataset.day);renderTabs();renderDay(activeDay)});
}
function renderDay(dayNo,planIndex=edits.selectedDay6Plan||0){
  const d=trip.days.find(x=>x.day===dayNo);
  if(d.plans?.length)edits.selectedDay6Plan=planIndex;
  let planSwitch=d.plans?.length?`<div class="plan-switch">${d.plans.map((p,i)=>`<button data-plan="${i}" class="${i===planIndex?"active":""}">${esc(p.name)}</button>`).join("")}</div>`:"";
  const items=itemsForDay(d,planIndex);
  $("#dayContent").innerHTML=`<div class="day-header"><small>DAY ${d.day} · ${d.date.replaceAll("-","/")}</small><h3>${esc(d.title)}</h3><p>${esc(d.city)}</p>${!readonly?'<p class="sort-hint">按住 ↕ 拖曳，或使用上移／下移調整順序。</p>':""}</div>${weatherHtml(d)}${planSwitch}<div id="sortableCards" data-day="${d.day}" data-plan="${planIndex}">${items.map((x,i)=>placeCard(x,items[i+1],i,items.length)).join("")}</div>${!readonly?`<button class="primary-action" onclick="addItem(${dayNo})">新增 Day ${dayNo} 行程</button>`:""}`;
  bindCards(d,planIndex);
  $$(".plan-switch button").forEach(b=>b.onclick=()=>{edits.selectedDay6Plan=Number(b.dataset.plan);persistLocal();renderDay(dayNo,Number(b.dataset.plan))});
}
function placeCard(x,next,index,total){
  const rows=[],t=x.transport||{},det=x.details||{};
  if(t.boarding)rows.push(["上車／起點",t.boarding]);if(t.transfer)rows.push(["轉乘",t.transfer]);if(t.route)rows.push(["路線",t.route]);if(t.arrival)rows.push(["下車／終點",t.arrival]);if(t.exit)rows.push(["出口",t.exit]);if(t.walkingMinutes)rows.push(["步行",`${t.walkingMinutes} 分鐘`]);
  if(det.boardingPoint)rows.push(["遊園車上車點",det.boardingPoint]);if(det.backupPoint)rows.push(["替代上車點",det.backupPoint]);if(det.dropOffPoint)rows.push(["遊園車下車點",det.dropOffPoint]);if(det.price)rows.push(["費用",det.price]);if(det.operationHours)rows.push(["營運時間",det.operationHours]);if(det.recommendedStayMinutes)rows.push(["建議停留",`${det.recommendedStayMinutes} 分鐘`]);if(det.cafes)rows.push(["咖啡備選",det.cafes.join("、")]);if(det.routeOptions)rows.push(["集合交通",det.routeOptions.join("／")]);if(det.flight)rows.push(["航班",`${det.flight}｜${det.departure} → ${det.arrival}`]);
  const favorite=(edits.favorites||[]).includes(x.id);
  return `<article class="place-card ${x.done?"done":""}" data-id="${x.id}" draggable="${readonly?"false":"true"}">
    <div class="place-top">
      ${!readonly?'<button class="drag-handle" title="拖曳排序">↕</button>':""}
      <div class="place-time">${esc(x.time)}</div>
      <div class="place-main"><h3>${esc(x.title)}</h3><div class="place-location">${esc(x.place)}</div><p class="place-summary">${esc(x.summary||"")}</p></div>
      <button class="expand-btn">詳情</button>
    </div>
    <div class="card-actions">
      <a class="pill-link" target="_blank" href="${mapUrl(x.mapsQuery||x.place)}">Google Maps</a>
      <a class="pill-link" target="_blank" href="${directionUrl(x.mapsQuery||x.place)}">目前位置導航</a>
      <a class="pill-link" target="_blank" href="${nearbyFoodUrl(x.mapsQuery||x.place)}">附近美食</a>
      <a class="pill-link" target="_blank" href="${directionUrl(x.mapsQuery||x.place,"transit")}">即時交通</a>
      ${next?`<a class="pill-link" target="_blank" href="${directionUrl(next.mapsQuery||next.place)}">前往下一站</a>`:""}
    </div>
    ${x.image?`<img class="user-image" src="${x.image}" loading="lazy">`:""}
    ${!readonly?`<div class="edit-tools">
      <button onclick="toggleFavorite('${x.id}')">${favorite?"★ 已收藏":"☆ 收藏"}</button>
      <button onclick="moveItem('${x.id}',-1)" ${index===0?"disabled":""}>上移</button>
      <button onclick="moveItem('${x.id}',1)" ${index===total-1?"disabled":""}>下移</button>
      <button onclick="toggleDone('${x.id}')">完成</button>
      <button onclick="editItem('${x.id}')">編輯</button>
      <button onclick="uploadItemImage('${x.id}')">圖片</button>
      <button class="danger" onclick="hideItem('${x.id}')">隱藏</button>
    </div>`:""}
    <div class="details"><div class="detail-grid">${rows.length?rows.map(([k,v])=>`<div class="detail-row"><b>${esc(k)}</b><span>${esc(v)}</span></div>`).join(""):'<div class="detail-note">目前沒有額外交通資料。</div>'}</div>${det.operationNote?`<div class="detail-note">${esc(det.operationNote)}</div>`:""}</div>
  </article>`;
}
function saveVisibleOrder(day,planIndex){
  const ids=$$("#sortableCards .place-card").map(x=>x.dataset.id);
  edits.dayOrders=edits.dayOrders||{};
  edits.dayOrders["day-"+day+"-plan-"+planIndex]=ids;
  queueCloudSave();
}
function bindCards(day,planIndex){
  $$(".expand-btn").forEach(b=>b.onclick=()=>b.closest(".place-card").classList.toggle("open"));
  if(readonly)return;
  let dragging=null;
  $$("#sortableCards .place-card").forEach(card=>{
    card.addEventListener("dragstart",e=>{dragging=card;card.classList.add("dragging");e.dataTransfer.effectAllowed="move"});
    card.addEventListener("dragend",()=>{card.classList.remove("dragging");dragging=null;saveVisibleOrder(day.day,planIndex)});
    card.addEventListener("dragover",e=>{
      e.preventDefault();
      if(!dragging||dragging===card)return;
      const rect=card.getBoundingClientRect();
      const after=e.clientY>rect.top+rect.height/2;
      card.parentNode.insertBefore(dragging,after?card.nextSibling:card);
    });
  });
}
function findBaseItem(id){for(const d of trip.days){for(const i of baseItemsForDay(d,edits.selectedDay6Plan||0)){if(i.id===id)return i}}return edits.addedItems.find(x=>x.id===id)}
window.toggleFavorite=id=>{
  edits.favorites=edits.favorites||[];
  edits.favorites=edits.favorites.includes(id)?edits.favorites.filter(x=>x!==id):[...edits.favorites,id];
  queueCloudSave();
};
window.moveItem=(id,delta)=>{
  const d=trip.days.find(x=>x.day===activeDay),plan=edits.selectedDay6Plan||0;
  const items=itemsForDay(d,plan),index=items.findIndex(x=>x.id===id),next=index+delta;
  if(index<0||next<0||next>=items.length)return;
  const ids=items.map(x=>x.id);[ids[index],ids[next]]=[ids[next],ids[index]];
  edits.dayOrders=edits.dayOrders||{};edits.dayOrders[orderKey(d,plan)]=ids;queueCloudSave();
};
window.toggleDone=id=>{edits.itemOverrides[id]={...(edits.itemOverrides[id]||{}),done:!mergedItem(findBaseItem(id)).done};queueCloudSave()};
window.hideItem=id=>{if(confirm("隱藏此行程？")){if(!edits.hiddenItems.includes(id))edits.hiddenItems.push(id);queueCloudSave()}};
window.editItem=id=>{const x=mergedItem(findBaseItem(id));openEditor("編輯行程",[
  {name:"time",label:"時間",type:"text",value:x.time},{name:"title",label:"名稱",type:"text",value:x.title},{name:"place",label:"地點",type:"text",value:x.place},{name:"summary",label:"重點提醒",type:"textarea",value:x.summary}
],v=>{edits.itemOverrides[id]={...(edits.itemOverrides[id]||{}),...v};queueCloudSave()})};
window.addItem=day=>openEditor(`新增 Day ${day} 行程`,[
  {name:"time",label:"時間",type:"text",value:"09:00"},{name:"title",label:"名稱",type:"text",value:""},{name:"place",label:"地點",type:"text",value:""},{name:"summary",label:"重點提醒",type:"textarea",value:""}
],v=>{edits.addedItems.push({...v,id:"user-"+crypto.randomUUID(),day:Number(day),mapsQuery:v.place});queueCloudSave()});
window.uploadItemImage=id=>pickImage(async file=>{try{setSync("上傳圖片中…");const url=await uploadImage(file,"itinerary");edits.itemOverrides[id]={...(edits.itemOverrides[id]||{}),image:url};queueCloudSave()}catch(e){alert("上傳失敗："+e.message)}});

function pickImage(callback){const input=document.createElement("input");input.type="file";input.accept="image/*";input.onchange=()=>input.files[0]&&callback(input.files[0]);input.click()}
function openEditor(title,fields,onSave){
  $("#editTitle").textContent=title;
  $("#editFields").innerHTML=fields.map(function(f){
    var control;
    if(f.type==="textarea"){
      control='<textarea name="'+esc(f.name)+'">'+esc(f.value||"")+'</textarea>';
    }else{
      control='<input name="'+esc(f.name)+'" value="'+esc(f.value||"")+'">';
    }
    return '<div class="field"><label>'+esc(f.label)+'</label>'+control+'</div>';
  }).join("");
  $("#editDialog").showModal();
  $("#editForm").onsubmit=function(e){
    e.preventDefault();
    onSave(Object.fromEntries(new FormData(e.target)));
    $("#editDialog").close();
  };
}
function renderMap(){
  $("#mapList").innerHTML=trip.days.map(d=>`<section class="map-day"><h3>Day ${d.day}｜${esc(d.title)}</h3>${itemsForDay(d).map(x=>`<div class="map-row"><span>${esc(x.time)}｜${esc(x.title)}</span><a target="_blank" href="${mapUrl(x.mapsQuery||x.place)}">導航</a></div>`).join("")}</section>`).join("");
}
function renderToday(){
  const dayNo=dayFromToday();if(!dayNo){$("#todayWeather").innerHTML="";$("#todayItems").innerHTML='<div class="today-empty">旅程尚未開始。出發後會自動顯示當天行程與天氣。</div>';return}
  const d=trip.days.find(x=>x.day===dayNo),items=itemsForDay(d);$("#todayWeather").innerHTML=weatherHtml(d);$("#todayItems").innerHTML=items.map((x,i)=>placeCard(x,items[i+1],i,items.length)).join("");bindCards(d,edits.selectedDay6Plan||0)
}
function renderAll(){renderNav();renderDashboard();renderHotel();renderTabs();renderDay(activeDay);renderMap();renderToday();renderTools();renderCloudPanels();applyReadonly()}
function renderCloudPanels(){
  if(tripId){$("#noTripPanel").classList.add("hidden");$("#tripManagePanel").classList.remove("hidden");$("#syncBar").classList.remove("hidden")}else{$("#noTripPanel").classList.remove("hidden");$("#tripManagePanel").classList.add("hidden");$("#syncBar").classList.add("hidden")}
}
function applyReadonly(){
  document.querySelectorAll(".readonly-banner").forEach(x=>x.remove());
  if(readonly){document.body.insertAdjacentHTML("afterbegin",'<div class="readonly-banner">唯讀分享模式｜最後更新 '+esc(edits.lastModified?new Date(edits.lastModified).toLocaleString("zh-TW"):"—")+"</div>");$("#syncBar").classList.add("hidden")}
}

function findAnyItem(id){
  for(const d of trip.days){
    for(const p of [0,1]){
      const x=baseItemsForDay(d,p).find(i=>i.id===id);
      if(x)return mergedItem(x);
    }
  }
  return edits.addedItems.find(x=>x.id===id);
}
function renderTools(){
  if(readonly)return;
  $$(".tool-tabs button").forEach(b=>b.onclick=()=>{
    $$(".tool-tabs button").forEach(x=>x.classList.remove("active"));
    $$(".tool-panel").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");$("#"+b.dataset.tool).classList.add("active");
  });
  renderFavorites();renderShopping();renderLuggage();renderDiary();renderAssistant();
  const yen=$("#yenInput"),rate=$("#rateInput"),out=$("#twdOutput");
  if(yen&&rate&&out){
    rate.value=edits.currencyRate||0.205;
    const update=()=>{edits.currencyRate=Number(rate.value)||0.205;out.textContent="NT$"+Math.round((Number(yen.value)||0)*edits.currencyRate).toLocaleString();persistLocal()};
    yen.oninput=update;rate.oninput=update;update();
  }
}
function renderFavorites(){
  const items=(edits.favorites||[]).map(findAnyItem).filter(Boolean);
  $("#favoriteList").innerHTML=items.length?items.map(x=>`<article class="tool-card"><div><h4>${esc(x.title)}</h4><p>${esc(x.place)}</p></div><div class="tool-actions"><a target="_blank" href="${directionUrl(x.mapsQuery||x.place)}">導航</a><button onclick="toggleFavorite('${x.id}')">移除</button></div></article>`).join(""):'<div class="today-empty">尚未收藏景點。</div>';
}
function renderShopping(){
  const total=edits.shopping.reduce((s,x)=>s+(Number(x.amount)||0),0),done=edits.shopping.filter(x=>x.done).length;
  $("#shoppingStats").innerHTML=`<div><b>${edits.shopping.length}</b><span>全部</span></div><div><b>${done}</b><span>已買</span></div><div><b>¥${total.toLocaleString()}</b><span>總金額</span></div>`;
  $("#shoppingList").innerHTML=edits.shopping.map(x=>`<article class="tool-card ${x.done?"done":""}"><div><h4>${esc(x.name)}</h4><p>${esc(x.place||"未指定")}｜¥${Number(x.amount||0).toLocaleString()}</p><p>${esc(x.recipient||"")}</p></div><div class="tool-actions"><button onclick="toggleShopping('${x.id}')">✓</button><button onclick="editShopping('${x.id}')">編輯</button><button onclick="deleteShopping('${x.id}')">刪除</button></div></article>`).join("")||'<div class="today-empty">尚無必買商品。</div>';
}
window.toggleShopping=id=>{const x=edits.shopping.find(v=>v.id===id);x.done=!x.done;queueCloudSave()};
window.deleteShopping=id=>{if(confirm("刪除此商品？")){edits.shopping=edits.shopping.filter(x=>x.id!==id);queueCloudSave()}};
window.editShopping=id=>{const x=edits.shopping.find(v=>v.id===id);openEditor("編輯必買",[
  {name:"name",label:"商品",type:"text",value:x.name},{name:"place",label:"購買地點",type:"text",value:x.place},{name:"amount",label:"金額（日圓）",type:"text",value:x.amount},{name:"recipient",label:"送禮對象",type:"text",value:x.recipient}
],v=>{Object.assign(x,v,{amount:Number(v.amount)||0});queueCloudSave()})};
function addShoppingItem(){openEditor("新增必買",[
  {name:"name",label:"商品",type:"text",value:""},{name:"place",label:"購買地點",type:"text",value:""},{name:"amount",label:"金額（日圓）",type:"text",value:"0"},{name:"recipient",label:"送禮對象",type:"text",value:""}
],v=>{edits.shopping.unshift({...v,id:"shop-"+crypto.randomUUID(),amount:Number(v.amount)||0,done:false});queueCloudSave()})}
function renderLuggage(){
  const group=(title,key)=>`<section class="luggage-group"><h4>${title}</h4>${edits.luggage[key].map(x=>`<label class="check-row ${x.done?"done":""}"><input type="checkbox" ${x.done?"checked":""} onchange="toggleLuggage('${key}','${x.id}')"><span>${esc(x.name)}</span><button onclick="deleteLuggage('${key}','${x.id}');return false;">刪除</button></label>`).join("")}</section>`;
  $("#luggageLists").innerHTML=group("出發前","outbound")+group("回程前","return");
}
window.toggleLuggage=(key,id)=>{const x=edits.luggage[key].find(v=>v.id===id);x.done=!x.done;queueCloudSave()};
window.deleteLuggage=(key,id)=>{edits.luggage[key]=edits.luggage[key].filter(x=>x.id!==id);queueCloudSave()};
function addLuggageItem(){openEditor("新增行李",[
  {name:"group",label:"分類（outbound 或 return）",type:"text",value:"outbound"},{name:"name",label:"項目",type:"text",value:""}
],v=>{const key=v.group==="return"?"return":"outbound";edits.luggage[key].push({id:"lug-"+crypto.randomUUID(),name:v.name,done:false});queueCloudSave()})}
function renderDiary(){
  $("#diaryList").innerHTML=edits.diary.map(x=>`<article class="tool-card"><div><h4>${esc(x.date)}</h4><p>${esc(x.text)}</p></div><div class="tool-actions"><button onclick="editDiary('${x.id}')">編輯</button><button onclick="deleteDiary('${x.id}')">刪除</button></div></article>`).join("")||'<div class="today-empty">尚無日記。</div>';
}
window.deleteDiary=id=>{edits.diary=edits.diary.filter(x=>x.id!==id);queueCloudSave()};
window.editDiary=id=>{const x=edits.diary.find(v=>v.id===id);openEditor("編輯日記",[
  {name:"date",label:"日期",type:"text",value:x.date},{name:"text",label:"內容",type:"textarea",value:x.text}
],v=>{Object.assign(x,v);queueCloudSave()})};
function addDiaryItem(){openEditor("新增日記",[
  {name:"date",label:"日期",type:"text",value:dateKey()},{name:"text",label:"內容",type:"textarea",value:""}
],v=>{edits.diary.unshift({...v,id:"diary-"+crypto.randomUUID()});queueCloudSave()})}
function renderAssistant(){
  const select=$("#assistantDay");if(!select)return;
  select.innerHTML=trip.days.map(d=>`<option value="${d.day}">Day ${d.day}｜${esc(d.title)}</option>`).join("");
}
async function copyAssistantPrompt(){
  const day=trip.days.find(d=>d.day===Number($("#assistantDay").value));
  const items=itemsForDay(day).map(x=>`${x.time} ${x.title}（${x.place}）`).join("\\n");
  const q=$("#assistantQuestion").value.trim()||"請依天氣與交通，提供當天行程優化建議。";
  const prompt=`我正在規劃大阪自由行。\\n${day.date} Day ${day.day}：${day.title}\\n行程：\\n${items}\\n問題：${q}\\n請以繁體中文、簡潔具體回答，並優先考量交通順路、夏季高溫與獨旅安全。`;
  await copyText(prompt);
  window.open("https://chatgpt.com/","_blank");
}

async function loadAllWeather(){await Promise.all(trip.days.map(loadWeatherForDay));renderForecast();renderDay(activeDay);renderToday()}
async function loadWeatherForDay(day){
  const c=cityCoords[day.weather.location];
  try{const url=`https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTokyo&start_date=${day.date}&end_date=${day.date}`;const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw new Error();const j=await r.json();if(!j.daily?.time?.length){weatherCache[day.date]={wait:true};return}const code=j.daily.weather_code[0],[icon,label]=weatherCodes[code]||["🌡️","天氣資訊"];weatherCache[day.date]={icon,label,max:j.daily.temperature_2m_max[0],min:j.daily.temperature_2m_min[0],rain:j.daily.precipitation_probability_max[0]??0}}catch{weatherCache[day.date]={wait:true}}
}
function renderForecast(){$("#forecastStrip").innerHTML=trip.days.map(d=>{const w=weatherCache[d.date];return `<div class="forecast-card"><small>Day ${d.day}</small>${w&&!w.wait?`<b>${w.icon}</b><span>${Math.round(w.min)}–${Math.round(w.max)}°</span><small>降雨 ${w.rain}%</small>`:`<b>—</b><span>尚未開放</span><small>${esc(d.city)}</small>`}</div>`}).join("")}
async function init(){
  try{
    [trip,hotel,defaultShopping,defaultLuggage]=await Promise.all([loadJson("./public/data/osaka-2026.json"),loadJson("./public/data/hotel.json"),loadJson("./public/data/shopping.json"),loadJson("./public/data/luggage.json")]);
    loadLocalEdits();
    edits.dayOrders=edits.dayOrders||{};
    edits.favorites=Array.isArray(edits.favorites)?edits.favorites:[];
    edits.hotelBooking=edits.hotelBooking||{};
    edits.shopping=Array.isArray(edits.shopping)&&edits.shopping.length?edits.shopping:(defaultShopping.defaultItems||[]).map(x=>({...x,done:false}));
    edits.luggage=edits.luggage&&Array.isArray(edits.luggage.outbound)?edits.luggage:{outbound:(defaultLuggage.outbound||[]).map((name,i)=>({id:"out-"+i,name,done:false})),return:(defaultLuggage.return||[]).map((name,i)=>({id:"ret-"+i,name,done:false}))};
    edits.diary=Array.isArray(edits.diary)?edits.diary:[];
    edits.currencyRate=Number(edits.currencyRate)||0.205;
    if(tripId&&activeToken()){try{await fetchCloud();setSync("雲端已連線")}catch(e){console.error(e);setSync("雲端讀取失敗，顯示本機資料")}}
    $("#boot").classList.add("hidden");$("#app").classList.remove("hidden");renderAll();loadAllWeather();
    if(tripId&&activeToken())setInterval(async()=>{if(document.hidden)return;try{const before=JSON.stringify(edits);await fetchCloud();if(JSON.stringify(edits)!==before){renderAll();setSync("已收到其他裝置更新")}}catch{}},7000);
  }catch(e){$("#boot").innerHTML=`<div style="padding:24px;text-align:center"><b>資料載入失敗</b><p>${esc(e.message)}</p></div>`}
}

$("#refreshWeather").onclick=()=>{weatherCache={};$("#forecastStrip").innerHTML='<div class="weather-wait">正在更新…</div>';loadAllWeather()};
$$("[data-page-target]").forEach(b=>b.onclick=()=>{const btn=$(`#bottomNav [data-page="${b.dataset.pageTarget}"]`);switchPage(b.dataset.pageTarget,btn)});
$("#exportData").onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(trip,null,2)],{type:"application/json"}));a.download="osaka-2026.json";a.click();URL.revokeObjectURL(a.href)};
$("#createCloudTrip").onclick=createCloudTrip;
$("#joinTrip").onclick=()=>{try{location.href=new URL($("#joinTripUrl").value.trim()).toString()}catch{alert("網址格式不正確")}};
$("#copyEditLink").onclick=()=>copyText(editLink());
$("#copyReadLink").onclick=()=>copyText(readLink());
$("#syncNow").onclick=saveCloud;
$("#exportState").onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(edits,null,2)],{type:"application/json"}));a.download="osaka-2026-edits.json";a.click();URL.revokeObjectURL(a.href)};
$("#importState").onchange=e=>{const r=new FileReader();r.onload=()=>{try{edits={...edits,...JSON.parse(r.result)};queueCloudSave()}catch{alert("檔案格式錯誤")}};r.readAsText(e.target.files[0])};
$("#clearEdits").onclick=()=>{if(confirm("清除所有個人修改？原始行程仍會保留。")){const share=edits.shareToken;edits={version:3,itemOverrides:{},hiddenItems:[],addedItems:[],hotelImage:"",hotelBooking:{},selectedDay6Plan:0,dayOrders:{},favorites:[],shopping:[],luggage:{outbound:[],return:[]},diary:[],currencyRate:0.205,lastModified:null,shareToken:share};queueCloudSave()}};

$("#addShopping").onclick=addShoppingItem;
$("#addLuggage").onclick=addLuggageItem;
$("#addDiary").onclick=addDiaryItem;
$("#copyAssistantPrompt").onclick=copyAssistantPrompt;
init();
