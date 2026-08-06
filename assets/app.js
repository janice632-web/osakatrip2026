
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
let trip,hotel,dayOverrides,activeDay=1,weatherCache={},cloudTimer=null,lastCloudUpdated=null;
let edits={
  version:5,
  itemOverrides:{},
  hiddenItems:[],
  addedItems:[],
  hotelImage:"",
  hotelBooking:{},
  selectedDay6Plan:0,
    day6PlanBEnabled:true,
  day6PlanBEnabled:true,
  dayOrders:{},
  prepItems:[],
  shopping:[],
  lastModified:null
};

const headers={"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Content-Type":"application/json"};
const cityCoords={Osaka:{lat:34.6937,lon:135.5023,label:"大阪"},Kyoto:{lat:35.0116,lon:135.7681,label:"京都"},Kobe:{lat:34.6901,lon:135.1955,label:"神戶"}};

const RECOMMENDED_SHOPPING_ITEMS=[
  {id:"shop-rec-elixir",name:"ELIXIR Retino Power Wrinkle Cream ba S 15g",qty:1,unitPrice:6600,person:"自己",done:false,image:"assets/products/elixir.webp"},
  {id:"shop-rec-biore-athlizm",name:"Biore UV ATHLIZM Protect Mist 70ml",qty:1,unitPrice:1980,person:"自己",done:false,image:"https://japanesetaste.com.au/cdn/shop/files/athlizm_1.jpg?v=1746157315"},
  {id:"shop-rec-skin-aqua",name:"Skin Aqua Super Moisture UV Gel Pump 140g",qty:1,unitPrice:1375,person:"自己",done:false,image:"assets/products/skin-aqua.jpg"},
  {id:"shop-rec-minon-mask",name:"MINON Amino Moist 保濕面膜 4片",qty:1,unitPrice:1320,person:"自己",done:false,image:"assets/products/minon.jpg"},
  {id:"shop-rec-melano-cc",name:"Melano CC Premium Essence 20ml",qty:1,unitPrice:1628,person:"自己",done:false,image:"assets/products/melano-cc.jpg"},
  {id:"shop-rec-lipopeel",name:"LIPOPEEL 柔煥透亮精萃 30ml",qty:1,unitPrice:2480,person:"自己",done:false,image:"assets/products/lipopeel.png"},
  {id:"shop-rec-fancl-mco",name:"FANCL Mild Cleansing Oil 120ml",qty:1,unitPrice:1980,person:"自己",done:false,image:"assets/products/fancl-mco.png"}
];

const weatherCodes={0:["☀️","晴朗"],1:["🌤️","大致晴朗"],2:["⛅","局部多雲"],3:["☁️","陰天"],45:["🌫️","有霧"],48:["🌫️","霧淞"],51:["🌦️","毛毛雨"],53:["🌦️","毛毛雨"],55:["🌧️","較強毛毛雨"],61:["🌧️","小雨"],63:["🌧️","中雨"],65:["🌧️","大雨"],80:["🌦️","陣雨"],81:["🌧️","陣雨"],82:["⛈️","強陣雨"],95:["⛈️","雷雨"],96:["⛈️","雷雨冰雹"],99:["⛈️","強雷雨冰雹"]};

function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function mapUrl(q){return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(q||"")}
function directionUrl(q){return "https://www.google.com/maps/dir/?api=1&destination="+encodeURIComponent(q||"")+"&travelmode=transit"}
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


function migrateEdits(raw){
  const previous=raw&&typeof raw==="object"?raw:{};
  try{
    const key=tripId?`tc-backup:${tripId}:${Date.now()}`:`tc-backup:local:${Date.now()}`;
    localStorage.setItem(key,JSON.stringify(previous));
  }catch{}
  const defaults={
    version:4,
    itemOverrides:{},
    hiddenItems:[],
    addedItems:[],
    hotelImage:"",
    hotelBooking:{},
    selectedDay6Plan:0,
    dayOrders:{},
    originalDayOrders:{},
    routeFixed:{},
    routeCoordinates:{},
    selectedPlans:{},
    planStatuses:{},
    prepItems:[
      {id:"prep-passport",name:"護照",done:false},
      {id:"prep-vjw",name:"Visit Japan Web",done:false},
      {id:"prep-flight",name:"電子機票",done:false},
      {id:"prep-insurance",name:"旅遊保險",done:false},
      {id:"prep-hotel",name:"飯店訂房確認",done:false},
      {id:"prep-esim",name:"eSIM／SIM",done:false},
      {id:"prep-card",name:"信用卡海外交易",done:false},
      {id:"prep-cash",name:"日圓現金",done:false}
    ],
    shopping:[],
    lastModified:null
  };
  const next={...defaults,...previous};
  next.day6PlanBEnabled=previous.day6PlanBEnabled!==false;
  next.itemOverrides={...defaults.itemOverrides,...(previous.itemOverrides||{})};
  next.hotelBooking={...defaults.hotelBooking,...(previous.hotelBooking||{})};
  next.dayOrders={...defaults.dayOrders,...(previous.dayOrders||{})};
  next.originalDayOrders={...defaults.originalDayOrders,...(previous.originalDayOrders||{})};
  next.routeFixed={...defaults.routeFixed,...(previous.routeFixed||{})};
  next.routeCoordinates={...defaults.routeCoordinates,...(previous.routeCoordinates||{})};
  next.selectedPlans={...defaults.selectedPlans,...(previous.selectedPlans||{})};
  next.planStatuses={...defaults.planStatuses,...(previous.planStatuses||{})};
  next.hiddenItems=Array.isArray(previous.hiddenItems)?previous.hiddenItems:[];
  next.addedItems=Array.isArray(previous.addedItems)?previous.addedItems:[];
  next.prepItems=Array.isArray(previous.prepItems)&&previous.prepItems.length?previous.prepItems:defaults.prepItems;
  next.shopping=Array.isArray(previous.shopping)?previous.shopping:[];
  const normalizedNames=new Set(next.shopping.map(x=>String(x.name||"").toLowerCase().replace(/\s+/g,"")));
  RECOMMENDED_SHOPPING_ITEMS.forEach(item=>{
    const key=String(item.name).toLowerCase().replace(/\s+/g,"");
    const idExists=next.shopping.some(x=>x.id===item.id);
    const fuzzyExists=["elixir","athlizm","skinaqua","minon","melanocc","lipopeel","fancl"].some(token=>key.includes(token)&&[...normalizedNames].some(n=>n.includes(token)));
    if(!idExists&&!normalizedNames.has(key)&&!fuzzyExists){next.shopping.push({...item});normalizedNames.add(key)}
  });
  next.version=5;
  return next;
}

function loadLocalEdits(){
  try{edits=migrateEdits(JSON.parse(localStorage.getItem(localKey())||"{}"))}catch{edits=migrateEdits(edits)}
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
  if(cloudTime>=localTime)edits=migrateEdits({...edits,...cloud});
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
function baseItemsForDay(day,planIndex=selectedPlanForDay(day.day)){
  const base=[...(day.items||[])];
  if(day.plans?.length)base.unshift(...day.plans[planIndex].items);
  return base;
}
function orderKey(day,planIndex=selectedPlanForDay(day.day)){return "day-"+day.day+"-plan-"+planIndex}
function itemsForDay(day,planIndex=selectedPlanForDay(day.day)){
  const base=baseItemsForDay(day,planIndex).filter(x=>!isHidden(x.id)).map(mergedItem);
  const added=edits.addedItems.filter(x=>Number(x.day)===Number(day.day)&&!isHidden(x.id)).map(mergedItem);
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
  return `<div class="day-weather"><div class="weather-main"><div><b>${w.icon} ${esc(w.label)}</b><div style="font-size:12px;color:var(--muted)">${travelReminder(w.max,w.rain)}</div></div><strong>${Math.round(w.min)}–${Math.round(w.max)}°C</strong></div><div class="weather-meta"><div><b>最高</b><span>${Math.round(w.max)}°C</span></div><div><b>最低</b><span>${Math.round(w.min)}°C</span></div><div><b>降雨</b><span>${w.rain}%</span></div></div></div>`;
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
function currentHotel(){return {...hotel,...(edits.hotelBooking||{})}}
function renderHotel(){
  const h=currentHotel();
  $("#hotelCard").innerHTML=`<h3>${esc(h.name||hotel.name)}</h3>
    <p>${esc(h.bookingPlatform||"尚未輸入訂房平台")}${h.bookingNumber?`｜訂單 ${esc(h.bookingNumber)}`:""}</p>
    <p>${esc(h.address||"尚未輸入地址")}</p>
    ${h.phone?`<p>電話：${esc(h.phone)}</p>`:""}
    ${edits.hotelImage?`<img class="user-image" src="${edits.hotelImage}" loading="lazy">`:""}
    <div class="hotel-actions">
      <a class="pill-link" target="_blank" href="${mapUrl(h.address||h.mapsQuery||h.name)}">Google Maps</a>
      <button class="small-action" onclick="toggleHotelDetails()">展開備註</button>
      ${!readonly?'<button class="small-action" onclick="editHotelBooking()">編輯住宿資訊</button><button class="small-action" onclick="uploadHotelImage()">上傳入口照片</button>':""}
    </div>
    <div id="hotelDetails" class="details"><div class="detail-note">${esc(h.bookingNotes||"尚未輸入備註")}</div></div>`;
}
window.editHotelBooking=()=>{const h=currentHotel();openEditor("編輯住宿資訊",[
  {name:"name",label:"飯店名稱",type:"text",value:h.name||""},
  {name:"bookingPlatform",label:"訂房平台",type:"text",value:h.bookingPlatform||""},
  {name:"bookingNumber",label:"訂單編號",type:"text",value:h.bookingNumber||""},
  {name:"address",label:"地址",type:"text",value:h.address||""},
  {name:"phone",label:"電話",type:"text",value:h.phone||""},
  {name:"bookingNotes",label:"備註",type:"textarea",value:h.bookingNotes||""}
],v=>{edits.hotelBooking={...(edits.hotelBooking||{}),...v};queueCloudSave()})}
window.toggleHotelDetails=()=>$("#hotelDetails").style.display=$("#hotelDetails").style.display==="block"?"none":"block";
window.uploadHotelImage=()=>pickImage(async file=>{try{setSync("上傳圖片中…");edits.hotelImage=await uploadImage(file,"hotel");queueCloudSave()}catch(e){alert("上傳失敗："+e.message)}});

function renderTabs(){
  $("#dayTabs").innerHTML=trip.days.map(d=>`<button data-day="${d.day}" class="${d.day===activeDay?"active":""}">Day ${d.day}</button>`).join("");
  $$("#dayTabs button").forEach(b=>b.onclick=()=>{activeDay=Number(b.dataset.day);renderTabs();renderDay(activeDay)});
}

function isDay6PlanBEnabled(){
  return edits.day6PlanBEnabled!==false;
}
window.toggleDay6PlanB=(enabled)=>{
  edits.day6PlanBEnabled=!!enabled;
  if(!edits.day6PlanBEnabled){
    edits.selectedPlans=edits.selectedPlans||{};
    edits.selectedPlans[6]=0;
    edits.selectedDay6Plan=0;
  }
  queueCloudSave();
};

function renderDay(dayNo,planIndex=null){
  const d=trip.days.find(x=>x.day===dayNo);

  if(planIndex===null){
    if(typeof selectedPlanForDay==="function") planIndex=selectedPlanForDay(dayNo);
    else planIndex=edits.selectedDay6Plan||0;
  }

  if(dayNo===6 && !isDay6PlanBEnabled()) planIndex=0;

  if(d.plans?.length){
    if(edits.selectedPlans){
      edits.selectedPlans[dayNo]=planIndex;
    }else{
      edits.selectedDay6Plan=planIndex;
    }
  }

  window.currentRenderedDay=d;
  window.currentRenderedPlan=planIndex;

  const visiblePlans=d.plans?.length
    ? d.plans.filter((p,i)=>!(dayNo===6 && i===1 && !isDay6PlanBEnabled()))
    : [];

  let planSwitch="";
  if(visiblePlans.length){
    planSwitch=`<div class="plan-switch">${visiblePlans.map(p=>{
      const originalIndex=d.plans.indexOf(p);
      return `<button data-plan="${originalIndex}" class="${originalIndex===planIndex?"active":""}">${esc(p.name)}</button>`;
    }).join("")}</div>`;
  }

  const day6Toggle=!readonly && dayNo===6 && d.plans?.length>1
    ? `<div class="day6-planb-toggle">
        <label>
          <input id="day6PlanBToggle" type="checkbox" ${isDay6PlanBEnabled()?"checked":""}>
          <span>啟用 Plan B 神戶半日遊</span>
        </label>
       </div>`
    : "";

  const statusOptions=d.planStatusOptions||[];
  const currentStatus=typeof planStatusForDay==="function"?planStatusForDay(d):"";
  const statusControl=statusOptions.length?`<div class="plan-status">
    <label>主方案狀態
      <select id="dayPlanStatus">${statusOptions.map(x=>`<option value="${esc(x)}" ${x===currentStatus?"selected":""}>${esc(x)}</option>`).join("")}</select>
    </label>
  </div>`:"";

  const items=itemsForDay(d,planIndex);
  const smartTools=!readonly&&window.renderSmartSortToolbar?window.renderSmartSortToolbar(d,planIndex,items):"";
  const health=window.renderTripHealth?window.renderTripHealth(d,planIndex,items):"";

  $("#dayContent").innerHTML=`<div class="day-header">
      <small>DAY ${d.day} · ${d.date.replaceAll("-","/")}</small>
      <h3>${esc(d.title)}</h3>
      <p>${esc(d.city)}</p>
      ${day6Toggle}${statusControl}${smartTools}
    </div>
    ${weatherHtml(d)}${planSwitch}${health}
    <div id="sortableCards" data-day="${d.day}" data-plan="${planIndex}">
      ${items.map((x,i)=>placeCard(x,items[i+1],i,items.length)).join("")}
    </div>
    ${!readonly?`<button class="primary-action" onclick="addItem(${dayNo})">新增 Day ${dayNo} 行程</button>`:""}`;

  bindCards();
  if(window.bindSmartSortToolbar)window.bindSmartSortToolbar(d,planIndex,items);

  $("#day6PlanBToggle")?.addEventListener("change",e=>{
    toggleDay6PlanB(e.target.checked);
  });

  $("#dayPlanStatus")?.addEventListener("change",e=>{
    if(typeof setDayPlanStatus==="function")setDayPlanStatus(dayNo,e.target.value);
  });

  $$(".plan-switch button").forEach(b=>b.onclick=()=>{
    const next=Number(b.dataset.plan);
    if(edits.selectedPlans){
      edits.selectedPlans[dayNo]=next;
    }else{
      edits.selectedDay6Plan=next;
    }
    persistLocal();
    renderDay(dayNo,next);
  });
}
function placeCard(x,next,index,total){
  const rows=[],t=x.transport||{},det=x.details||{};
  if(t.boarding)rows.push(["上車／起點",t.boarding]);if(t.transfer)rows.push(["轉乘",t.transfer]);if(t.route)rows.push(["路線",t.route]);if(t.arrival)rows.push(["下車／終點",t.arrival]);if(t.exit)rows.push(["出口",t.exit]);if(t.walkingMinutes)rows.push(["步行",`${t.walkingMinutes} 分鐘`]);
  if(det.boardingPoint)rows.push(["遊園車上車點",det.boardingPoint]);if(det.backupPoint)rows.push(["替代上車點",det.backupPoint]);if(det.dropOffPoint)rows.push(["遊園車下車點",det.dropOffPoint]);if(det.price)rows.push(["費用",det.price]);if(det.operationHours)rows.push(["營運時間",det.operationHours]);
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
      ${next?`<a class="pill-link" target="_blank" href="${directionUrl(next.mapsQuery||next.place)}">前往下一站</a>`:""}
    </div>
    ${x.image?`<img class="user-image" src="${x.image}" loading="lazy">`:""}
    ${!readonly?`<div class="edit-tools">
      <button class="${edits.routeFixed?.[x.id]?"fixed-active":""}" onclick="toggleRouteFixed('${x.id}')">${edits.routeFixed?.[x.id]?"📌 已固定":"📍 固定"}</button>
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
function saveVisibleOrder(){
  const box=$("#sortableCards");if(!box)return;
  edits.dayOrders=edits.dayOrders||{};
  edits.dayOrders["day-"+box.dataset.day+"-plan-"+box.dataset.plan]=$$("#sortableCards .place-card").map(x=>x.dataset.id);
  queueCloudSave();
}
function bindCards(){
  $$(".expand-btn").forEach(b=>b.onclick=()=>b.closest(".place-card").classList.toggle("open"));
  if(readonly)return;
  let dragging=null;
  $$("#sortableCards .place-card").forEach(card=>{
    card.addEventListener("dragstart",e=>{dragging=card;card.classList.add("dragging");e.dataTransfer.effectAllowed="move"});
    card.addEventListener("dragend",()=>{card.classList.remove("dragging");dragging=null;saveVisibleOrder()});
    card.addEventListener("dragover",e=>{e.preventDefault();if(!dragging||dragging===card)return;const r=card.getBoundingClientRect();card.parentNode.insertBefore(dragging,e.clientY>r.top+r.height/2?card.nextSibling:card)});
  });
}
function findBaseItem(id){for(const d of trip.days){for(const i of baseItemsForDay(d,edits.selectedDay6Plan||0)){if(i.id===id)return i}}return edits.addedItems.find(x=>x.id===id)}
window.toggleRouteFixed=id=>{edits.routeFixed=edits.routeFixed||{};edits.routeFixed[id]=!edits.routeFixed[id];queueCloudSave()};
window.moveItem=(id,delta)=>{
  const d=trip.days.find(x=>x.day===activeDay),plan=edits.selectedDay6Plan||0,items=itemsForDay(d,plan);
  const i=items.findIndex(x=>x.id===id),j=i+delta;if(i<0||j<0||j>=items.length)return;
  const ids=items.map(x=>x.id);[ids[i],ids[j]]=[ids[j],ids[i]];
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
  const d=trip.days.find(x=>x.day===dayNo),items=itemsForDay(d);$("#todayWeather").innerHTML=weatherHtml(d);$("#todayItems").innerHTML=items.map((x,i)=>placeCard(x,items[i+1],i,items.length)).join("");bindCards()
}
function renderAll(){renderNav();renderDashboard();renderHotel();renderTabs();renderDay(activeDay);renderMap();renderToday();renderTools();if(window.renderTodayReminder)window.renderTodayReminder();renderCloudPanels();applyReadonly()}
function renderCloudPanels(){
  if(tripId){$("#noTripPanel").classList.add("hidden");$("#tripManagePanel").classList.remove("hidden");$("#syncBar").classList.remove("hidden")}else{$("#noTripPanel").classList.remove("hidden");$("#tripManagePanel").classList.add("hidden");$("#syncBar").classList.add("hidden")}
}
function applyReadonly(){
  document.querySelectorAll(".readonly-banner").forEach(x=>x.remove());
  if(readonly){document.body.insertAdjacentHTML("afterbegin",'<div class="readonly-banner">唯讀分享模式｜最後更新 '+esc(edits.lastModified?new Date(edits.lastModified).toLocaleString("zh-TW"):"—")+"</div>");$("#syncBar").classList.add("hidden")}
}

function renderTools(){
  if(readonly)return;
  $$(".tool-tabs button").forEach(b=>b.onclick=()=>{
    $$(".tool-tabs button").forEach(x=>x.classList.remove("active"));
    $$(".tool-panel").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");$("#"+b.dataset.tool).classList.add("active");
  });
  renderPrep();renderShopping();
}
function renderPrep(){
  const total=edits.prepItems.length,done=edits.prepItems.filter(x=>x.done).length,pct=total?Math.round(done/total*100):0;
  $("#prepProgress").innerHTML=`<strong>${done} / ${total}</strong><span>${pct}% 已完成</span><div class="progress-track"><i style="width:${pct}%"></i></div>`;
  $("#prepList").innerHTML=edits.prepItems.map(x=>`<label class="check-row ${x.done?"done":""}"><input type="checkbox" ${x.done?"checked":""} onchange="togglePrep('${x.id}')"><span>${esc(x.name)}</span><button onclick="deletePrep('${x.id}');return false;">刪除</button></label>`).join("");
}
window.togglePrep=id=>{const x=edits.prepItems.find(v=>v.id===id);x.done=!x.done;queueCloudSave()};
window.deletePrep=id=>{edits.prepItems=edits.prepItems.filter(x=>x.id!==id);queueCloudSave()};
function addPrep(){openEditor("新增行前準備",[{name:"name",label:"項目",type:"text",value:""}],v=>{edits.prepItems.push({id:"prep-"+crypto.randomUUID(),name:v.name,done:false});queueCloudSave()})}
function shoppingAmount(x){return (Number(x.qty)||0)*(Number(x.unitPrice)||0)}
function renderShopping(){
  const total=edits.shopping.reduce((s,x)=>s+shoppingAmount(x),0),done=edits.shopping.filter(x=>x.done).length;
  $("#shoppingStats").innerHTML=`<div><b>${edits.shopping.length}</b><span>全部</span></div><div><b>${done}</b><span>已購買</span></div><div><b>¥${total.toLocaleString()}</b><span>總金額</span></div>`;
  const people={};edits.shopping.forEach(x=>{const p=x.person||"自己";people[p]=(people[p]||0)+shoppingAmount(x)});
  $("#personSummary").innerHTML=Object.entries(people).map(([p,v])=>`<div class="person-chip"><span>${esc(p)}</span><b>¥${v.toLocaleString()}</b></div>`).join("");
  $("#shoppingList").innerHTML=edits.shopping.map(x=>`<article class="shopping-card ${x.done?"done":""}">
    ${x.image?`<img src="${x.image}" alt="" loading="lazy">`:'<div class="photo-placeholder">無照片</div>'}
    <div class="shopping-body"><h4>${esc(x.name)}</h4><p>${Number(x.qty)||0} × ¥${Number(x.unitPrice||0).toLocaleString()}＝¥${shoppingAmount(x).toLocaleString()}</p><p>委託人：${esc(x.person||"自己")}</p></div>
    <div class="tool-actions"><button onclick="toggleShopping('${x.id}')">✓</button><button onclick="editShopping('${x.id}')">編輯</button><button onclick="shoppingPhoto('${x.id}')">照片</button><button onclick="deleteShopping('${x.id}')">刪除</button></div>
  </article>`).join("")||'<div class="today-empty">尚無必買／代購項目。</div>';
}
window.toggleShopping=id=>{const x=edits.shopping.find(v=>v.id===id);x.done=!x.done;queueCloudSave()};
window.deleteShopping=id=>{if(confirm("刪除此項目？")){edits.shopping=edits.shopping.filter(x=>x.id!==id);queueCloudSave()}};
window.editShopping=id=>{const x=edits.shopping.find(v=>v.id===id);openEditor("編輯必買／代購",[
  {name:"name",label:"商品",type:"text",value:x.name},{name:"qty",label:"數量",type:"text",value:x.qty},{name:"unitPrice",label:"單價（日圓）",type:"text",value:x.unitPrice},{name:"person",label:"委託人",type:"text",value:x.person}
],v=>{Object.assign(x,v,{qty:Number(v.qty)||0,unitPrice:Number(v.unitPrice)||0});queueCloudSave()})};
function addShopping(){openEditor("新增必買／代購",[
  {name:"name",label:"商品",type:"text",value:""},{name:"qty",label:"數量",type:"text",value:"1"},{name:"unitPrice",label:"單價（日圓）",type:"text",value:"0"},{name:"person",label:"委託人",type:"text",value:"自己"}
],v=>{edits.shopping.unshift({...v,id:"shop-"+crypto.randomUUID(),qty:Number(v.qty)||0,unitPrice:Number(v.unitPrice)||0,done:false,image:""});queueCloudSave()})}
window.shoppingPhoto=id=>pickImage(async file=>{try{setSync("上傳商品照片中…");const url=await uploadImage(file,"shopping");edits.shopping.find(v=>v.id===id).image=url;queueCloudSave()}catch(e){alert("上傳失敗："+e.message)}})

async function loadAllWeather(){await Promise.all(trip.days.map(loadWeatherForDay));renderForecast();renderDay(activeDay);renderToday();if(window.renderTodayReminder)window.renderTodayReminder()}
async function loadWeatherForDay(day){
  const c=cityCoords[day.weather.location];
  try{const url=`https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTokyo&start_date=${day.date}&end_date=${day.date}`;const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw new Error();const j=await r.json();if(!j.daily?.time?.length){weatherCache[day.date]={wait:true};return}const code=j.daily.weather_code[0],[icon,label]=weatherCodes[code]||["🌡️","天氣資訊"];weatherCache[day.date]={icon,label,max:j.daily.temperature_2m_max[0],min:j.daily.temperature_2m_min[0],rain:j.daily.precipitation_probability_max[0]??0}}catch{weatherCache[day.date]={wait:true}}
}
function renderForecast(){$("#forecastStrip").innerHTML=trip.days.map(d=>{const w=weatherCache[d.date];return `<div class="forecast-card"><small>Day ${d.day}</small>${w&&!w.wait?`<b>${w.icon}</b><span>${Math.round(w.min)}–${Math.round(w.max)}°</span><small>降雨 ${w.rain}%</small>`:`<b>—</b><span>尚未開放</span><small>${esc(d.city)}</small>`}</div>`}).join("")}

function applyDayOverrides(baseTrip,overrides){
  if(!overrides?.days?.length)return baseTrip;
  const replacements=new Map(overrides.days.map(day=>[Number(day.day),day]));
  return {
    ...baseTrip,
    days:baseTrip.days.map(day=>replacements.has(Number(day.day))?replacements.get(Number(day.day)):day)
  };
}
function selectedPlanForDay(dayNo){
  edits.selectedPlans=edits.selectedPlans||{};
  return Number(edits.selectedPlans[dayNo]??0);
}
function planStatusForDay(day){
  edits.planStatuses=edits.planStatuses||{};
  return edits.planStatuses[day.day]||day.defaultPlanStatus||"";
}
window.setDayPlanStatus=(dayNo,value)=>{
  edits.planStatuses=edits.planStatuses||{};
  edits.planStatuses[dayNo]=value;
  queueCloudSave();
};

async function init(){
  try{
    [trip,hotel,dayOverrides]=await Promise.all([loadJson("./public/data/osaka-2026.json"),loadJson("./public/data/hotel.json"),loadJson("./public/data/day-overrides.json").catch(()=>({days:[]}))]);
    trip=applyDayOverrides(trip,dayOverrides);
    loadLocalEdits();
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
$("#clearEdits").onclick=()=>{if(confirm("清除所有個人修改？原始行程仍會保留。")){const share=edits.shareToken;edits=migrateEdits({shareToken:share});queueCloudSave()}};

$("#addPrepItem").onclick=addPrep;$("#addShopping").onclick=addShopping;
init();
