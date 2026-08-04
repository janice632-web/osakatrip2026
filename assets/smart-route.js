/* V3.3 smart route */
(function(){
const C={"d1-br176":[25.0797,121.2342],"d1-kobe-airport":[34.6328,135.2239],"d1-shinki-bus":[34.6328,135.2239],"d1-hotel-checkin":[34.6747,135.5043],"d1-dotonbori":[34.6687,135.5013],"d2-morinomiya":[34.6815,135.5346],"d2-road-train":[34.6888,135.5352],"d2-osaka-castle":[34.6873,135.5262],"d2-ytv":[34.6943,135.5328],"d2-tennoji":[34.6466,135.5133],"d2-harukas":[34.6461,135.5133],"d3-meeting":[34.6666,135.4958],"d3-arashiyama":[35.0094,135.6668],"d3-kinkakuji":[35.0394,135.7292],"d3-kiyomizu":[34.9949,135.7850],"d3-fushimi":[34.9671,135.7727],"d4-depart":[34.6677,135.4383],"d4-conan":[34.6654,135.4323],"d4-mario":[34.6677,135.4312],"d4-minecart":[34.6675,135.4307],"d4-jurassic":[34.6632,135.4335],"d4-harrypotter":[34.6681,135.4346],"d5-umeda":[34.7025,135.4959],"d5-nintendo":[34.7001,135.4965],"d5-pokemon":[34.7001,135.4965],"d5-lucua":[34.7025,135.4955],"d5-yodobashi":[34.704,135.4967],"d5-cafe":[34.708,135.5001],"d5-grandfront":[34.7055,135.4947],"d6a-shopping":[34.674,135.5017],"d6a-bus":[34.6743,135.5007],"d6b-bus":[34.6743,135.5007],"d6b-portliner":[34.6372,135.2287],"d6b-nankinmachi":[34.688,135.1877],"d6b-return":[34.6949,135.1956],"d6-flight":[34.6328,135.2239]};
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