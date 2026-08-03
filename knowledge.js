(() => {
  'use strict';
  const V=window.V60;V.setTheme();V.registerSW();
  const params=new URLSearchParams(location.search);
  const state={subject:'',q:params.get('search')||'',status:'',track:params.get('track')==='pdf'?'pdf':'daily'};

  function matchesBlock(b){
    if(b.track!==state.track)return false;
    if(!b.knowledge.length&&!b.understand.length)return false;
    if(state.subject&&b.subject!==state.subject)return false;
    if(state.status==='unfinished'&&b.complete)return false;
    if(state.status==='started'&&!b.started)return false;
    if(state.status==='done'&&!b.complete)return false;
    if(state.q){
      const hay=[b.subject,b.chapter,b.section,b.category,...b.knowledge.map(i=>`${i.title} ${i.oneLine||''}`),...b.understand.map(i=>`${i.title} ${i.oneLine||''}`)].join(' ').toLowerCase();
      if(!hay.includes(state.q.toLowerCase()))return false;
    }
    return true;
  }
  function chapterKey(b){return `${b.subject}|||${b.chapter}`}
  function sectionTitle(b){return b.track==='pdf'?V.pdfDisplaySection(b):b.section}
  function displayTitle(b){return b.track==='pdf'?V.pdfDisplayCode(b):b.category}
  function cardHtml(b){
    const s=V.blockSummary(b),isPdf=b.track==='pdf',must=b.knowledge.reduce((n,i)=>n+(i.mustPatterns||[]).length,0),understand=b.understand.length+b.knowledge.reduce((n,i)=>n+(i.understandOnly||[]).length,0);
    const status=b.complete?'已完成':b.started?'学习中':(b.knowledge.length?'未开始':'仅了解');
    return `<article class="compact-block-row ${isPdf?'pdf-block-row':'daily-block-row'}"><div class="compact-block-main"><div class="compact-block-title"><h4>${V.esc(displayTitle(b))}</h4><span>${status}</span></div><p>${s.core[0]?V.esc(s.core[0]):'本模块没有加粗必背内容，只需阅读了解'}</p><div class="mini-progress"><i style="width:${b.progress}%"></i></div><div class="compact-meta">${isPdf?'<span class="track-tag pdf">PDF原资料</span>':'<span class="track-tag daily">日常知识点</span>'}<span>必背 ${must}条</span><span>了解 ${understand}项</span><span>课堂笔记 ${b.notes.length}</span><span>关联题 ${b.questions.length}</span></div></div><div class="compact-block-actions"><a class="primary-btn" href="./learn.html?block=${encodeURIComponent(b.key)}&track=${b.track}">${b.knowledge.length?(isPdf?'背这一份PDF':'开始这一块'):'阅读了解'}</a><details><summary>查看细项</summary><div class="fine-item-list">${[...b.knowledge,...b.understand].map(i=>`<a href="./library.html?item=${encodeURIComponent(i.id)}">${V.esc(i.title)}</a>`).join('')}</div></details></div></article>`;
  }
  function render(){
    const blocks=V.refreshBlocks(state.track).filter(matchesBlock),chapters=new Map();
    blocks.forEach(b=>{
      const ck=chapterKey(b),ch=chapters.get(ck)||{subject:b.subject,title:b.chapter,sections:new Map(),blocks:[]};
      const st=sectionTitle(b),sec=ch.sections.get(st)||{title:st,blocks:[]};
      sec.blocks.push(b);ch.sections.set(st,sec);ch.blocks.push(b);chapters.set(ck,ch);
    });
    const host=V.$('#treeHost');
    if(!chapters.size){host.innerHTML='<div class="empty">没有符合条件的内容。</div>';return}
    const chapterList=[...chapters.values()].sort((a,b)=>V.compareBlocks(a.blocks[0],b.blocks[0]));
    host.innerHTML=chapterList.map(ch=>{
      const total=ch.blocks.length,mastered=ch.blocks.filter(b=>b.complete).length,pct=total?Math.round(mastered/total*100):0;
      const sections=[...ch.sections.values()].sort((a,b)=>V.compareBlocks(a.blocks[0],b.blocks[0]));
      return `<details class="tree-chapter" open><summary><span>${V.esc(ch.subject)} · ${V.esc(ch.title)}</span><em>${mastered}/${total} 个模块 · ${pct}%</em></summary><div class="chapter-body">${sections.map(sec=>`<section class="tree-section"><h3>${V.esc(sec.title)}</h3><div class="compact-block-list">${sec.blocks.sort(V.compareBlocks).map(cardHtml).join('')}</div></section>`).join('')}</div></details>`;
    }).join('');
  }
  function updateTrackUi(){
    const isPdf=state.track==='pdf';
    V.$('#trackDaily').classList.toggle('active',!isPdf);V.$('#trackPdf').classList.toggle('active',isPdf);
    V.$('#trackTitle').textContent=isPdf?'PDF原资料 01—10（独立专区）':'日常知识点（非PDF）';
    V.$('#trackDesc').textContent=isPdf?'这里只显示10张由PDF 01—10直接整理出的专属卡；不会带入任何日常知识点。只背原PDF黑色加粗内容，普通字只作了解。':'这里只显示原来的日常知识点，例如历史人物、历史事件、计算机特点等；这些不是PDF卡。';
    const action=V.$('#trackAction');
    action.href=isPdf?'./learn.html?track=pdf':'./learn.html';
    action.textContent=isPdf?'按 01—10 顺序开始 PDF 背诵':'开始今日背诵';
    V.$('#subjectFilter').value=isPdf?'计算机':state.subject;
    if(isPdf){state.subject='计算机';V.$('#subjectFilter').disabled=true}else{V.$('#subjectFilter').disabled=false}
  }
  function setTrack(track){state.track=track;state.subject=track==='pdf'?'计算机':'';state.status='';V.$('#statusFilter').value='';updateTrackUi();history.replaceState(null,'',`./knowledge.html?track=${track}`);render()}
  V.$('#treeSearch').value=state.q;
  V.$('#trackDaily').addEventListener('click',()=>setTrack('daily'));
  V.$('#trackPdf').addEventListener('click',()=>setTrack('pdf'));
  V.$('#subjectFilter').addEventListener('change',e=>{state.subject=e.target.value;render()});
  V.$('#statusFilter').addEventListener('change',e=>{state.status=e.target.value;render()});
  let t;V.$('#treeSearch').addEventListener('input',e=>{clearTimeout(t);t=setTimeout(()=>{state.q=e.target.value.trim();render()},180)});
  updateTrackUi();render();
})();
