(() => {
  'use strict';
  const V=window.V60;V.setTheme();V.registerSW();
  const params=new URLSearchParams(location.search),requestedItem=params.get('item'),requestedBlock=params.get('block'),requestedTrack=params.get('track'),requestedMode=params.get('mode')||'';
  const plan=V.todayPlan();let queue=[],index=0,graded=0;
  if(requestedBlock){
    const b=V.refreshBlocks().find(x=>x.key===requestedBlock);if(b)queue=[{type:'block',block:b,due:false,mode:requestedMode}];
  }else if(requestedItem&&V.BY_ID.has(requestedItem)){
    const item=V.BY_ID.get(requestedItem);queue=[{type:'question',item}];
  }else if(requestedTrack==='pdf'){
    queue=V.pdfBlocks().filter(b=>!b.complete).map(block=>({type:'block',block,due:false}));
  }else{
    queue=[...plan.queue];
  }
  function isPdfEntry(entry){return entry.type==='block'&&entry.block.track==='pdf'}
  function typeLabel(entry){if(entry.type==='question')return '关联练习';if(isPdfEntry(entry))return 'PDF加粗必背';return entry.due?'日常必须复习':'日常下一知识块';}
  function finishHtml(){
    const pdfMode=requestedTrack==='pdf'||queue.some(isPdfEntry);
    return `<section class="session-done"><h1>${pdfMode?'这一轮PDF专题完成':'今天这一轮完成'}</h1><p>已处理 ${graded} 个任务。${pdfMode?'PDF专题与日常背诵分开记录。':'PDF专题没有混入本轮日常任务。'}</p><div class="detail-actions" style="justify-content:center"><a class="primary-btn" href="${pdfMode?'./knowledge.html?track=pdf':'./index.html'}">${pdfMode?'返回PDF专题':'返回今日'}</a><a href="./questions.html">继续刷题</a></div></section>`;
  }

  function renderBlockTest(entry){
    const b=entry.block,isPdf=b.track==='pdf',tests=V.buildBlockCheck(b),code=isPdf?V.pdfDisplayCode(b):b.category;
    const backHref=isPdf?'./knowledge.html?track=pdf':'./knowledge.html?track=daily';
    const hint=isPdf?'写出PDF加粗内容里的关键词、名称或关键结论。':'写出这一块最核心的关键词或关键结论。';
    const testList=tests.length?tests.map((t,idx)=>`<div class="typed-test-item"><label>${idx+1}. ${V.esc(t.prompt)}</label><input type="text" data-test-input="${idx}" placeholder="在这里输入关键词或答案"></div>`).join(''):'<div class="empty">这块暂时没有可自动生成的填空，你可以先点“查看参考答案”自测。</div>';
    return `<article class="study-card compact-study-card ${isPdf?'pdf-study-card':'daily-study-card'}"><div class="study-meta"><span class="${isPdf?'pdf-study-badge':'daily-study-badge'}">背完检验</span><span>${V.esc(b.subject)}</span><span>${V.esc(b.chapter)}</span><span>${V.esc(isPdf?V.pdfDisplaySection(b):b.section)}</span></div><div class="compact-study-heading"><div><small>${isPdf?'PDF专题检验 · 输入关键词即可':'日常知识块检验 · 输入关键词即可'}</small><h1>${V.esc(code)}</h1></div><span>${tests.length} 题自检</span></div><div class="recall-panel typed-test-panel"><div class="typed-test-tip"><b>使用方式：</b>${V.esc(hint)}</div>${testList}<div class="typed-test-actions">${tests.length?'<button class="primary-btn" id="submitTypedTest" type="button">提交检验</button>':''}<button class="ghost-btn" id="revealBtn" type="button">查看参考答案</button></div></div><section id="typedResult" class="typed-result"></section><section id="answerPanel" class="answer-panel">${V.blockAnswerHtml(b)}<div class="detail-actions"><a href="${backHref}">返回${isPdf?'PDF专题':'日常知识树'}</a>${b.notes.length?`<a href="./notes.html?block=${encodeURIComponent(b.key)}">查看关联课堂笔记</a>`:''}${b.questions.length?`<a href="./questions.html?block=${encodeURIComponent(b.key)}">做关联题</a>`:''}</div></section><div id="gradeRow" class="grade-row"><button data-grade="0">还不会</button><button data-grade="1">大体会了</button><button data-grade="2">背会了</button></div></article>`;
  }
  function handleTypedTest(){
    const entry=queue[index];
    if(!entry || entry.type!=='block') return;
    const tests=V.buildBlockCheck(entry.block);
    const resultHost=V.$('#typedResult');
    if(!tests.length){
      resultHost.innerHTML='<div class="typed-score">这块没有自动检验题，已为你展开参考答案。</div>';
      resultHost.classList.add('open');
      V.$('#answerPanel')?.classList.add('open');
      V.$('#gradeRow')?.classList.add('open');
      return;
    }
    let correct=0;
    const rows=tests.map((t,idx)=>{
      const input=V.$(`[data-test-input="${idx}"]`)?.value||'';
      const ok=V.checkTypedAnswer(input,t.answer);
      if(ok) correct++;
      return `<div class="typed-result-item ${ok?'ok':'bad'}"><div><b>${idx+1}. ${ok?'正确':'再记一下'}</b><p>你的答案：${V.esc(input||'（未填写）')}</p></div><div class="typed-answer"><span>参考答案</span><strong>${V.esc(t.answer)}</strong><small>${V.esc(t.line)}</small></div></div>`;
    }).join('');
    const pct=Math.round(correct/tests.length*100);
    let tip='建议再多看两遍再点“背会了”。';
    if(pct>=80) tip='这块已经比较稳了，可以直接标记“背会了”。';
    else if(pct>=50) tip='已经记住一半以上，建议看一眼答案后再巩固一次。';
    resultHost.innerHTML=`<div class="typed-score"><b>检验结果：${correct}/${tests.length}</b><span>${pct}% · ${tip}</span></div>${rows}`;
    resultHost.classList.add('open');
    V.$('#answerPanel')?.classList.add('open');
    V.$('#gradeRow')?.classList.add('open');
    const reveal=V.$('#revealBtn'); if(reveal) reveal.classList.add('hidden');
  }

  function render(){
    const host=V.$('#studyHost'),total=queue.length;
    V.$('#progressBar').style.width=`${total?Math.round(index/total*100):100}%`;
    V.$('#sessionLabel').textContent=total?`第 ${Math.min(index+1,total)} / ${total} 项`:'任务完成';
    if(!total||index>=total){host.innerHTML=finishHtml();return;}
    const entry=queue[index];
    if(entry.type==='question'){
      const i=entry.item,b=V.refreshBlocks().find(x=>x.key===V.blockKey(i));
      host.innerHTML=`<article class="study-card"><div class="study-meta"><span>${V.esc(typeLabel(entry))}</span><span>${V.esc(i.subject)}</span><span>${V.esc(V.chapter(i))}</span><span>${V.esc(i.category||'未分类')}</span></div><h1>${V.esc(i.title)}</h1><div class="recall-panel">${V.questionHtml(i)}</div><button id="revealBtn" class="reveal-btn">先作答，再核对答案</button><section id="answerPanel" class="answer-panel">${V.answerHtml(i)}<div class="detail-actions"><a href="./library.html?item=${encodeURIComponent(i.id)}">查看完整解析</a>${b?.notes?.length?`<a href="./notes.html?block=${encodeURIComponent(b.key)}">关联课堂笔记</a>`:''}</div></section><div id="gradeRow" class="grade-row"><button data-grade="0">做错了</button><button data-grade="1">有点模糊</button><button data-grade="2">做对了</button></div></article>`;
      return;
    }
    const b=entry.block,s=V.blockSummary(b),onlyUnderstand=!b.knowledge.length,isPdf=b.track==='pdf';
    if(entry.mode==='test'){ host.innerHTML=renderBlockTest(entry); return; }
    const backHref=isPdf?'./knowledge.html?track=pdf':'./knowledge.html?track=daily';
    const code=isPdf?V.pdfDisplayCode(b):b.category;
    host.innerHTML=`<article class="study-card compact-study-card ${isPdf?'pdf-study-card':'daily-study-card'}"><div class="study-meta"><span class="${isPdf?'pdf-study-badge':'daily-study-badge'}">${onlyUnderstand?'PDF了解资料':V.esc(typeLabel(entry))}</span><span>${V.esc(b.subject)}</span><span>${V.esc(b.chapter)}</span><span>${V.esc(isPdf?V.pdfDisplaySection(b):b.section)}</span></div><div class="compact-study-heading"><div><small>${isPdf?'独立PDF专题 · 不进入每日任务':onlyUnderstand?'本页不参与背诵':'日常核心知识块'}</small><h1>${V.esc(code)}</h1></div><span>${b.knowledge.reduce((n,i)=>n+(i.mustPatterns||[]).length,0)} 条${isPdf?'加粗必背':'核心必背'}</span></div><div class="recall-panel">${onlyUnderstand?'<div class="recall-question"><b>阅读了解：</b>本页没有黑色加粗的必背句，浏览普通内容即可。</div>':V.blockQuestionHtml(b)}</div><button id="revealBtn" class="reveal-btn">${onlyUnderstand?'查看了解内容':isPdf?'显示PDF加粗必背内容':'显示日常必背内容'}</button><section id="answerPanel" class="answer-panel">${V.blockAnswerHtml(b)}<div class="detail-actions"><a href="${backHref}">返回${isPdf?'PDF专题':'日常知识树'}</a>${b.notes.length?`<a href="./notes.html?block=${encodeURIComponent(b.key)}">查看关联课堂笔记</a>`:''}${b.questions.length?`<a href="./questions.html?block=${encodeURIComponent(b.key)}">做关联题</a>`:''}</div></section>${onlyUnderstand?'<div id="understandRow" class="understand-next-row"><button data-next="understand">已阅读了解，下一项</button></div>':`<div id="gradeRow" class="grade-row"><button data-grade="0">这一块不会</button><button data-grade="1">记得不完整</button><button data-grade="2">这一块会了</button></div>`}</article>`;
  }
  document.addEventListener('click',e=>{
    if(e.target.id==='submitTypedTest'){ handleTypedTest(); return; }
    if(e.target.id==='revealBtn'){
      V.$('#answerPanel').classList.add('open');
      const grades=V.$('#gradeRow'),understand=V.$('#understandRow');if(grades)grades.classList.add('open');if(understand)understand.classList.add('open');
      e.target.classList.add('hidden');return;
    }
    const next=e.target.closest('[data-next="understand"]');
    if(next){const entry=queue[index];if(entry?.type==='block')V.markUnderstandBlock(entry.block);graded++;index++;render();return;}
    const btn=e.target.closest('[data-grade]');if(!btn)return;
    const entry=queue[index],grade=Number(btn.dataset.grade);
    if(entry.type==='question')V.markGrade(entry.item,grade);else V.markBlockGrade(entry.block,grade);
    graded++;index++;render();
  });
  render();
})();
