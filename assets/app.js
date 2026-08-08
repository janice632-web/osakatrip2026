/* Travel Companion V4.0.0 — consolidated modules */
/* V3.3 smart route */
(function(){
const C={"d3-umeda-arrival":[34.7025,135.4959],"d3-nintendo":[34.7001,135.4965],"d3-pokemon":[34.7001,135.4965],"d3-daimaru-lunch":[34.7001,135.4965],"d3-lucua":[34.7025,135.4955],"d3-yodobashi":[34.704,135.4967],"d3-grandfront":[34.7055,135.4947],"d3-night-option":[34.704,135.4996],"d5a-meeting":[34.6743,135.5007],"d5a-kobe-harbor":[34.6806,135.1868],"d5a-kitano":[34.7007,135.1909],"d5a-arima":[34.797,135.2485],"d5a-rokko":[34.7647,135.2473],"d5a-return":[34.6743,135.5007],"d5b-sannomiya":[34.6949,135.1956],"d5b-kitano":[34.7007,135.1909],"d5b-ikuta":[34.6949,135.1904],"d5b-nankinmachi":[34.688,135.1877],"d5b-harborland":[34.6806,135.1868],"d5b-return":[34.6797,135.1783],"d1-br176":[25.0797,121.2342],"d1-kobe-airport":[34.6328,135.2239],"d1-shinki-bus":[34.6328,135.2239],"d1-hotel-checkin":[34.6747,135.5043],"d1-dotonbori":[34.6687,135.5013],"d2-morinomiya":[34.6815,135.5346],"d2-road-train":[34.6888,135.5352],"d2-osaka-castle":[34.6873,135.5262],"d2-ytv":[34.6943,135.5328],"d2-tennoji":[34.6466,135.5133],"d2-harukas":[34.6461,135.5133],"d3-meeting":[34.6666,135.4958],"d3-arashiyama":[35.0094,135.6668],"d3-kinkakuji":[35.0394,135.7292],"d3-kiyomizu":[34.9949,135.7850],"d3-fushimi":[34.9671,135.7727],"d4-depart":[34.6677,135.4383],"d4-conan":[34.6654,135.4323],"d4-mario":[34.6677,135.4312],"d4-minecart":[34.6675,135.4307],"d4-jurassic":[34.6632,135.4335],"d4-harrypotter":[34.6681,135.4346],"d5-umeda":[34.7025,135.4959],"d5-nintendo":[34.7001,135.4965],"d5-pokemon":[34.7001,135.4965],"d5-lucua":[34.7025,135.4955],"d5-yodobashi":[34.704,135.4967],"d5-cafe":[34.708,135.5001],"d5-grandfront":[34.7055,135.4947],"d6a-shopping":[34.674,135.5017],"d6a-bus":[34.6743,135.5007],"d6b-bus":[34.6743,135.5007],"d6b-portliner":[34.6372,135.2287],"d6b-nankinmachi":[34.688,135.1877],"d6b-return":[34.6949,135.1956],"d6-flight":[34.6328,135.2239]};
function t(v){
  const s=String(v||"").trim();
  const m=s.match(/^(\d{1,2}):(\d{2})/);
  if(m)return Number(m[1])*60+Number(m[2]);
  if(/清晨/.test(s))return 420;
  if(/早上|上午/.test(s))return 540;
  if(/中午/.test(s))return 720;
  if(/下午/.test(s))return 840;
  if(/傍晚/.test(s))return 1050;
  if(/晚上/.test(s))return 1140;
  if(/全天/.test(s))return 480;
  if(/彈性|待定/.test(s))return 9998;
  return null;
}
function fixed(x){return !!(edits.routeFixed&&edits.routeFixed[x.id])||t(x.time)!==null}
function co(x){return edits.routeCoordinates?.[x.id]||C[x.id]||null}
function d(a,b){if(!a||!b)return 1e9;const R=Math.PI/180,p=a[0]*R,q=b[0]*R,u=(b[0]-a[0])*R,v=(b[1]-a[1])*R,h=Math.sin(u/2)**2+Math.cos(p)*Math.cos(q)*Math.sin(v/2)**2;return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h))}
function save(day,plan,ids,label){const k=orderKey(day,plan);edits.dayOrders=edits.dayOrders||{};edits.originalDayOrders=edits.originalDayOrders||{};if(!edits.originalDayOrders[k]?.length)edits.originalDayOrders[k]=itemsForDay(day,plan).map(x=>x.id);edits.dayOrders[k]=ids;edits.lastSortLabel=label;queueCloudSave()}
function notify(message){
  let box=document.getElementById("sortToast");
  if(!box){
    box=document.createElement("div");
    box.id="sortToast";
    box.className="sort-toast";
    document.body.appendChild(box);
  }
  box.textContent=message;
  box.classList.add("show");
  clearTimeout(box._timer);
  box._timer=setTimeout(()=>box.classList.remove("show"),2200);
}
function byTime(day,plan){
  const before=itemsForDay(day,plan);
  const sorted=[...before].sort((x,y)=>{
    const A=t(x.time),B=t(y.time);
    if(A===null&&B===null)return 0;
    if(A===null)return 1;
    if(B===null)return -1;
    return A-B;
  });
  const beforeIds=before.map(x=>x.id);
  const afterIds=sorted.map(x=>x.id);
  if(afterIds.every((id,i)=>id===beforeIds[i])){
    notify("目前已依時間排列");
    return;
  }
  save(day,plan,afterIds,"依時間排序");
  notify("已依時間重新排序");
}
function nearest(seg,start){const left=[...seg],out=[];let cur=start;while(left.length){let bi=0,bd=Infinity;left.forEach((x,i)=>{const z=d(cur,co(x));if(z<bd){bd=z;bi=i}});const x=left.splice(bi,1)[0];out.push(x);cur=co(x)||cur}return out}
function route(day,plan){const a=itemsForDay(day,plan);if(a.length<3)return alert("景點數量不足，不需要排序。");let out=[],seg=[],prev=null;const flush=()=>{if(seg.length){const s=nearest(seg,prev||co(seg[0]));out.push(...s);prev=co(s[s.length-1])||prev;seg=[]}};a.forEach(x=>{if(fixed(x)){flush();out.push(x);prev=co(x)||prev}else seg.push(x)});flush();if(out.every((x,i)=>x.id===a[i].id))return alert("目前順序已接近最佳，或彈性景點不足。");if(confirm("智慧排序預覽：\n\n"+out.map(x=>x.title).join(" → ")+"\n\n固定時間與已釘選行程不會移動。是否套用？"))save(day,plan,out.map(x=>x.id),"智慧路線排序")}
function restore(day,plan){const k=orderKey(day,plan),ids=edits.originalDayOrders?.[k];if(!ids?.length)return alert("尚無可還原的排序紀錄。");if(confirm("確定還原排序前的行程順序？")){edits.dayOrders[k]=[...ids];queueCloudSave()}}
window.renderSmartSortToolbar=(day,plan,items)=>`<div class="smart-sort-toolbar"><button id="sortByTime">依時間排序</button><button id="sortByRoute">智慧路線排序</button><button id="restoreOrder">還原排序</button><span>${items.filter(fixed).length} 個固定時間／釘選行程</span></div>`;
window.bindSmartSortToolbar=(day,plan)=>{document.getElementById("sortByTime")?.addEventListener("click",()=>byTime(day,plan));document.getElementById("sortByRoute")?.addEventListener("click",()=>route(day,plan));document.getElementById("restoreOrder")?.addEventListener("click",()=>restore(day,plan))};
})();

/* V3.3 trip health */
(function(){
function t(v){const m=String(v||"").match(/^(\d{1,2}):(\d{2})$/);return m?+m[1]*60 + +m[2]:null}
function issues(a){const x=[];if(a.length>=7)x.push(`共 ${a.length} 個行程，安排偏多，建議保留彈性。`);for(let i=0;i<a.length-1;i++){const A=t(a[i].time),B=t(a[i+1].time);if(A!==null&&B!==null){const gap=B-A,stay=Number(a[i].details?.recommendedStayMinutes)||60;if(gap>0&&gap<stay+20)x.push(`${a[i].time} ${a[i].title} 到 ${a[i+1].time} ${a[i+1].title} 間隔僅 ${gap} 分鐘。`)}}return x}
window.renderTripHealth=(day,plan,a)=>{const x=issues(a);return `<section class="trip-health ${x.length?"has-warning":"is-good"}"><div><b>${x.length?"⚠ 行程健檢":"✓ 行程健檢"}</b><span>${x.length?`${x.length} 項提醒`:"目前未發現明顯時間衝突"}</span></div>${x.length?`<details><summary>查看提醒</summary><ul>${x.map(v=>`<li>${esc(v)}</li>`).join("")}</ul></details>`:""}</section>`};
window.renderTodayReminder=()=>{const p=document.getElementById("todayReminderPanel"),b=document.getElementById("todayReminder");if(!p||!b||!trip)return;const n=dayFromToday(),day=n?trip.days.find(x=>x.day===n):trip.days[0];if(!day)return p.classList.add("hidden");const a=itemsForDay(day),w=weatherCache[day.date],notes=[n?`今天是 Day ${day.day}｜${day.title}`:`下一個旅程日：Day ${day.day}｜${day.title}`];if(day.planStatusOptions&&planStatusForDay(day)==="待確認成團")notes.push("⚠ 主方案尚未確認成團，請留意 KKday 通知並保留備案");if(w&&!w.wait){notes.push(`${w.icon} ${w.label}，${Math.round(w.min)}–${Math.round(w.max)}°C`);if(w.rain>=50)notes.push(`降雨機率 ${w.rain}%，建議攜帶雨具`);if(w.max>=32)notes.push("高溫，建議攜帶水、手持風扇並補擦防曬")}const s=a.map(x=>x.title).join(" ");if(/USJ|環球|柯南|Mario|Mine Cart/i.test(s))notes.push("確認 USJ 門票、Express Pass 與行動電源");if(/航班|BR17|機場|神姬巴士/i.test(s))notes.push("再次確認航班、巴士時間與護照");b.innerHTML=`<div class="today-reminder-list">${notes.map(x=>`<div>• ${esc(x)}</div>`).join("")}</div>`;p.classList.remove("hidden")};
})();


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
  dayOrders:{},
  prepItems:[],
  shopping:[],
  lastModified:null
};

const headers={"apikey":SUPABASE_KEY,"Authorization":"Bearer "+SUPABASE_KEY,"Content-Type":"application/json"};
const cityCoords={Osaka:{lat:34.6937,lon:135.5023,label:"大阪"},Kyoto:{lat:35.0116,lon:135.7681,label:"京都"},Kobe:{lat:34.6901,lon:135.1955,label:"神戶"}};
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




const APP_VERSION="4.2.2";

const PWA_LAUNCH_KEY="tc-pwa-launch-url-v1";

function hasTripLaunchParams(url=new URL(location.href)){
  return !!(url.searchParams.get("trip")||url.searchParams.get("edit")||url.searchParams.get("view"));
}
function rememberCurrentLaunchUrl(){
  try{
    const url=new URL(location.href);
    if(hasTripLaunchParams(url)){
      localStorage.setItem(PWA_LAUNCH_KEY,url.pathname+url.search+url.hash);
    }
  }catch{}
}
function restorePwaLaunchUrlIfNeeded(){
  try{
    if(!isStandaloneMode())return false;
    const current=new URL(location.href);
    if(hasTripLaunchParams(current))return false;
    const saved=localStorage.getItem(PWA_LAUNCH_KEY);
    if(!saved)return false;
    const target=new URL(saved,location.origin);
    if(target.origin!==location.origin)return false;
    location.replace(target.href);
    return true;
  }catch{return false}
}

let deferredInstallPrompt=null;
let swRegistration=null;
let swReloading=false;

function isStandaloneMode(){
  return window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone===true;
}
function isIOS(){
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
function updateInstallUI(){
  const panel=document.getElementById("installPanel");
  const button=document.getElementById("installApp");
  const hint=document.getElementById("installHint");
  if(!panel||!button||!hint)return;
  if(isStandaloneMode()){
    button.textContent="已加入主畫面";
    button.disabled=true;
    hint.textContent="目前正以主畫面 App 模式開啟。";
    return;
  }
  button.disabled=false;
  button.textContent="加入主畫面";
  hint.textContent=isIOS()
    ?"iPhone／iPad：Safari 點「分享」→「加入主畫面」。"
    :"可將旅遊手冊安裝到主畫面，離線時仍可查看已載入資料。";
}

function repairPwaLaunchLink(){
  rememberCurrentLaunchUrl();
  alert("已記住目前這份旅程連結。\\n\\n如果主畫面 App 仍顯示全新狀態：\\n1. 刪除舊的主畫面圖示\\n2. 用 Safari 開啟目前這個旅程頁面\\n3. 重新「加入主畫面」一次");
}

async function installTravelApp(){
  if(isStandaloneMode())return;
  if(deferredInstallPrompt){
    deferredInstallPrompt.prompt();
    try{await deferredInstallPrompt.userChoice}catch{}
    deferredInstallPrompt=null;
    updateInstallUI();
    return;
  }
  if(isIOS()){
    alert("iPhone／iPad 安裝方式：\n\n1. 請先確認目前已開啟你自己的旅程頁面\n2. 使用 Safari 點下方「分享」圖示\n3. 往下選「加入主畫面」\n4. 點右上角「新增」\n\n之後從主畫面開啟會回到同一份旅程資料。");
    return;
  }
  alert("若瀏覽器沒有顯示安裝提示，請從瀏覽器選單選擇「安裝應用程式」或「加入主畫面」。");
}
async function registerServiceWorker(){
  if(!("serviceWorker" in navigator))return;
  try{
    swRegistration=await navigator.serviceWorker.register("./service-worker.js?v=410-phase3",{updateViaCache:"none"});
    await swRegistration.update().catch(()=>{});
    swRegistration.addEventListener("updatefound",()=>{
      const worker=swRegistration.installing;
      if(!worker)return;
      worker.addEventListener("statechange",()=>{
        if(worker.state==="installed" && navigator.serviceWorker.controller){
          worker.postMessage({type:"SKIP_WAITING"});
        }
      });
    });
    navigator.serviceWorker.addEventListener("controllerchange",()=>{
      if(swReloading)return;
      swReloading=true;
      sessionStorage.setItem("tc-sw-version",APP_VERSION);
      location.reload();
    });
    window.addEventListener("focus",()=>swRegistration?.update().catch(()=>{}));
  }catch(e){
    console.warn("Service Worker registration failed",e);
  }
}
window.addEventListener("beforeinstallprompt",e=>{
  e.preventDefault();
  deferredInstallPrompt=e;
  updateInstallUI();
});
window.addEventListener("appinstalled",()=>{
  rememberCurrentLaunchUrl();
  deferredInstallPrompt=null;
  updateInstallUI();
});
window.addEventListener("online",()=>setConnectionState(true));
window.addEventListener("offline",()=>setConnectionState(false));

function setConnectionState(online=navigator.onLine){
  document.documentElement.dataset.connection=online?"online":"offline";
  if(!online){
    setSync("離線模式｜修改已保存本機");
  }else if(tripId&&activeToken()){
    setSync("已恢復連線，正在同步…");
    reconcileCloudState().catch(()=>setSync("已連線｜等待下次同步"));
  }
}

const BEAUTY_IMPORT_VERSION="beauty-products-2026-08-07-v4";
const BEAUTY_IMPORT_ITEMS=[
  {id:"beauty-elixir-retinol",name:"ELIXIR 視黃醇（Retino Power Wrinkle Cream ba S 15g）",qty:1,unitPrice:6600,person:"自己",done:false,image:"./assets/products/elixir-retinol.webp",referencePrice:true},
  {id:"beauty-biore-athlizm",name:"Biore UV ATHLIZM 身體防曬 70g",qty:1,unitPrice:2000,person:"自己",done:false,image:"./assets/products/biore-athlizm.jpg",referencePrice:true},
  {id:"beauty-skin-aqua-gel",name:"Skin Aqua UV Super Moisture Gel 110g",qty:1,unitPrice:1155,person:"自己",done:false,image:"./assets/products/skin-aqua.jpg",referencePrice:true},
  {id:"beauty-minon-mask",name:"MINON 面膜 4片",qty:1,unitPrice:1320,person:"自己",done:false,image:"./assets/products/minon-mask.png",referencePrice:true},
  {id:"beauty-melano-cc-premium",name:"Melano CC Premium 美白精華 20mL",qty:1,unitPrice:1359,person:"自己",done:false,image:"./assets/products/melano-cc-premium.jpg",referencePrice:true},
  {id:"beauty-lipopeel",name:"LIPOPEEL 柔煥透亮精萃 30mL",qty:1,unitPrice:2480,person:"自己",done:false,image:"./assets/products/lipopeel.webp",referencePrice:true},
  {id:"beauty-fancl-mco",name:"FANCL MCO 奈米淨化卸妝油 120mL",qty:1,unitPrice:1980,person:"自己",done:false,image:"./assets/products/fancl-mco.webp",referencePrice:true}
];
function normalizedShoppingName(value){
  return String(value||"").toLowerCase().replace(/\s+/g,"").replace(/[（）()・／/]/g,"");
}
async function appendBeautyProducts(showMessage=false){
  edits.shopping=Array.isArray(edits.shopping)?edits.shopping:[];
  edits.shoppingImports=Array.isArray(edits.shoppingImports)?edits.shoppingImports:[];
  if(edits.shoppingImports.includes(BEAUTY_IMPORT_VERSION)){
    if(showMessage)alert("7 項商品已在清單中。");
    return 0;
  }
  const ids=new Set(edits.shopping.map(x=>x.id).filter(Boolean));
  const names=new Set(edits.shopping.map(x=>normalizedShoppingName(x.name)));
  let added=0;
  for(const item of BEAUTY_IMPORT_ITEMS){
    if(!ids.has(item.id)&&!names.has(normalizedShoppingName(item.name))){
      edits.shopping.push({...item});
      ids.add(item.id);
      names.add(normalizedShoppingName(item.name));
      added++;
    }
  }
  edits.shoppingImports.push(BEAUTY_IMPORT_VERSION);
  persistLocal();
  if(tripId&&editToken&&!readonly){
    try{await saveCloud()}catch(e){console.error(e)}
  }
  if(showMessage)alert(added?`已新增 ${added} 項商品`:"7 項商品已在清單中。");
  return added;
}
window.appendBeautyProducts=appendBeautyProducts;

function migrateEdits(raw){
  const previous=raw&&typeof raw==="object"?raw:{};
  try{
    const key=tripId?`tc-backup:${tripId}:${Date.now()}`:`tc-backup:local:${Date.now()}`;
    localStorage.setItem(key,JSON.stringify(previous));
  }catch{}
  const defaults={
    version:6,
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
    shoppingImports:[],
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
  next.shoppingImports=Array.isArray(previous.shoppingImports)?previous.shoppingImports:[];
  next.version=6;
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
  if(!navigator.onLine){
    setSync("離線模式｜修改已保存本機");
    return;
  }
  setSync("同步中…");
  try{
    lastCloudUpdated=await rpc("tc_update_private_trip",{p_trip_id:tripId,p_edit_token:editToken,p_payload:edits});
    setSync("已同步 "+dateTimeText());
  }catch(e){
    setSync("同步失敗，已保存本機");
    console.error(e);
  }
}
async function fetchCloud(){
  if(!navigator.onLine)throw new Error("offline");
  const rows=await rpc("tc_get_private_trip",{p_trip_id:tripId,p_token:activeToken()});
  if(!rows?.length)throw new Error("私人連結無效或旅程不存在");
  readonly=!rows[0].can_edit;
  const cloud=migrateEdits(rows[0].payload||{});
  const cloudTime=Date.parse(cloud.lastModified||0);
  const localTime=Date.parse(edits.lastModified||0);
  if(cloudTime>localTime){
    edits=migrateEdits({...edits,...cloud});
    localStorage.setItem(localKey(),JSON.stringify(edits));
  }
  lastCloudUpdated=rows[0].updated_at;
  return {cloudTime,localTime,canEdit:rows[0].can_edit};
}
async function reconcileCloudState(){
  if(!tripId||!activeToken()||!navigator.onLine)return;
  const before=JSON.stringify(edits);
  const result=await fetchCloud();
  if(result.localTime>result.cloudTime && editToken && !readonly){
    await saveCloud();
  }else if(JSON.stringify(edits)!==before){
    renderAll();
    setSync("已收到其他裝置更新");
  }else{
    setSync("已同步 "+dateTimeText());
  }
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


function openImageLightbox(src,caption=""){
  if(!src)return;
  const box=$("#imageLightbox");
  const img=$("#imageLightboxImg");
  const label=$("#imageLightboxCaption");
  img.src=src;
  img.alt=caption?`${caption} 商品圖片`:"商品圖片放大預覽";
  label.textContent=caption||"";
  box.classList.remove("hidden");
  document.body.classList.add("lightbox-open");
}
function closeImageLightbox(){
  const box=$("#imageLightbox");
  if(!box)return;
  box.classList.add("hidden");
  $("#imageLightboxImg").removeAttribute("src");
  document.body.classList.remove("lightbox-open");
}
function bindImageLightbox(){
  $$(".shopping-zoom-image").forEach(img=>{
    img.onclick=()=>openImageLightbox(img.src,img.dataset.caption||img.alt||"");
    img.onkeydown=e=>{
      if(e.key==="Enter"||e.key===" "){
        e.preventDefault();
        openImageLightbox(img.src,img.dataset.caption||img.alt||"");
      }
    };
  });
}

let shoppingView="all";
let shoppingPerson="";
let shoppingSearchText="";
let shoppingSortMode="newest";

function normalizeProductName(value){
  return String(value||"")
    .trim()
    .toLowerCase()
    .replace(/\s+/g," ")
    .replace(/[（）]/g,m=>m==="（"?"(":")");
}
function shoppingCreatedAt(item,index){
  if(item.createdAt)return Date.parse(item.createdAt)||0;
  const id=String(item.id||"");
  const uuidTime=id.match(/(\d{10,13})/);
  return uuidTime?Number(uuidTime[1]):index;
}
function sortedShoppingItems(items){
  const indexed=items.map((item,index)=>({item,index}));
  indexed.sort((a,b)=>{
    if(shoppingSortMode==="name"){
      return String(a.item.name||"").localeCompare(String(b.item.name||""),"zh-Hant");
    }
    if(shoppingSortMode==="price"){
      return Number(b.item.unitPrice||0)-Number(a.item.unitPrice||0);
    }
    return shoppingCreatedAt(b.item,b.index)-shoppingCreatedAt(a.item,a.index);
  });
  return indexed.map(x=>x.item);
}
function visibleShoppingItems(){
  let items=[...edits.shopping];
  const q=shoppingSearchText.trim().toLowerCase();
  if(q){
    items=items.filter(x=>
      String(x.name||"").toLowerCase().includes(q) ||
      String(x.person||"").toLowerCase().includes(q)
    );
  }
  if(shoppingView==="person"&&shoppingPerson){
    items=items.filter(x=>(x.person||"自己")===shoppingPerson);
  }
  return sortedShoppingItems(items);
}
function groupShoppingByProduct(items){
  const groups=new Map();
  items.forEach(item=>{
    const key=normalizeProductName(item.name);
    if(!groups.has(key)){
      groups.set(key,{
        key,
        name:item.name||"未命名商品",
        image:item.image||"",
        unitPrice:Number(item.unitPrice)||0,
        entries:[],
        totalQty:0,
        totalAmount:0
      });
    }
    const group=groups.get(key);
    group.entries.push(item);
    group.totalQty+=Number(item.qty)||0;
    group.totalAmount+=shoppingAmount(item);
    if(!group.image&&item.image)group.image=item.image;
  });
  return [...groups.values()];
}
function renderShoppingPersonSummary(items){
  const people={};
  edits.shopping.forEach(x=>{
    const p=x.person||"自己";
    if(!people[p])people[p]={amount:0,qty:0,rows:0};
    people[p].amount+=shoppingAmount(x);
    people[p].qty+=Number(x.qty)||0;
    people[p].rows+=1;
  });
  const container=$("#personSummary");
  if(shoppingView!=="person"){
    container.innerHTML="";
    return;
  }
  container.innerHTML=`<div class="person-filter-list">
    <button class="${shoppingPerson===""?"active":""}" data-person="">全部人</button>
    ${Object.entries(people).map(([name,data])=>`
      <button class="${shoppingPerson===name?"active":""}" data-person="${esc(name)}">
        <span>${esc(name)}</span>
        <small>${data.rows} 項｜${data.qty} 件｜¥${data.amount.toLocaleString()}</small>
      </button>`).join("")}
  </div>`;
  $$("#personSummary [data-person]").forEach(button=>{
    button.onclick=()=>{
      shoppingPerson=button.dataset.person||"";
      renderShopping();
    };
  });
}
function renderProductGroupCard(group){
  const people={};
  group.entries.forEach(item=>{
    const name=item.person||"自己";
    if(!people[name])people[name]=0;
    people[name]+=Number(item.qty)||0;
  });
  return `<details class="product-group-card">
    <summary>
      ${group.image?`<img class="shopping-zoom-image" src="${group.image}" loading="lazy" alt="${esc(group.name)}" data-caption="${esc(group.name)}" role="button" tabindex="0" title="點擊放大">`:'<div class="photo-placeholder">無照片</div>'}
      <div class="product-group-main">
        <h4>${esc(group.name)}</h4>
        <p>總數量：${group.totalQty}｜預估總額：¥${group.totalAmount.toLocaleString()}</p>
        ${group.unitPrice?`<small>參考單價 ¥${group.unitPrice.toLocaleString()}</small>`:""}
      </div>
      <span class="product-group-toggle">▼</span>
    </summary>
    <div class="product-buyers">
      ${Object.entries(people).map(([name,qty])=>`
        <div><b>${esc(name)}</b><span>× ${qty}</span></div>`).join("")}
    </div>
  </details>`;
}

function shoppingAmount(x){return (Number(x.qty)||0)*(Number(x.unitPrice)||0)}
function renderShopping(){
  const filtered=visibleShoppingItems();
  const total=filtered.reduce((s,x)=>s+shoppingAmount(x),0);
  const totalQty=filtered.reduce((s,x)=>s+(Number(x.qty)||0),0);
  $("#shoppingStats").innerHTML=`<div><b>${filtered.length}</b><span>商品項目</span></div><div><b>${totalQty}</b><span>總件數</span></div><div><b>¥${total.toLocaleString()}</b><span>總金額</span></div>`;

  $$("#shoppingViewTabs [data-shopping-view]").forEach(button=>{
    button.classList.toggle("active",button.dataset.shoppingView===shoppingView);
  });

  renderShoppingPersonSummary(filtered);

  if(shoppingView==="product"){
    const groups=groupShoppingByProduct(filtered);
    $("#shoppingList").innerHTML=groups.length
      ? groups.map(renderProductGroupCard).join("")
      : '<div class="today-empty">找不到符合條件的商品。</div>';
    bindImageLightbox();
    return;
  }

  $("#shoppingList").innerHTML=filtered.map(x=>`<article class="shopping-card ${x.done?"done":""}">
    ${x.image?`<img class="shopping-zoom-image" src="${x.image}" alt="${esc(x.name)}" data-caption="${esc(x.name)}" loading="lazy" role="button" tabindex="0" title="點擊放大">`:'<div class="photo-placeholder">無照片</div>'}
    <div class="shopping-body">
      <h4>${esc(x.name)}</h4>
      <p>${x.referencePrice?"日本參考價 ":""}¥${Number(x.unitPrice||0).toLocaleString()}${Number(x.qty||0)!==1?` × ${Number(x.qty)||0}＝¥${shoppingAmount(x).toLocaleString()}`:""}</p>
      <p>委託人：${esc(x.person||"自己")}｜數量：${Number(x.qty)||0}</p>
    </div>
    <div class="tool-actions">
      <button onclick="toggleShopping('${x.id}')">✓</button>
      <button onclick="editShopping('${x.id}')">編輯</button>
      <button onclick="shoppingPhoto('${x.id}')">照片</button>
      <button onclick="deleteShopping('${x.id}')">刪除</button>
    </div>
  </article>`).join("")||'<div class="today-empty">找不到符合條件的商品。</div>';
  bindImageLightbox();
}
window.toggleShopping=id=>{const x=edits.shopping.find(v=>v.id===id);x.done=!x.done;queueCloudSave()};
window.deleteShopping=id=>{if(confirm("刪除此項目？")){edits.shopping=edits.shopping.filter(x=>x.id!==id);queueCloudSave()}};
window.editShopping=id=>{const x=edits.shopping.find(v=>v.id===id);openEditor("編輯必買／代購",[
  {name:"name",label:"商品",type:"text",value:x.name},{name:"qty",label:"數量",type:"text",value:x.qty},{name:"unitPrice",label:"單價（日圓）",type:"text",value:x.unitPrice},{name:"person",label:"委託人",type:"text",value:x.person}
],v=>{Object.assign(x,v,{qty:Number(v.qty)||0,unitPrice:Number(v.unitPrice)||0});queueCloudSave()})};
function addShopping(){openEditor("新增必買／代購",[
  {name:"name",label:"商品",type:"text",value:""},{name:"qty",label:"數量",type:"text",value:"1"},{name:"unitPrice",label:"單價（日圓）",type:"text",value:"0"},{name:"person",label:"委託人",type:"text",value:"自己"}
],v=>{edits.shopping.unshift({...v,id:"shop-"+crypto.randomUUID(),qty:Number(v.qty)||0,unitPrice:Number(v.unitPrice)||0,done:false,image:"",createdAt:new Date().toISOString()});queueCloudSave()})}
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


window.addEventListener("storage",e=>{
  if(e.key!==localKey()||!e.newValue)return;
  try{
    const incoming=migrateEdits(JSON.parse(e.newValue));
    if(Date.parse(incoming.lastModified||0)>Date.parse(edits.lastModified||0)){
      edits=incoming;
      renderAll();
      setSync("已收到此裝置其他分頁更新");
    }
  }catch{}
});
window.addEventListener("pageshow",()=>{
  if(tripId&&activeToken()&&navigator.onLine)reconcileCloudState().catch(()=>{});
});
document.addEventListener("visibilitychange",()=>{
  if(!document.hidden){
    swRegistration?.update().catch(()=>{});
    if(tripId&&activeToken()&&navigator.onLine)reconcileCloudState().catch(()=>{});
  }
});

async function init(){
  if(restorePwaLaunchUrlIfNeeded())return;
  rememberCurrentLaunchUrl();
  try{
    [trip,hotel,dayOverrides]=await Promise.all([loadJson("./public/data/osaka-2026.json"),loadJson("./public/data/hotel.json"),loadJson("./public/data/day-overrides.json").catch(()=>({days:[]}))]);
    trip=applyDayOverrides(trip,dayOverrides);
    loadLocalEdits();
    if(tripId&&activeToken()){try{await reconcileCloudState()}catch(e){console.error(e);setSync(navigator.onLine?"雲端讀取失敗，顯示本機資料":"離線模式｜顯示本機資料")}}
    await appendBeautyProducts(false);
    $("#boot").classList.add("hidden");$("#app").classList.remove("hidden");renderAll();loadAllWeather();
    if(tripId&&activeToken())setInterval(()=>{if(!document.hidden&&navigator.onLine)reconcileCloudState().catch(()=>{})},15000);
    updateInstallUI();setConnectionState();registerServiceWorker();
  }catch(e){$("#boot").innerHTML=`<div style="padding:24px;text-align:center"><b>資料載入失敗</b><p>${esc(e.message)}</p></div>`}
}

$("#refreshWeather").onclick=()=>{weatherCache={};$("#forecastStrip").innerHTML='<div class="weather-wait">正在更新…</div>';loadAllWeather()};
$$("[data-page-target]").forEach(b=>b.onclick=()=>{const btn=$(`#bottomNav [data-page="${b.dataset.pageTarget}"]`);switchPage(b.dataset.pageTarget,btn)});
$("#exportData").onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(trip,null,2)],{type:"application/json"}));a.download="osaka-2026.json";a.click();URL.revokeObjectURL(a.href)};
$("#createCloudTrip").onclick=createCloudTrip;
$("#joinTrip").onclick=()=>{try{location.href=new URL($("#joinTripUrl").value.trim()).toString()}catch{alert("網址格式不正確")}};
$("#copyEditLink").onclick=()=>copyText(editLink());
$("#copyReadLink").onclick=()=>copyText(readLink());
$("#syncNow").onclick=()=>reconcileCloudState().catch(()=>setConnectionState(false));
$("#exportState").onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(edits,null,2)],{type:"application/json"}));a.download="osaka-2026-edits.json";a.click();URL.revokeObjectURL(a.href)};
$("#importState").onchange=e=>{const r=new FileReader();r.onload=()=>{try{edits={...edits,...JSON.parse(r.result)};queueCloudSave()}catch{alert("檔案格式錯誤")}};r.readAsText(e.target.files[0])};
$("#clearEdits").onclick=()=>{if(confirm("清除所有個人修改？原始行程仍會保留。")){const share=edits.shareToken;edits=migrateEdits({shareToken:share});queueCloudSave()}};

$("#closeImageLightbox").onclick=closeImageLightbox;
$("#imageLightbox").onclick=e=>{if(e.target===$("#imageLightbox"))closeImageLightbox()};
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("#imageLightbox").classList.contains("hidden"))closeImageLightbox()});
$("#addPrepItem").onclick=addPrep;$("#addShopping").onclick=addShopping;$("#appendBeautyProducts").onclick=()=>appendBeautyProducts(true);$("#installApp").onclick=installTravelApp;$("#repairPwaLink").onclick=repairPwaLaunchLink;

$("#shoppingSearch").oninput=e=>{
  shoppingSearchText=e.target.value||"";
  renderShopping();
};
$("#shoppingSort").onchange=e=>{
  shoppingSortMode=e.target.value||"newest";
  renderShopping();
};
$$("#shoppingViewTabs [data-shopping-view]").forEach(button=>{
  button.onclick=()=>{
    shoppingView=button.dataset.shoppingView||"all";
    if(shoppingView!=="person")shoppingPerson="";
    renderShopping();
  };
});
init();
