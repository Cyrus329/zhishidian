(() => {
  'use strict';
  const V=window.V60;V.setTheme();V.registerSW();
  const plan=V.todayPlan(),days=V.examDays(),coach=V.coach();
  const countdownLabel=V.$('#countdownLabel'),countdownValue=V.$('#countdownValue'),heroText=V.$('#heroText');
  if(days===null){countdownLabel.textContent='考试日期尚未设置';countdownValue.textContent='按日常知识块稳步推进';heroText.textContent='今日页面只安排日常背诵。计算机PDF 01—10已经单独分区，不会混入今天的任务。'}
  else if(days<0){countdownLabel.textContent='考试日期已过';countdownValue.textContent='请更新考试日期';}
  else{countdownLabel.textContent=days<=30?'已进入冲刺阶段':'距离考试';countdownValue.textContent=`${days} 天`;heroText.textContent=days<=30?'先处理日常高频、错题和到期内容；PDF专题单独复习。':'先完成日常背诵，再按需要进入PDF加粗专题。'}
  V.$('#dueCount').textContent=plan.due.length;
  V.$('#learnCount').textContent=plan.learn.length;
  V.$('#questionCount').textContent=plan.questions.length;
  V.$('#learnBlockName').textContent=plan.block?plan.block.category:(plan.due.length?'先完成到期核心块':'已完成当前日常资料');
  const cp=V.$('#coachPanel');cp.classList.add(coach.level||'');cp.innerHTML=`<div class="coach-icon">${coach.level==='danger'?'!':coach.level==='warn'?'↻':'→'}</div><div><h3>${V.esc(coach.title)}</h3><p>${V.esc(coach.text)}</p></div>`;
  V.$('#subjectProgress').innerHTML=['计算机','英语','数学'].map(s=>{const x=V.subjectStats(s);return `<article class="progress-card"><header><b>${s}</b><span>${x.mastered}/${x.total} 块</span></header><div class="bar"><i style="width:${x.pct}%"></i></div><small>日常背诵完成 ${x.pct}%</small></article>`}).join('');
  const ps=V.pdfStats(),pdfHost=V.$('#pdfTrackProgress');
  if(pdfHost)pdfHost.innerHTML=`<div><span class="track-tag pdf">独立专题</span><h3>计算机 PDF 01—10</h3><p>只背黑色加粗内容，普通字只了解；不进入今日任务。</p><div class="bar"><i style="width:${ps.pct}%"></i></div><small>已完成 ${ps.completed}/${ps.total} 个PDF模块 · 其中加粗必背 ${ps.mastered}/${ps.memorizeTotal}</small></div><a class="primary-btn" href="./knowledge.html?track=pdf">进入PDF专题</a>`;
  const b=plan.block||plan.todayDue[0],host=V.$('#currentBlock');
  if(!b){host.innerHTML='<div class="empty">当前日常核心背诵块已经完成，可进入题库或PDF专题。</div>';return}
  host.innerHTML=`<div><div class="path">日常背诵 · ${V.esc(b.subject)} ＞ ${V.esc(b.chapter)} ＞ ${V.esc(b.section)}</div><h3>${V.esc(b.category)}</h3><div class="badges"><span class="badge">1个核心块</span><span class="badge">原细卡 ${b.knowledge.length}</span><span class="badge">课堂笔记 ${b.notes.length}</span><span class="badge">关联题 ${b.questions.length}</span></div></div><a class="primary-btn" href="./learn.html?block=${encodeURIComponent(b.key)}&track=daily">开始这一块</a>`;
})();
