
const ITEMS = window.KNOWLEDGE_ITEMS || [];
const SORTED_ITEMS = [...ITEMS].sort((a,b)=>(a.order||0)-(b.order||0));
const ITEM_BY_ID = new Map(ITEMS.map(i=>[i.id,i]));
const SEARCH_CACHE = new WeakMap();
const SUBJECT_MARK = {"计算机":"计","英语":"英","数学":"数","考点必背":"必"};
const META = window.KNOWLEDGE_META || {};
const STORE = 'zsb-knowledge-v26-day1'; // 延续全新题库存储，保留v26以来的学习记录
const OLD_STORE = 'zsb-knowledge-v26-day1:legacy';
const INITIAL_STUDY = {};
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const state = {q:'', subject:'', chapter:'', chapterRootKey:'', mindmapChapterKey:'', status:'', importBatch:'', recordType:'', sourceOrg:'', contentMode:'', blockKey:'', selected:'', hideMastered:false, detailMode:true, panel:'learn', reviewMode:'today', redoMode:false, auditOnly:false, clozeModes:{}, redoAnswers:{}};
const REVIEW_INTERVALS = [1,2,4,7,15,30];
let timer = {left:25*60, running:false, handle:null};
let data = load();
let deferredPrompt=null;
function dateKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function today(){return dateKey()}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function rawItemImportRecords(i){
  const records=Array.isArray(i?.importHistory)?i.importHistory.map(x=>({...x})):[];
  const baseId=i?.importBatchId||`date-${i?.importDate||'unknown'}`;
  if(baseId&&!records.some(x=>x.id===baseId))records.push({id:baseId,day:Number(i?.importDay||0),date:i?.importDate||'',label:i?.importLabel||'',title:i?.batch||'',subject:i?.subject||'',category:i?.category||'',action:'首次建立'});
  return records.filter(x=>x&&x.id);
}
function buildImportIndex(){
  const dates=new Set();
  (META.importBatches||[]).forEach(b=>{if(b?.date)dates.add(String(b.date))});
  const rawById=new Map();
  ITEMS.forEach(i=>{
    const raw=rawItemImportRecords(i);
    rawById.set(i.id,raw);
    raw.forEach(r=>{if(r?.date)dates.add(String(r.date))});
    if(i?.importDate)dates.add(String(i.importDate));
  });
  const sortedDates=[...dates].sort((a,b)=>a.localeCompare(b));
  const dayByDate=new Map(sortedDates.map((d,idx)=>[d,idx+1]));
  const recordsById=new Map(), itemDates=new Map(), itemsByDate=new Map();
  ITEMS.forEach(i=>{
    const byDate=new Map();
    (rawById.get(i.id)||[]).forEach(r=>{
      const date=String(r.date||i?.importDate||'');
      const key=date||r.id;
      const prev=byDate.get(key);
      const day=dayByDate.get(date)||Number(r.day||i?.importDay||0);
      const normalized={...r,id:date?`date-${date}`:r.id,date,day,label:date?`第${day||1}天 · ${shortImportDate(date)}`:(r.label||'')};
      if(!prev)byDate.set(key,normalized);
      else{
        prev.action=[prev.action,normalized.action].filter(Boolean).filter((x,j,a)=>a.indexOf(x)===j).join('；');
        prev.note=[prev.note,normalized.note].filter(Boolean).filter((x,j,a)=>a.indexOf(x)===j).join('；');
      }
    });
    const records=[...byDate.values()].sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
    recordsById.set(i.id,records);
    const dateSet=new Set(records.map(r=>r.date).filter(Boolean));
    itemDates.set(i.id,dateSet);
    dateSet.forEach(date=>{
      const arr=itemsByDate.get(date)||[];
      arr.push(i);itemsByDate.set(date,arr);
    });
  });
  const grouped=new Map();
  const add=b=>{
    const date=String(b?.date||'');if(!date)return;
    const day=dayByDate.get(date)||Number(b?.day||0);
    const cur=grouped.get(date)||{id:`date-${date}`,date,day,label:`第${day||'?'}天 · ${shortImportDate(date)}`,title:'',subject:'',category:'',description:'',images:[],entries:[]};
    cur.title=cur.title||b.title||'知识点导入';
    cur.subject=cur.subject||b.subject||'';
    cur.category=cur.category||b.category||'';
    if(b.description&&!cur.description.includes(b.description))cur.description=[cur.description,b.description].filter(Boolean).join('；');
    cur.images=[...new Set([...(cur.images||[]),...(b.images||[])])];
    cur.entries=[...(cur.entries||[]),...(b.entries||[])];
    grouped.set(date,cur);
  };
  (META.importBatches||[]).forEach(add);
  ITEMS.forEach(i=>(recordsById.get(i.id)||[]).forEach(r=>add({...r,title:r.title||i.batch,subject:r.subject||i.subject,category:r.category||i.category})));
  const metaByDate=new Map((META.importBatches||[]).filter(b=>b?.date).map(b=>[String(b.date),b]));
  const batches=[...grouped.values()].map(b=>{
    const dayItems=itemsByDate.get(b.date)||[];
    const recordMap=new Map();
    dayItems.forEach(i=>{
      const type=i.recordType||'知识点背诵';
      const cur=recordMap.get(type)||{recordType:type,count:0,titles:[]};
      cur.count++;cur.titles.push(i.title);recordMap.set(type,cur);
    });
    const metaRecords=Array.isArray(metaByDate.get(b.date)?.records)?metaByDate.get(b.date).records:[];
    const records=[...recordMap.values()].map(r=>({...r,...(metaRecords.find(x=>x.recordType===r.recordType)||{}),count:r.count,titles:r.titles}));
    return {...b,count:dayItems.length,records};
  }).sort((a,b)=>a.date.localeCompare(b.date));
  const batchById=new Map();
  batches.forEach(b=>batchById.set(b.id,b));
  (META.importBatches||[]).forEach(b=>{if(b?.id&&b?.date){const normalized=batchById.get(`date-${b.date}`);if(normalized)batchById.set(b.id,normalized)}});
  return {dates:sortedDates,dayByDate,recordsById,itemDates,itemsByDate,batches,batchById};
}
const IMPORT_INDEX=buildImportIndex();
function allImportDates(){return IMPORT_INDEX.dates}
function importDayForDate(date){return IMPORT_INDEX.dayByDate.get(String(date||''))||0}
function itemImportRecords(i){return IMPORT_INDEX.recordsById.get(i?.id)||[]}
function latestImportRecord(i){const r=itemImportRecords(i);return r[r.length-1]||{day:i?.importDay,date:i?.importDate,label:i?.importLabel,id:i?.importBatchId}}
function itemHasImportDate(i,date){return IMPORT_INDEX.itemDates.get(i?.id)?.has(String(date||''))||false}
function importBatches(){return IMPORT_INDEX.batches}
function itemHasImportBatch(i,id){const b=IMPORT_INDEX.batchById.get(id);return b?itemHasImportDate(i,b.date):itemImportRecords(i).some(x=>x.id===id)}
function shortImportDate(date){const m=String(date||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${Number(m[2])}.${Number(m[3])}`:String(date||'未记日期')}
function fullImportDate(date){const m=String(date||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[1]}年${Number(m[2])}月${Number(m[3])}日`:String(date||'未记录日期')}
function importTag(i){const r=latestImportRecord(i);return r?.date?`第${importDayForDate(r.date)||r.day||1}天 · ${shortImportDate(r.date)}`:(r?.label||i?.importLabel||'未记录日期')}
function latestImportDate(i){return latestImportRecord(i)?.date||i?.importDate||''}

function load(){
  let base={study:{...INITIAL_STUDY},stats:{totalSeconds:0,subjectSeconds:{},itemSeconds:{},days:{},checkins:{},focusSessions:0},reviews:{},answers:{},blockCompletions:{},chapterCompletions:{},settings:{autoNext:true}};
  try{const old=localStorage.getItem(OLD_STORE); if(old) base.study={...base.study,...JSON.parse(old)}}catch{}
  try{const raw=localStorage.getItem(STORE); if(raw) base={...base,...JSON.parse(raw)}}catch{}
  base.study = compat(base.study||{});
  base.stats = base.stats || {totalSeconds:0,subjectSeconds:{},itemSeconds:{},days:{},checkins:{},focusSessions:0};
  base.stats.subjectSeconds ||= {}; base.stats.itemSeconds ||= {}; base.stats.days ||= {}; base.stats.checkins ||= {}; base.stats.focusSessions ||= 0;
  base.reviews ||= {};
  base.answers ||= {};
  base.blockCompletions ||= {};
  base.chapterCompletions ||= {};
  // v50 将数学第一章统一为“函数、极限与连续”，迁移旧章节/知识块完结日期。
  Object.entries({...base.blockCompletions}).forEach(([k,v])=>{const nk=k.replace('数学｜第一章 函数｜','数学｜第一章 函数、极限与连续｜');if(nk!==k&&!base.blockCompletions[nk])base.blockCompletions[nk]=v});
  if(base.chapterCompletions['数学|||第一章 函数']&&!base.chapterCompletions['数学|||第一章 函数、极限与连续'])base.chapterCompletions['数学|||第一章 函数、极限与连续']=base.chapterCompletions['数学|||第一章 函数'];
  base.settings = {autoNext:true,...(base.settings||{})};
  return base;
}
let saveTimer=null;
function save(){if(saveTimer){clearTimeout(saveTimer);saveTimer=null}localStorage.setItem(STORE,JSON.stringify(data))}
function scheduleSave(delay=220){if(saveTimer)clearTimeout(saveTimer);saveTimer=setTimeout(()=>{saveTimer=null;localStorage.setItem(STORE,JSON.stringify(data))},delay)}
function compat(study){
  const out={...study};
  ITEMS.forEach(i=>{
    if(!out[i.id] && Array.isArray(i.sourceIds)){
      const sources=i.sourceIds.map(id=>out[id]).filter(Boolean);
      if(sources.length){
        out[i.id]={read:sources.some(x=>x.read),starred:sources.some(x=>x.starred),mastered:sources.every(x=>x.mastered),note:sources.map(x=>x.note).filter(Boolean).join('\n'),updatedAt:new Date().toISOString()};
      }
    }
  });
  return out;
}
function st(id){return data.study[id]||{read:false,starred:false,mastered:false,note:''}}
function isQuestionCard(i){return i?.studyMode==='question'||String(i?.recordType||'').includes('题目')}
function isNoteCard(i){return !isQuestionCard(i)&&(i?.studyMode==='note'||String(i?.recordType||'').includes('笔记'))}
function recordTypeClass(type){return type==='PDF资料整理'?'pdf':(type==='图片知识点'?'image':(String(type||'').includes('题目')?'question':(String(type||'').includes('笔记')?'note':'')))}
function itemBlockKey(i){return [i?.subject||'未分类',i?.chapter||'未分章',i?.category||'未分类'].join('|||')}
function buildKnowledgeBlockIndex(){
  const byKey=new Map();
  ITEMS.forEach(i=>{
    const key=itemBlockKey(i),cur=byKey.get(key)||{key,subject:i.subject||'未分类',chapter:i.chapter||'未分章',category:i.category||'未分类',items:[]};
    cur.items.push(i);byKey.set(key,cur);
  });
  const subjectOrder={'计算机':1,'英语':2,'数学':3,'考点必背':4};
  const blocks=[...byKey.values()].sort((a,b)=>(subjectOrder[a.subject]||99)-(subjectOrder[b.subject]||99)||a.chapter.localeCompare(b.chapter,'zh-CN')||a.category.localeCompare(b.category,'zh-CN'));
  return {blocks,byKey};
}
const BLOCK_INDEX=buildKnowledgeBlockIndex();
function chapterPathParts(i){return String(i?.chapter||'未分章').split('｜').map(x=>x.trim()).filter(Boolean)}
function itemChapterRootKey(i){const parts=chapterPathParts(i),subject=i?.subject||parts[0]||'未分类',chapterTitle=parts[1]||parts[0]||'未分章';return `${subject}|||${chapterTitle}`}
function itemChapterRootTitle(i){const parts=chapterPathParts(i);return parts[1]||parts[0]||'未分章'}
function itemChapterSection(i){const parts=chapterPathParts(i);return parts.length>2?parts.slice(2).join('｜'):(parts[1]||parts[0]||'本章内容')}
function buildChapterMindmapIndex(){
  const byKey=new Map();
  SORTED_ITEMS.forEach(i=>{
    const key=itemChapterRootKey(i),subject=i.subject||'未分类',title=itemChapterRootTitle(i),sectionName=itemChapterSection(i);
    const chapter=byKey.get(key)||{key,subject,title,sections:new Map(),items:[]};
    const section=chapter.sections.get(sectionName)||{name:sectionName,categories:new Map(),items:[]};
    const categoryName=i.category||'未分类',blockKey=itemBlockKey(i),category=section.categories.get(categoryName)||{name:categoryName,key:blockKey,items:[]};
    category.items.push(i);section.categories.set(categoryName,category);section.items.push(i);chapter.sections.set(sectionName,section);chapter.items.push(i);byKey.set(key,chapter);
  });
  const subjectOrder={'计算机':1,'英语':2,'数学':3,'考点必背':4};
  const chapters=[...byKey.values()].sort((a,b)=>(subjectOrder[a.subject]||99)-(subjectOrder[b.subject]||99)||a.title.localeCompare(b.title,'zh-CN'));
  chapters.forEach(ch=>{
    ch.sections=[...ch.sections.values()].sort((a,b)=>a.name.localeCompare(b.name,'zh-CN'));
    ch.sections.forEach(sec=>sec.categories=[...sec.categories.values()].sort((a,b)=>a.name.localeCompare(b.name,'zh-CN')));
  });
  return {chapters,byKey};
}
const CHAPTER_MINDMAP_INDEX=buildChapterMindmapIndex();
function blockRequirementMet(i){const s=st(i.id);return isNoteCard(i)?!!s.read:!!s.mastered}
function hasAnswerTrace(i){
  const r=data.answers?.[i.id];if(!r)return false;
  if(String(r.questionText||'').trim())return true;
  return Object.values(r.values||{}).some(v=>String(v||'').trim());
}
function knowledgeBlockStats(block){
  const items=block?.items||[],total=items.length;
  const done=items.filter(blockRequirementMet).length,read=items.filter(i=>st(i.id).read).length,mastered=items.filter(i=>st(i.id).mastered).length;
  const wrong=items.filter(i=>st(i.id).wrong).length,starred=items.filter(i=>st(i.id).starred).length,copied=items.filter(i=>st(i.id).notebookCopied).length;
  const notes=items.filter(isNoteCard).length,questions=items.filter(isQuestionCard).length,knowledge=total-notes-questions;
  const answered=items.filter(hasAnswerTrace).length,due=items.filter(i=>data.reviews?.[i.id]&&isDue(data.reviews[i.id])).length;
  const seconds=items.reduce((n,i)=>n+Number(data.stats.itemSeconds?.[i.id]||0),0),progress=total?Math.round(done/total*100):0;
  const started=items.some(i=>st(i.id).read||st(i.id).mastered||st(i.id).wrong||st(i.id).starred||hasAnswerTrace(i)||Number(data.stats.itemSeconds?.[i.id]||0)>0);
  const complete=total>0&&done===total;
  return {...block,total,done,read,mastered,wrong,starred,copied,notes,questions,knowledge,answered,due,seconds,progress,started,complete,completedAt:data.blockCompletions?.[block.key]||''};
}
function blockStatusText(b){return b.complete?'已完结':(b.started?'进行中':'未开始')}
function blockStatsText(block){
  const b=knowledgeBlockStats(block),types=[b.knowledge?`知识点${b.knowledge}张`:'',b.notes?`笔记${b.notes}张`:'',b.questions?`题目${b.questions}道`:''].filter(Boolean).join('、');
  return [`【${b.subject}｜${b.category}】`,`章节：${b.chapter}`,`状态：${blockStatusText(b)}${b.completedAt?`（首次完结 ${b.completedAt}）`:''}`,`总体进度：${b.done}/${b.total}（${b.progress}%）`,`内容组成：${types||'无'}`,`已看：${b.read}｜已掌握：${b.mastered}｜错题：${b.wrong}｜重点：${b.starred}`,`已抄写总结：${b.copied}｜有作答记录：${b.answered}｜到期复习：${b.due}`,`学习时长：${fmt(b.seconds)}`].join('\n');
}
function chapterBlockAggregate(blocks){
  const total=blocks.reduce((n,b)=>n+b.total,0),done=blocks.reduce((n,b)=>n+b.done,0),seconds=blocks.reduce((n,b)=>n+b.seconds,0);
  return {total,done,seconds,progress:total?Math.round(done/total*100):0,complete:total>0&&done===total};
}
function renderKnowledgeBlockStats(){
  const host=$('#blockStatsList'),overview=$('#blockStatsOverview');if(!host||!overview)return;
  const blocks=BLOCK_INDEX.blocks.map(knowledgeBlockStats);let dirty=false;
  blocks.forEach(b=>{if(b.complete&&!data.blockCompletions[b.key]){data.blockCompletions[b.key]=today();b.completedAt=today();dirty=true}});
  if(dirty)scheduleSave(300);
  const completed=blocks.filter(b=>b.complete).length,active=blocks.filter(b=>!b.complete&&b.started).length,untouched=blocks.length-completed-active;
  const totalCards=blocks.reduce((n,b)=>n+b.total,0),doneCards=blocks.reduce((n,b)=>n+b.done,0),overall=totalCards?Math.round(doneCards/totalCards*100):0;
  overview.innerHTML=`<div><span>知识块</span><b>${blocks.length}</b><em>按学科＋章节＋分类统计</em></div><div><span>已完结</span><b>${completed}</b><em>进行中 ${active} · 未开始 ${untouched}</em></div><div><span>总体完成</span><b>${overall}%</b><em>${doneCards}/${totalCards}张达到要求</em></div><div><span>累计学习</span><b>${fmt(blocks.reduce((n,b)=>n+b.seconds,0))}</b><em>按卡片学习时长汇总</em></div>`;
  const banner=$('#activeBlockBanner');
  if(banner){const activeBlock=BLOCK_INDEX.byKey.get(state.blockKey);if(activeBlock){const b=knowledgeBlockStats(activeBlock);banner.classList.remove('hidden');banner.innerHTML=`<div><b>当前只看：${esc(b.subject)} · ${esc(b.category)}</b><span>${b.done}/${b.total}完成 · ${b.progress}% · ${esc(b.chapter)}</span></div><button data-block-clear="1">退出本块筛选</button>`}else{banner.classList.add('hidden');banner.innerHTML=''}}
  const grouped=new Map();blocks.forEach(b=>{const key=`${b.subject}|||${b.chapter}`;const arr=grouped.get(key)||[];arr.push(b);grouped.set(key,arr)});
  host.innerHTML=[...grouped.entries()].map(([key,arr],idx)=>{
    const [subject,chapter]=key.split('|||'),agg=chapterBlockAggregate(arr),open=idx<2||arr.some(b=>b.key===state.blockKey);
    const cards=arr.map(b=>{
      const typeText=[b.knowledge?`知识点 ${b.knowledge}`:'',b.notes?`笔记 ${b.notes}`:'',b.questions?`题目 ${b.questions}`:''].filter(Boolean).join(' · ');
      return `<article class="knowledge-block-card ${b.complete?'complete':(b.started?'active':'')} ${b.key===state.blockKey?'selected':''}"><div class="block-card-head"><div><span class="block-subject">${esc(b.subject)}</span><h4>${esc(b.category)}</h4><p>${esc(typeText||'知识内容')}</p></div><span class="block-status">${blockStatusText(b)}</span></div><div class="block-progress"><i style="width:${b.progress}%"></i></div><div class="block-main-number"><b>${b.progress}%</b><span>${b.done}/${b.total} 达到完结要求</span>${b.completedAt?`<em>首次完结：${esc(b.completedAt)}</em>`:''}</div><div class="block-metrics"><span>已看 <b>${b.read}</b></span><span>掌握 <b>${b.mastered}</b></span><span>错题 <b>${b.wrong}</b></span><span>重点 <b>${b.starred}</b></span><span>已抄写 <b>${b.copied}</b></span><span>到期复习 <b>${b.due}</b></span><span>作答记录 <b>${b.answered}</b></span><span>时长 <b>${fmt(b.seconds)}</b></span></div><div class="block-actions"><button data-block-filter="${esc(b.key)}">${b.key===state.blockKey?'正在查看':'只看本块'}</button><button class="ghost" data-block-copy="${esc(b.key)}">复制统计</button></div></article>`;
    }).join('');
    return `<details class="block-chapter-group" ${open?'open':''}><summary><div><b>${esc(subject)} · ${esc(chapter.split('｜').slice(-1)[0]||chapter)}</b><span>${arr.length}块 · ${agg.done}/${agg.total} · ${agg.progress}%</span></div><i style="width:${agg.progress}%"></i></summary><div class="block-card-grid">${cards}</div></details>`;
  }).join('')||'<p class="muted">暂无知识块。</p>';
}
function chapterMindmapStats(chapter){
  const items=chapter?.items||[],total=items.length,done=items.filter(blockRequirementMet).length;
  const read=items.filter(i=>st(i.id).read).length,mastered=items.filter(i=>st(i.id).mastered).length,wrong=items.filter(i=>st(i.id).wrong).length;
  const blocks=chapter?.sections?.reduce((n,s)=>n+(s.categories?.length||0),0)||0,sections=chapter?.sections?.length||0;
  const seconds=items.reduce((n,i)=>n+Number(data.stats.itemSeconds?.[i.id]||0),0),progress=total?Math.round(done/total*100):0,complete=total>0&&done===total;
  return {...chapter,total,done,read,mastered,wrong,blocks,sectionCount:sections,seconds,progress,complete,completedAt:data.chapterCompletions?.[chapter.key]||''};
}
function chapterMindmapText(chapter){
  const c=chapterMindmapStats(chapter),lines=[`${c.subject}｜${c.title}`,`总体：${c.done}/${c.total}（${c.progress}%）${c.completedAt?`｜首次完结 ${c.completedAt}`:''}`];
  (c.sections||[]).forEach((sec,si)=>{
    const secDone=sec.items.filter(blockRequirementMet).length;
    lines.push(`${si===c.sections.length-1?'└─':'├─'} ${sec.name}（${secDone}/${sec.items.length}）`);
    sec.categories.forEach((cat,ci)=>{
      const lastCat=ci===sec.categories.length-1,prefix=si===c.sections.length-1?'   ':'│  ',catDone=cat.items.filter(blockRequirementMet).length;
      lines.push(`${prefix}${lastCat?'└─':'├─'} ${cat.name}（${catDone}/${cat.items.length}）`);
      cat.items.forEach((i,ii)=>{
        const p2=prefix+(lastCat?'   ':'│  '),lastItem=ii===cat.items.length-1,done=blockRequirementMet(i);
        lines.push(`${p2}${lastItem?'└─':'├─'} ${done?'✓':'○'} ${i.title}`);
      });
    });
  });
  return lines.join('\n');
}
function mindmapStatusLabel(i){if(blockRequirementMet(i))return '已完成';const s=st(i.id);return s.read?'已看':'未开始'}
function renderChapterMindmap(){
  const select=$('#mindmapChapterSelect'),host=$('#chapterMindmapList'),overview=$('#mindmapOverview');if(!select||!host||!overview)return;
  const chapters=CHAPTER_MINDMAP_INDEX.chapters;if(!chapters.length){host.innerHTML='<p class="muted">暂无章节。</p>';return}
  if(!state.mindmapChapterKey||!CHAPTER_MINDMAP_INDEX.byKey.has(state.mindmapChapterKey))state.mindmapChapterKey=state.chapterRootKey&&CHAPTER_MINDMAP_INDEX.byKey.has(state.chapterRootKey)?state.chapterRootKey:chapters[0].key;
  select.innerHTML=chapters.map(ch=>`<option value="${esc(ch.key)}">${esc(ch.subject)} · ${esc(ch.title)} · ${ch.items.length}张</option>`).join('');select.value=state.mindmapChapterKey;
  const chapter=CHAPTER_MINDMAP_INDEX.byKey.get(state.mindmapChapterKey),c=chapterMindmapStats(chapter);let dirty=false;
  if(c.complete&&!data.chapterCompletions[c.key]){data.chapterCompletions[c.key]=today();c.completedAt=today();dirty=true}if(dirty)scheduleSave(300);
  const categories=[...new Set(chapter.sections.flatMap(sec=>sec.categories.map(cat=>cat.name)))];
  overview.innerHTML=`<div><span>本章进度</span><b>${c.progress}%</b><em>${c.done}/${c.total}张达到要求</em></div><div><span>结构规模</span><b>${c.sectionCount}节</b><em>${c.blocks}个知识块</em></div><div><span>学习状态</span><b>${c.mastered}掌握</b><em>${c.read}已看 · ${c.wrong}错题</em></div><div><span>累计学习</span><b>${fmt(c.seconds)}</b><em>${c.completedAt?`首次完结 ${esc(c.completedAt)}`:(c.complete?'本章已完结':'完成后自动记录')}</em></div><p class="mindmap-chapter-summary"><b>本章提纲：</b>${esc(categories.join('、')||'暂无分类')}</p>`;
  const banner=$('#mindmapActiveBanner');if(banner){if(state.chapterRootKey===chapter.key){banner.classList.remove('hidden');banner.innerHTML=`<div><b>当前列表只看：${esc(chapter.subject)} · ${esc(chapter.title)}</b><span>${c.done}/${c.total}完成 · ${c.progress}%</span></div><button data-mindmap-clear="1">退出本章筛选</button>`}else{banner.classList.add('hidden');banner.innerHTML=''}}
  const sections=chapter.sections.map((sec,si)=>{
    const secDone=sec.items.filter(blockRequirementMet).length,secProgress=sec.items.length?Math.round(secDone/sec.items.length*100):0;
    const categoriesHTML=sec.categories.map(cat=>{
      const block=BLOCK_INDEX.byKey.get(cat.key),b=block?knowledgeBlockStats(block):{done:0,total:cat.items.length,progress:0,complete:false};
      const cards=cat.items.map(i=>{const done=blockRequirementMet(i),started=st(i.id).read||st(i.id).mastered;return `<button class="mindmap-card-node ${done?'done':(started?'started':'')}" data-mindmap-item="${esc(i.id)}"><span>${done?'✓':(started?'◐':'○')}</span><b>${esc(i.title)}</b><em>${esc(i.recordType||'知识点背诵')} · ${mindmapStatusLabel(i)}</em></button>`}).join('');
      return `<details class="mindmap-branch"><summary><span class="mindmap-dot"></span><div><b>${esc(cat.name)}</b><em>${b.done}/${b.total} · ${b.progress}% · ${b.complete?'已完结':'学习中'}</em></div></summary><div class="mindmap-card-list">${cards}<button class="mindmap-block-filter ghost" data-mindmap-block-filter="${esc(cat.key)}">只看“${esc(cat.name)}”</button></div></details>`;
    }).join('');
    return `<details class="mindmap-section" open><summary><span class="mindmap-section-index">${String(si+1).padStart(2,'0')}</span><div><b>${esc(sec.name)}</b><em>${secDone}/${sec.items.length} · ${secProgress}%</em></div><i style="width:${secProgress}%"></i></summary><div class="mindmap-block-list">${categoriesHTML}</div></details>`;
  }).join('');
  host.innerHTML=`<article class="mindmap-root-card"><header><div><span>${esc(chapter.subject)}</span><h3>${esc(chapter.title)}</h3><p>${c.sectionCount}个小节 · ${c.blocks}个知识块 · ${c.total}张卡</p></div><strong class="${c.complete?'complete':''}">${c.complete?'本章已完结':`${c.progress}%`}</strong></header><div class="mindmap-root-line"></div><div class="mindmap-section-list">${sections}</div></article>`;
  const filterBtn=$('#mindmapFilterChapterBtn');if(filterBtn)filterBtn.textContent=state.chapterRootKey===chapter.key?'正在查看本章':'只看本章';
}
function setst(id, patch){data.study[id]={...st(id),...patch,updatedAt:new Date().toISOString()};save();renderStudyUpdate()}
function txt(i){if(SEARCH_CACHE.has(i))return SEARCH_CACHE.get(i);const value=[i.id,i.title,i.subject,i.chapter,i.category,i.range,i.batch,i.recordType,i.sourceOrg,i.sourceCourse,i.importLabel,i.importDate,JSON.stringify(i.importHistory||[]),i.oneLine,JSON.stringify(i.memoBlocks||[]),JSON.stringify(i.phraseGroups||[]),JSON.stringify(i.tables||[]),JSON.stringify(i.clozeLines||[]),JSON.stringify(i.pdfTextLines||[]),JSON.stringify(i.pdfClozeLines||[]),i.problem,i.answer,JSON.stringify(i.choices||[]),JSON.stringify(i.solutionSteps||[]),JSON.stringify(i.principle||{}),...(i.topics||[]),...(i.keywords||[])].join(' ').toLowerCase();SEARCH_CACHE.set(i,value);return value}
function matches(i){const s=st(i.id); if(state.chapterRootKey&&itemChapterRootKey(i)!==state.chapterRootKey)return false; if(state.blockKey&&itemBlockKey(i)!==state.blockKey)return false; if(state.importBatch && !itemHasImportBatch(i,state.importBatch)) return false; if(state.recordType && (i.recordType||'知识点背诵')!==state.recordType) return false; if(state.sourceOrg && (i.sourceOrg||'未标注')!==state.sourceOrg) return false; if(state.contentMode==='knowledge'&&(isNoteCard(i)||isQuestionCard(i)))return false; if(state.contentMode==='notes'&&!isNoteCard(i))return false; if(state.contentMode==='questions'&&!isQuestionCard(i))return false; if(state.auditOnly && !(AUDIT_BY_ID[i.id]?.issues?.length)) return false; if(state.subject && i.subject!==state.subject) return false; if(state.chapter && i.chapter!==state.chapter) return false; if(state.status==='unread' && s.read) return false; if(state.status==='read' && !s.read) return false; if(state.status==='starred' && !s.starred) return false; if(state.status==='wrong' && !s.wrong) return false; if(state.status==='mastered' && !s.mastered) return false; if(state.hideMastered && s.mastered) return false; return !state.q || txt(i).includes(state.q.toLowerCase())}
function filtered(){return SORTED_ITEMS.filter(matches)}
function pct(arr){const mem=(arr||[]).filter(i=>!isNoteCard(i));if(!mem.length)return 0;return Math.round(mem.filter(i=>st(i.id).mastered).length/mem.length*100)}
function fmt(sec){sec=Math.floor(sec||0); if(sec<60)return sec+'s'; let m=Math.floor(sec/60); if(m<60)return m+'m'; return (m/60).toFixed(1)+'h'}
function chapters(){return [...new Set(ITEMS.filter(i=>!state.subject||i.subject===state.subject).map(i=>i.chapter))].sort((a,b)=>a.localeCompare(b,'zh-CN'))}
function list(arr){arr=(arr||[]).filter(Boolean);return arr.length?`<ul>${arr.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p class="muted">暂无</p>'}
function renderStats(){
  const comp=ITEMS.filter(i=>i.subject==='计算机'), eng=ITEMS.filter(i=>i.subject==='英语'), math=ITEMS.filter(i=>i.subject==='数学');
  $('#totalCount').textContent=ITEMS.length; $('#shownCount').textContent=filtered().length+' 个正在显示';
  const cp=pct(comp), ep=pct(eng), mp=pct(math); $('#compPct').textContent=cp+'%'; $('#engPct').textContent=ep+'%'; if($('#mathPct'))$('#mathPct').textContent=mp+'%'; $('#compBar').style.width=cp+'%'; $('#engBar').style.width=ep+'%'; if($('#mathBar'))$('#mathBar').style.width=mp+'%';
  $('#timeTotal').textContent=fmt(data.stats.totalSeconds); $('#timeToday').textContent=fmt(data.stats.days[today()]||0); $('#streak').textContent=calcStreak()+' 天'; if($('#focusCount')) $('#focusCount').textContent=data.stats.focusSessions||0; if($('#reviewDue')) $('#reviewDue').textContent=dueReviews().length+' 张';
  if($('#answerTraceCount')) $('#answerTraceCount').textContent=Object.keys(data.answers||{}).length+' 张有作答记录';
  if($('#resetScopeInfo')){const current=ITEM_BY_ID.get(state.selected); $('#resetScopeInfo').textContent=current?`当前章节：${current.chapter}；当前题型：${questionType(current)}`:'先选择一张卡片，再重置本章或当前题型。'}
  const redo=$('#redoMode'); if(redo) redo.checked=state.redoMode;
  $$('#subjectTabs button').forEach(b=>b.classList.toggle('active',(b.dataset.subject||'')===state.subject));
  $$('#contentTabs button').forEach(b=>b.classList.toggle('active',(b.dataset.contentMode||'')===state.contentMode));
}
function calcStreak(){let d=new Date(), n=0; for(;;){const k=d.toISOString().slice(0,10); if((data.stats.checkins&&data.stats.checkins[k]) || (data.stats.days&&data.stats.days[k]>120)){n++; d.setDate(d.getDate()-1)}else break;} return n}
function renderFilters(){const chs=chapters(); const cur=state.chapter; $('#chapterFilter').innerHTML='<option value="">全部章节</option>'+chs.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join(''); if(chs.includes(cur)) $('#chapterFilter').value=cur; else {state.chapter=''; $('#chapterFilter').value=''} $('#statusFilter').value=state.status; const ib=$('#importBatchFilter'); if(ib){const bs=importBatches();ib.innerHTML='<option value="">全部导入日期</option>'+bs.map(b=>`<option value="${esc(b.id)}">第${b.day||'?'}天 · ${esc(shortImportDate(b.date))} · ${b.count}个</option>`).join('');if(bs.some(b=>b.id===state.importBatch))ib.value=state.importBatch;else{state.importBatch='';ib.value=''}} const rt=$('#recordTypeFilter');if(rt){const types=[...new Set(ITEMS.map(i=>i.recordType||'知识点背诵'))];rt.innerHTML='<option value="">全部记录类型</option>'+types.map(t=>`<option value="${esc(t)}">${esc(t)} · ${ITEMS.filter(i=>(i.recordType||'知识点背诵')===t).length}张</option>`).join('');if(types.includes(state.recordType))rt.value=state.recordType;else{state.recordType='';rt.value=''}} const so=$('#sourceOrgFilter');if(so){const orgs=['蓝色森林','全方位','未标注'];so.innerHTML='<option value="">全部机构来源</option>'+orgs.map(o=>`<option value="${esc(o)}">${esc(o)} · ${ITEMS.filter(i=>(i.sourceOrg||'未标注')===o).length}张</option>`).join('');so.value=orgs.includes(state.sourceOrg)?state.sourceOrg:'';if(!orgs.includes(state.sourceOrg))state.sourceOrg=''}}
function renderTree(){
  const groups={}; ITEMS.forEach(i=>{if(state.subject&&i.subject!==state.subject)return; (groups[i.chapter] ||= []).push(i)});
  $('#treeNav').innerHTML=Object.entries(groups).map(([ch,arr])=>{const p=pct(arr);return `<button data-chapter="${esc(ch)}" class="${ch===state.chapter?'active':''}"><span class="tree-title">${esc(ch)}</span><small>${arr.length}张 · 掌握 ${p}%</small><span class="mini"><i style="width:${p}%"></i></span></button>`}).join('');
}
function renderTasks(){
  const pick=(sub,n)=>ITEMS.filter(i=>i.subject===sub&&!isNoteCard(i)&&!st(i.id).mastered).slice(0,n);
  const tasks=[...pick('计算机',3),...pick('英语',3),...pick('数学',3),...pick('考点必背',2)];
  $('#todayTasks').innerHTML=tasks.map(i=>`<button class="task" data-task="${esc(i.id)}">${SUBJECT_MARK[i.subject]||'学'} · ${esc(i.title.replace(/^.*?｜/,''))}</button>`).join('') || `<span class="muted">${ITEMS.length?'今天没有未掌握卡，开始复盘重点。':'当前题库为空，加入题目后这里会自动生成今日任务。'}</span>`;
}
function importTitlesPreview(titles,limit=6){
  const arr=(titles||[]).filter(Boolean);
  const shown=arr.slice(0,limit).join('、');
  return arr.length>limit?`${shown} 等${arr.length}张`:shown;
}
function renderImportHistory(force=false){
  const box=$('#importHistoryList');if(!box)return;
  if(box.dataset.rendered==='1'&&!force){syncImportHistoryActive();return}
  const batches=importBatches();
  box.innerHTML=batches.map(b=>{
    const active=state.importBatch===b.id;
    const records=(b.records||[]).map(r=>`<button class="import-record-row" data-import-record="${esc(b.id)}" data-record-type="${esc(r.recordType)}"><span class="record-type-badge ${recordTypeClass(r.recordType)}">${esc(r.recordType)}</span><b>${Number(r.count||0)}张</b><em>${esc(r.action||'只看这一类')}</em><small>${esc(importTitlesPreview(r.titles))}</small></button>`).join('');
    const imageCount=(b.images||[]).length;
    const images=imageCount?`<details class="import-source-images" data-import-images="${esc(b.id)}"><summary>查看当天导入原图（${imageCount}张，展开后加载）</summary><div class="import-image-placeholder">原图尚未加载</div></details>`:'';
    return `<article class="import-batch-card ${active?'active':''}" data-import-card="${esc(b.id)}"><button class="import-batch-main" data-import-batch="${esc(b.id)}"><span class="import-day">第${b.day||'?'}天</span><span class="import-date">${esc(shortImportDate(b.date))}</span><span class="import-count">${b.count}张</span><b>${esc(b.title||'知识点导入')}</b><em>${esc(b.subject||'')} · ${esc(b.category||'')} · ${esc(fullImportDate(b.date))}</em><small>${esc(b.description||'点击后只看当天内容')}</small></button>${records?`<div class="import-record-groups">${records}</div>`:''}${images}</article>`;
  }).join('')||'<p class="muted">还没有导入记录。</p>';
  box.dataset.rendered='1';
  const outline=$('#sourceOutline');
  if(outline){const o=META.sourceOutline;if(!o){outline.innerHTML='';return}const imported=(o.categories||[]).reduce((n,c)=>n+Number(c.imported||0),0);outline.innerHTML=`<details class="source-outline"><summary>${esc(o.title||'来源目录')}：已导入 ${imported}/${Number(o.total||imported)}</summary><div class="source-outline-grid">${(o.categories||[]).map(c=>`<div class="${c.imported>=c.expected?'done':''}"><b>${esc(c.name)}</b><span>${Number(c.imported||0)}/${Number(c.expected||0)}</span></div>`).join('')}</div><p>目录截图显示共 ${Number(o.total||0)} 个知识点；没有正文截图的内容不会凭空生成。</p></details>`}
}
function syncImportHistoryActive(){
  $$('#importHistoryList [data-import-card]').forEach(card=>card.classList.toggle('active',card.dataset.importCard===state.importBatch));
}
function ensureImportImages(details,more=false){
  if(!details)return;
  const batch=IMPORT_INDEX.batchById.get(details.dataset.importImages);
  const host=details.querySelector(':scope > div');if(!host||!batch)return;
  const all=batch.images||[];
  const current=Number(details.dataset.loadedCount||0);
  const target=Math.min(all.length,more?current+12:Math.max(current,12));
  if(target<=current)return;
  const images=all.slice(0,target).map((src,idx)=>`<figure><img class="zoom" loading="lazy" decoding="async" src="${esc(src)}" alt="${esc(batch.label||batch.title)}导入来源${idx+1}"><figcaption>导入来源 ${idx+1}</figcaption></figure>`).join('');
  const moreButton=target<all.length?`<button class="import-load-more" data-load-more-images="${esc(batch.id)}">继续加载（剩余${all.length-target}张）</button>`:'';
  host.className='import-images-grid';host.innerHTML=images+moreButton;details.dataset.loadedCount=String(target);
}

function quick(i){return i.oneLine || ((i.clozeLines||[])[0]||'').replace(/\[\[(.*?)\]\]/g,'$1') || ((i.memoBlocks||[])[0]?.mnemonic||[])[0] || ((i.memoBlocks||[])[0]?.mustKnow||[])[0] || (i.outline||[])[0] || ''}
function renderList(){const arr=filtered(); if(!arr.length){$('#itemList').innerHTML=ITEMS.length?'<div class="nores">没有匹配结果</div>':'<div class="nores"><b>当前题库为空</b><span>所有学习功能均已保留，加入题目后会自动显示在这里。</span></div>'; return} if(!state.selected||!arr.some(i=>i.id===state.selected)){state.selected=arr[0].id;state.panel=defaultPanelFor(arr[0]);} $('#itemList').innerHTML=arr.map(i=>{const s=st(i.id),a=AUDIT_BY_ID[i.id]; const audit=a?.issues?.length?`<i class="audit-dot ${a.confidence}" title="${esc(a.issues.join('；'))}"></i>`:''; return `<button class="row ${i.id===state.selected?'active':''}" data-id="${esc(i.id)}" data-subject="${esc(i.subject)}"><span class="num">${String(i.order||'').padStart(3,'0')}</span><span class="rmain"><span class="row-tags"><span class="row-import-tag">${esc(importTag(i))}</span>${i.sourceOrg?`<span class="source-org-badge ${i.sourceOrg==='蓝色森林'?'blue-forest':'allround'}">${esc(i.sourceOrg)}</span>`:''}<span class="record-type-badge ${recordTypeClass(i.recordType||'知识点背诵')}">${esc(i.recordType||'知识点背诵')}</span></span><b>${esc(i.title)}</b><em>${esc(i.subject)} · ${esc(i.category||i.chapter)} · ${esc(i.range||'')}</em><small>${esc(quick(i)).slice(0,62)}</small></span><span class="marks">${audit}${s.wrong?'错':''}${s.starred?'★':''}${s.mastered?'✓':''}</span></button>`}).join('')}
function sec(title, html, open=false){if(!String(html||'').trim())return '';return `<details class="sec" ${open?'open':''}><summary>${esc(title)}</summary><div class="inside">${html}</div></details>`}
function tableHTML(t){return `<div class="table-wrap"><table><thead><tr>${(t.headers||[]).map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${(t.rows||[]).map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`}
function examplesHTML(ex){return ex&&ex.length?`<div class="examples">${ex.map(e=>`<div class="example"><b>${esc(e.en)}</b><span>${esc(e.cn)}</span><em>${esc(e.note||'')}</em></div>`).join('')}</div>`:'<p class="muted">暂无例句</p>'}
function confusionHTML(cs){return cs&&cs.length?`<div class="confusion">${cs.map(c=>`<div class="conf-item"><b>${esc(c[0])} ${c[1]?`/ ${esc(c[1])}`:''}</b><p>${esc(c[2]||'')}</p></div>`).join('')}</div>`:'<p class="muted">暂无易混点</p>'}
function testsHTML(ts){return ts&&ts.length?`<div class="tests">${ts.map(t=>`<details class="test"><summary>${esc(t.q)}</summary><p>${esc(t.a)}</p></details>`).join('')}</div>`:'<p class="muted">暂无自测题</p>'}
function phraseHTML(groups){if(!groups||!groups.length)return '<p class="muted">非短语卡暂无短语表</p>'; return `<div class="phrase-tools"><button id="showPhraseAnswers" class="ghost">显示/隐藏中文</button><span class="muted">点每个短语也能单独显示答案。</span></div><div id="phraseGrid" class="phrase-grid">${groups.map(g=>`<div class="phrase-group"><h3>${esc(g.key)}</h3>${g.items.map(x=>`<div class="phrase"><b>${esc(x.phrase)}</b><div class="meaning">${esc(x.meaning)}</div><small>${esc(x.example||'')}</small></div>`).join('')}</div>`).join('')}</div>`}
function cleanExtractHTML(i){
  const full=(i.pdfTextLines||[]).filter(Boolean);
  const explain=(i.basicExplain||[]).slice(0,6);
  const exam=(i.examRefine||[]).slice(0,8);
  const must=(i.mustPatterns||[]).slice(0,8);
  const fullHtml=full.length?`<div class="pdf-text"><div class="pdf-text-head">PDF 原文提取</div>${full.map(x=>`<p>${esc(x)}</p>`).join('')}</div>`:'';
  const blocks=(i.memoBlocks||[]).map(b=>{
    const a=[...(b.understanding||[]),...(b.mustKnow||[]),...(b.exam||[]),...(b.confuse||[]),...(b.mnemonic||[])].filter(Boolean).slice(0,8);
    return a.length?`<div class="extract-group"><h4>${esc(b.title||'整理内容')}</h4>${list(a)}</div>`:'';
  }).join('');
  return `<div class="clean-notice"><b>不再显示乱码 OCR</b><p>能提取文字的 PDF 会在这里完整显示；图片型 PDF 以原图核对，不强行生成乱码。</p></div>${fullHtml}${sec('干净整理版：先看这个', list(must.length?must:explain), true)}${sec('基础解释', list(explain), true)}${sec('考试考法', list(exam), true)}${blocks}`;
}
function mediaHTML(i){
  if(i.pageCloze){
    const p=i.pageCloze;
    const files=i.sourceFile?`<p class="source-files">来源：${esc(i.sourceFile)} · ${esc(p.video||'录屏')} · ${esc(p.time||'')}s</p>`:'';
    return `${files}<div class="page-gallery exam-answer-gallery"><figure><div class="page-label">考点必背原图 / 答案页</div><img class="zoom" loading="lazy" decoding="async" src="${esc(p.answer)}" alt="${esc(i.title)} 原图答案" onerror="this.closest('figure').classList.add('img-error')"><div class="img-error-msg">图片没加载出来：上传 GitHub 时必须把 exam_video_v15 文件夹一起上传，不能只传 index.html。</div></figure></div>`;
  }
  const imgs=i.images&&i.images.length?i.images:(i.image?[i.image]:[]);
  const pdf=i.pdf?`<a class="pdf" href="${esc(i.pdf)}" target="_blank" rel="noopener">打开完整 PDF / 原图</a>`:'';
  const files=i.sourceFiles?.length?`<p class="source-files">来源：${esc(i.sourceFiles.join('；'))}</p>`:(i.sourceFile?`<p class="source-files">来源：${esc(i.sourceFile)}</p>`:'');
  const gal=imgs.length?`<div class="page-gallery">${imgs.map((src,idx)=>`<figure><div class="page-label">第 ${idx+1} / ${imgs.length} 页</div><img class="zoom" loading="lazy" decoding="async" src="${esc(src)}" alt="${esc(i.title)} 第${idx+1}页" onerror="this.closest('figure').classList.add('img-error')"><div class="img-error-msg">图片没加载出来：请确认 images 文件夹已完整上传。</div></figure>`).join('')}</div>`:'';
  return `${pdf}${files}${gal}` || '<p class="muted">暂无原图</p>'
}

function addDays(dateStr,n){let d;if(/^\d{4}-\d{2}-\d{2}$/.test(String(dateStr||''))){const [y,m,day]=dateStr.split('-').map(Number);d=new Date(y,m-1,day)}else d=new Date();d.setDate(d.getDate()+n);return dateKey(d)}
function isDue(r){return r && (!r.due || r.due<=today())}
function dueReviews(){return Object.entries(data.reviews||{}).map(([id,r])=>({item:ITEM_BY_ID.get(id),review:r})).filter(x=>x.item&&!isNoteCard(x.item)&&isDue(x.review))}
function allReviews(){return Object.entries(data.reviews||{}).map(([id,r])=>({item:ITEM_BY_ID.get(id),review:r})).filter(x=>x.item&&!isNoteCard(x.item))}
function ensureReview(id){const item=ITEM_BY_ID.get(id);if(isNoteCard(item))return null;const now=today(); if(!data.reviews) data.reviews={}; if(!data.reviews[id]) data.reviews[id]={stage:0,due:now,last:'',count:0}; save(); return data.reviews[id]}
function scheduleReview(id, remembered=true){
  const r=ensureReview(id); if(!r)return; const now=today();
  if(remembered){r.stage=Math.min((r.stage||0)+1, REVIEW_INTERVALS.length); const days=REVIEW_INTERVALS[Math.max(0,r.stage-1)]||30; r.due=addDays(now,days);}
  else{r.stage=0; r.due=addDays(now,1);}
  r.last=now;r.count=(r.count||0)+1;data.reviews[id]=r;save();renderStudyUpdate();
}
function reviewBadge(id){const r=data.reviews?.[id]; if(!r)return '未加入'; return isDue(r)?'今日复习':'下次 '+r.due}
function renderReview(){
  const box=$('#reviewList'); if(!box)return;
  const arr=state.reviewMode==='all'?allReviews():dueReviews();
  if(!arr.length){box.innerHTML='<div class="review-card"><b>暂无需要复习</b><em>在任意知识点里点“加入抗遗忘”，系统会按 1/2/4/7/15/30 天帮你排期。</em></div>'; return}
  box.innerHTML=arr.map(({item,review})=>`<div class="review-card"><b>${esc(item.subject)} · ${esc(item.title.replace(/^.*?｜/,''))}</b><em>阶段 ${review.stage||0}/6 · 下次 ${esc(review.due||today())} · 已复习 ${review.count||0} 次</em><div class="buttons"><button data-review-open="${esc(item.id)}">打开</button><button data-review-ok="${esc(item.id)}">记住了</button><button class="weak" data-review-no="${esc(item.id)}">没记住</button></div></div>`).join('');
}
function memoryHTML(i){
  const r=data.reviews?.[i.id];
  return `<div class="memory-box"><h3>抗遗忘记忆法</h3><p>这张卡按“当天理解 → 1天后 → 2天后 → 4天后 → 7天后 → 15天后 → 30天后”复习。不要每天从头乱背，优先复习快忘的内容。</p><div class="memory-steps"><span>当天</span><span>1天</span><span>2天</span><span>4天</span><span>7天</span><span>15天</span><span>30天</span></div><p><b>当前状态：</b>${esc(reviewBadge(i.id))}</p><div class="buttons"><button class="review-action" data-review-add="${esc(i.id)}">${r?'重新加入今天复习':'加入抗遗忘'}</button><button class="review-action ghost" data-review-ok="${esc(i.id)}">我记住了</button><button class="review-action ghost" data-review-no="${esc(i.id)}">没记住，明天再来</button></div></div>`;
}
function renderTimer(){const m=Math.floor(timer.left/60),s=timer.left%60; if($('#focusTimer')) $('#focusTimer').textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')}
function addFocusTime(seconds){
  data.stats.totalSeconds=(data.stats.totalSeconds||0)+seconds;
  data.stats.days[today()]=(data.stats.days[today()]||0)+seconds;
  data.stats.focusSessions=(data.stats.focusSessions||0)+1;
  if(state.selected){
    const i=ITEM_BY_ID.get(state.selected);
    if(i){data.stats.subjectSeconds[i.subject]=(data.stats.subjectSeconds[i.subject]||0)+seconds; data.stats.itemSeconds[i.id]=(data.stats.itemSeconds[i.id]||0)+seconds;}
  }
  save(); renderStats();
}
function timerTick(){if(!timer.running)return; timer.left--; renderTimer(); if(timer.left<=0){timer.running=false; clearInterval(timer.handle); timer.handle=null; timer.left=25*60; addFocusTime(25*60); renderTimer(); alert('25分钟完成，已计入学习时长。休息5分钟再继续。')}}
function startTimer(){if(timer.running)return; timer.running=true; timer.handle=setInterval(timerTick,1000)}
function pauseTimer(){timer.running=false; if(timer.handle){clearInterval(timer.handle); timer.handle=null}}
function resetTimer(){pauseTimer(); timer.left=25*60; renderTimer()}


function normAns(s){
  return String(s||'').normalize('NFKC').trim().toLowerCase().replace(/[\s\u200b-\u200d\ufeff]+/g,'').replace(/[\p{P}]/gu,'');
}
function levenshtein(a,b){
  const x=[...a],y=[...b],row=Array(y.length+1).fill(0).map((_,i)=>i);
  for(let i=1;i<=x.length;i++){
    let prev=row[0]; row[0]=i;
    for(let j=1;j<=y.length;j++){
      const old=row[j]; row[j]=Math.min(row[j]+1,row[j-1]+1,prev+(x[i-1]===y[j-1]?0:1)); prev=old;
    }
  }
  return row[y.length];
}
function firstDiff(value,answer){
  const a=[...normAns(value)],b=[...normAns(answer)],n=Math.max(a.length,b.length);
  for(let i=0;i<n;i++) if(a[i]!==b[i]) return {index:i+1,got:a[i]||'缺少',expected:b[i]||'多余'};
  return null;
}
function compareAnswer(value,answer){
  const v=normAns(value),a=normAns(answer);
  if(!v)return {status:'empty',similarity:0,diff:null};
  if(v===a)return {status:'ok',similarity:1,diff:null};
  const distance=levenshtein(v,a),max=Math.max(v.length,a.length,1),similarity=1-distance/max;
  const near=distance<=1 || (max>=5&&distance<=2) || similarity>=.74;
  return {status:near?'near':'bad',similarity,distance,diff:firstDiff(value,answer)};
}
function answerLengthHint(answer){
  const raw=String(answer||'').trim();
  const words=raw.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)||[];
  const zh=[...raw].filter(ch=>/[\u3400-\u9fff]/.test(ch)).length;
  if(words.length&&zh===0)return words.length===1?`${[...words[0]].length} 个英文字母`:`${words.length} 个英文单词`;
  const count=[...normAns(raw)].length;
  return `${count} 个有效字符`;
}
function firstAnswerChar(answer){return [...String(answer||'').trim()][0]||''}
function clozeUnits(s){
  let units=0;
  for(const ch of [...String(s||'')]) units += /[\u0000-\u00ff]/.test(ch) ? .62 : 1;
  return Math.max(4,Math.min(42,Math.ceil(units)+2));
}
let clozeMeasureCanvas=null;
function resizeClozeInput(inp){
  if(!inp)return;
  const typed=String(inp.value||''),answer=String(inp.dataset.answer||''),sample=typed||answer||'填空';
  let measured=clozeUnits(sample)*16+32;
  try{
    clozeMeasureCanvas ||= document.createElement('canvas');
    const ctx=clozeMeasureCanvas.getContext('2d'),style=getComputedStyle(inp);
    ctx.font=style.font||`${style.fontSize} ${style.fontFamily}`;
    measured=Math.ceil(ctx.measureText(sample.replace(/\n/g,' ')).width)+34;
  }catch{}
  const line=inp.closest('.cloze-line'),wrap=inp.closest('.cloze-blank');
  const lineWidth=Math.max(180,line?.clientWidth||inp.closest('.cloze-lines')?.clientWidth||window.innerWidth||360);
  const maxInputWidth=Math.max(96,Math.min(680,lineWidth-86,(window.innerWidth||720)-118));
  const multiline=measured>maxInputWidth-10||typed.includes('\n')||clozeUnits(answer)>18;
  const width=Math.max(82,Math.min(maxInputWidth,measured));
  inp.style.setProperty('--blank-width',(multiline?maxInputWidth:width)+'px');
  wrap?.style.setProperty('--blank-width',(multiline?maxInputWidth:width)+'px');
  wrap?.classList.toggle('multiline-wrap',multiline);
  inp.classList.toggle('multiline',multiline);
  inp.style.height='auto';
  const base=38;
  inp.style.height=(multiline?Math.min(160,Math.max(base,inp.scrollHeight)):base)+'px';
  inp.title=typed&&measured>maxInputWidth?typed:'';
}
function markVisibleAnswers(line){
  return String(line||'').replace(/([（(])\s*([^()（）]*?)\s*([)）])/g,(m,open,answer,close)=>{
    const clean=answer.trim();
    if(!clean||clean.includes('[[')||clean.includes(']]'))return m;
    return `${open}[[${clean}]]${close}`;
  });
}
function mergePageClozeLines(lines){
  const out=[]; let question='';
  for(const raw of (lines||[])){
    const line=String(raw||'').trim(); if(!line)continue;
    const startsQuestion=/^\d+\s*[.、．]/.test(line);
    if(startsQuestion){if(question)out.push(question); question=line}
    else if(question)question+=line; else out.push(line);
  }
  if(question)out.push(question);
  return out.map(markVisibleAnswers);
}
function itemClozeLines(i){
  if(i?.pageCloze)return mergePageClozeLines(i.pageClozeTextLines||[]);
  return (i?.pdfClozeLines&&i.pdfClozeLines.length)?i.pdfClozeLines:(i?.clozeLines||[]);
}
function countClozeBlanks(lines){return ((lines||[]).join('\n').match(/\[\[(.*?)\]\]/g)||[]).length}
function defaultPanelFor(i){return isQuestionCard(i)?'question':(itemClozeLines(i).length?'cloze':'learn')}
function questionType(i){
  if(isQuestionCard(i))return i.recordType||'题目';
  if(i?.pageCloze)return '录屏填空';
  if(itemClozeLines(i).length)return '文字填空';
  if(i?.selfTests?.length)return '自测题';
  return '知识卡';
}
function auditItem(i){
  const lines=itemClozeLines(i),actual=countClozeBlanks(lines),expected=Number(i.pageCloze?.boxCount||0),issues=[];
  if(i.pageCloze){
    if(!i.pageCloze.masked||!i.pageCloze.answer)issues.push('缺少原图或答案图路径');
    if(!lines.length)issues.push('没有可靠的文字识别内容');
    else if(actual===0)issues.push('识别出文字但没有生成填空');
    const countSuspicious=expected&&(actual===0||actual/expected<.25||actual>expected+2);
    if(countSuspicious)issues.push(`题图黄色框 ${expected} 个，文字填空仅 ${actual} 个，数量差距较大`);
  }
  const noSelfAnswer=(i.selfTests||[]).some(t=>t?.q&&!String(t?.a||'').trim());
  if(noSelfAnswer)issues.push('自测题缺少答案');
  let confidence='high';
  if(i.clozeVerified)confidence='verified';
  else if(!lines.length||actual===0||(expected&&(actual/expected<.25||actual>expected+2)))confidence='low';
  else if((expected&&(actual/expected<.5||actual>expected))||issues.length)confidence='medium';
  return {id:i.id,actual,expected,issues,confidence,applicable:!!i.pageCloze||!!lines.length};
}
const AUDIT_RESULTS=ITEMS.map(auditItem);
const AUDIT_BY_ID=Object.fromEntries(AUDIT_RESULTS.map(x=>[x.id,x]));
const AUDIT_SUMMARY={
  applicable:AUDIT_RESULTS.filter(x=>x.applicable).length,
  issueCards:AUDIT_RESULTS.filter(x=>x.issues.length).length,
  missingText:AUDIT_RESULTS.filter(x=>x.issues.some(y=>y.includes('没有可靠'))).length,
  noBlanks:AUDIT_RESULTS.filter(x=>x.issues.some(y=>y.includes('没有生成填空'))).length,
  mismatch:AUDIT_RESULTS.filter(x=>x.issues.some(y=>y.includes('黄色框'))).length,
  low:AUDIT_RESULTS.filter(x=>x.confidence==='low').length
};
function renderAudit(){
  if($('#auditTotal'))$('#auditTotal').textContent=AUDIT_SUMMARY.applicable;
  if($('#auditIssueCount'))$('#auditIssueCount').textContent=AUDIT_SUMMARY.issueCards;
  if($('#auditMissingCount'))$('#auditMissingCount').textContent=AUDIT_SUMMARY.missingText+AUDIT_SUMMARY.noBlanks;
  if($('#auditMismatchCount'))$('#auditMismatchCount').textContent=AUDIT_SUMMARY.mismatch;
  const btn=$('#auditOnlyBtn'); if(btn){btn.textContent=state.auditOnly?'取消问题筛选':'只看有问题';btn.classList.toggle('on',state.auditOnly)}
  const list=$('#auditList'); if(list){
    const rows=AUDIT_RESULTS.filter(x=>x.issues.length).slice(0,12).map(a=>{const i=ITEM_BY_ID.get(a.id);return `<button data-audit-open="${esc(a.id)}"><b>${esc(i?.title||a.id)}</b><span>${esc(a.issues.join('；'))}</span></button>`}).join('');
    list.innerHTML=rows||'<p class="muted">未发现结构性问题。</p>';
  }
}
function answerRoot(){return state.redoMode?state.redoAnswers:data.answers}
function answerBucket(id,create=false){
  const root=answerRoot();
  if(!root[id]&&create)root[id]={values:{},statuses:{},feedbacks:{},hints:{},revealed:false,updatedAt:new Date().toISOString()};
  return root[id]||null;
}
function persistAnswer(id){
  const rec=answerBucket(id,false); if(rec)rec.updatedAt=new Date().toISOString();
  if(!state.redoMode)scheduleSave();
}
function clearAnswerIds(ids){
  (ids||[]).forEach(id=>{delete data.answers[id];delete state.redoAnswers[id]});
  save();renderFilteredContent();
}
function clozeModeState(id,total){
  const m=state.clozeModes[id]||(state.clozeModes[id]={mode:'all',singleIndex:0,randomIndices:[],wrongIndices:[]});
  m.singleIndex=Math.max(0,Math.min(Math.max(0,total-1),Number(m.singleIndex)||0));
  m.randomIndices=(m.randomIndices||[]).filter(x=>x>=0&&x<total);
  m.wrongIndices=(m.wrongIndices||[]).filter(x=>x>=0&&x<total);
  if(m.mode==='random'&&!m.randomIndices.length)m.randomIndices=randomIndices(total);
  return m;
}
function randomIndices(total){
  const all=Array.from({length:total},(_,i)=>i);
  for(let i=all.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[all[i],all[j]]=[all[j],all[i]]}
  return all.slice(0,Math.max(1,Math.ceil(total/2))).sort((a,b)=>a-b);
}
function activeClozeIndices(m,total){
  if(m.mode==='single')return new Set([m.singleIndex]);
  if(m.mode==='random')return new Set(m.randomIndices);
  if(m.mode==='wrong')return new Set(m.wrongIndices.length?m.wrongIndices:Array.from({length:total},(_,i)=>i));
  return new Set(Array.from({length:total},(_,i)=>i));
}
function blankFeedback(answer,idx,rec){
  const hint=Number(rec?.hints?.[idx]||0),status=rec?.statuses?.[idx]||'',fb=rec?.feedbacks?.[idx]||'';
  let text='';
  if(hint===1)text=`长度提示：${answerLengthHint(answer)}`;
  else if(hint===2)text=`长度：${answerLengthHint(answer)}；首字：${firstAnswerChar(answer)}`;
  else if(hint>=3)text=`答案：${answer}`;
  else if(fb)text=fb;
  return `<span class="cloze-feedback ${status} ${hint>=3?'answer-shown':''}">${esc(text)}${hint>=3?` <button type="button" data-cloze-refill="${idx}">看完再填</button>`:''}</span>`;
}
function clozeBlankHTML(answer,idx,itemId,active,rec){
  if(!active)return `<span class="cloze-given" title="本轮不挖空">${esc(answer)}</span>`;
  const value=state.redoMode?(rec?.values?.[idx]||''):(rec?.values?.[idx]||'');
  const status=rec?.statuses?.[idx]||'',hint=Number(rec?.hints?.[idx]||0),n=clozeUnits(answer),px=Math.max(82,Math.min(680,n*16+32));
  return `<span class="cloze-blank ${status} ${hint>=3?'reveal-one':''}" data-blank-index="${idx}" style="--blank-width:${px}px"><span class="cloze-input-row"><textarea rows="1" data-cloze-input="1" data-blank-index="${idx}" data-answer="${esc(answer)}" aria-label="填空 ${idx+1}" autocomplete="off" autocapitalize="off" spellcheck="false">${esc(value)}</textarea><button type="button" class="hint-btn" data-cloze-hint="${idx}" title="依次显示字数、首字、答案">提示${hint?hint:''}</button></span><span class="cloze-answer">${esc(answer)}</span>${blankFeedback(answer,idx,rec)}</span>`;
}
function clozeLineHTML(line,lineIndex,ctx){
  const raw=String(line||''),re=/\[\[(.*?)\]\]/g; let out='',last=0,m;
  const textPart=t=>t?`<span class="cloze-text">${esc(t)}</span>`:'';
  while((m=re.exec(raw))){
    out+=textPart(raw.slice(last,m.index));
    const idx=ctx.cursor++,active=ctx.active.has(idx);
    out+=clozeBlankHTML(m[1],idx,ctx.itemId,active,ctx.rec);
    last=re.lastIndex;
  }
  out+=textPart(raw.slice(last));
  return `<p class="cloze-line" data-line-index="${lineIndex}">${out}</p>`;
}
function clozeSourcePreview(i,open=false){
  const p=i.pageCloze;if(!p?.masked)return '';
  return `<details class="cloze-source-preview" ${open?'open':''}><summary>文字有遗漏或乱码时，直接对照原图填空</summary><figure><img class="zoom" loading="lazy" src="${esc(p.masked)}" alt="原图填空页"><figcaption>这是去掉答案后的原图；答案图仍在“PDF原图/干净整理”中。</figcaption></figure></details>`;
}
function qualityBadge(i,a){
  if(i.clozeVerified)return `<span class="cloze-quality verified">已人工核对 · ${a.actual}空</span>`;
  const names={high:'识别较稳定',medium:'需要复核',low:'识别不稳定'};
  return `<span class="cloze-quality ${a.confidence}">${names[a.confidence]||'自动识别'} · ${a.actual}空</span>`;
}
function clozeModeBar(i,total,m,activeCount){
  const b=(mode,label)=>`<button class="ghost ${m.mode===mode?'on':''}" data-cloze-mode="${mode}">${label}</button>`;
  return `<div class="cloze-modebar">${b('all','全部重点')}${b('random','随机一半')}<button class="ghost" data-cloze-randomize="1">换一组</button>${b('single','单空练习')}<button class="ghost" data-cloze-prev-blank="1">上一空</button><button class="ghost" data-cloze-next-blank="1">下一空</button><label class="auto-next"><input type="checkbox" data-auto-next="1" ${data.settings.autoNext?'checked':''}> 全对自动下一题</label><span>本轮 ${activeCount}/${total} 空</span></div>`;
}
function clozeHTML(i){
  const lines=itemClozeLines(i),a=AUDIT_BY_ID[i.id]||auditItem(i),total=countClozeBlanks(lines),m=clozeModeState(i.id,total),active=activeClozeIndices(m,total),rec=answerBucket(i.id,false),ctx={cursor:0,active,itemId:i.id,rec};
  if(i.pageCloze&&!lines.length)return `<div class="cloze-box compact-cloze" data-item-id="${esc(i.id)}"><div class="cloze-head slim"><b>这一页文字识别不稳定</b>${qualityBadge(i,a)}<span>不强行显示乱码，直接用下面的原图填空。</span></div>${clozeSourcePreview(i,true)}</div>`;
  if(!lines.length)return '<p class="muted">这张卡没有填空内容。</p>';
  const countIssue=a.issues.some(x=>x.includes('黄色框'));
  const warning=countIssue?`<div class="cloze-count-warning"><b>数量复核：</b>题图黄色框 ${a.expected} 个，文字填空仅 ${a.actual} 个，数量差距较大。黄色标题框可能不属于答案，请对照原图检查遗漏。</div>`:'';
  const title=i.pageCloze?'填空':'文字填空',source=i.pageCloze?`${clozeSourcePreview(i,false)}`:'';
  return `<div class="cloze-box ${i.pageCloze?'video-text-cloze compact-cloze':''} ${rec?.revealed?'show-answers':''}" data-item-id="${esc(i.id)}" data-total-blanks="${total}"><div class="cloze-head slim"><b>${title}</b>${qualityBadge(i,a)}<span>${state.redoMode?'重新做题模式：旧记录已隐藏。':'标点、括号和空格不影响判分。'}</span></div>${warning}${clozeModeBar(i,total,m,active.size)}<div class="cloze-actions"><button data-cloze-check="1">检查</button><button class="ghost" data-cloze-reveal="1">${rec?.revealed?'隐藏答案':'答案'}</button><button class="ghost refill-all" data-cloze-refill-all="1">看完再填</button><button class="ghost" data-cloze-clear="1">清空本题</button></div><div class="cloze-result" aria-live="polite"></div><div class="cloze-lines">${lines.map((line,idx)=>clozeLineHTML(line,idx,ctx)).join('')}</div>${i.clozeVerifiedNote?`<p class="cloze-verified-note">${esc(i.clozeVerifiedNote)}</p>`:''}${i.pageCloze?`<p class="muted small-note">${esc(i.pageCloze.video||'录屏')} · ${esc(i.pageCloze.time||'')}s · 题图数量只用于复核提醒。</p>`:''}${source}</div>`;
}
function checkClozeBox(box){
  const itemId=box?.dataset.itemId,inputs=[...(box?.querySelectorAll('[data-cloze-input]')||[])],rec=answerBucket(itemId,true),wrong=[];
  let correct=0,near=0,empty=0;
  inputs.forEach(inp=>{
    const idx=Number(inp.dataset.blankIndex),value=String(inp.value||''),cmp=compareAnswer(value,inp.dataset.answer||'');
    rec.values[idx]=value; rec.statuses[idx]=cmp.status;
    if(cmp.status==='ok'){correct++;rec.feedbacks[idx]='正确'}
    else if(cmp.status==='empty'){empty++;wrong.push(idx);rec.feedbacks[idx]='还没有填写'}
    else if(cmp.status==='near'){near++;wrong.push(idx);const d=cmp.diff;rec.feedbacks[idx]=d?`接近正确：第 ${d.index} 个字符，你写“${d.got}”，应为“${d.expected}”`:'接近正确，再检查一个字符'}
    else{wrong.push(idx);rec.feedbacks[idx]=`差异较大；正确答案长度为 ${answerLengthHint(inp.dataset.answer||'')}`}
    inp.classList.remove('ok','near','bad','empty');inp.classList.add(cmp.status);
    const wrap=inp.closest('.cloze-blank');if(wrap){wrap.classList.remove('ok','near','bad','empty');wrap.classList.add(cmp.status);const fb=wrap.querySelector('.cloze-feedback');if(fb){fb.className=`cloze-feedback ${cmp.status}`;fb.textContent=rec.feedbacks[idx]}}
  });
  persistAnswer(itemId);
  const result=box?.querySelector('.cloze-result'),all=inputs.length>0&&correct===inputs.length;
  if(result){result.className='cloze-result '+(all?'all-ok':'has-error');result.innerHTML=all?`全部正确：${correct}/${inputs.length}`:`正确 ${correct}/${inputs.length}${near?`，接近正确 ${near} 个`:''}${empty?`，未填写 ${empty} 个`:''}${wrong.length?` <button type="button" data-cloze-wrong-retry="1">只练错空</button>`:''}`}
  const mode=clozeModeState(itemId,Number(box.dataset.totalBlanks||inputs.length));mode.wrongIndices=[...new Set(wrong)];
  return {all,wrong,inputs,itemId};
}
function goNextStudyItem(){
  const arr=filtered(),idx=arr.findIndex(x=>x.id===state.selected),next=arr[idx+1];
  if(!next)return;
  state.selected=next.id;state.panel=defaultPanelFor(next);markRead(next.id);renderList();renderDetail();
}


function questionBucket(id,create=false){
  const store=state.redoMode?state.redoAnswers:data.answers;
  if(create&&!store[id])store[id]={questionText:'',questionRevealed:false};
  return store[id]||null;
}
function relatedNotesHTML(i){
  const rel=(i.relatedNoteIds||[]).map(id=>ITEMS.find(x=>x.id===id)).filter(Boolean);
  if(!rel.length)return '<p class="muted">暂无关联笔记。</p>';
  return `<div class="related-note-list">${rel.map(x=>`<button data-related-open="${esc(x.id)}"><b>${esc(x.title)}</b><span>${esc(x.recordType||'笔记')}</span><small>${esc(x.oneLine||'')}</small></button>`).join('')}</div>`;
}
function questionWorkHTML(i){
  const rec=questionBucket(i.id,true),choices=(i.choices||[]);
  return `<div class="math-question-card" data-question-id="${esc(i.id)}">
    <div class="question-label">题目</div>
    <div class="question-problem">${esc(i.problem||i.oneLine||'')}</div>
    ${choices.length?`<div class="question-choices">${choices.map(x=>`<div>${esc(x)}</div>`).join('')}</div>`:''}
    <label class="question-answer-box"><span>我的作答</span><textarea data-question-input="${esc(i.id)}" placeholder="先自己写答案或步骤，再查看参考答案。">${esc(rec?.questionText||'')}</textarea></label>
    <div class="question-actions"><button data-question-save="1">保存作答</button><button class="ghost" data-question-reveal="1">${rec?.questionRevealed?'隐藏参考答案':'查看参考答案'}</button><button class="ghost" data-question-clear="1">清空</button></div>
    <div class="question-reference ${rec?.questionRevealed?'show':''}"><b>参考答案：${esc(i.answer||'')}</b>${(i.solutionSteps||[]).length?`<ol>${i.solutionSteps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`:''}</div>
  </div>`;
}
function questionSolutionHTML(i){
  return `<div class="solution-card"><div class="solution-answer"><span>答案</span><b>${esc(i.answer||'')}</b></div>${sec('完整步骤',`<ol class="solution-steps">${(i.solutionSteps||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`,true)}${sec('本题关键点',list(i.keyPoints||[]),true)}</div>`;
}
function questionPrincipleHTML(i){
  const p=i.principle||{}, rules=p.coreRules||i.keyPoints||[], flow=p.flow||[], mistakes=p.mistakes||[];
  if(!p.summary&&!rules.length&&!flow.length&&!mistakes.length)return `<div class="principle-empty"><b>这道题的原理还没有补充</b><span>以后导入题目时会强制同时录入“原理、步骤、易错点”。</span></div>`;
  const block=(title,arr,cls='')=>arr.length?`<section class="principle-block ${cls}"><h3>${esc(title)}</h3><ol>${arr.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></section>`:'';
  return `<div class="principle-card">
    <div class="principle-title"><span>本题原理</span><h3>${esc(p.title||i.title||'')}</h3></div>
    ${p.summary?`<div class="principle-summary"><b>为什么这样做</b><p>${esc(p.summary)}</p></div>`:''}
    ${block('核心规则',rules,'core')}
    ${block('思考顺序',flow,'flow')}
    ${block('最容易错的地方',mistakes,'mistakes')}
    <div class="principle-transfer"><b>会这一题以后</b><span>遇到同类题，先判断属于哪条规则，再按照“列条件 → 求解集 → 取交集或并集 → 检查端点”的顺序处理。</span></div>
  </div>`;
}

function notebookSummaryData(i){
  const n=i.notebookSummary||{};
  const uniq=(arr,limit=8)=>{const out=[],seen=new Set();for(const v of (arr||[])){const x=String(v||'').replace(/\[\[(.*?)\]\]/g,'$1').trim();if(!x||seen.has(x))continue;seen.add(x);out.push(x);if(out.length>=limit)break}return out};
  if(n.overview||n.core?.length)return {...n,core:uniq(n.core,6),method:uniq(n.method,5),mistakes:uniq(n.mistakes,4)};
  const p=i.principle||{},isQ=isQuestionCard(i),memo=[];
  (i.memoBlocks||[]).forEach(b=>memo.push(...(b.mustKnow||[]),...(b.understanding||[])));
  return {
    overview:i.oneLine||p.summary||i.problem||i.title,
    core:uniq(isQ?[...(p.coreRules||[]),...(i.keyPoints||[])]:[...(i.mustPatterns||[]),...memo],6),
    method:uniq(isQ?[...(p.flow||[]),...(i.solutionSteps||[])]:[...(i.basicExplain||[]),...(i.examRefine||[])],5),
    mistakes:uniq(isQ?(p.mistakes||[]):(i.examRefine||[]),4),
    conclusion:isQ?(i.answer||''):(i.mustPatterns||[])[0]||i.oneLine||'',
    mnemonic:(i.keywords||[]).slice(0,6).join(' → '),
    sourceLabel:`${i.importLabel||''}${i.recordType?` · ${i.recordType}`:''}`
  };
}
function notebookSummaryText(i){
  const n=notebookSummaryData(i),lines=[];
  lines.push(`【${i.subject}】${i.title}`);
  if(n.sourceLabel)lines.push(`来源：${n.sourceLabel}`);
  if(n.overview)lines.push(`一句话：${n.overview}`);
  if(n.core?.length){lines.push('', '一、笔记本必写');n.core.forEach((x,k)=>lines.push(`${k+1}. ${x}`))}
  if(n.method?.length){lines.push('', isQuestionCard(i)?'二、解题原理与顺序':'二、理解与复习方法');n.method.forEach((x,k)=>lines.push(`${k+1}. ${x}`))}
  if(n.mistakes?.length){lines.push('', '三、易错提醒');n.mistakes.forEach((x,k)=>lines.push(`${k+1}. ${x}`))}
  if(n.conclusion)lines.push('', `结论：${n.conclusion}`);
  if(n.mnemonic)lines.push(`记忆口令：${n.mnemonic}`);
  return lines.join('\n');
}
function notebookSummaryHTML(i){
  const n=notebookSummaryData(i),s=st(i.id),block=(title,arr,cls='')=>arr?.length?`<section class="notebook-block ${cls}"><h3>${esc(title)}</h3><ol>${arr.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></section>`:'';
  return `<div class="notebook-summary-card" data-notebook-id="${esc(i.id)}">
    <div class="notebook-summary-head"><div><span>可直接抄到笔记本</span><h3>${esc(i.title)}</h3><p>${esc(n.sourceLabel||importTag(i))}</p></div><div class="notebook-summary-actions"><button data-copy-summary="${esc(i.id)}">复制全文</button><button class="ghost ${s.notebookCopied?'done':''}" data-notebook-copied="${esc(i.id)}">${s.notebookCopied?'已抄写 ✓':'标记已抄写'}</button></div></div>
    ${n.overview?`<div class="notebook-overview"><b>一句话总览</b><p>${esc(n.overview)}</p></div>`:''}
    ${block('一、笔记本必写',n.core,'core')}
    ${block(isQuestionCard(i)?'二、解题原理与顺序':'二、理解与复习方法',n.method,'method')}
    ${block('三、易错提醒',n.mistakes,'mistakes')}
    ${(n.conclusion||n.mnemonic)?`<div class="notebook-bottom">${n.conclusion?`<p><b>结论：</b>${esc(n.conclusion)}</p>`:''}${n.mnemonic?`<p><b>记忆口令：</b>${esc(n.mnemonic)}</p>`:''}</div>`:''}
    <details class="notebook-plain"><summary>查看纯文字抄写版</summary><pre>${esc(notebookSummaryText(i))}</pre></details>
  </div>`;
}
function allNotebookSummaryText(){
  const groups={};ITEMS.forEach(i=>{const key=`${i.subject}｜${i.importLabel||''}`;(groups[key]||(groups[key]=[])).push(i)});
  const lines=[`专升本笔记本总结`, `生成时间：${new Date().toLocaleString('zh-CN')}`, `共 ${ITEMS.length} 张卡片`, ''];
  Object.entries(groups).forEach(([key,arr])=>{lines.push('='.repeat(36),key,'='.repeat(36),'');arr.sort((a,b)=>(a.order||0)-(b.order||0)).forEach(i=>{lines.push(notebookSummaryText(i),'','-'.repeat(32),'')})});
  return lines.join('\n');
}
async function copyPlainText(text){
  try{await navigator.clipboard.writeText(text);return true}catch{}
  const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand('copy')}catch{}ta.remove();return ok;
}
function blocksHTML(i){const bs=i.memoBlocks||[]; if(!bs.length)return ''; return bs.map(b=>`<details class="sec" open><summary>${esc(b.title||'背诵整理')}</summary><div class="inside">${list(b.understanding)}${list(b.mustKnow)}</div></details>`).join('')}
function renderDetail(){
  const i=ITEM_BY_ID.get(state.selected); const pane=$('#detailPane'); if(!i){pane.innerHTML=ITEMS.length?'<div class="empty">点一个知识点、笔记或题目开始。</div>':'<div class="empty"><b>0 道题</b><p>这是无题目的功能模板。后续添加题库后，背诵、填空、检查、答案、清空、错空重练、抗遗忘和统计功能会继续使用。</p></div>';return}
  const s=st(i.id),questionMode=isQuestionCard(i),noteMode=isNoteCard(i); document.body.classList.add('detail-mode'); document.body.classList.toggle('detail-on', state.detailMode);
  const tab = (name,label)=>`<button data-panel="${name}" class="${activePanel===name?'active':''}">${label}</button>`;
  const panel = (name,html)=>`<section class="panel ${activePanel===name?'active':''}" data-panel-box="${name}">${html}</section>`;
  const type=i.recordType||'知识点背诵';
  const userNote=`<div class="note"><h3>我的笔记</h3><textarea data-note="${esc(i.id)}" placeholder="写自己的理解、易错点...">${esc(s.note||'')}</textarea></div>`;

  if(questionMode){
    const activePanel=['question','principle','summary','solution','related','pdf','test'].includes(state.panel)?state.panel:'question';
    const qTab=(name,label)=>`<button data-panel="${name}" class="${activePanel===name?'active':''}">${label}</button>`;
    const qPanel=(name,html)=>`<section class="panel ${activePanel===name?'active':''}" data-panel-box="${name}">${html}</section>`;
    const ops=`<div class="ops slim-ops"><button data-act="read" class="${s.read?'on':''}">${s.read?'已做':'标已做'}</button><button data-act="star" class="star ${s.starred?'on':''}">收藏</button><button data-act="wrong" class="wrong ${s.wrong?'on':''}">${s.wrong?'已加入错题':'错题'}</button><button data-act="master" class="master ${s.mastered?'on':''}">${s.mastered?'已掌握':'掌握'}</button><button data-act="forget" class="memory-on">重练计划</button></div>`;
    const tabs=`${qTab('question','做题')}${qTab('principle','本题原理')}${qTab('summary','笔记本总结')}${qTab('solution','答案与步骤')}${qTab('related','关联笔记')}${qTab('pdf','课堂原图')}${qTab('test','我的笔记')}`;
    const panels=`${qPanel('question',questionWorkHTML(i))}${qPanel('principle',questionPrincipleHTML(i))}${qPanel('summary',notebookSummaryHTML(i))}${qPanel('solution',questionSolutionHTML(i))}${qPanel('related',relatedNotesHTML(i))}${qPanel('pdf',sec('课堂原图',mediaHTML(i),true))}${qPanel('test',userNote)}`;
    pane.innerHTML=`<button class="back" id="backBtn">← 返回列表</button><div class="dhead slim-head"><div><p>${esc(i.subject)} · ${esc(i.chapter)} · ${esc(i.category||i.range||'')}</p><h2>${esc(i.title)}</h2><div class="detail-import-tag">${esc(importTag(i))} · ${esc(fullImportDate(latestImportDate(i)))} ${i.sourceOrg?`<span class="source-org-badge ${i.sourceOrg==='蓝色森林'?'blue-forest':'allround'}">${esc(i.sourceOrg)}</span>`:''} <span class="record-type-badge ${recordTypeClass(type)}">${esc(type)}</span></div></div><span>${String(i.order||'').padStart(3,'0')}</span></div>${ops}<div class="tabs slim-tabs">${tabs}</div>${panels}`;
    return;
  }

  const activePanel = noteMode ? (['learn','summary','pdf','phrase','test'].includes(state.panel)?state.panel:'learn') : (state.panel || (i.pageCloze ? 'cloze' : 'learn'));
  const learnHTML = noteMode
    ? `<div class="note-reading-tip"><b>阅读笔记</b><span>本卡不参与填空背诵、掌握率和抗遗忘，只用于理解、复习与查阅。</span></div>${sec('快速概览',list([i.oneLine]),true)}${blocksHTML(i)}`
    : (i.pageCloze
      ? '<p class="muted slim-tip">这类卡来自录屏黄色重点，直接用“填空背诵”和“PDF原图/干净整理”即可。</p>'
      : `${sec('先背这里', list(i.mustPatterns||[]), true)}${sec('详细解释版', list(i.basicExplain||[]), true)}${blocksHTML(i)}`);
  const ops=noteMode
    ? `<div class="ops slim-ops"><button data-act="read" class="${s.read?'on':''}">${s.read?'已看':'标已看'}</button><button data-act="star" class="star ${s.starred?'on':''}">重点</button><span class="note-mode-tag">只读笔记</span></div>`
    : `<div class="ops slim-ops"><button data-act="read" class="${s.read?'on':''}">${s.read?'已看':'标已看'}</button><button data-act="star" class="star ${s.starred?'on':''}">重点</button><button data-act="master" class="master ${s.mastered?'on':''}">${s.mastered?'已掌握':'掌握'}</button><button data-act="forget" class="memory-on">抗遗忘</button></div>`;
  const noteTabs=`${tab('learn','笔记整理')}${tab('summary','笔记本总结')}${tab('pdf','课堂原图')}${tab('phrase','例句')}${tab('test','我的笔记')}`;
  const studyTabs=`${tab('learn','背诵整理')}${tab('summary','笔记本总结')}${tab('cloze','填空背诵')}${tab('pdf','PDF原图/干净整理')}${tab('exam','考试考法')}${tab('confuse','易混/图表')}${tab('phrase','例句/短语')}${tab('test','自测')}${tab('memory','抗遗忘')}`;
  const notePanels=`${panel('learn',learnHTML)}${panel('summary',notebookSummaryHTML(i))}${panel('pdf',sec('课堂原图',mediaHTML(i),true))}${panel('phrase',examplesHTML(i.examples||[]))}${panel('test',userNote)}`;
  const studyPanels=`${panel('learn',learnHTML)}${panel('summary',notebookSummaryHTML(i))}${panel('cloze',clozeHTML(i))}${panel('pdf',`${sec('原图 / 答案页', mediaHTML(i), true)}${!i.pageCloze ? sec('PDF内容提取：清爽整理版', cleanExtractHTML(i), true) : ''}`)}${panel('exam',`${sec('考点提炼', list(i.examRefine||[]), true)}${sec('必背句式 / 固定结构', list(i.mustPatterns||[]), true)}`)}${panel('confuse',`${confusionHTML(i.confusions||[])}${(i.tables||[]).map(tableHTML).join('')}`)}${panel('phrase',`${examplesHTML(i.examples||[])}${phraseHTML(i.phraseGroups||[])}`)}${panel('test',`${testsHTML(i.selfTests||[])}${userNote}`)}${panel('memory',memoryHTML(i))}`;
  pane.innerHTML=`<button class="back" id="backBtn">← 返回列表</button><div class="dhead slim-head"><div><p>${esc(i.subject)} · ${esc(i.chapter)} · ${esc(i.category||i.range||'')}</p><h2>${esc(i.title)}</h2><div class="detail-import-tag">${esc(importTag(i))} · ${esc(fullImportDate(latestImportDate(i)))} ${i.sourceOrg?`<span class="source-org-badge ${i.sourceOrg==='蓝色森林'?'blue-forest':'allround'}">${esc(i.sourceOrg)}</span>`:''} <span class="record-type-badge ${recordTypeClass(type)}">${esc(type)}</span></div></div><span>${String(i.order||'').padStart(3,'0')}</span></div>${ops}<div class="tabs slim-tabs">${noteMode?noteTabs:studyTabs}</div>${noteMode?notePanels:studyPanels}`;
  requestAnimationFrame(()=>$$('#detailPane [data-cloze-input]').forEach(resizeClozeInput));
}
function renderFilteredContent({filters=false,tree=false}={}){if(filters)renderFilters();if(tree)renderTree();renderStats();renderKnowledgeBlockStats();renderChapterMindmap();renderList();renderDetail();syncImportHistoryActive()}
function renderStudyUpdate(){renderStats();renderKnowledgeBlockStats();renderChapterMindmap();renderTree();renderTasks();renderReview();renderList();renderDetail();syncImportHistoryActive()}
function render(){renderStats();renderFilters();renderTree();renderTasks();renderImportHistory();renderKnowledgeBlockStats();renderChapterMindmap();renderReview();renderAudit();renderList();renderDetail();renderTimer()}
document.addEventListener('click',async e=>{
  const subj=e.target.closest('[data-subject]'); if(subj && subj.parentElement?.id==='subjectTabs'){state.blockKey='';state.chapterRootKey='';state.subject=subj.dataset.subject||'';state.chapter='';state.selected='';renderFilteredContent({filters:true,tree:true});return}
  const content=e.target.closest('[data-content-mode]'); if(content && content.parentElement?.id==='contentTabs'){state.contentMode=content.dataset.contentMode||'';state.selected='';renderFilteredContent();return}
  const tree=e.target.closest('[data-chapter]'); if(tree){state.blockKey='';state.chapterRootKey='';state.chapter=tree.dataset.chapter;state.selected='';renderFilteredContent({filters:true,tree:true});return}
  const ib=e.target.closest('[data-import-batch]'); if(ib){state.blockKey='';state.chapterRootKey='';state.importBatch=state.importBatch===ib.dataset.importBatch?'':ib.dataset.importBatch;state.recordType='';state.selected='';const filter=$('#importBatchFilter');if(filter)filter.value=state.importBatch;const rt=$('#recordTypeFilter');if(rt)rt.value='';renderFilteredContent();document.querySelector('.layout')?.scrollIntoView({behavior:'auto',block:'start'});return}
  const ir=e.target.closest('[data-import-record]'); if(ir){state.blockKey='';state.chapterRootKey='';state.importBatch=ir.dataset.importRecord||'';state.recordType=ir.dataset.recordType||'';state.selected='';const filter=$('#importBatchFilter');if(filter)filter.value=state.importBatch;const rt=$('#recordTypeFilter');if(rt)rt.value=state.recordType;renderFilteredContent();document.querySelector('.layout')?.scrollIntoView({behavior:'auto',block:'start'});return}
  const imgSummary=e.target.closest('.import-source-images > summary');if(imgSummary){ensureImportImages(imgSummary.parentElement);return}
  const loadMoreImages=e.target.closest('[data-load-more-images]');if(loadMoreImages){ensureImportImages(loadMoreImages.closest('.import-source-images'),true);return}
  const blockFilter=e.target.closest('[data-block-filter]');if(blockFilter){state.chapterRootKey='';state.blockKey=state.blockKey===blockFilter.dataset.blockFilter?'':blockFilter.dataset.blockFilter;state.subject='';state.chapter='';state.importBatch='';state.recordType='';state.contentMode='';state.selected='';renderFilteredContent({filters:true,tree:true});document.querySelector('.layout')?.scrollIntoView({behavior:'auto',block:'start'});return}
  const blockClear=e.target.closest('[data-block-clear]');if(blockClear){state.blockKey='';state.selected='';renderFilteredContent({filters:true,tree:true});return}
  const blockCopy=e.target.closest('[data-block-copy]');if(blockCopy){const block=BLOCK_INDEX.byKey.get(blockCopy.dataset.blockCopy);if(!block)return;const ok=await copyPlainText(blockStatsText(block));blockCopy.textContent=ok?'已复制 ✓':'复制失败';setTimeout(()=>{blockCopy.textContent='复制统计'},1200);return}
  const mindmapItem=e.target.closest('[data-mindmap-item]');if(mindmapItem){const it=ITEM_BY_ID.get(mindmapItem.dataset.mindmapItem);if(!it)return;state.chapterRootKey=itemChapterRootKey(it);state.blockKey='';state.subject='';state.chapter='';state.importBatch='';state.recordType='';state.contentMode='';state.selected=it.id;state.panel=defaultPanelFor(it);markRead(it.id);renderFilteredContent({filters:true,tree:true});document.querySelector('.layout')?.scrollIntoView({behavior:'smooth',block:'start'});return}
  const mindmapBlock=e.target.closest('[data-mindmap-block-filter]');if(mindmapBlock){state.chapterRootKey='';state.blockKey=mindmapBlock.dataset.mindmapBlockFilter||'';state.subject='';state.chapter='';state.importBatch='';state.recordType='';state.contentMode='';state.selected='';renderFilteredContent({filters:true,tree:true});document.querySelector('.layout')?.scrollIntoView({behavior:'smooth',block:'start'});return}
  if(e.target.id==='mindmapFilterChapterBtn'){const key=state.mindmapChapterKey;if(!key)return;state.blockKey='';state.chapterRootKey=state.chapterRootKey===key?'':key;state.subject='';state.chapter='';state.importBatch='';state.recordType='';state.contentMode='';state.selected='';renderFilteredContent({filters:true,tree:true});if(state.chapterRootKey)document.querySelector('.layout')?.scrollIntoView({behavior:'smooth',block:'start'});return}
  const mindmapClear=e.target.closest('[data-mindmap-clear]');if(mindmapClear){state.chapterRootKey='';state.selected='';renderFilteredContent({filters:true,tree:true});return}
  if(e.target.id==='mindmapExpandBtn'){$$('#chapterMindmapList details').forEach(d=>d.open=true);return}
  if(e.target.id==='mindmapCollapseBtn'){$$('#chapterMindmapList details').forEach(d=>d.open=false);return}
  if(e.target.id==='mindmapCopyBtn'){const chapter=CHAPTER_MINDMAP_INDEX.byKey.get(state.mindmapChapterKey);if(!chapter)return;const ok=await copyPlainText(chapterMindmapText(chapter));e.target.textContent=ok?'已复制 ✓':'复制失败';setTimeout(()=>{e.target.textContent='复制导图'},1200);return}
  const task=e.target.closest('[data-task]'); if(task){state.selected=task.dataset.task;const it=ITEM_BY_ID.get(state.selected);state.panel=defaultPanelFor(it);markRead(state.selected);renderFilteredContent();return}
  const row=e.target.closest('.row'); if(row){state.selected=row.dataset.id;const it=ITEM_BY_ID.get(state.selected);state.panel=defaultPanelFor(it);markRead(state.selected);renderKnowledgeBlockStats();renderChapterMindmap();renderList();renderDetail();return}
  const act=e.target.closest('[data-act]')?.dataset.act; if(act&&state.selected){const s=st(state.selected); if(act==='read')setst(state.selected,{read:!s.read}); if(act==='star')setst(state.selected,{starred:!s.starred}); if(act==='wrong')setst(state.selected,{wrong:!s.wrong,read:true}); if(act==='master'){setst(state.selected,{mastered:!s.mastered,read:true});if(!s.mastered){ensureReview(state.selected);renderReview();renderStats();}} if(act==='forget'){ensureReview(state.selected);renderStudyUpdate();} return}
  const panel=e.target.closest('[data-panel]'); if(panel){const name=panel.dataset.panel;state.panel=name; $$('.tabs button').forEach(b=>b.classList.toggle('active',b.dataset.panel===name)); $$('.panel').forEach(p=>p.classList.toggle('active',p.dataset.panelBox===name)); return}
  
  const ro=e.target.closest('[data-review-open]'); if(ro){state.selected=ro.dataset.reviewOpen;const it=ITEM_BY_ID.get(state.selected);state.panel=defaultPanelFor(it);markRead(state.selected);renderFilteredContent();return}
  const ra=e.target.closest('[data-review-add]'); if(ra){ensureReview(ra.dataset.reviewAdd);renderStudyUpdate();return}
  const rk=e.target.closest('[data-review-ok]'); if(rk){scheduleReview(rk.dataset.reviewOk,true); return}
  const rn=e.target.closest('[data-review-no]'); if(rn){scheduleReview(rn.dataset.reviewNo,false); return}
  if(e.target.id==='reviewTodayBtn'){state.reviewMode='today'; renderReview(); return}
  if(e.target.id==='reviewAllBtn'){state.reviewMode='all'; renderReview(); return}
  if(e.target.id==='timerStart'){startTimer(); return}
  if(e.target.id==='timerPause'){pauseTimer(); return}
  if(e.target.id==='timerReset'){resetTimer(); return}



  const related=e.target.closest('[data-related-open]'); if(related){state.selected=related.dataset.relatedOpen;state.panel=defaultPanelFor(ITEMS.find(x=>x.id===state.selected));markRead(state.selected);renderFilteredContent();return}
  const qReveal=e.target.closest('[data-question-reveal]'); if(qReveal){const box=qReveal.closest('[data-question-id]'),id=box?.dataset.questionId,rec=questionBucket(id,true);rec.questionRevealed=!rec.questionRevealed;persistAnswer(id);renderDetail();return}
  const qClear=e.target.closest('[data-question-clear]'); if(qClear){const box=qClear.closest('[data-question-id]'),id=box?.dataset.questionId,rec=questionBucket(id,true);rec.questionText='';rec.questionRevealed=false;persistAnswer(id);renderDetail();return}
  const qSave=e.target.closest('[data-question-save]'); if(qSave){const box=qSave.closest('[data-question-id]'),id=box?.dataset.questionId,ta=box?.querySelector('[data-question-input]'),rec=questionBucket(id,true);rec.questionText=ta?.value||'';persistAnswer(id);setst(id,{read:true});return}

  const pr=e.target.closest('[data-page-reveal]'); if(pr){(pr.closest('.page-cloze')||pr.closest('.video-fallback'))?.classList.toggle('show-page-answer'); return}
  const pc=e.target.closest('[data-page-clear]'); if(pc){const ta=pc.closest('.page-cloze')?.querySelector('.page-answer-input'); if(ta)ta.value=''; return}

  const modeBtn=e.target.closest('[data-cloze-mode]'); if(modeBtn){const box=modeBtn.closest('.cloze-box'),id=box?.dataset.itemId,total=Number(box?.dataset.totalBlanks||0),m=clozeModeState(id,total);m.mode=modeBtn.dataset.clozeMode;if(m.mode==='random')m.randomIndices=randomIndices(total);if(m.mode==='single'&&!Number.isFinite(m.singleIndex))m.singleIndex=0;state.panel='cloze';renderDetail();return}
  const randomize=e.target.closest('[data-cloze-randomize]'); if(randomize){const box=randomize.closest('.cloze-box'),id=box?.dataset.itemId,total=Number(box?.dataset.totalBlanks||0),m=clozeModeState(id,total);m.mode='random';m.randomIndices=randomIndices(total);state.panel='cloze';renderDetail();return}
  const prevBlank=e.target.closest('[data-cloze-prev-blank]'); if(prevBlank){const box=prevBlank.closest('.cloze-box'),id=box?.dataset.itemId,total=Number(box?.dataset.totalBlanks||0),m=clozeModeState(id,total);m.mode='single';m.singleIndex=(m.singleIndex-1+total)%Math.max(1,total);state.panel='cloze';renderDetail();return}
  const nextBlank=e.target.closest('[data-cloze-next-blank]'); if(nextBlank){const box=nextBlank.closest('.cloze-box'),id=box?.dataset.itemId,total=Number(box?.dataset.totalBlanks||0),m=clozeModeState(id,total);m.mode='single';m.singleIndex=(m.singleIndex+1)%Math.max(1,total);state.panel='cloze';renderDetail();return}
  const ck=e.target.closest('[data-cloze-check]'); if(ck){
    const box=ck.closest('.cloze-box'),result=checkClozeBox(box);
    if(result.all){
      const total=Number(box.dataset.totalBlanks||result.inputs.length),m=clozeModeState(result.itemId,total),selectedAtCheck=state.selected;
      if(m.mode==='single'&&m.singleIndex<total-1){setTimeout(()=>{if(state.selected!==selectedAtCheck)return;m.singleIndex++;renderDetail()},550)}
      else if(data.settings.autoNext)setTimeout(()=>{if(state.selected===selectedAtCheck)goNextStudyItem()},750);
    }
    return
  }
  const wrongRetry=e.target.closest('[data-cloze-wrong-retry]'); if(wrongRetry){const box=wrongRetry.closest('.cloze-box'),id=box?.dataset.itemId,total=Number(box?.dataset.totalBlanks||0),m=clozeModeState(id,total),rec=answerBucket(id,true);m.mode='wrong';m.wrongIndices.forEach(idx=>{rec.values[idx]='';delete rec.statuses[idx];delete rec.feedbacks[idx];delete rec.hints[idx]});persistAnswer(id);state.panel='cloze';renderDetail();return}
  const hint=e.target.closest('[data-cloze-hint]'); if(hint){const box=hint.closest('.cloze-box'),id=box?.dataset.itemId,idx=Number(hint.dataset.clozeHint),rec=answerBucket(id,true);rec.hints[idx]=Math.min(3,Number(rec.hints[idx]||0)+1);persistAnswer(id);state.panel='cloze';renderDetail();requestAnimationFrame(()=>document.querySelector(`.cloze-box[data-item-id="${CSS.escape(id)}"] [data-blank-index="${idx}"] textarea`)?.focus());return}
  const refill=e.target.closest('[data-cloze-refill]'); if(refill){const box=refill.closest('.cloze-box'),id=box?.dataset.itemId,idx=Number(refill.dataset.clozeRefill),rec=answerBucket(id,true);rec.values[idx]='';delete rec.statuses[idx];delete rec.feedbacks[idx];delete rec.hints[idx];persistAnswer(id);state.panel='cloze';renderDetail();requestAnimationFrame(()=>document.querySelector(`.cloze-box[data-item-id="${CSS.escape(id)}"] [data-blank-index="${idx}"] textarea`)?.focus());return}
  const cr=e.target.closest('[data-cloze-reveal]'); if(cr){const box=cr.closest('.cloze-box'),id=box?.dataset.itemId,rec=answerBucket(id,true);rec.revealed=!rec.revealed;persistAnswer(id);box?.classList.toggle('show-answers',rec.revealed);cr.textContent=rec.revealed?'隐藏答案':'答案';return}
  const refillAll=e.target.closest('[data-cloze-refill-all]'); if(refillAll){const box=refillAll.closest('.cloze-box'),id=box?.dataset.itemId,rec=answerBucket(id,true);[...(box?.querySelectorAll('[data-cloze-input]')||[])].forEach(inp=>{const idx=Number(inp.dataset.blankIndex);rec.values[idx]='';delete rec.statuses[idx];delete rec.feedbacks[idx];delete rec.hints[idx]});rec.revealed=false;persistAnswer(id);state.panel='cloze';renderDetail();requestAnimationFrame(()=>$('#detailPane [data-cloze-input]')?.focus());return}
  const cc=e.target.closest('[data-cloze-clear]'); if(cc){const box=cc.closest('.cloze-box'),id=box?.dataset.itemId;delete answerRoot()[id];persistAnswer(id);state.panel='cloze';renderDetail();return}

  const auditOpen=e.target.closest('[data-audit-open]'); if(auditOpen){state.selected=auditOpen.dataset.auditOpen;const it=ITEM_BY_ID.get(state.selected);state.panel=defaultPanelFor(it);markRead(state.selected);renderFilteredContent();return}
  if(e.target.id==='auditOnlyBtn'){state.auditOnly=!state.auditOnly;state.selected='';renderAudit();renderFilteredContent();return}
  if(e.target.id==='resetAllAnswers'){const ids=[...new Set([...Object.keys(data.answers||{}),...Object.keys(state.redoAnswers||{})])];if(confirm('重置全部作答痕迹？收藏、笔记、已掌握状态和学习时长都会保留。'))clearAnswerIds(ids);return}
  if(e.target.id==='resetChapterAnswers'){const current=ITEMS.find(x=>x.id===state.selected),chapter=state.chapter||current?.chapter;if(!chapter){alert('请先选择一张卡片或章节。');return}const ids=ITEMS.filter(x=>x.chapter===chapter).map(x=>x.id);if(confirm(`重置“${chapter}”的作答痕迹？`))clearAnswerIds(ids);return}
  if(e.target.id==='resetTypeAnswers'){const current=ITEM_BY_ID.get(state.selected);if(!current){alert('请先选择一张卡片。');return}const type=questionType(current),ids=ITEMS.filter(x=>questionType(x)===type).map(x=>x.id);if(confirm(`重置全部“${type}”作答痕迹？`))clearAnswerIds(ids);return}
  const copySummary=e.target.closest('[data-copy-summary]'); if(copySummary){const it=ITEM_BY_ID.get(copySummary.dataset.copySummary);if(!it)return;const ok=await copyPlainText(notebookSummaryText(it));copySummary.textContent=ok?'已复制 ✓':'复制失败';setTimeout(()=>{copySummary.textContent='复制全文'},1200);return}
  const copied=e.target.closest('[data-notebook-copied]'); if(copied){const id=copied.dataset.notebookCopied;data.study[id]={...st(id),notebookCopied:!st(id).notebookCopied,updatedAt:new Date().toISOString()};save();state.panel='summary';renderKnowledgeBlockStats();renderDetail();renderList();return}
  const phrase=e.target.closest('.phrase'); if(phrase){phrase.classList.toggle('show'); return}
  if(e.target.id==='showPhraseAnswers'){$('#phraseGrid')?.classList.toggle('show-answers'); return}
  if(e.target.id==='backBtn'){document.body.classList.remove('detail-mode'); return}
  if(e.target.id==='themeBtn'){document.body.classList.toggle('dark'); localStorage.setItem('zsb-theme',document.body.classList.contains('dark')?'dark':'light'); return}
  if(e.target.id==='checkinBtn'){data.stats.checkins[today()]=true; save(); renderStats(); return}
  const img=e.target.closest('.zoom'); if(img){$('#dialogImage').src=img.src; $('#imageDialog').showModal()}
});
function markRead(id){if(!st(id).read){data.study[id]={...st(id),read:true,updatedAt:new Date().toISOString()}; save()}}
let searchRenderTimer=null;
document.addEventListener('input',e=>{
  const ci=e.target.closest('[data-cloze-input]'); if(ci){const box=ci.closest('.cloze-box'),id=box?.dataset.itemId,idx=Number(ci.dataset.blankIndex),rec=answerBucket(id,true);rec.values[idx]=ci.value;delete rec.statuses[idx];delete rec.feedbacks[idx];persistAnswer(id);resizeClozeInput(ci);ci.classList.remove('ok','near','bad','empty');const wrap=ci.closest('.cloze-blank');wrap?.classList.remove('ok','near','bad','empty');const fb=wrap?.querySelector('.cloze-feedback');if(fb&&!Number(rec.hints[idx]||0))fb.textContent='';return}
  if(e.target.id==='searchInput'){state.q=e.target.value;state.selected='';if(searchRenderTimer)clearTimeout(searchRenderTimer);searchRenderTimer=setTimeout(()=>{searchRenderTimer=null;renderFilteredContent()},120)}
  if(e.target.id==='hideMastered'){state.hideMastered=e.target.checked;state.selected='';renderFilteredContent()}
  if(e.target.id==='detailMode'){state.detailMode=e.target.checked;document.body.classList.toggle('detail-on',state.detailMode)}
  if(e.target.id==='redoMode'){state.redoMode=e.target.checked;state.redoAnswers={};state.panel='cloze';renderFilteredContent()}
  if(e.target.matches('[data-auto-next]')){data.settings.autoNext=e.target.checked;save()}
  if(e.target.dataset.note){data.study[e.target.dataset.note]={...st(e.target.dataset.note),note:e.target.value,updatedAt:new Date().toISOString()};scheduleSave()}
  if(e.target.dataset.questionInput){const rec=questionBucket(e.target.dataset.questionInput,true);rec.questionText=e.target.value;persistAnswer(e.target.dataset.questionInput)}
});
$('#mindmapChapterSelect')?.addEventListener('change',e=>{state.mindmapChapterKey=e.target.value;renderChapterMindmap()});
$('#chapterFilter').addEventListener('change',e=>{state.blockKey='';state.chapterRootKey='';state.chapter=e.target.value;state.selected='';renderFilteredContent({tree:true})});
$('#statusFilter').addEventListener('change',e=>{state.status=e.target.value;state.selected='';renderFilteredContent()});
$('#importBatchFilter')?.addEventListener('change',e=>{state.blockKey='';state.chapterRootKey='';state.importBatch=e.target.value;state.selected='';renderFilteredContent()});
$('#recordTypeFilter')?.addEventListener('change',e=>{state.blockKey='';state.chapterRootKey='';state.recordType=e.target.value;state.selected='';renderFilteredContent()});
$('#sourceOrgFilter')?.addEventListener('change',e=>{state.blockKey='';state.chapterRootKey='';state.sourceOrg=e.target.value;state.selected='';renderFilteredContent()});
$('#closeDialog').addEventListener('click',()=>$('#imageDialog').close());
$('#exportNotebookBtn')?.addEventListener('click',()=>{const blob=new Blob([allNotebookSummaryText()],{type:'text/plain;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='专升本笔记本总结_v53_大型导图联动版.txt';a.click();URL.revokeObjectURL(a.href)});
$('#exportBtn').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({version:53,knowledgeVersion:META.version,importDates:META.importBatches||[],exportedAt:new Date().toISOString(),study:data.study,stats:data.stats,reviews:data.reviews,answers:data.answers,blockCompletions:data.blockCompletions,chapterCompletions:data.chapterCompletions,settings:data.settings},null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='专升本知识点学习记录_v53_大型导图联动版.json'; a.click(); URL.revokeObjectURL(a.href)});
$('#importInput').addEventListener('change',async e=>{const f=e.target.files?.[0]; if(!f)return; try{const x=JSON.parse(await f.text()); data.study=compat(x.study||x||{}); data.stats=x.stats||data.stats; data.reviews=x.reviews||data.reviews||{};data.answers=x.answers||data.answers||{};data.blockCompletions=x.blockCompletions||data.blockCompletions||{};data.chapterCompletions=x.chapterCompletions||data.chapterCompletions||{};data.settings={...data.settings,...(x.settings||{})}; save(); render(); alert('导入完成')}catch{alert('导入失败，请选择正确 JSON')}});
setInterval(()=>{if(document.hidden||!state.selected)return; const i=ITEM_BY_ID.get(state.selected); if(!i)return; data.stats.totalSeconds=(data.stats.totalSeconds||0)+15; data.stats.days[today()]=(data.stats.days[today()]||0)+15; data.stats.subjectSeconds[i.subject]=(data.stats.subjectSeconds[i.subject]||0)+15; data.stats.itemSeconds[i.id]=(data.stats.itemSeconds[i.id]||0)+15; save(); renderStats();},15000);

document.addEventListener('compositionstart',e=>{const inp=e.target.closest?.('[data-cloze-input]');if(inp)inp.dataset.composing='1'});
document.addEventListener('compositionend',e=>{const inp=e.target.closest?.('[data-cloze-input]');if(inp){delete inp.dataset.composing;resizeClozeInput(inp)}});
document.addEventListener('keydown',e=>{
  const inp=e.target.closest?.('[data-cloze-input]');
  if(!inp||e.key!=='Enter'||e.isComposing||inp.dataset.composing==='1')return;
  e.preventDefault();
  const inputs=[...(inp.closest('.cloze-box')?.querySelectorAll('[data-cloze-input]')||[])],next=inputs[inputs.indexOf(inp)+1];
  if(next){next.focus();next.select()}else inp.blur();
});
window.addEventListener('resize',()=>$$('#detailPane [data-cloze-input]').forEach(resizeClozeInput));
window.addEventListener('pagehide',()=>{if(saveTimer)save()});

if(localStorage.getItem('zsb-theme')==='dark') document.body.classList.add('dark');
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('#installBtn').classList.remove('hidden')});
$('#installBtn').addEventListener('click',async()=>{if(deferredPrompt){deferredPrompt.prompt(); deferredPrompt=null; $('#installBtn').classList.add('hidden')}});
if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>{})}
const deepLinkItem=new URLSearchParams(location.search).get('item');
if(deepLinkItem&&ITEM_BY_ID.has(deepLinkItem)){
  const it=ITEM_BY_ID.get(deepLinkItem);
  state.subject='';state.chapter='';state.chapterRootKey='';state.blockKey='';state.importBatch='';state.recordType='';state.sourceOrg='';state.contentMode='';state.q='';
  state.selected=deepLinkItem;state.panel=defaultPanelFor(it);
}
render();
if(deepLinkItem&&ITEM_BY_ID.has(deepLinkItem))requestAnimationFrame(()=>document.querySelector('.layout')?.scrollIntoView({behavior:'auto',block:'start'}));
