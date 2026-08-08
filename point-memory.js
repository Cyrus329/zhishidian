(()=>{
'use strict';
const POINTS=Array.isArray(window.KNOWLEDGE_MEMORY_DATA)?window.KNOWLEDGE_MEMORY_DATA:[];
const STORE='zsb-knowledge-memory-b003';
const LEGACY_STORE='zsb-knowledge-memory-b002';
const RESET='zsb-knowledge-memory-b002-reset-done';
const REVIEW_STEPS=[
 {label:'20分钟',short:'20分',ms:20*60*1000},
 {label:'1小时',short:'1时',ms:60*60*1000},
 {label:'9小时',short:'9时',ms:9*60*60*1000},
 {label:'1天',short:'1天',ms:24*60*60*1000},
 {label:'2天',short:'2天',ms:2*24*60*60*1000},
 {label:'6天',short:'6天',ms:6*24*60*60*1000},
 {label:'31天',short:'31天',ms:31*24*60*60*1000}
];
const FUZZY_DELAY={label:'8分钟',ms:8*60*1000};
const FORGOT_DELAY={label:'2分钟',ms:2*60*1000};
const SCHEDULE_VERSION='word-v70-20m-1h-9h';
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SUBSCRIPT_MAP={'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9','₊':'+','₋':'−','₌':'=','₍':'(','₎':')','ₐ':'a','ₑ':'e','ₕ':'h','ᵢ':'i','ⱼ':'j','ₖ':'k','ₗ':'l','ₘ':'m','ₙ':'n','ₒ':'o','ₚ':'p','ᵣ':'r','ₛ':'s','ₜ':'t','ᵤ':'u','ᵥ':'v','ₓ':'x'};
const SUPERSCRIPT_MAP={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁺':'+','⁻':'−','⁼':'=','⁽':'(','⁾':')','ⁿ':'n','ⁱ':'i'};
function convertSubscripts(html){return html.replace(/([₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜᵤᵥₓ]+)/g,seq=>`<sub>${[...seq].map(ch=>SUBSCRIPT_MAP[ch]||ch).join('')}</sub>`) }
function convertSuperscripts(html){return html.replace(/([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿⁱ]+)/g,seq=>`<sup>${[...seq].map(ch=>SUPERSCRIPT_MAP[ch]||ch).join('')}</sup>`) }
function formatEscapedMathHtml(html){
 html=html.replace(/全体实数\s*R/g,'全体实数 ℝ').replace(/∈\s*R/g,'∈ ℝ').replace(/∈\s*Z/g,'∈ ℤ').replace(/R/g,'ℝ').replace(/Z/g,'ℤ');
 html=html.replace(/√\[([^\]]+)\]\{([^{}]+)\}/g,(_,idx,rad)=>`<span class="math-root"><sup class="root-index">${formatEscapedMathHtml(idx)}</sup><span class="root-sign">√</span><span class="root-bar">${formatEscapedMathHtml(rad)}</span></span>`);
 html=html.replace(/√\{([^{}]+)\}/g,(_,rad)=>`<span class="math-root"><span class="root-sign">√</span><span class="root-bar">${formatEscapedMathHtml(rad)}</span></span>`);
 html=convertSubscripts(html);
 html=convertSuperscripts(html);
 html=html.replace(/((?:π|\d+|[a-zA-Z]))\/((?:π|\d+|[a-zA-Z]))/g,'<span class="math-frac"><span class="num">$1</span><span class="den">$2</span></span>');
 html=html.replace(/([A-Za-z0-9πℝℤxfgkny\)\]])([=≠≤≥<>])([A-Za-z0-9πℝℤxfgkny√\(\[])/g,'$1 <span class="math-op">$2</span> $3');
 html=html.replace(/\+/g,' + ').replace(/−/g,' − ').replace(/\s{2,}/g,' ');
 return html;
}
function prettyTextHtml(value){return `<span class="math-inline">${formatEscapedMathHtml(esc(value))}</span>`}
const todayKey=()=>new Date().toISOString().slice(0,10);
const nowIso=()=>new Date().toISOString();
const fmtTime=sec=>{sec=Math.max(0,Math.floor(sec||0));if(sec<60)return `${sec}秒`;const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60);return h?`${h}小时${m}分`:`${m}分`};
const fmtClock=sec=>`${Math.floor(sec/60)}:${String(Math.floor(sec%60)).padStart(2,'0')}`;
const fmtDateTime=iso=>{if(!iso)return '—';const d=new Date(iso);return Number.isNaN(d.getTime())?'—':d.toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false})};
const unique=a=>[...new Set(a.filter(Boolean))];
function emptyState(){return{version:3,scheduleVersion:SCHEDULE_VERSION,progress:{},currentId:POINTS[0]?.id||'',history:[],settings:{tier:'core',subject:'',day:'',chapter:'',scope:'new',practice:'cloze'},time:{totalSeconds:0,todayDate:todayKey(),todaySeconds:0,bySubject:{},byDay:{}},daily:{},updatedAt:nowIso()}}
function oneTimeReset(){
 if(localStorage.getItem(RESET)==='1')return;
 const keys=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i)||'';if(/word|vocab|english-folder|mobile-focus|smart-vocab|zsb-knowledge-point-memory-b001/i.test(k))keys.push(k)}
 keys.forEach(k=>localStorage.removeItem(k));
 try{indexedDB.deleteDatabase('word-memory-trainer-mobile:v1')}catch{}
 localStorage.setItem(RESET,'1');
 localStorage.setItem('zsb-knowledge-memory-b002-reset-time',nowIso());
}
oneTimeReset();
let state=emptyState();
try{const raw=localStorage.getItem(STORE)||localStorage.getItem(LEGACY_STORE)||'{}';state={...state,...JSON.parse(raw)}}catch{}
state.progress=state.progress||{};state.history=state.history||[];state.settings={...emptyState().settings,...(state.settings||{})};state.time={...emptyState().time,...(state.time||{})};state.time.bySubject=state.time.bySubject||{};state.time.byDay=state.time.byDay||{};state.daily=state.daily||{};
function migrateReviewSchedule(){
 if(state.scheduleVersion===SCHEDULE_VERSION)return;
 Object.values(state.progress).forEach(pr=>{
  if(!pr||typeof pr!=='object')return;
  if(pr.status==='new'&&!pr.nextDue){pr.stage=-1;return}
  const last=pr.lastAt?new Date(pr.lastAt).getTime():Date.now();
  if(pr.status==='forgot'){pr.stage=-1;pr.nextDue=new Date(last+FORGOT_DELAY.ms).toISOString()}
  else if(pr.status==='fuzzy'){pr.stage=Math.max(0,Math.min(REVIEW_STEPS.length-1,(Number.isInteger(pr.stage)?pr.stage:1)-1));pr.nextDue=new Date(last+FUZZY_DELAY.ms).toISOString()}
  else{pr.stage=Math.max(0,Math.min(REVIEW_STEPS.length-1,(Number.isInteger(pr.stage)?pr.stage:1)-1));pr.nextDue=new Date(last+REVIEW_STEPS[pr.stage].ms).toISOString()}
 });
 state.version=3;state.scheduleVersion=SCHEDULE_VERSION;
}
migrateReviewSchedule();
if(state.time.todayDate!==todayKey()){state.time.todayDate=todayKey();state.time.todaySeconds=0}
let queue=[],index=0,customQueue=null,browserPage=1,revealed=false,typedChecked=false,typedCorrect=false,sessionSeconds=0,sessionActions=0,lastActivity=Date.now(),activeModule='timeline';
function save(){state.updatedAt=nowIso();try{localStorage.setItem(STORE,JSON.stringify(state))}catch(e){console.warn(e)}}
function progress(id){return state.progress[id]||{status:'new',stage:-1,remember:0,fuzzy:0,forgot:0,attempts:0,streak:0,lastAt:'',nextDue:'',updatedAt:''}}
function tierAllowed(p,tier=state.settings.tier){return tier==='all'||(tier==='core'&&p.tier==='core')||(tier==='core+extended'&&(p.tier==='core'||p.tier==='extended'))}
function baseFiltered(){return POINTS.filter(p=>tierAllowed(p)&&(!state.settings.subject||p.subject===state.settings.subject)&&(!state.settings.day||String(p.importDay)===String(state.settings.day))&&(!state.settings.chapter||p.chapter===state.settings.chapter))}
function isDue(p){const pr=progress(p.id);return pr.status!=='new'&&(!pr.nextDue||new Date(pr.nextDue).getTime()<=Date.now())}
function buildQueue(preserve=true){
 const oldId=preserve?queue[index]?.id||state.currentId:'';
 const base=baseFiltered();const scope=state.settings.scope;
 if(customQueue){queue=customQueue.map(id=>POINTS.find(p=>p.id===id)).filter(Boolean)}
 else if(scope==='new')queue=base.filter(p=>progress(p.id).status==='new');
 else if(scope==='wrong')queue=base.filter(p=>['forgot','fuzzy'].includes(progress(p.id).status));
 else if(scope==='due')queue=base.filter(isDue);
 else queue=base;
 index=Math.max(0,queue.findIndex(p=>p.id===oldId));if(index<0)index=0;
 renderAll();
}
function current(){return queue[index]||null}
function parsePrompt(s){
 const parts=String(s||'').split(/(\{\{.*?\}\})/g);return parts.map(part=>{const m=part.match(/^\{\{(.*?)\}\}$/);return m?`<span class="blank" title="${esc(m[1])}">${prettyTextHtml(m[1])}</span>`:prettyTextHtml(part)}).join('')
}
function answerDetails(p){
 const exam=(p.examRefine||[]).slice(0,3),conf=(p.confusions||[]).slice(0,2),explain=(p.basicExplain||[]).slice(0,2);
 const extra=[exam.length?`<details><summary>考试这样考</summary><ul>${exam.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details>`:'',conf.length?`<details><summary>易混点</summary><ul>${conf.map(x=>`<li>${esc(Array.isArray(x)?x.join('｜'):x)}</li>`).join('')}</ul></details>`:'',explain.length?`<details><summary>补充说明</summary><ul>${explain.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></details>`:''].join('');
 return `<div class="answer-main">${prettyTextHtml(p.point)}</div><div class="answer-extra"><b>关键词：</b>${prettyTextHtml((p.clozeAnswers||[]).join('、')||p.shortHint||'—')}<br><b>来源：</b>${esc(p.importLabel)}｜${esc(p.sourceTitle)}${extra}</div>`
}
function reviewPlanHtml(pr){
 const stage=Number.isInteger(pr.stage)?pr.stage:-1;
 const next=pr.nextDue?`下次复习：${fmtDateTime(pr.nextDue)}`:'首次记住后：20分钟';
 const special=pr.status==='forgot'?'忘了后2分钟回炉':pr.status==='fuzzy'?'模糊后8分钟回炉':'';
 return `<div class="review-plan"><div class="review-plan-head"><b>复习阶段</b><span>${esc(special||next)}</span></div><div class="review-steps">${REVIEW_STEPS.map((step,i)=>`<span class="${i<stage?'done ':''}${i===stage?'current':''}">${step.short}</span>`).join('')}</div></div>`
}
function cardHtml(p,focus=false){
 if(!p)return `<div class="empty-card"><h3>当前范围没有需要学习的知识点</h3><p>可以切换到“新知识点”“全部抽查”，或放宽背诵级别与时间线筛选。</p></div>`;
 const pr=progress(p.id),prevId=state.history.at(-1)?.id,prev=POINTS.find(x=>x.id===prevId);
 const practice=state.settings.practice;
 const prompt=practice==='recall'?`<div class="recall-prompt"><small>请完整回忆</small><br>${esc(p.sourceTitle)}<br><span style="font-size:14px;color:#6c778d">${esc(p.chapter)}</span></div>`:`<div class="recall-prompt math-card-prompt">${parsePrompt(p.clozePrompt)}</div>`;
 const input=practice==='type'?`<div class="type-area open"><input class="answer-input" autocomplete="off" placeholder="填写挖空关键词，按 Enter 检查"><button class="check-answer">检查</button></div><div class="type-result"></div>`:'';
 return `<div class="previous-point">${prev?`上一个：${esc(prev.sourceTitle)}｜${prev?formatEscapedMathHtml(esc(prev.point)):''}`:'从第一个知识点开始'}</div>
 <div class="card-meta"><span class="tag ${p.tier==='core'?'core':''}">${esc(p.tierLabel)}</span><span class="tag">${esc(p.subject)}</span><span class="tag">${esc(p.importLabel)}</span><span class="tag">${esc(p.recallType==='formula'?'公式/规则':p.recallType==='list'?'列表记忆':p.recallType==='contrast'?'辨析':'事实结论')}</span><span class="card-counter">${index+1} / ${queue.length}</span></div>
 <h2 class="card-title">${esc(p.sourceTitle)}</h2><div class="card-subtitle">${esc(p.chapter)}</div>
 <div class="recall-box">${prompt}</div>${input}
 <button class="reveal-button">显示答案（Shift）</button>
 <div class="answer-box">${answerDetails(p)}</div>
 ${reviewPlanHtml(pr)}
 <div class="grade-row"><button class="forgot" data-grade="forgot">忘了 →</button><button class="fuzzy" data-grade="fuzzy">模糊 ↓</button><button class="remember" data-grade="remember">记住 ←</button></div>`
}
function renderCard(){
 const p=current();state.currentId=p?.id||state.currentId;save();revealed=false;typedChecked=false;typedCorrect=false;
 $('#activeCard').innerHTML=cardHtml(p,false);$('#focusCard').innerHTML=cardHtml(p,true);
 $('#scopeChip').textContent=state.settings.scope==='due'?'到期复习':state.settings.scope==='new'?'新知识点':state.settings.scope==='wrong'?'错点回炉':customQueue?'临时复习':'全部抽查';
 $('#focusMeta').textContent=p?`${p.importLabel} · ${p.subject}`:'';$('#focusCount').textContent=p?`${index+1}/${queue.length}`:'0/0';$('#focusProgressBar').style.width=`${queue.length?((index+1)/queue.length*100):0}%`;
 updateRangeSummary();
}
function reveal(){revealed=true;$$('.answer-box').forEach(x=>x.classList.add('open'));$$('.reveal-button').forEach(x=>x.classList.add('hidden'));activity()}
function normalizeAnswer(s){return String(s||'').toLowerCase().replace(/[\s，,。；;：:"'“”‘’（）()\[\]【】]/g,'')}
function checkTyped(input){const p=current();if(!p)return;const val=normalizeAnswer(input.value);const answers=(p.clozeAnswers||[]).map(normalizeAnswer).filter(Boolean);typedCorrect=!!val&&answers.every(a=>val.includes(a)||a.includes(val));typedChecked=true;$$('.type-result').forEach(x=>{x.textContent=typedCorrect?'正确，第二次 Enter 记住':'还不完整，第二次 Enter 按“忘了”处理';x.style.color=typedCorrect?'#15803d':'#cf2f3f'});if(typedCorrect)reveal();activity()}
function scheduleFor(status,old,now=Date.now()){
 const oldStage=Number.isInteger(old.stage)?old.stage:-1;
 if(status==='remember'){const stage=Math.min(oldStage+1,REVIEW_STEPS.length-1),step=REVIEW_STEPS[Math.max(0,stage)];return{stage:Math.max(0,stage),nextDue:new Date(now+step.ms).toISOString(),streak:(old.streak||0)+1,scheduleLabel:step.label}}
 if(status==='fuzzy'){const stage=Math.max(0,oldStage);return{stage,nextDue:new Date(now+FUZZY_DELAY.ms).toISOString(),streak:0,scheduleLabel:FUZZY_DELAY.label}}
 return{stage:-1,nextDue:new Date(now+FORGOT_DELAY.ms).toISOString(),streak:0,scheduleLabel:FORGOT_DELAY.label}
}
function daily(){const k=todayKey();return state.daily[k]||(state.daily[k]={ids:[],actions:0,remember:0,fuzzy:0,forgot:0})}
function grade(status){
 const p=current();if(!p)return;const old=progress(p.id),at=nowIso(),sch=scheduleFor(status,old);state.progress[p.id]={...old,...sch,status,lastAt:at,updatedAt:at,attempts:(old.attempts||0)+1,[status]:(old[status]||0)+1};
 state.history.push({id:p.id,status,at,nextDue:sch.nextDue,scheduleLabel:sch.scheduleLabel});state.history=state.history.slice(-100);const d=daily();d.actions++;d[status]++;if(!d.ids.includes(p.id))d.ids.push(p.id);sessionActions++;
 if(status==='forgot'){
   const insert=Math.min(queue.length,index+4);if(!queue.slice(index+1,index+6).some(x=>x.id===p.id))queue.splice(insert,0,p);
 }
 save();index++;if(index>=queue.length)index=0;renderAll();activity();
}
function undo(){if(!state.history.length)return;const last=state.history.pop(),p=POINTS.find(x=>x.id===last.id);if(p){delete state.progress[last.id];const earlier=[...state.history].reverse().find(h=>h.id===last.id);if(earlier){const old=progress(last.id);state.progress[last.id]={...old,status:earlier.status,lastAt:earlier.at,updatedAt:earlier.at}}const pos=queue.findIndex(x=>x.id===last.id);if(pos>=0)index=pos}save();renderAll()}
function updateStats(){
 const core=POINTS.filter(p=>p.tier==='core').length;$('#coreCount').textContent=core;$('#allCount').textContent=`全部资料点 ${POINTS.length}`;$('#totalStudyTime').textContent=fmtTime(state.time.totalSeconds);$('#todayStudyTime').textContent=`今日 ${fmtTime(state.time.todaySeconds)}`;
 $('#dueCount').textContent=POINTS.filter(p=>tierAllowed(p,'core')&&isDue(p)).length;const d=daily();$('#todayDone').textContent=d.ids.length;$('#todayAccuracy').textContent=`记住反馈 ${d.actions?Math.round(d.remember/d.actions*100):0}%`;$('#sessionTime').textContent=fmtClock(sessionSeconds);$('#sessionActions').textContent=`已完成 ${sessionActions} 条`;
}
function updateRangeSummary(){const base=baseFiltered(),studied=base.filter(p=>progress(p.id).status!=='new').length,due=base.filter(isDue).length;$('#rangeSummary').innerHTML=`当前范围 <b>${base.length}</b> 条<br>已学习 <b>${studied}</b> 条｜到期 <b>${due}</b> 条<br>当前队列 <b>${queue.length}</b> 条`}
function renderTimeline(){
 const days=unique(POINTS.map(p=>p.importDay)).sort((a,b)=>a-b);$('#timelineGrid').innerHTML=days.map(day=>{const all=POINTS.filter(p=>p.importDay===day),core=all.filter(p=>p.tier==='core'),done=core.filter(p=>progress(p.id).status!=='new').length,due=core.filter(isDue).length,label=all[0]?.importLabel||`第${day}天`,date=all[0]?.importDate||'',pct=core.length?Math.round(done/core.length*100):0,time=state.time.byDay[day]||0;return `<article class="timeline-card ${String(state.settings.day)===String(day)?'active':''}" data-day="${day}"><h3>${esc(label)}</h3><div class="date">${esc(date)} · 学习 ${fmtTime(time)}</div><div class="counts"><div><b>${core.length}</b><small>核心</small></div><div><b>${done}</b><small>已学</small></div><div><b>${due}</b><small>到期</small></div></div><div class="bar"><span style="width:${pct}%"></span></div></article>`}).join('')
}
function browserRows(){const q=normalizeAnswer($('#browserSearch').value),sub=$('#browserSubject').value,tier=$('#browserTier').value,status=$('#browserStatus').value,day=$('#browserDay').value;return POINTS.filter(p=>(!q||normalizeAnswer([p.sourceTitle,p.point,p.chapter,p.category,p.shortHint].join(' ')).includes(q))&&(!sub||p.subject===sub)&&(!tier||p.tier===tier)&&(!status||progress(p.id).status===status)&&(!day||String(p.importDay)===day))}
function renderBrowser(){const rows=browserRows(),pages=Math.max(1,Math.ceil(rows.length/100));browserPage=Math.min(Math.max(1,browserPage),pages);const slice=rows.slice((browserPage-1)*100,browserPage*100);$('#browserCount').textContent=`共 ${rows.length} 条，按资料原始顺序`;$('#pointList').innerHTML=slice.map(p=>{const st=progress(p.id).status;return `<article class="point-row ${p.tier==='core'?'core':''} status-${st}" data-point-id="${p.id}"><div><b>#${p.order}</b></div><div><h3>${esc(p.sourceTitle)} · ${esc(p.tierLabel)}</h3><p>${prettyTextHtml(p.point)}</p></div><small>${esc(p.importLabel)}<br>${st==='new'?'未学习':st==='remember'?'记住':st==='fuzzy'?'模糊':'忘了'}</small></article>`}).join('')||'<div class="empty-card">没有匹配内容</div>';$('#pageInfo').textContent=`${browserPage} / ${pages}`}
function progressLine(name,list,time){const done=list.filter(p=>progress(p.id).status!=='new').length,pct=list.length?Math.round(done/list.length*100):0;return `<div class="progress-line"><span>${esc(name)}</span><div class="mini-bar"><span style="width:${pct}%"></span></div><small>${done}/${list.length} · ${fmtTime(time)}</small></div>`}
function renderProgress(){const core=POINTS.filter(p=>p.tier==='core'),remember=core.filter(p=>progress(p.id).status==='remember').length,fuzzy=core.filter(p=>progress(p.id).status==='fuzzy').length,forgot=core.filter(p=>progress(p.id).status==='forgot').length;$('#progressCards').innerHTML=[['核心已学习',core.filter(p=>progress(p.id).status!=='new').length],['已经记住',remember],['仍然模糊',fuzzy],['当前忘了',forgot]].map(([a,b])=>`<div class="progress-summary"><b>${b}</b><span>${a}</span></div>`).join('');$('#subjectProgress').innerHTML=unique(core.map(p=>p.subject)).map(s=>progressLine(s,core.filter(p=>p.subject===s),state.time.bySubject[s]||0)).join('');$('#dayProgress').innerHTML=unique(core.map(p=>p.importDay)).sort((a,b)=>a-b).map(d=>progressLine(`第${d}天`,core.filter(p=>p.importDay===d),state.time.byDay[d]||0)).join('')}
function renderAll(){updateStats();renderCard();renderTimeline();if(activeModule==='browser')renderBrowser();if(activeModule==='progress')renderProgress()}
function setModule(name){activeModule=name;$$('[data-section]').forEach(x=>x.classList.toggle('active',x.dataset.section===name));$$('[data-module]').forEach(x=>x.classList.toggle('active',x.dataset.module===name));if(name==='browser')renderBrowser();if(name==='progress')renderProgress();window.scrollTo({top:0,behavior:'smooth'})}
function fillFilters(){
 const subjects=unique(POINTS.map(p=>p.subject)),days=unique(POINTS.map(p=>p.importDay)).sort((a,b)=>a-b);
 const subOpts='<option value="">全部学科</option>'+subjects.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');$('#subjectFilter').innerHTML=subOpts;$('#browserSubject').innerHTML=subOpts;
 const dayOpts='<option value="">全部天数</option>'+days.map(d=>{const p=POINTS.find(x=>x.importDay===d);return `<option value="${d}">${esc(p?.importLabel||`第${d}天`)}</option>`}).join('');$('#dayFilter').innerHTML=dayOpts;$('#browserDay').innerHTML=dayOpts;
 $('#tierFilter').value=state.settings.tier;$('#subjectFilter').value=state.settings.subject;$('#dayFilter').value=state.settings.day;
 fillChapters();
}
function fillChapters(){const list=POINTS.filter(p=>(!state.settings.subject||p.subject===state.settings.subject)&&(!state.settings.day||String(p.importDay)===String(state.settings.day))),opts='<option value="">全部章节</option>'+unique(list.map(p=>p.chapter)).map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');$('#chapterFilter').innerHTML=opts;$('#chapterFilter').value=state.settings.chapter;if(!$('#chapterFilter').value)state.settings.chapter=''}
function applyFilter(){state.settings.tier=$('#tierFilter').value;state.settings.subject=$('#subjectFilter').value;state.settings.day=$('#dayFilter').value;state.settings.chapter=$('#chapterFilter').value;customQueue=null;save();buildQueue(false)}
function setScope(scope){state.settings.scope=scope;customQueue=null;$$('[data-scope]').forEach(x=>x.classList.toggle('active',x.dataset.scope===scope));save();buildQueue(false)}
function setPractice(practice){state.settings.practice=practice;$$('[data-practice]').forEach(x=>x.classList.toggle('active',x.dataset.practice===practice));save();renderCard()}
function quick(minutes){const base=baseFiltered();const ranked=[...base].sort((a,b)=>{const pa=progress(a.id),pb=progress(b.id);const sa=pa.status==='forgot'?0:pa.status==='fuzzy'?1:isDue(a)?2:pa.status==='new'?3:4;const sb=pb.status==='forgot'?0:pb.status==='fuzzy'?1:isDue(b)?2:pb.status==='new'?3:4;return sa-sb||(new Date(pa.nextDue||0)-new Date(pb.nextDue||0))||a.order-b.order});customQueue=ranked.slice(0,Math.max(10,minutes*7)).map(p=>p.id);state.settings.scope='custom';index=0;save();buildQueue(false);setModule('study')}
function recent(){const ids=unique([...state.history].reverse().map(x=>x.id)).slice(0,10);customQueue=ids;state.settings.scope='custom';index=0;buildQueue(false);setModule('study')}
function openPoint(id){customQueue=[id];state.settings.scope='custom';index=0;buildQueue(false);setModule('study')}
function enterFocus(){setModule('study');$('#focusMode').hidden=false;document.body.style.overflow='hidden';renderCard()}
function exitFocus(){$('#focusMode').hidden=true;document.body.style.overflow='';}
function exportData(){const obj={type:'zsb-knowledge-memory-backup',version:3,reviewSteps:REVIEW_STEPS.map(x=>x.label),exportedAt:nowIso(),state};const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`知识点记忆备份-${todayKey()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function importData(file){const r=new FileReader();r.onload=()=>{try{const obj=JSON.parse(r.result);if(obj?.state?.progress){state={...emptyState(),...obj.state};state.settings={...emptyState().settings,...(state.settings||{})};save();location.reload()}else alert('这不是知识点记忆备份文件')}catch{alert('无法读取备份文件')}};r.readAsText(file)}
function reset(){if(!confirm('确认清空知识点进度、学习时长和时间线完成记录吗？原资料和知识点内容不会删除。'))return;state=emptyState();save();location.reload()}
function activity(){lastActivity=Date.now()}
['pointerdown','keydown','touchstart','scroll'].forEach(e=>window.addEventListener(e,activity,{passive:true}));
setInterval(()=>{$('#clockNow').textContent=new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});if(document.visibilityState==='visible'&&Date.now()-lastActivity<120000){sessionSeconds++;state.time.totalSeconds++;if(state.time.todayDate!==todayKey()){state.time.todayDate=todayKey();state.time.todaySeconds=0}state.time.todaySeconds++;const p=current();if(p){state.time.bySubject[p.subject]=(state.time.bySubject[p.subject]||0)+1;state.time.byDay[p.importDay]=(state.time.byDay[p.importDay]||0)+1}if(sessionSeconds%15===0)save();updateStats()}},1000);
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
document.addEventListener('click',e=>{
 const mod=e.target.closest('[data-module]');if(mod){e.preventDefault();setModule(mod.dataset.module)}
 const scope=e.target.closest('[data-scope]');if(scope)setScope(scope.dataset.scope);
 const practice=e.target.closest('[data-practice]');if(practice)setPractice(practice.dataset.practice);
 const quickBtn=e.target.closest('[data-quick]');if(quickBtn)quick(Number(quickBtn.dataset.quick));
 const day=e.target.closest('[data-day]');if(day){state.settings.day=day.dataset.day;$('#dayFilter').value=state.settings.day;customQueue=null;state.settings.scope='all';save();buildQueue(false);setModule('study')}
 const row=e.target.closest('[data-point-id]');if(row)openPoint(row.dataset.pointId);
 if(e.target.closest('.reveal-button'))reveal();
 const gradeBtn=e.target.closest('[data-grade]');if(gradeBtn)grade(gradeBtn.dataset.grade);
 if(e.target.closest('.check-answer')){const inp=e.target.closest('.knowledge-card')?.querySelector('.answer-input');if(inp)checkTyped(inp)}
 if(e.target.id==='recentButton')recent();if(e.target.id==='focusEntry')enterFocus();if(e.target.id==='exitFocus')exitFocus();if(e.target.id==='exportButton')exportData();if(e.target.id==='importButton')$('#importFile').click();if(e.target.id==='resetButton')reset();if(e.target.id==='prevPage'){browserPage--;renderBrowser()}if(e.target.id==='nextPage'){browserPage++;renderBrowser()}
});
document.addEventListener('keydown',e=>{
 const studyActive=activeModule==='study'||!$('#focusMode').hidden;
 const inp=e.target.closest?.('.answer-input');if(inp&&e.key==='Enter'){e.preventDefault();if(!typedChecked)checkTyped(inp);else grade(typedCorrect?'remember':'forgot');return}
 if(e.key==='Escape'&&!$('#focusMode').hidden){exitFocus();return}
 if(!studyActive)return;
 if(e.key==='Shift'){e.preventDefault();reveal()}else if(e.key==='ArrowLeft'){e.preventDefault();grade('remember')}else if(e.key==='ArrowDown'){e.preventDefault();grade('fuzzy')}else if(e.key==='ArrowRight'){e.preventDefault();grade('forgot')}else if(e.key==='Control'){e.preventDefault();undo()}
});
$('#tierFilter').addEventListener('change',applyFilter);$('#subjectFilter').addEventListener('change',()=>{state.settings.subject=$('#subjectFilter').value;fillChapters();applyFilter()});$('#dayFilter').addEventListener('change',()=>{state.settings.day=$('#dayFilter').value;fillChapters();applyFilter()});$('#chapterFilter').addEventListener('change',applyFilter);
['browserSearch','browserSubject','browserTier','browserStatus','browserDay'].forEach(id=>$('#'+id).addEventListener(id==='browserSearch'?'input':'change',()=>{browserPage=1;renderBrowser()}));
$('#importFile').addEventListener('change',e=>e.target.files[0]&&importData(e.target.files[0]));
fillFilters();$$('[data-scope]').forEach(x=>x.classList.toggle('active',x.dataset.scope===state.settings.scope));$$('[data-practice]').forEach(x=>x.classList.toggle('active',x.dataset.practice===state.settings.practice));buildQueue(false);setModule('timeline');
})();
