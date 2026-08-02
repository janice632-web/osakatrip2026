
document.querySelectorAll('input[type=checkbox]').forEach(el=>{
  const k='check:'+el.dataset.key;
  el.checked=localStorage.getItem(k)==='1';
  el.addEventListener('change',()=>localStorage.setItem(k,el.checked?'1':'0'));
});
document.querySelectorAll('textarea[data-note]').forEach(el=>{
  const k='note:'+el.dataset.note;
  el.value=localStorage.getItem(k)||'';
  el.addEventListener('input',()=>localStorage.setItem(k,el.value));
});
document.querySelectorAll('.favorite').forEach(btn=>{
  const k='fav:'+btn.dataset.fav;
  const refresh=()=>{btn.classList.toggle('on',localStorage.getItem(k)==='1');btn.textContent=localStorage.getItem(k)==='1'?'♥':'♡';};
  refresh();
  btn.addEventListener('click',()=>{localStorage.setItem(k,localStorage.getItem(k)==='1'?'0':'1');refresh();});
});
document.querySelectorAll('.tabs').forEach(tabbar=>{
  const wrap=tabbar.parentElement;
  tabbar.querySelectorAll('.tabbtn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      tabbar.querySelectorAll('.tabbtn').forEach(b=>b.classList.remove('active'));
      wrap.querySelectorAll('.tabcontent').forEach(c=>c.classList.remove('active'));
      btn.classList.add('active');
      wrap.querySelector('#'+btn.dataset.target).classList.add('active');
    });
  });
});
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js'));}
