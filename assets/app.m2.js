
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let trip,hotel,activeDay=1,weatherCache={};

const cityCoords={
  Osaka:{lat:34.6937,lon:135.5023,label:"大阪"},
  Kyoto:{lat:35.0116,lon:135.7681,label:"京都"},
  Kobe:{lat:34.6901,lon:135.1955,label:"神戶"}
};
const weatherCodes={
  0:["☀️","晴朗"],1:["🌤️","大致晴朗"],2:["⛅","局部多雲"],3:["☁️","陰天"],
  45:["🌫️","有霧"],48:["🌫️","霧淞"],51:["🌦️","毛毛雨"],53:["🌦️","毛毛雨"],
  55:["🌧️","較強毛毛雨"],61:["🌧️","小雨"],63:["🌧️","中雨"],65:["🌧️","大雨"],
  80:["🌦️","陣雨"],81:["🌧️","陣雨"],82:["⛈️","強陣雨"],95:["⛈️","雷雨"],96:["⛈️","雷雨冰雹"],99:["⛈️","強雷雨冰雹"]
};

function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function mapUrl(q){return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(q||"")}
function dateKey(){return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Tokyo"}).format(new Date())}
function dayFromToday(){const key=dateKey();return trip.days.find(d=>d.date===key)?.day||null}
function flattenDay(day,planIndex=0){
  const result=[...(day.items||[])];
  if(day.plans?.length) result.unshift(...day.plans[planIndex].items);
  return result;
}
function travelReminder(max,rain){
  const arr=[];
  if(max>=32)arr.push("高溫，建議攜帶水與手持風扇");
  if(rain>=50)arr.push("降雨機率偏高，建議攜帶輕便雨具");
  if(!arr.length)arr.push("依現場體感補充水分並注意防曬");
  return arr.join("；");
}
async function loadJson(path){const r=await fetch(path,{cache:"no-store"});if(!r.ok)throw new Error(path+" 載入失敗");return r.json()}
async function init(){
  try{
    [trip,hotel]=await Promise.all([
      loadJson("./public/data/osaka-2026.json"),
      loadJson("./public/data/hotel.json")
    ]);
    $("#boot").classList.add("hidden");$("#app").classList.remove("hidden");
    renderDashboard();renderHotel();renderTabs();renderDay(activeDay);renderToday();
    loadAllWeather();
  }catch(e){
    $("#boot").innerHTML=`<div style="padding:24px;text-align:center"><b>資料載入失敗</b><p>${esc(e.message)}</p></div>`;
  }
}
function renderDashboard(){
  const dep=new Date(trip.trip.startDate+"T00:00:00+08:00"),now=new Date();
  const diff=Math.ceil((dep-now)/86400000);
  $("#countdown").textContent=diff>0?diff+" 天":diff===0?"今天":"旅程中";
  const today=dayFromToday();
  if(today){
    const day=trip.days.find(d=>d.day===today),first=flattenDay(day)[0];
    $("#todayLabel").textContent=`Day ${today}`;
    $("#todaySummary").textContent=first?`${first.time}｜${first.title}`:day.title;
  }
}
function renderHotel(){
  $("#hotelCard").innerHTML=`<h3>${esc(hotel.name)}</h3>
    <p>${esc(hotel.nameEn)}</p>
    <p>Check-in：${esc(hotel.checkIn)}</p>
    <p>8/12 晚間抵達，從心齋橋（長堀通）巴士下車點步行前往。</p>
    <div class="hotel-actions">
      <a class="pill-link" target="_blank" href="${mapUrl(hotel.mapsQuery)}">Google Maps</a>
      <button class="small-action" onclick="toggleHotelDetails()">展開住宿備註</button>
    </div>
    <div id="hotelDetails" class="details">
      <div class="detail-note">${hotel.notes.map(esc).join("<br>")}</div>
    </div>`;
}
window.toggleHotelDetails=()=>$("#hotelDetails").style.display=$("#hotelDetails").style.display==="block"?"none":"block";
function renderTabs(){
  $("#dayTabs").innerHTML=trip.days.map(d=>`<button data-day="${d.day}" class="${d.day===activeDay?"active":""}">Day ${d.day}</button>`).join("");
  $$("#dayTabs button").forEach(b=>b.onclick=()=>{activeDay=Number(b.dataset.day);renderTabs();renderDay(activeDay)});
}
function weatherHtml(day){
  const w=weatherCache[day.date];
  if(!w)return `<div class="day-weather"><div class="weather-wait">預報讀取中；若日期尚未開放，接近出發日期後會自動更新。</div></div>`;
  if(w.wait)return `<div class="day-weather"><div class="weather-wait">預報尚未開放，接近出發日期後自動更新。</div></div>`;
  return `<div class="day-weather">
    <div class="weather-main"><div><b>${w.icon} ${esc(w.label)}</b><div style="font-size:12px;color:var(--muted)">${travelReminder(w.max,w.rain)}</div></div><strong>${Math.round(w.min)}–${Math.round(w.max)}°C</strong></div>
    <div class="weather-meta"><div><b>最高</b><span>${Math.round(w.max)}°C</span></div><div><b>最低</b><span>${Math.round(w.min)}°C</span></div><div><b>降雨</b><span>${w.rain}%</span></div></div>
  </div>`;
}
function renderDay(dayNo,planIndex=0){
  const d=trip.days.find(x=>x.day===dayNo);
  let planSwitch="";
  if(d.plans?.length){
    planSwitch=`<div class="plan-switch">${d.plans.map((p,i)=>`<button data-plan="${i}" class="${i===planIndex?"active":""}">${esc(p.name)}</button>`).join("")}</div>`;
  }
  const items=flattenDay(d,planIndex);
  $("#dayContent").innerHTML=`<div class="day-header"><small>DAY ${d.day} · ${d.date.replaceAll("-","/")}</small><h3>${esc(d.title)}</h3><p>${esc(d.city)}</p></div>
    ${weatherHtml(d)}${planSwitch}
    <div>${items.map((x,i)=>placeCard(x,items[i+1])).join("")}</div>`;
  $$(".expand-btn").forEach(b=>b.onclick=()=>b.closest(".place-card").classList.toggle("open"));
  $$(".plan-switch button").forEach(b=>b.onclick=()=>renderDay(dayNo,Number(b.dataset.plan)));
}
function placeCard(x,next){
  const rows=[];
  const t=x.transport||{},det=x.details||{};
  if(t.boarding)rows.push(["上車／起點",t.boarding]);
  if(t.transfer)rows.push(["轉乘",t.transfer]);
  if(t.route)rows.push(["路線",t.route]);
  if(t.arrival)rows.push(["下車／終點",t.arrival]);
  if(t.exit)rows.push(["出口",t.exit]);
  if(t.walkingMinutes)rows.push(["步行",`${t.walkingMinutes} 分鐘`]);
  if(det.boardingPoint)rows.push(["遊園車上車點",det.boardingPoint]);
  if(det.backupPoint)rows.push(["替代上車點",det.backupPoint]);
  if(det.dropOffPoint)rows.push(["遊園車下車點",det.dropOffPoint]);
  if(det.price)rows.push(["費用",det.price]);
  if(det.operationHours)rows.push(["營運時間",det.operationHours]);
  if(det.recommendedStayMinutes)rows.push(["建議停留",`${det.recommendedStayMinutes} 分鐘`]);
  if(det.cafes)rows.push(["咖啡備選",det.cafes.join("、")]);
  if(det.routeOptions)rows.push(["集合交通",det.routeOptions.join("／")]);
  if(det.flight)rows.push(["航班",`${det.flight}｜${det.departure} → ${det.arrival}`]);

  return `<article class="place-card">
    <div class="place-top">
      <div class="place-time">${esc(x.time)}</div>
      <div class="place-main"><h3>${esc(x.title)}</h3><div class="place-location">${esc(x.place)}</div><p class="place-summary">${esc(x.summary||"")}</p></div>
      <button class="expand-btn">詳情</button>
    </div>
    <div class="card-actions">
      <a class="pill-link" target="_blank" href="${mapUrl(x.mapsQuery||x.place)}">Google Maps</a>
      ${next?`<a class="pill-link" target="_blank" href="${mapUrl(next.mapsQuery||next.place)}">前往下一站</a>`:""}
    </div>
    <div class="details">
      <div class="detail-grid">${rows.length?rows.map(([k,v])=>`<div class="detail-row"><b>${esc(k)}</b><span>${esc(v)}</span></div>`).join(""):'<div class="detail-note">目前沒有額外交通資料。</div>'}</div>
      ${det.operationNote?`<div class="detail-note">${esc(det.operationNote)}</div>`:""}
    </div>
  </article>`;
}
async function loadAllWeather(){
  await Promise.all(trip.days.map(loadWeatherForDay));
  renderForecast();renderDay(activeDay);renderToday();
}
async function loadWeatherForDay(day){
  const c=cityCoords[day.weather.location];
  try{
    const url=`https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTokyo&start_date=${day.date}&end_date=${day.date}`;
    const r=await fetch(url,{cache:"no-store"});
    if(!r.ok)throw new Error();
    const j=await r.json();
    if(!j.daily?.time?.length){weatherCache[day.date]={wait:true};return}
    const code=j.daily.weather_code[0],[icon,label]=weatherCodes[code]||["🌡️","天氣資訊"];
    weatherCache[day.date]={icon,label,max:j.daily.temperature_2m_max[0],min:j.daily.temperature_2m_min[0],rain:j.daily.precipitation_probability_max[0]??0};
  }catch{weatherCache[day.date]={wait:true}}
}
function renderForecast(){
  $("#forecastStrip").innerHTML=trip.days.map(d=>{
    const w=weatherCache[d.date];
    return `<div class="forecast-card"><small>Day ${d.day}</small>${w&&!w.wait?`<b>${w.icon}</b><span>${Math.round(w.min)}–${Math.round(w.max)}°</span><small>降雨 ${w.rain}%</small>`:`<b>—</b><span>尚未開放</span><small>${esc(d.city)}</small>`}</div>`;
  }).join("");
}
function renderToday(){
  const dayNo=dayFromToday();
  if(!dayNo){
    $("#todayWeather").innerHTML="";
    $("#todayItems").innerHTML='<div class="today-empty">旅程尚未開始。出發後會自動顯示當天行程、天氣與第一站。</div>';
    return;
  }
  const d=trip.days.find(x=>x.day===dayNo);
  $("#todayWeather").innerHTML=weatherHtml(d);
  $("#todayItems").innerHTML=flattenDay(d).map((x,i,a)=>placeCard(x,a[i+1])).join("");
  $$("#todayItems .expand-btn").forEach(b=>b.onclick=()=>b.closest(".place-card").classList.toggle("open"));
}
$("#refreshWeather").onclick=()=>{weatherCache={};$("#forecastStrip").innerHTML='<div class="weather-wait">正在更新…</div>';loadAllWeather()};
$$(".bottom-nav button").forEach(b=>b.onclick=()=>{$$(".bottom-nav button").forEach(x=>x.classList.remove("active"));b.classList.add("active");$$(".page").forEach(x=>x.classList.remove("active"));$("#"+b.dataset.page).classList.add("active");scrollTo({top:0,behavior:"smooth"})});
$$("[data-page-target]").forEach(b=>b.onclick=()=>document.querySelector(`.bottom-nav [data-page="${b.dataset.pageTarget}"]`).click());
$("#exportData").onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(trip,null,2)],{type:"application/json"}));a.download="osaka-2026.json";a.click();URL.revokeObjectURL(a.href)};
init();
