(()=>{
  const MARK='zsb-clean-start-v60-4-pdf-bold-only-20260803-done';
  if(localStorage.getItem(MARK)==='1')return;
  try{
    Object.keys(localStorage).filter(k=>k.startsWith('zsb-')).forEach(k=>localStorage.removeItem(k));
    sessionStorage.clear();
    localStorage.setItem(MARK,'1');
    localStorage.setItem('zsb-clean-start-time',new Date().toISOString());
    localStorage.setItem('zsb-clean-start-reason','计算机PDF01-10按加粗重分并重新背诵');
    if('caches' in window)caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('zsb-knowledge-')).map(k=>caches.delete(k))));
  }catch(e){console.warn('零起点清理失败',e)}
})();
