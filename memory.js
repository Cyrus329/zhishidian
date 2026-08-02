const ITEMS=window.KNOWLEDGE_ITEMS||[];
const STORE='zsb-knowledge-v26-day1';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const isQuestion=i=>i?.studyMode==='question'||String(i?.recordType||'').includes('题目');
const isNote=i=>!isQuestion(i)&&(i?.studyMode==='note'||String(i?.recordType||'').includes('笔记'));
const isPurePdf=i=>!isQuestion(i)&&String(i?.recordType||'').includes('PDF');
const MEMORY_ITEMS=ITEMS.filter(i=>!isNote(i)&&!isPurePdf(i));
const ITEM_BY_ID=new Map(ITEMS.map(i=>[i.id,i]));
const MEMORY_BY_ID=new Map(MEMORY_ITEMS.map(i=>[i.id,i]));
const ERROR_REASONS=['完全没背过','概念混淆','关键词遗漏','公式/规则记错','审题错误','计算错误','选项辨析错误','会做但不熟练'];
const GRADE_LABELS=['完全不会','模糊记得','基本记住','非常熟练'];
let data=load(),mode='daily',activeAdaptive=null,activeTrain=null,trainQuestion=null,whiteState=null,challenge=null,mixed=null,pendingGrade=null,recognition=null,weeklyText='';

function load(){
  let x={};
  try{x=JSON.parse(localStorage.getItem(STORE)||'{}')}catch{}
  x.study||={};x.reviews||={};x.recall||={};x.answers||={};x.errorReasons||={};x.dailyPlans||={};x.eventLog||=[];x.challengeRecords||={};x.quickReview||={};x.settings||={};
  x.settings.dailyNewQuota=Number(x.settings.dailyNewQuota||20);x.settings.dailyReviewCap=Number(x.settings.dailyReviewCap||40);
  return x;
}
function save(){localStorage.setItem(STORE,JSON.stringify(data))}
function today(){const d=new Date();return dateKey(d)}
function yesterday(){const d=new Date();d.setDate(d.getDate()-1);return dateKey(d)}
function dateKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function addDays(n,from=new Date()){const d=new Date(from);d.setDate(d.getDate()+n);return dateKey(d)}
function daysBetween(a,b){const A=new Date(`${a}T00:00:00`),B=new Date(`${b}T00:00:00`);return Math.round((B-A)/86400000)}
function st(id){return data.study?.[id]||{read:false,mastered:false,wrong:false,starred:false}}
function review(id){return data.reviews?.[id]||{due:'',interval:0,ease:2.3,count:0,lapses:0,last:'',lastGrade:null}}
function recallInfo(id){return data.recall?.[id]||{attempts:0,misses:0,best:0,last:'',lastMissing:[]}}
function normalize(s){return String(s||'').toLowerCase().replace(/[\s，。；：、,.!?！？:;“”‘’（）()\[\]{}<>《》·'"`~_—-]/g,'')}
function uniq(arr){return [...new Set((arr||[]).map(x=>String(x||'').trim()).filter(Boolean))]}
function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function chapterParts(i){return String(i?.chapter||'未分章').split('｜').map(x=>x.trim()).filter(Boolean)}
function rootKey(i){const p=chapterParts(i);return `${i.subject||p[0]||'未分类'}|||${p[1]||p[0]||'未分章'}`}
function rootTitle(i){const p=chapterParts(i);return p[1]||p[0]||'未分章'}
function sectionTitle(i){const p=chapterParts(i);return p.length>2?p.slice(2).join('｜'):(p[1]||'本章内容')}
function source(i){return i.sourceOrg||'未标注'}
function importLabel(i){return i.importLabel||i.range||i.importDate||'未记录日期'}
function itemPath(i){return `${i.subject} ＞ ${rootTitle(i)} ＞ ${sectionTitle(i)} ＞ ${i.category||'未分类'}`}
function eventTime(e){return new Date(e.at||0).getTime()||0}
function logEvent(type,itemId='',meta={}){data.eventLog.push({at:new Date().toISOString(),date:today(),type,itemId,meta});if(data.eventLog.length>5000)data.eventLog=data.eventLog.slice(-5000)}
function isDueId(id){const r=review(id);return !!r.due&&r.due<=today()}
function isNewItem(i){const r=review(i.id),s=st(i.id);return !s.mastered&&!r.count&&!s.read}
function overdueDays(i){const r=review(i.id);return r.due?Math.max(0,daysBetween(r.due,today())):0}
function errorCount(id){return Object.values(data.errorReasons?.[id]||{}).reduce((n,x)=>n+Number(x||0),0)}
function weakScore(i){const s=st(i.id),r=review(i.id),rec=recallInfo(i.id);let score=0;if(s.wrong)score+=8;if(isDueId(i.id))score+=6+Math.min(5,overdueDays(i));if(!s.mastered)score+=2;if(s.starred)score+=1;if(r.lastGrade===0)score+=4;if(r.lastGrade===1)score+=2;score+=Math.min(5,errorCount(i.id));if(rec.attempts)score+=Math.min(5,Math.ceil(rec.misses/Math.max(1,rec.attempts)));return score}
function extractKeywords(i){
  const out=[];(i.keywords||[]).forEach(x=>out.push(x));
  (i.clozeLines||[]).forEach(line=>{[...String(line).matchAll(/\[\[([^\]]+)\]\]/g)].forEach(m=>out.push(m[1]))});
  (i.pdfClozeLines||[]).forEach(line=>{[...String(line).matchAll(/\[\[([^\]]+)\]\]/g)].forEach(m=>out.push(m[1]))});
  if(isQuestion(i)&&i.answer)out.push(i.answer);
  (i.keyPoints||[]).forEach(x=>out.push(x));
  (i.notebookSummary?.core||[]).forEach(x=>String(x).split(/[，；。,:：、]/).forEach(t=>{if(t.length>=2&&t.length<=28)out.push(t)}));
  if(out.length<5)(i.mustPatterns||[]).forEach(x=>String(x).split(/[，；。,:：、]/).forEach(t=>{if(t.length>=2&&t.length<=28)out.push(t)}));
  return uniq(out).filter(x=>normalize(x).length>=2&&normalize(x).length<=36).slice(0,14);
}
function fullCore(i){return uniq([...(i.mustPatterns||[]),...(i.notebookSummary?.core||[]),...(i.basicExplain||[]),...(i.examRefine||[]),...(i.keyPoints||[]),...(isQuestion(i)?(i.solutionSteps||[]):[])]).slice(0,18)}
function shortCore(i){const k=extractKeywords(i);return k.slice(0,6)}
function tenSecond(i){return i.oneLine||i.notebookSummary?.conclusion||fullCore(i)[0]||i.title}
function itemLink(i,label='进入原卡片'){return `<a class="meta-link" href="./index.html?item=${encodeURIComponent(i.id)}">${label}</a>`}

function ensureDailyPlan(force=false){
  const key=today();
  if(force)delete data.dailyPlans[key];
  let p=data.dailyPlans[key];
  if(!p){
    const due=MEMORY_ITEMS.filter(i=>isDueId(i.id)).sort((a,b)=>weakScore(b)-weakScore(a)||(a.order||0)-(b.order||0)).slice(0,data.settings.dailyReviewCap);
    const dueSet=new Set(due.map(i=>i.id));
    let news=MEMORY_ITEMS.filter(i=>!dueSet.has(i.id)&&isNewItem(i)).sort((a,b)=>(a.order||0)-(b.order||0)).slice(0,data.settings.dailyNewQuota);
    if(news.length<data.settings.dailyNewQuota){const used=new Set([...dueSet,...news.map(i=>i.id)]);news=news.concat(MEMORY_ITEMS.filter(i=>!used.has(i.id)&&!st(i.id).mastered&&!review(i.id).count).slice(0,data.settings.dailyNewQuota-news.length))}
    p={date:key,reviewIds:due.map(i=>i.id),newIds:news.map(i=>i.id),completedIds:[],createdAt:new Date().toISOString()};data.dailyPlans[key]=p;save();
  }
  p.reviewIds=(p.reviewIds||[]).filter(id=>MEMORY_BY_ID.has(id));p.newIds=(p.newIds||[]).filter(id=>MEMORY_BY_ID.has(id));p.completedIds=p.completedIds||[];
  return p;
}
function planType(id){const p=ensureDailyPlan();if(p.completedIds.includes(id))return 'done';if(p.reviewIds.includes(id))return 'review';if(p.newIds.includes(id))return 'new';return ''}
function planPending(type){const p=ensureDailyPlan(),ids=type==='review'?p.reviewIds:p.newIds;return ids.filter(id=>!p.completedIds.includes(id)).map(id=>MEMORY_BY_ID.get(id)).filter(Boolean)}
function completePlanItem(id){const p=ensureDailyPlan();if(!p.completedIds.includes(id))p.completedIds.push(id)}

function renderTodayCommand(){const r=planPending('review').length,n=planPending('new').length,done=ensureDailyPlan().completedIds.length,total=ensureDailyPlan().reviewIds.length+ensureDailyPlan().newIds.length;$('#todayCommand').innerHTML=`<div class="command-title"><strong>今天必须完成</strong><span>${today()} · 已完成 ${done}/${total}</span></div><a href="#" data-jump="daily" class="command-box command-review"><small>🔴 今日必须复习</small><b>${r}</b><em>到期、错题和薄弱内容</em></a><a href="#" data-jump="daily" class="command-box command-new"><small>🟠 今日必须背诵</small><b>${n}</b><em>按顺序安排的新知识点</em></a>`}
function renderStats(){const due=MEMORY_ITEMS.filter(i=>isDueId(i.id)).length,wrong=MEMORY_ITEMS.filter(i=>st(i.id).wrong).length,unmastered=MEMORY_ITEMS.filter(i=>!st(i.id).mastered).length,events=data.eventLog.filter(e=>e.date===today()).length;$('#heroStats').innerHTML=`<article class="hero-stat"><span>今天到期</span><b>${due}</b><em>自适应排期</em></article><article class="hero-stat"><span>薄弱/错题</span><b>${wrong}</b><em>自动加权</em></article><article class="hero-stat"><span>尚未掌握</span><b>${unmastered}</b><em>不含课堂笔记</em></article><article class="hero-stat"><span>今日有效学习</span><b>${events}</b><em>回忆、作答与评级</em></article>`}
function reasonTags(i){const s=st(i.id),r=review(i.id),rec=recallInfo(i.id),a=[];if(isDueId(i.id))a.push(['到期复习','due']);if(s.wrong)a.push(['错题/没记住','urgent']);if(rec.lastMissing?.length)a.push([`最近漏${rec.lastMissing.length}点`,'weak']);if(!s.mastered)a.push(['未掌握','']);if(errorCount(i.id))a.push([`错因${errorCount(i.id)}次`,'weak']);return a}
function queueCard(i,type){const tags=reasonTags(i),badge=type==='review'?'<span class="plan-badge review">今日复习</span>':'<span class="plan-badge new">今日必背</span>';return `<article class="queue-card ${type}"><span class="queue-rank">${type==='review'?'复':'背'}</span><div>${badge}<h3>${esc(i.title)}</h3><p>${esc(itemPath(i))}<br>${esc(source(i))} · ${esc(importLabel(i))}</p><div class="reason-row">${tags.map(([t,c])=>`<span class="${c}">${esc(t)}</span>`).join('')}</div></div><button data-study-item="${esc(i.id)}" data-study-origin="${type}">开始</button></article>`}
function renderDaily(){const reviews=planPending('review'),news=planPending('new');$('#reviewPlanCount').textContent=reviews.length;$('#newPlanCount').textContent=news.length;$('#todayReviewList').innerHTML=reviews.length?reviews.map(i=>queueCard(i,'review')).join(''):'<div class="empty success">今天的复习已完成。</div>';$('#todayNewList').innerHTML=news.length?news.map(i=>queueCard(i,'new')).join(''):'<div class="empty success">今天的新背任务已完成。</div>';renderTodayCommand()}

function adaptivePool(){const p=ensureDailyPlan();const pending=[...p.reviewIds,...p.newIds].filter(id=>!p.completedIds.includes(id)).map(id=>MEMORY_BY_ID.get(id)).filter(Boolean);return pending.length?pending:[...MEMORY_ITEMS].sort((a,b)=>weakScore(b)-weakScore(a))}
function pickAdaptive(id=''){const pool=adaptivePool();activeAdaptive=id?MEMORY_BY_ID.get(id):pool[0];if(!activeAdaptive&&pool.length)activeAdaptive=pool[Math.floor(Math.random()*pool.length)];renderAdaptive()}
function renderCompression(i,level='10'){if(level==='10')return `<div class="compression-content"><p class="ten-second">${esc(tenSecond(i))}</p></div>`;if(level==='30')return `<div class="compression-content"><div class="keyword-list">${shortCore(i).map(x=>`<span>${esc(x)}</span>`).join('')}</div></div>`;return `<div class="compression-content"><ul>${fullCore(i).map(x=>`<li>${esc(x)}</li>`).join('')||'<li>请进入原卡片查看完整内容。</li>'}</ul></div>`}
function renderAdaptive(level='10'){
  const h=$('#adaptiveCard');if(!activeAdaptive){h.innerHTML='<div class="empty">没有可复习内容。</div>';return}const i=activeAdaptive,r=review(i.id),pt=planType(i.id);
  h.innerHTML=`<div class="study-meta"><span class="${pt==='review'?'red-tag':'orange-tag'}">${pt==='review'?'今日必须复习':pt==='new'?'今日必须背诵':'自适应复习'}</span><span>${esc(itemPath(i))}</span><span>${esc(source(i))}</span></div><h2>${esc(i.title)}</h2><div class="recall-prompt">先不看内容，在脑中或纸上复述这个知识点。</div><div class="compression-tabs"><button data-level="10" class="${level==='10'?'active':''}">10秒速记</button><button data-level="30" class="${level==='30'?'active':''}">30秒关键词</button><button data-level="full" class="${level==='full'?'active':''}">完整复习</button></div><div id="compressionHost">${renderCompression(i,level)}</div><div class="adaptive-info">当前间隔 ${r.interval||0}天 · 已复习 ${r.count||0}次 · 遗忘 ${r.lapses||0}次</div><div class="grade-row">${GRADE_LABELS.map((x,g)=>`<button data-grade="${g}" class="grade-${g}"><b>${g}</b><span>${x}</span></button>`).join('')}</div><div class="study-links">${itemLink(i)}<button data-voice-target="adaptiveVoiceText" class="ghost">语音复述</button></div><textarea id="adaptiveVoiceText" class="voice-note" placeholder="可在这里输入或用语音复述，系统会保留本次回忆用于漏点检测。"></textarea>`}
function applyGrade(i,grade,reason=''){
  const old=review(i.id),ease=Math.max(1.3,Math.min(3.2,Number(old.ease||2.3)+(grade===0?-0.22:grade===1?-0.1:grade===3?.12:0)));
  let interval=1;if(grade===0)interval=1;else if(grade===1)interval=Math.max(2,Math.round((old.interval||1)*1.25));else if(grade===2)interval=old.count?Math.max(3,Math.round(Math.max(2,old.interval||2)*ease)):3;else interval=old.count?Math.max(7,Math.round(Math.max(3,old.interval||3)*(ease+.25))):7;
  data.reviews[i.id]={...old,ease,interval,due:addDays(interval),last:today(),count:Number(old.count||0)+1,lapses:Number(old.lapses||0)+(grade===0?1:0),lastGrade:grade};
  data.study[i.id]={...st(i.id),read:true,mastered:grade>=2,wrong:grade===0,updatedAt:new Date().toISOString()};
  if(reason){data.errorReasons[i.id]||={};data.errorReasons[i.id][reason]=Number(data.errorReasons[i.id][reason]||0)+1}
  completePlanItem(i.id);logEvent('review',i.id,{grade,reason,interval});save();renderDaily();renderStats();renderErrors();
}
function gradeAdaptive(grade){if(!activeAdaptive)return;if(grade<=1){pendingGrade={item:activeAdaptive,grade};openReasonDialog();return}applyGrade(activeAdaptive,grade);pickAdaptive()}
function openReasonDialog(){const d=$('#reasonDialog');$('#reasonButtons').innerHTML=ERROR_REASONS.map(r=>`<button type="button" data-error-reason="${esc(r)}">${esc(r)}</button>`).join('');d.showModal()}

function subjects(){return [...new Set(MEMORY_ITEMS.map(i=>i.subject))]}
function chaptersFor(subject=''){const m=new Map();MEMORY_ITEMS.filter(i=>!subject||i.subject===subject).forEach(i=>{const k=rootKey(i);if(!m.has(k))m.set(k,{key:k,title:`${i.subject} · ${rootTitle(i)}`})});return [...m.values()].sort((a,b)=>a.title.localeCompare(b.title,'zh-CN'))}
function fillSelect(sel,values,allLabel='全部'){sel.innerHTML=`<option value="">${allLabel}</option>`+values.map(v=>typeof v==='string'?`<option value="${esc(v)}">${esc(v)}</option>`:`<option value="${esc(v.key)}">${esc(v.title)}</option>`).join('')}
function updateChapterSelect(subjectSel,chapterSel){fillSelect(chapterSel,chaptersFor(subjectSel.value),'请选择章节')}

function buildWhite(){const sub=$('#whiteSubject').value,key=$('#whiteChapter').value;const pool=MEMORY_ITEMS.filter(i=>(!sub||i.subject===sub)&&(!key||rootKey(i)===key));if(!pool.length){whiteState=null;renderWhite();return}const selected=pool.slice(0,Math.min(30,pool.length));whiteState={items:selected};renderWhite()}
function renderWhite(){const h=$('#whiteBoard');if(!whiteState){h.innerHTML='<div class="empty">请选择一个有内容的章节。</div>';return}const items=whiteState.items;const title=items[0]?`${items[0].subject} · ${rootTitle(items[0])}`:'本章';h.innerHTML=`<div class="white-head"><div><span>闭卷章节</span><h2>${esc(title)}</h2></div><b>${items.length}个小标题</b></div><div class="white-prompts">${items.map((i,n)=>`<span>${n+1}. ${esc(i.title)}</span>`).join('')}</div><textarea id="whiteInput" placeholder="像在白纸上默写一样，把整章能想到的定义、公式、关键词、区别和易错点写下来……"></textarea><div class="white-actions"><button id="checkWhite" class="primary">检查整章漏点</button><button data-voice-target="whiteInput" class="ghost">🎙 语音复述</button><button id="revealWhite" class="ghost">显示完整框架</button></div><div id="whiteResult"></div><div id="whiteFull" class="full-answer hidden">${items.map(i=>`<section><h3>${esc(i.title)}</h3><ul>${fullCore(i).slice(0,8).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>${itemLink(i)}</section>`).join('')}</div>`}
function checkWhite(){if(!whiteState)return;const text=$('#whiteInput').value.trim();if(!text){$('#whiteResult').innerHTML='<div class="empty">请先进行闭卷回忆。</div>';return}const norm=normalize(text),rows=whiteState.items.map(i=>{const keys=extractKeywords(i),hit=keys.filter(k=>norm.includes(normalize(k))),miss=keys.filter(k=>!norm.includes(normalize(k)));const pct=keys.length?Math.round(hit.length/keys.length*100):0;const old=recallInfo(i.id);data.recall[i.id]={attempts:(old.attempts||0)+1,misses:(old.misses||0)+miss.length,best:Math.max(old.best||0,pct),last:new Date().toLocaleString('zh-CN',{hour12:false}),lastMissing:miss};return {i,hit,miss,pct}});const avg=Math.round(rows.reduce((n,x)=>n+x.pct,0)/Math.max(1,rows.length));logEvent('white-recall','',{chapter:rootKey(rows[0]?.i||{}),coverage:avg});save();$('#whiteResult').innerHTML=`<div class="white-score"><b>${avg}%</b><span>本章关键词覆盖率</span></div><div class="white-rows">${rows.map(x=>`<details class="white-row ${x.pct>=80?'good':x.pct>=50?'mid':'bad'}"><summary><b>${esc(x.i.title)}</b><span>${x.pct}% · 漏${x.miss.length}点</span></summary><div><strong>已覆盖</strong><p>${x.hit.map(esc).join('、')||'无'}</p><strong>漏点</strong><p class="missing-text">${x.miss.map(esc).join('、')||'没有漏点'}</p></div></details>`).join('')}</div>`;renderStats()}

function firstCloze(i){const lines=[...(i.clozeLines||[]),...(i.pdfClozeLines||[])];for(const line of lines){const m=String(line).match(/\[\[([^\]]+)\]\]/);if(m)return {prompt:String(line).replace(/\[\[[^\]]+\]\]/,'________'),answer:m[1]}}return null}
function otherKeywords(i,n=3){return shuffle(MEMORY_ITEMS.filter(x=>x.id!==i.id&&x.subject===i.subject).flatMap(x=>extractKeywords(x).slice(0,2))).filter((x,k,a)=>a.indexOf(x)===k&&!extractKeywords(i).includes(x)).slice(0,n)}
function buildQuestion(i,type='random'){
  const available=['title','reverse','choice'];if(firstCloze(i))available.push('cloze');if(i.confusions?.length)available.push('contrast');available.push('judge');if(type==='random')type=shuffle(available)[0];
  if(type==='title')return {type,label:'看标题回忆',prompt:`写出“${i.title}”的核心关键词或结论。`,answer:extractKeywords(i),input:'text'};
  if(type==='reverse'){const clue=tenSecond(i);return {type,label:'看内容猜标题',prompt:clue,answer:[i.title],input:'short'}}
  if(type==='cloze'){const c=firstCloze(i);if(c)return {type,label:'填空',prompt:c.prompt,answer:[c.answer],input:'short'};return buildQuestion(i,'title')}
  if(type==='contrast'&&i.confusions?.length){const c=shuffle(i.confusions)[0];return {type,label:'易错辨析',prompt:`区分“${c[0]}”与“${c[1]}”。`,answer:[c[2]],input:'text'}}
  if(type==='judge'){
    const core=fullCore(i)[0]||tenSecond(i);const falseMode=!!i.confusions?.length&&Math.random()<.5;
    if(falseMode){const c=shuffle(i.confusions)[0];return {type,label:'判断',prompt:`判断：${c[0]}与${c[1]}在考试中可以完全互换。`,answer:['错误'],options:['正确','错误'],correct:'错误',explain:c[2]}}
    return {type,label:'判断',prompt:`判断：${core}`,answer:['正确'],options:['正确','错误'],correct:'正确',explain:core}
  }
  const correct=extractKeywords(i)[0]||i.title,choices=shuffle([correct,...otherKeywords(i,3)]);return {type:'choice',label:'选择',prompt:`以下哪一项最符合“${i.title}”的核心内容？`,answer:[correct],options:choices,correct,explain:tenSecond(i)}
}
function pickTrain(){const sub=$('#trainSubject').value,pool=MEMORY_ITEMS.filter(i=>!sub||i.subject===sub);activeTrain=shuffle(pool)[0];trainQuestion=activeTrain?buildQuestion(activeTrain,$('#trainType').value):null;renderTraining('#trainCard',activeTrain,trainQuestion,'train')}
function renderTraining(hostSel,item,q,scope){const h=$(hostSel);if(!item||!q){h.innerHTML='<div class="empty">没有可训练内容。</div>';return}const opts=q.options?`<div class="option-grid">${q.options.map(x=>`<button data-answer-option="${esc(x)}" data-scope="${scope}">${esc(x)}</button>`).join('')}</div>`:`<textarea id="${scope}Answer" placeholder="先作答，再核对……"></textarea>`;h.innerHTML=`<div class="study-meta"><span class="blue-tag">${esc(q.label)}</span><span>${esc(itemPath(item))}</span></div><h2>${esc(item.title)}</h2><div class="training-prompt">${esc(q.prompt)}</div>${opts}<div class="training-actions"><button data-check-training="${scope}" class="primary">核对答案</button><button data-voice-target="${scope}Answer" class="ghost">🎙 语音作答</button>${itemLink(item)}</div><div id="${scope}Result"></div>`}
function checkTraining(scope,selected=''){const item=scope==='train'?activeTrain:scope==='challenge'?challenge?.currentItem:mixed?.currentItem,q=scope==='train'?trainQuestion:scope==='challenge'?challenge?.currentQuestion:mixed?.currentQuestion;if(!item||!q)return;const input=selected||$(`#${scope}Answer`)?.value?.trim()||'';let ok=false,pct=0,missing=[];if(q.type==='title'||q.type==='contrast'){const keys=q.type==='title'?q.answer:extractKeywords({keywords:q.answer});const norm=normalize(input),hit=keys.filter(k=>norm.includes(normalize(k)));missing=keys.filter(k=>!norm.includes(normalize(k)));pct=keys.length?Math.round(hit.length/keys.length*100):0;ok=pct>=60}else{ok=q.answer.some(a=>normalize(input)===normalize(a)||normalize(input).includes(normalize(a)));pct=ok?100:0}const result=$(`#${scope}Result`);result.innerHTML=`<div class="answer-result ${ok?'ok':'bad'}"><b>${ok?'回答正确/基本覆盖':'需要加强'}</b><p>参考答案：${esc(q.answer.join('；'))}</p>${missing.length?`<p>漏点：${missing.map(esc).join('、')}</p>`:''}${q.explain?`<p>说明：${esc(q.explain)}</p>`:''}</div>`;logEvent('multi-train',item.id,{type:q.type,ok,coverage:pct});if(!ok){pendingGrade={item,grade:0,after:()=>advanceSession(scope,ok)};openReasonDialog()}else{applyGrade(item,2);advanceSession(scope,ok)}save()}
function advanceSession(scope,ok){if(scope==='train')return;if(scope==='challenge'){challenge.correct+=ok?1:0;challenge.index++;renderChallengeQuestion()}if(scope==='mixed'){mixed.correct+=ok?1:0;mixed.index++;renderMixedQuestion()}}

function comparisonRows(){const rows=[];const seen=new Set();MEMORY_ITEMS.forEach(i=>(i.confusions||[]).forEach(c=>{if(!c?.[0]||!c?.[1])return;const k=[c[0],c[1]].sort().join('|||');if(seen.has(k))return;seen.add(k);rows.push({item:i,a:c[0],b:c[1],diff:c[2]||'请进入原卡片查看区别。',subject:i.subject,chapter:rootTitle(i)})}));return rows}
function renderCompare(){const sub=$('#compareSubject').value,q=normalize($('#compareSearch').value),rows=comparisonRows().filter(x=>(!sub||x.subject===sub)&&(!q||normalize(`${x.a}${x.b}${x.diff}`).includes(q))).slice(0,80);$('#compareList').innerHTML=rows.length?rows.map(x=>`<article class="compare-card"><header><span>${esc(x.subject)} · ${esc(x.chapter)}</span><b>易混对比</b></header><div class="compare-head"><strong>${esc(x.a)}</strong><i>VS</i><strong>${esc(x.b)}</strong></div><p>${esc(x.diff)}</p>${itemLink(x.item,'查看对应知识点')}</article>`).join(''):'<div class="empty">没有匹配的对比卡。</div>'}

function startChallenge(){const key=$('#challengeChapter').value,stage=Number($('#challengeStage').value),pool=MEMORY_ITEMS.filter(i=>rootKey(i)===key);if(!pool.length){$('#challengeArea').innerHTML='<div class="empty">该章节没有可闯关内容。</div>';return}challenge={key,stage,items:shuffle(pool).slice(0,Math.min(10,pool.length)),index:0,correct:0,currentItem:null,currentQuestion:null};renderChallengeQuestion()}
function questionTypeForStage(stage){if(stage===1)return shuffle(['title','reverse','cloze'])[0];if(stage===2)return shuffle(['judge','choice','contrast'])[0];return 'random'}
function renderChallengeQuestion(){const h=$('#challengeArea');if(!challenge)return;if(challenge.index>=challenge.items.length){const total=challenge.items.length,pct=Math.round(challenge.correct/Math.max(1,total)*100),passed=pct>=80;data.challengeRecords[challenge.key]||={};data.challengeRecords[challenge.key][challenge.stage]={date:today(),score:pct,passed};logEvent('challenge','',{chapter:challenge.key,stage:challenge.stage,score:pct});save();h.innerHTML=`<div class="session-finish ${passed?'passed':'failed'}"><b>${pct}%</b><h2>${passed?'闯关通过':'建议再练一次'}</h2><p>答对 ${challenge.correct}/${total}。${passed?'可以进入下一关，但仍会保留间隔复习。':'低于80%，优先复习本章错因和漏点。'}</p><button id="startChallenge">再来一轮</button></div>`;return}const item=challenge.items[challenge.index];challenge.currentItem=item;challenge.currentQuestion=buildQuestion(item,questionTypeForStage(challenge.stage));h.innerHTML=`<div class="session-progress"><span>第${challenge.stage}关</span><b>${challenge.index+1}/${challenge.items.length}</b><i style="width:${challenge.index/challenge.items.length*100}%"></i></div><div id="challengeQuestion"></div>`;renderTraining('#challengeQuestion',item,challenge.currentQuestion,'challenge')}

function startMixed(){const subs=$$('.mixed-settings input:checked').map(x=>x.value),count=Number($('#mixedCount').value),pool=MEMORY_ITEMS.filter(i=>subs.includes(i.subject));mixed={items:shuffle(pool).slice(0,Math.min(count,pool.length)),index:0,correct:0,currentItem:null,currentQuestion:null};renderMixedQuestion()}
function renderMixedQuestion(){const h=$('#mixedArea');if(!mixed)return;if(mixed.index>=mixed.items.length){const total=mixed.items.length,pct=Math.round(mixed.correct/Math.max(1,total)*100);logEvent('mixed-session','',{score:pct,total});save();h.innerHTML=`<div class="session-finish ${pct>=80?'passed':'failed'}"><b>${pct}%</b><h2>混合复习完成</h2><p>答对 ${mixed.correct}/${total}。错误内容已经进入薄弱队列。</p><button id="startMixed">再生成一组</button></div>`;return}const item=mixed.items[mixed.index];mixed.currentItem=item;mixed.currentQuestion=buildQuestion(item,'random');h.innerHTML=`<div class="session-progress"><span>跨学科混合</span><b>${mixed.index+1}/${mixed.items.length}</b><i style="width:${mixed.index/mixed.items.length*100}%"></i></div><div id="mixedQuestion"></div>`;renderTraining('#mixedQuestion',item,mixed.currentQuestion,'mixed')}

function relatedItems(i){const ids=uniq([...(i.relatedNoteIds||[]),...(i.relatedKnowledgeIds||[])]),direct=ids.map(id=>ITEM_BY_ID.get(id)).filter(Boolean);const same=ITEMS.filter(x=>x.id!==i.id&&x.subject===i.subject&&rootKey(x)===rootKey(i)&&(x.category===i.category||String(x.title).includes(i.title)||String(i.title).includes(x.title))).slice(0,5);return uniq([...direct,...same].map(x=>x.id)).map(id=>ITEM_BY_ID.get(id)).filter(Boolean)}
function renderErrors(filter=''){const counts={};Object.values(data.errorReasons||{}).forEach(m=>Object.entries(m).forEach(([k,v])=>counts[k]=Number(counts[k]||0)+Number(v||0)));const sum=$('#errorSummary');if(sum)sum.innerHTML=ERROR_REASONS.map(r=>`<button data-error-filter="${esc(r)}" class="${filter===r?'active':''}"><span>${esc(r)}</span><b>${counts[r]||0}</b></button>`).join('');const rows=MEMORY_ITEMS.filter(i=>errorCount(i.id)>0||st(i.id).wrong).filter(i=>!filter||Number(data.errorReasons?.[i.id]?.[filter]||0)>0).sort((a,b)=>errorCount(b.id)-errorCount(a.id));const host=$('#errorItems');if(!host)return;host.innerHTML=rows.length?rows.map(i=>{const reasons=Object.entries(data.errorReasons?.[i.id]||{}).sort((a,b)=>b[1]-a[1]);const rel=relatedItems(i);return `<article class="error-card"><header><div><span>${esc(itemPath(i))}</span><h3>${esc(i.title)}</h3></div><b>${errorCount(i.id)}次</b></header><div class="error-reasons">${reasons.map(([r,n])=>`<span>${esc(r)} ${n}</span>`).join('')||'<span>仅标记为错题</span>'}</div><section><strong>反向关联</strong><div class="related-links">${rel.map(x=>`<a href="./${isNote(x)?'notes.html':'index.html'}?${isNote(x)?'note':'item'}=${encodeURIComponent(x.id)}">${isNote(x)?'课堂笔记':'知识点/题目'}：${esc(x.title)}</a>`).join('')||'<span>暂无明确关联，可按同章复习。</span>'}</div></section>${itemLink(i,'返回原题/知识点')}</article>`}).join(''):'<div class="empty">目前还没有错因记录。</div>'}

function eventsOn(date){return data.eventLog.filter(e=>e.date===date)}
function renderQuick(){const p=ensureDailyPlan(),todayIds=uniq([...p.newIds,...eventsOn(today()).map(e=>e.itemId)]).filter(Boolean).map(id=>MEMORY_BY_ID.get(id)).filter(Boolean).slice(0,12),yIds=uniq(eventsOn(yesterday()).map(e=>e.itemId)).filter(Boolean).map(id=>MEMORY_BY_ID.get(id)).filter(Boolean).slice(0,12);const list=(arr,type)=>arr.length?arr.map(i=>`<article><span class="${type}">${type==='bed'?'睡前速记':'次日检查'}</span><b>${esc(i.title)}</b><p>${esc(tenSecond(i))}</p><div>${extractKeywords(i).slice(0,5).map(x=>`<em>${esc(x)}</em>`).join('')}</div><button data-study-item="${esc(i.id)}" data-study-origin="${type}">开始回忆</button></article>`).join(''):'<div class="empty">暂无对应内容。</div>';$('#bedtimeList').innerHTML=list(todayIds,'bed');$('#nextdayList').innerHTML=list(yIds,'next')}

function renderWeekly(){const now=Date.now(),start=now-7*86400000,events=data.eventLog.filter(e=>eventTime(e)>=start),reviews=events.filter(e=>e.type==='review'),recalls=events.filter(e=>e.type==='white-recall'||e.type==='multi-train'),challenges=events.filter(e=>e.type==='challenge'),itemCounts={};events.forEach(e=>{if(e.itemId)itemCounts[e.itemId]=Number(itemCounts[e.itemId]||0)+1});const weak=MEMORY_ITEMS.map(i=>({i,score:weakScore(i)+Number(itemCounts[i.id]||0)})).filter(x=>x.score>2).sort((a,b)=>b.score-a.score).slice(0,10);const reasonCounts={};Object.values(data.errorReasons||{}).forEach(m=>Object.entries(m).forEach(([r,n])=>reasonCounts[r]=Number(reasonCounts[r]||0)+Number(n||0)));const topReasons=Object.entries(reasonCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);const subjects={};events.forEach(e=>{const i=ITEM_BY_ID.get(e.itemId);if(i)subjects[i.subject]=Number(subjects[i.subject]||0)+1});weeklyText=[`最近7天复习报告（${new Date(start).toLocaleDateString('zh-CN')}—${new Date(now).toLocaleDateString('zh-CN')}）`,`有效复习：${reviews.length}次`,`主动回忆/训练：${recalls.length}次`,`章节闯关：${challenges.length}次`,`最常见错因：${topReasons.map(x=>`${x[0]}${x[1]}次`).join('、')||'暂无'}`,`下周优先：${weak.map(x=>x.i.title).join('、')||'暂无明显薄弱项'}`].join('\n');$('#weeklyReport').innerHTML=`<div class="weekly-cards"><article><span>有效复习</span><b>${reviews.length}</b></article><article><span>主动回忆/训练</span><b>${recalls.length}</b></article><article><span>章节闯关</span><b>${challenges.length}</b></article><article><span>本周涉及知识点</span><b>${Object.keys(itemCounts).length}</b></article></div><section><h3>各科学习活动</h3><div class="subject-bars">${Object.entries(subjects).map(([s,n])=>`<div><span>${esc(s)}</span><i style="width:${Math.min(100,n/Math.max(1,events.length)*100)}%"></i><b>${n}</b></div>`).join('')||'<p>暂无活动记录。</p>'}</div></section><section><h3>最常见错因</h3><div class="reason-cloud">${topReasons.map(([r,n])=>`<span>${esc(r)} · ${n}次</span>`).join('')||'<span>暂无错因记录</span>'}</div></section><section><h3>下周优先复习清单</h3><ol>${weak.map(x=>`<li><a href="./index.html?item=${encodeURIComponent(x.i.id)}">${esc(x.i.title)}</a><span>薄弱值 ${x.score} · ${esc(itemPath(x.i))}</span></li>`).join('')||'<li>暂无明显薄弱项，继续完成每日计划。</li>'}</ol></section>`}

function renderWeak(){const rows=MEMORY_ITEMS.map(i=>({i,score:weakScore(i)})).filter(x=>x.score>=3).sort((a,b)=>b.score-a.score),chapters=new Map();rows.forEach(x=>{const ck=rootKey(x.i),ch=chapters.get(ck)||{title:`${x.i.subject} · ${rootTitle(x.i)}`,groups:new Map(),count:0};const g=x.i.category||'未分类',arr=ch.groups.get(g)||[];arr.push(x);ch.groups.set(g,arr);ch.count++;chapters.set(ck,ch)});$('#weakMap').innerHTML=chapters.size?[...chapters.values()].map(ch=>`<details class="weak-chapter"><summary><b>${esc(ch.title)}</b><span>${ch.count}个薄弱内容</span></summary><div class="weak-groups">${[...ch.groups.entries()].map(([g,arr])=>`<section class="weak-group"><h3>${esc(g)}</h3><div class="weak-items">${arr.map(x=>`<a class="weak-item" href="./index.html?item=${encodeURIComponent(x.i.id)}"><b>${esc(x.i.title)}</b><em>薄弱值 ${x.score}</em></a>`).join('')}</div></section>`).join('')}</div></details>`).join(''):'<div class="empty">暂无明显薄弱内容。</div>'}

function startVoice(targetId){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){alert('当前浏览器不支持语音识别，请使用最新版Chrome或Edge，也可以直接输入。');return}if(recognition){recognition.stop();recognition=null}const target=document.getElementById(targetId);if(!target){alert('当前题型不需要语音输入。');return}recognition=new SR();recognition.lang='zh-CN';recognition.continuous=true;recognition.interimResults=true;let finalText=target.value||'';recognition.onresult=e=>{let interim='';for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0].transcript;if(e.results[i].isFinal)finalText+=(finalText?' ':'')+t;else interim+=t}target.value=finalText+(interim?` ${interim}`:'')};recognition.onerror=()=>{recognition=null};recognition.onend=()=>{recognition=null};recognition.start();target.focus()}
function switchMode(next){mode=next;$$('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===next));$$('[data-panel]').forEach(p=>p.classList.toggle('active',p.dataset.panel===next));if(next==='daily')renderDaily();if(next==='adaptive'&&!activeAdaptive)pickAdaptive();if(next==='white'&&!whiteState)buildWhite();if(next==='train'&&!activeTrain)pickTrain();if(next==='compare')renderCompare();if(next==='errors')renderErrors();if(next==='quick')renderQuick();if(next==='weekly')renderWeekly();if(next==='weak')renderWeak();window.scrollTo({top:0,behavior:'smooth'})}

function initFilters(){const subs=subjects();fillSelect($('#whiteSubject'),subs,'全部学科');fillSelect($('#trainSubject'),subs,'全部学科');fillSelect($('#compareSubject'),subs,'全部学科');fillSelect($('#challengeSubject'),subs,'请选择学科');updateChapterSelect($('#whiteSubject'),$('#whiteChapter'));updateChapterSelect($('#challengeSubject'),$('#challengeChapter'))}

document.addEventListener('click',e=>{
  const m=e.target.closest('[data-mode]');if(m){switchMode(m.dataset.mode);return}
  const j=e.target.closest('[data-jump]');if(j){e.preventDefault();switchMode(j.dataset.jump);return}
  const study=e.target.closest('[data-study-item]');if(study){activeAdaptive=MEMORY_BY_ID.get(study.dataset.studyItem);switchMode('adaptive');renderAdaptive();return}
  const level=e.target.closest('[data-level]');if(level&&activeAdaptive){renderAdaptive(level.dataset.level);return}
  const grade=e.target.closest('[data-grade]');if(grade){gradeAdaptive(Number(grade.dataset.grade));return}
  const reason=e.target.closest('[data-error-reason]');if(reason&&pendingGrade){const {item,grade,after}=pendingGrade;applyGrade(item,grade,reason.dataset.errorReason);pendingGrade=null;$('#reasonDialog').close();if(after)after();else pickAdaptive();return}
  const voice=e.target.closest('[data-voice-target]');if(voice){startVoice(voice.dataset.voiceTarget);return}
  const opt=e.target.closest('[data-answer-option]');if(opt){opt.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('selected'));opt.classList.add('selected');checkTraining(opt.dataset.scope,opt.dataset.answerOption);return}
  const check=e.target.closest('[data-check-training]');if(check){checkTraining(check.dataset.checkTraining);return}
  const ef=e.target.closest('[data-error-filter]');if(ef){renderErrors(ef.dataset.errorFilter);return}
  if(e.target.id==='rebuildPlan'){if(confirm('重新生成今天的必背和复习清单？已经完成的今日记录也会重排。')){ensureDailyPlan(true);renderDaily();renderStats()}return}
  if(e.target.id==='changeQuota'){const n=Number(prompt('每天安排多少个新知识点？建议15—25个。',data.settings.dailyNewQuota));if(n>=1&&n<=80){data.settings.dailyNewQuota=n;ensureDailyPlan(true);save();renderDaily()}return}
  if(e.target.id==='nextAdaptive'){pickAdaptive();return}
  if(e.target.id==='newWhite'){buildWhite();return}
  if(e.target.id==='checkWhite'){checkWhite();return}
  if(e.target.id==='revealWhite'){$('#whiteFull').classList.toggle('hidden');return}
  if(e.target.id==='nextTrain'){pickTrain();return}
  if(e.target.id==='randomCompare'){const rows=$$('#compareList .compare-card');if(rows.length)rows[Math.floor(Math.random()*rows.length)].scrollIntoView({behavior:'smooth',block:'center'});return}
  if(e.target.id==='startChallenge'){startChallenge();return}
  if(e.target.id==='startMixed'){startMixed();return}
  if(e.target.id==='clearErrorFilter'){renderErrors();return}
  if(e.target.id==='copyWeekly'){navigator.clipboard?.writeText(weeklyText).then(()=>alert('周报告已复制。'));return}
  if(e.target.id==='expandWeak'){$$('#weakMap details').forEach(d=>d.open=true);return}
});

$('#whiteSubject').addEventListener('change',()=>{updateChapterSelect($('#whiteSubject'),$('#whiteChapter'));buildWhite()});
$('#whiteChapter').addEventListener('change',buildWhite);
$('#trainSubject').addEventListener('change',pickTrain);$('#trainType').addEventListener('change',pickTrain);
$('#compareSubject').addEventListener('change',renderCompare);$('#compareSearch').addEventListener('input',renderCompare);
$('#challengeSubject').addEventListener('change',()=>updateChapterSelect($('#challengeSubject'),$('#challengeChapter')));

$('#reasonDialog').addEventListener('close',()=>{if(pendingGrade){const {item,grade,after}=pendingGrade;pendingGrade=null;applyGrade(item,grade);if(after)after();else pickAdaptive()}});
ensureDailyPlan();initFilters();if($('#whiteChapter').options.length>1)$('#whiteChapter').selectedIndex=1;if($('#challengeSubject').options.length>1){$('#challengeSubject').selectedIndex=1;updateChapterSelect($('#challengeSubject'),$('#challengeChapter'));if($('#challengeChapter').options.length>1)$('#challengeChapter').selectedIndex=1}buildWhite();renderTodayCommand();renderStats();renderDaily();renderErrors();
const params=new URLSearchParams(location.search),preferred=params.get('item')||'';if(preferred&&MEMORY_BY_ID.has(preferred)){activeAdaptive=MEMORY_BY_ID.get(preferred);switchMode('adaptive');renderAdaptive()}
