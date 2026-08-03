
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, STORAGE_BUCKET } from "./config.js";

const API_HEADERS={
  "apikey":SUPABASE_PUBLISHABLE_KEY,
  "Authorization":"Bearer "+SUPABASE_PUBLISHABLE_KEY,
  "Content-Type":"application/json"
};
async function rpc(name,args){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{
    method:"POST",
    headers:API_HEADERS,
    body:JSON.stringify(args)
  });
  const text=await r.text();
  let body=null;
  try{body=text?JSON.parse(text):null}catch{body=text}
  if(!r.ok)throw new Error(body?.message||body?.hint||body||`HTTP ${r.status}`);
  return body;
}
async function uploadToStorage(path,blob){
  const r=await fetch(`${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${path}`,{
    method:"POST",
    headers:{
      "apikey":SUPABASE_PUBLISHABLE_KEY,
      "Authorization":"Bearer "+SUPABASE_PUBLISHABLE_KEY,
      "Content-Type":"image/webp",
      "x-upsert":"false"
    },
    body:blob
  });
  const text=await r.text();
  let body=null;
  try{body=text?JSON.parse(text):null}catch{body=text}
  if(!r.ok)throw new Error(body?.message||body||`HTTP ${r.status}`);
  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const qs=new URLSearchParams(location.search);
let tripId=qs.get("trip"), editToken=qs.get("key"), readToken=qs.get("view");
let readonly=!!readToken&&!editToken;
let data=null, saveTimer=null, channel=null;

const initialData={
 title:"Osaka 2026",
 itinerary:[
  {id:crypto.randomUUID(),day:1,time:"14:20",title:"BR176 桃園起飛",place:"桃園國際機場第二航廈",note:"建議 11:50–12:20 抵達機場。"},
  {id:crypto.randomUUID(),day:1,time:"18:00",title:"抵達神戶機場 T2",place:"神戶機場第二航廈",note:"入境後前往神姬巴士站。"},
  {id:crypto.randomUUID(),day:1,time:"19:20",title:"搭神姬巴士",place:"神戶機場第二航廈巴士站",note:"直達心齋橋。"},
  {id:crypto.randomUUID(),day:2,time:"09:15",title:"大阪城 Road Train",place:"JO-TERRACE OSAKA",note:"搭至極樂橋周邊後步行前往天守閣。"},
  {id:crypto.randomUUID(),day:2,time:"10:00",title:"大阪城天守閣",place:"Osaka Castle Main Tower",note:"建議停留 60–90 分鐘。"},
  {id:crypto.randomUUID(),day:2,time:"13:15",title:"讀賣電視台",place:"Yomiuri Telecasting Corporation Osaka",note:"拍柯南銅像與展示。"},
  {id:crypto.randomUUID(),day:2,time:"17:45",title:"HARUKAS 300",place:"HARUKAS 300",note:"看夕陽與夜景。"},
  {id:crypto.randomUUID(),day:3,time:"07:10",title:"京都一日遊集合",place:"大阪站或難波 OCAT",note:"依訂單提前 15 分鐘抵達。"},
  {id:crypto.randomUUID(),day:4,time:"06:30",title:"前往 USJ",place:"Universal City Station",note:"提早抵達排隊入園。"},
  {id:crypto.randomUUID(),day:4,time:"13:00",title:"名偵探柯南 4-D",place:"Detective Conan 4-D Live Show",note:"場次依 USJ App 公告。"},
  {id:crypto.randomUUID(),day:4,time:"16:30",title:"SUPER NINTENDO WORLD",place:"SUPER NINTENDO WORLD Japan",note:"16:30 Mario Kart；17:00 Mine Cart Madness。"},
  {id:crypto.randomUUID(),day:5,time:"10:00",title:"Nintendo OSAKA",place:"Nintendo OSAKA",note:"週日先逛旗艦店。"},
  {id:crypto.randomUUID(),day:5,time:"11:00",title:"Pokémon Center Osaka",place:"Pokemon Center Osaka",note:"與 Nintendo 同棟。"},
  {id:crypto.randomUUID(),day:5,time:"15:30",title:"梅田咖啡休息",place:"Blue Bottle Coffee Umeda Chayamachi",note:"下午避暑休息。"},
  {id:crypto.randomUUID(),day:6,time:"08:30",title:"神戶半日遊備案",place:"心齋橋 長堀通 神姬巴士站",note:"09:31 抵達神戶機場寄物後前往三宮。"},
  {id:crypto.randomUUID(),day:6,time:"19:00",title:"BR175 神戶起飛",place:"神戶機場第二航廈",note:"20:55 抵達桃園 T2。"}
 ],
 shopping:[],
 expenses:[],
 notes:{},
 settings:{exchangeRate:0.205}
};

function token(bytes=24){const a=new Uint8Array(bytes);crypto.getRandomValues(a);return [...a].map(x=>x.toString(16).padStart(2,"0")).join("")}
function fmtYen(n){return "¥"+Math.round(Number(n)||0).toLocaleString("ja-JP")}
function mapUrl(p){return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(p||"")}
function setSync(msg){$("#syncState").textContent=msg}
function activeToken(){return editToken||readToken}

async function createTrip(){
 const e=token(),r=token();
 let id;try{id=await rpc("create_private_trip",{p_title:"Osaka 2026",p_edit_token:e,p_read_token:r,p_payload:initialData})}catch(error){alert("建立失敗："+error.message);return}
 const url=new URL(location.href);url.search="";url.searchParams.set("trip",id);url.searchParams.set("key",e);
 location.href=url.toString();
}
async function fetchTrip(){
 const rows=await rpc("get_private_trip",{p_trip_id:tripId,p_token:activeToken()});
 if(!rows?.length)throw new Error("找不到旅程");
 readonly=!rows[0].can_edit;
 data=rows[0].payload;
 localStorage.setItem("tripCache:"+tripId,JSON.stringify(data));
 renderAll();
 subscribeRealtime();
 setSync("雲端已連線");
}
async function saveCloud(){
 if(readonly||!tripId||!editToken)return;
 setSync("同步中…");
 try{await rpc("update_private_trip",{p_trip_id:tripId,p_edit_token:editToken,p_payload:data})}catch(error){setSync("同步失敗，已保留本機");localStorage.setItem("tripCache:"+tripId,JSON.stringify(data));return}
 setSync("已同步 "+new Date().toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit"}));
}
function queueSave(){
 localStorage.setItem("tripCache:"+tripId,JSON.stringify(data));
 clearTimeout(saveTimer);saveTimer=setTimeout(saveCloud,900);
}
function subscribeRealtime(){
 if(channel)clearInterval(channel);
 channel=setInterval(async()=>{
   if(document.hidden)return;
   try{
     const rows=await rpc("get_private_trip",{p_trip_id:tripId,p_token:activeToken()});
     if(!rows?.length)return;
     const incoming=JSON.stringify(rows[0].payload);
     const current=JSON.stringify(data);
     if(incoming!==current){
       data=rows[0].payload;
       localStorage.setItem("tripCache:"+tripId,JSON.stringify(data));
       renderAll();
       setSync("已收到其他裝置更新");
     }
   }catch{}
 },5000);
}

async function uploadImage(file,folder){
 const ext="webp", path=`${tripId}/${folder}/${crypto.randomUUID()}.${ext}`;
 const blob=await compressImage(file);
 return await uploadToStorage(path,blob);
}
function compressImage(file){
 return new Promise((resolve,reject)=>{
  const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{
   let w=img.width,h=img.height,s=Math.min(1,1200/Math.max(w,h));w=Math.round(w*s);h=Math.round(h*s);
   const c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(img,0,0,w,h);
   c.toBlob(b=>b?resolve(b):reject(new Error("壓縮失敗")),"image/webp",.76);
  };img.onerror=reject;img.src=r.result};r.onerror=reject;r.readAsDataURL(file);
 });
}

function renderAll(){renderDashboard();renderDays();renderItinerary();renderShopping();renderExpenses();applyReadonly()}
function renderDashboard(){
 const now=new Date(),dep=new Date("2026-08-12T00:00:00+08:00"),days=Math.ceil((dep-now)/86400000);
 $("#countdown").textContent=days>0?days+" 天":days===0?"今天":"旅程中";
 const dayMap={"2026-08-12":1,"2026-08-13":2,"2026-08-14":3,"2026-08-15":4,"2026-08-16":5,"2026-08-17":6};
 const key=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Tokyo"}).format(now),day=dayMap[key];
 if(day){const first=data.itinerary.filter(x=>x.day===day).sort((a,b)=>a.time.localeCompare(b.time))[0];$("#todayTitle").textContent=first?.title||"今天自由安排";$("#todaySub").textContent=first?`${first.time}｜${first.place}`:""}
 loadWeather();
}
async function loadWeather(){
 try{const r=await fetch("https://api.open-meteo.com/v1/forecast?latitude=34.6937&longitude=135.5023&current=temperature_2m,weather_code&timezone=Asia%2FTokyo",{cache:"no-store"});const w=await r.json();$("#weatherTemp").textContent=Math.round(w.current.temperature_2m)+"°C";$("#weatherText").textContent="大阪目前氣溫"}catch{}
}
function renderDays(){
 $("#daysNav").innerHTML=[1,2,3,4,5,6].map(d=>`<button data-day="${d}" class="${d===1?"active":""}">Day ${d}</button>`).join("");
 $$("#daysNav button").forEach(b=>b.onclick=()=>{$$("#daysNav button").forEach(x=>x.classList.remove("active"));b.classList.add("active");$$(".day-section").forEach(x=>x.classList.remove("active"));$("#daySec"+b.dataset.day).classList.add("active")})
}
function renderItinerary(){
 $("#itineraryList").innerHTML=[1,2,3,4,5,6].map(day=>`<section id="daySec${day}" class="day-section ${day===1?"active":""}">${data.itinerary.filter(x=>x.day===day).sort((a,b)=>a.time.localeCompare(b.time)).map(x=>`
  <article class="itinerary-card ${x.done?"done":""}">
   <div class="time-badge">${x.time}</div>
   <div class="card-main"><b>${esc(x.title)}</b><span>${esc(x.place)}</span><small>${esc(x.note||"")}</small>${x.image?`<img class="thumb" src="${x.image}" loading="lazy">`:""}<a class="map-link" target="_blank" href="${mapUrl(x.place)}">Google Maps 導航 ↗</a></div>
   <div class="card-actions"><button class="icon-btn" onclick="toggleDone('itinerary','${x.id}')">✓</button><button class="icon-btn edit-only" onclick="editItinerary('${x.id}')">編輯</button><button class="icon-btn edit-only" onclick="imageFor('itinerary','${x.id}')">圖片</button><button class="icon-btn edit-only" onclick="removeItem('itinerary','${x.id}')">刪除</button></div>
  </article>`).join("")||'<div class="panel">尚無行程</div>'}</section>`).join("")
}
function renderShopping(){
 const total=data.shopping.reduce((s,x)=>s+(Number(x.amount)||0),0),done=data.shopping.filter(x=>x.done).length;
 $("#shoppingStats").innerHTML=`<div class="stat"><b>${data.shopping.length}</b><span>全部</span></div><div class="stat"><b>${done}</b><span>已買</span></div><div class="stat"><b>${fmtYen(total)}</b><span>總金額</span></div>`;
 const groups={};data.shopping.forEach(x=>{const n=x.recipient||"未指定";groups[n]=(groups[n]||0)+(Number(x.amount)||0)});
 $("#recipientSummary").innerHTML='<b>依對象統計</b>'+Object.entries(groups).map(([n,v])=>`<div class="recipient-row"><span>${esc(n)}</span><b>${fmtYen(v)}</b></div>`).join("")||"<span>尚無資料</span>";
 $("#shoppingList").innerHTML=data.shopping.map(x=>`<article class="list-card ${x.done?"done":""}"><div class="card-main"><b>${esc(x.name)}</b><span>${esc(x.place)}｜${fmtYen(x.amount)}</span><span class="status-pill">對象：${esc(x.recipient||"未指定")}</span><small>${esc(x.note||"")}</small>${x.image?`<img class="thumb" src="${x.image}" loading="lazy">`:""}<a class="map-link" target="_blank" href="${mapUrl(x.place)}">Google Maps 導航 ↗</a></div><div class="card-actions"><button class="icon-btn" onclick="toggleDone('shopping','${x.id}')">✓</button><button class="icon-btn edit-only" onclick="editShopping('${x.id}')">編輯</button><button class="icon-btn edit-only" onclick="imageFor('shopping','${x.id}')">圖片</button><button class="icon-btn edit-only" onclick="removeItem('shopping','${x.id}')">刪除</button></div></article>`).join("")||'<div class="panel">尚無必買商品</div>'
}
function renderExpenses(){
 const total=data.expenses.reduce((s,x)=>s+(Number(x.amount)||0),0),twd=Math.round(total*(Number(data.settings.exchangeRate)||0));
 $("#expenseStats").innerHTML=`<div class="stat"><b>${data.expenses.length}</b><span>筆數</span></div><div class="stat"><b>${fmtYen(total)}</b><span>日圓</span></div><div class="stat"><b>NT$${twd.toLocaleString()}</b><span>台幣參考</span></div>`;
 $("#expenseList").innerHTML=data.expenses.sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time)).map(x=>`<article class="list-card"><div class="card-main"><b>${esc(x.name)}</b><span>${esc(x.date)}｜${esc(x.category)}｜${fmtYen(x.amount)}</span><small>${esc(x.note||"")}</small></div><div class="card-actions"><button class="icon-btn edit-only" onclick="editExpense('${x.id}')">編輯</button><button class="icon-btn edit-only" onclick="removeItem('expenses','${x.id}')">刪除</button></div></article>`).join("")||'<div class="panel">尚無花費紀錄</div>'
}
function applyReadonly(){
 if(readonly){document.body.insertAdjacentHTML("afterbegin",'<div class="readonly-banner">唯讀分享模式</div>');$$(".edit-only,#addItineraryBtn,#addShoppingBtn,#addExpenseBtn,#syncNowBtn").forEach(x=>x.style.display="none")}
}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}

function openEditor(title,fields,onSave){
 $("#dialogTitle").textContent=title;
 $("#editorFields").innerHTML=fields.map(f=>{
   let control="";
   if(f.type==="textarea"){
     control=`<textarea name="${f.name}">${esc(f.value||"")}</textarea>`;
   }else if(f.type==="select"){
     control=`<select name="${f.name}">${f.options.map(o=>`<option value="${o}" ${String(o)===String(f.value)?"selected":""}>${o}</option>`).join("")}</select>`;
   }else{
     control=`<input type="${f.type||"text"}" name="${f.name}" value="${esc(f.value||"")}">`;
   }
   return `<div class="field"><label>${f.label}</label>${control}</div>`;
 }).join("");
 $("#editorDialog").showModal();
 $("#editorForm").onsubmit=e=>{
   e.preventDefault();
   const fd=new FormData(e.target);
   onSave(Object.fromEntries(fd));
   $("#editorDialog").close();
 };
}

window.editItinerary=id=>{const x=data.itinerary.find(v=>v.id===id);openEditor("編輯行程",[
 {label:"Day",name:"day",type:"select",options:[1,2,3,4,5,6],value:x.day},{label:"時間",name:"time",type:"time",value:x.time},{label:"名稱",name:"title",value:x.title},{label:"地點",name:"place",value:x.place},{label:"備註",name:"note",type:"textarea",value:x.note}],v=>{Object.assign(x,v,{day:Number(v.day)});queueSave();renderAll()})}
window.editShopping=id=>{const x=data.shopping.find(v=>v.id===id);openEditor("編輯商品",[
 {label:"商品",name:"name",value:x.name},{label:"地點",name:"place",value:x.place},{label:"金額 ¥",name:"amount",type:"number",value:x.amount},{label:"對象",name:"recipient",value:x.recipient},{label:"備註",name:"note",type:"textarea",value:x.note}],v=>{Object.assign(x,v,{amount:Number(v.amount)});queueSave();renderAll()})}
window.editExpense=id=>{const x=data.expenses.find(v=>v.id===id);openEditor("編輯花費",[
 {label:"日期",name:"date",type:"date",value:x.date},{label:"名稱",name:"name",value:x.name},{label:"分類",name:"category",type:"select",options:["餐飲","交通","購物","票券","住宿","其他"],value:x.category},{label:"金額 ¥",name:"amount",type:"number",value:x.amount},{label:"備註",name:"note",type:"textarea",value:x.note}],v=>{Object.assign(x,v,{amount:Number(v.amount)});queueSave();renderAll()})}
window.removeItem=(type,id)=>{if(!confirm("確定刪除？"))return;data[type]=data[type].filter(x=>x.id!==id);queueSave();renderAll()}
window.toggleDone=(type,id)=>{const x=data[type].find(v=>v.id===id);x.done=!x.done;queueSave();renderAll()}
window.imageFor=(type,id)=>{const input=document.createElement("input");input.type="file";input.accept="image/*";input.onchange=async()=>{if(!input.files[0])return;setSync("上傳圖片中…");try{const url=await uploadImage(input.files[0],type);data[type].find(v=>v.id===id).image=url;queueSave();renderAll()}catch(e){alert("圖片上傳失敗："+e.message)}};input.click()}

$("#addItineraryBtn").onclick=()=>openEditor("新增行程",[
 {label:"Day",name:"day",type:"select",options:[1,2,3,4,5,6],value:1},{label:"時間",name:"time",type:"time",value:"09:00"},{label:"名稱",name:"title"},{label:"地點",name:"place"},{label:"備註",name:"note",type:"textarea"}],v=>{data.itinerary.push({...v,id:crypto.randomUUID(),day:Number(v.day)});queueSave();renderAll()})
$("#addShoppingBtn").onclick=()=>openEditor("新增必買",[
 {label:"商品",name:"name"},{label:"地點",name:"place"},{label:"金額 ¥",name:"amount",type:"number"},{label:"對象",name:"recipient"},{label:"備註",name:"note",type:"textarea"}],v=>{data.shopping.unshift({...v,id:crypto.randomUUID(),amount:Number(v.amount),done:false});queueSave();renderAll()})
$("#addExpenseBtn").onclick=()=>openEditor("新增花費",[
 {label:"日期",name:"date",type:"date",value:"2026-08-12"},{label:"名稱",name:"name"},{label:"分類",name:"category",type:"select",options:["餐飲","交通","購物","票券","住宿","其他"],value:"餐飲"},{label:"金額 ¥",name:"amount",type:"number"},{label:"備註",name:"note",type:"textarea"}],v=>{data.expenses.unshift({...v,id:crypto.randomUUID(),amount:Number(v.amount)});queueSave();renderAll()})

$$(".bottom-nav button").forEach(b=>b.onclick=()=>{$$(".bottom-nav button").forEach(x=>x.classList.remove("active"));b.classList.add("active");$$(".page").forEach(x=>x.classList.remove("active"));$("#"+b.dataset.page).classList.add("active");scrollTo({top:0,behavior:"smooth"})})
$$("[data-go]").forEach(b=>b.onclick=()=>document.querySelector(`.bottom-nav [data-page="${b.dataset.go}"]`).click())
$("#createTripBtn").onclick=createTrip;
$("#joinTripBtn").onclick=()=>{try{const u=new URL($("#joinUrl").value.trim());location.href=u.href}catch{alert("網址格式不正確")}}
$("#syncNowBtn").onclick=saveCloud;
function editUrl(){const u=new URL(location.href);u.search="";u.searchParams.set("trip",tripId);u.searchParams.set("key",editToken);return u.toString()}
function shareUrl(){const u=new URL(location.href);u.search="";u.searchParams.set("trip",tripId);u.searchParams.set("view",data?.shareToken||readToken||"");return u.toString()}
async function copy(t){await navigator.clipboard.writeText(t);alert("已複製")}
$("#copyEditLink").onclick=()=>copy(editUrl());
$("#copyShareLink").onclick=()=>copy(shareUrl());
$("#shareBtn").onclick=()=>{$("#shareUrlDisplay").value=shareUrl();$("#shareDialog").showModal()}
$("#copyShareFromDialog").onclick=()=>copy($("#shareUrlDisplay").value);
$("#exportJson").onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));a.download="Osaka2026_backup.json";a.click();URL.revokeObjectURL(a.href)}
$("#importJson").onchange=e=>{const r=new FileReader();r.onload=()=>{try{data=JSON.parse(r.result);queueSave();renderAll()}catch{alert("檔案格式錯誤")}};r.readAsText(e.target.files[0])}
$("#resetLocal").onclick=()=>{if(confirm("清除本機快取？雲端資料不會刪除。")){localStorage.removeItem("tripCache:"+tripId);location.reload()}}

async function init(){
 $("#loading").classList.add("hidden");
 if(!tripId||!activeToken()){$("#welcome").classList.remove("hidden");return}
 $("#app").classList.remove("hidden");
 try{
   const cache=localStorage.getItem("tripCache:"+tripId);if(cache){data=JSON.parse(cache);renderAll();setSync("顯示本機快取")}
   await fetchTrip();
 }catch(e){if(!data){alert(e.message);$("#app").classList.add("hidden");$("#welcome").classList.remove("hidden")}else setSync("目前離線")}
}
init();

window.addEventListener("error",e=>{
  const loading=document.querySelector("#loading");
  if(loading && !loading.classList.contains("hidden")){
    loading.innerHTML=`<div style="padding:24px;text-align:center"><b>網站載入失敗</b><p style="font-size:13px;color:#746e66">${String(e.message||"請重新整理")}</p><button onclick="location.reload()" style="border:0;border-radius:12px;padding:10px 14px;font-weight:900">重新整理</button></div>`;
  }
});
setTimeout(()=>{
  const loading=document.querySelector("#loading");
  if(loading && !loading.classList.contains("hidden")){
    loading.innerHTML='<div style="padding:24px;text-align:center"><b>載入時間過久</b><p style="font-size:13px;color:#746e66">請確認已上傳完整檔案，並重新整理頁面。</p><button onclick="location.reload()" style="border:0;border-radius:12px;padding:10px 14px;font-weight:900">重新整理</button></div>';
  }
},8000);
