(() => {
  'use strict';
  const V=window.V60;V.setTheme();V.registerSW();const data=V.data();
  V.$('#examDate').value=data.settings.examDate||'';V.$('#themeSelect').value=data.settings.theme||'system';
  V.$('#saveExam').addEventListener('click',()=>{data.settings.examDate=V.$('#examDate').value;V.save(0);alert('考试日期已保存。')});
  V.$('#saveTheme').addEventListener('click',()=>{data.settings.theme=V.$('#themeSelect').value;V.save(0);V.setTheme();alert('显示设置已保存。')});
  V.$('#exportData').addEventListener('click',V.exportData);
  V.$('#importData').addEventListener('change',e=>{const file=e.target.files?.[0];if(!file)return;V.importData(file).then(()=>{alert('学习记录已导入，页面将刷新。');location.reload()}).catch(err=>alert(`导入失败：${err.message}`))});
  V.$('#resetProgress').addEventListener('click',()=>{if(confirm('确定清空全部学习进度？知识点、题目、课堂笔记和原图不会删除。')){V.resetProgress();alert('学习进度已清空。');location.href='./index.html';}});
  const days=[];for(let n=34;n>=0;n--){const d=new Date();d.setDate(d.getDate()-n);const key=V.dateKey(d),count=Number(data.stats.days?.[key]||0),cls=count>=8?'l3':count>=3?'l2':count>0?'l1':'';days.push(`<span class="${cls}" title="${key}：${count}次学习">${d.getDate()}</span>`)}V.$('#heatmap').innerHTML=days.join('');
  const blocks=V.refreshBlocks().filter(b=>b.knowledge.length),notes=V.SORTED.filter(V.isNote).filter(i=>!V.isSourceMaterial(i)),sources=V.SORTED.filter(V.isSourceMaterial),questions=V.SORTED.filter(V.isQuestion),mastered=blocks.filter(b=>b.complete).length,readNotes=notes.filter(i=>V.state(i.id).read).length,wrong=questions.filter(i=>V.state(i.id).wrong).length;
  V.$('#dataStats').innerHTML=`<p>核心背诵块：<b>${blocks.length}</b></p><p>已完成核心块：<b>${mastered}</b></p><p>课堂笔记：<b>${notes.length}</b>，已看 ${readNotes}</p><p>题目：<b>${questions.length}</b>，当前错题 ${wrong}</p><p>PDF/扫描原资料：<b>${sources.length}</b>，仅存档，不进入每日背诵</p>`;
})();
