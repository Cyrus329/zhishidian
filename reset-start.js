(()=>{
  const MARK='zsb-clean-start-v56-zero-20260802-done';
  if(localStorage.getItem(MARK)==='1')return;
  try{
    Object.keys(localStorage).filter(k=>k.startsWith('zsb-')).forEach(k=>localStorage.removeItem(k));
    sessionStorage.clear();
    localStorage.setItem(MARK,'1');
    localStorage.setItem('zsb-clean-start-time',new Date().toISOString());
    if('caches' in window)caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('zsb-knowledge-')).map(k=>caches.delete(k))));
  }catch(e){console.warn('零起点清理失败',e)}
})();
