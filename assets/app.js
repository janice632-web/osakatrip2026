
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
 const key='note:'+el.dataset.note;
 el.value=localStorage.getItem(key)||'';
 el.addEventListener('input',()=>localStorage.setItem(key,el.value));
});
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js'));}
