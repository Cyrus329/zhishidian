(() => {
  'use strict';
  const ITEMS = Array.isArray(window.KNOWLEDGE_ITEMS) ? window.KNOWLEDGE_ITEMS : [];
  const STORE = 'zsb-knowledge-v26-day1';
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dateKey = (date=new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const addDays = days => { const d=new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()+Number(days||0)); return dateKey(d); };
  const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
  const uniq = arr => [...new Set(arr)];

  function defaults(){
    return {
      study:{}, stats:{totalSeconds:0,subjectSeconds:{},itemSeconds:{},days:{},checkins:{},focusSessions:0},
      reviews:{}, recall:{}, answers:{}, blockCompletions:{}, chapterCompletions:{},
      settings:{autoNext:true,examDate:'',theme:'light'}, dailyPlans:{}, errorReasons:{}, eventLog:[], challengeRecords:{}, quickReview:{},
      v60:{completedBlocks:{},lastOpen:''}
    };
  }
  function load(){
    const base=defaults();
    try{ const raw=localStorage.getItem(STORE); if(raw)Object.assign(base,JSON.parse(raw)); }catch(err){console.warn('学习记录读取失败',err)}
    base.study ||= {}; base.stats ||= defaults().stats; base.stats.subjectSeconds ||= {}; base.stats.itemSeconds ||= {}; base.stats.days ||= {}; base.stats.checkins ||= {};
    base.reviews ||= {}; base.recall ||= {}; base.answers ||= {}; base.settings={autoNext:true,examDate:'',theme:'light',...(base.settings||{})};
    base.eventLog ||= []; base.errorReasons ||= {}; base.v60 ||= {completedBlocks:{},lastOpen:''}; base.v60.completedBlocks ||= {};
    return base;
  }
  let data=load(), saveTimer=null;
  function save(delay=0){ if(saveTimer)clearTimeout(saveTimer); saveTimer=setTimeout(()=>{localStorage.setItem(STORE,JSON.stringify(data));saveTimer=null},delay); }
  function state(id){ return data.study[id] || {read:false,starred:false,mastered:false,wrong:false,note:''}; }
  function updateState(id,patch){ data.study[id]={...state(id),...patch,updatedAt:new Date().toISOString()}; save(0); return data.study[id]; }

  function isQuestion(i){ return i?.studyMode==='question' || String(i?.recordType||'').includes('题目'); }
  function isNote(i){ return !isQuestion(i) && (i?.studyMode==='note' || String(i?.recordType||'').includes('笔记')); }
  function isUnderstand(i){ return !isQuestion(i) && !isNote(i) && (i?.studyMode==='understand' || String(i?.recordType||'').includes('了解')); }
  function isPdf(i){ return String(i?.recordType||'').includes('PDF'); }
  function isPdfTrack(i){ return i?.pdfTrack===true; }
  function isSourceMaterial(i){
    if(i?.boldOnlyRule || i?.studyMode==='understand')return false;
    const text=`${i?.recordType||''} ${i?.category||''} ${i?.title||''}`;
    return isPdf(i) || /PDF|扫描讲义|原讲义|资料整理/.test(text);
  }
  function isKnowledge(i){ return !isQuestion(i) && !isNote(i) && !isUnderstand(i) && !isPdf(i); }
  function parts(i){ return String(i?.chapter||'未分章').split('｜').map(x=>x.trim()).filter(Boolean); }
  function chapter(i){ const p=parts(i); return p[1] || p[0] || '未分章'; }
  function section(i){ const p=parts(i); return p.length>2 ? p.slice(2).join('｜') : '本章内容'; }
  function source(i){ return i?.sourceOrg || '未标注'; }
  function dateLabel(i){ return i?.importDate ? `${i.importDate} · 第${i.importDay||'?'}天` : (i?.importLabel||'未记录'); }

  function groupInfo(i){
    const subject=i?.subject||'未分类', rawSection=section(i), cat=String(i?.category||''), title=String(i?.title||'');
    if(i?.pdfModule)return {section:i.pdfSection||rawSection,title:i.pdfModule};
    if(isSourceMaterial(i)) return {section:rawSection,title:'原始资料'};
    if(subject==='计算机'){
      if(rawSection.includes('1.1')){
        if(/历史人物|图片知识点|历史事件/.test(cat))return {section:'1.1 计算机文化基础',title:'人物与发展史'};
        if(/性能指标|计算机特点|计算机的特点/.test(cat))return {section:'1.1 计算机文化基础',title:'特点与性能'};
        if(/计算机的分类|嵌入式计算机/.test(cat))return {section:'1.1 计算机文化基础',title:'分类与嵌入式计算机'};
        if(/计算机应用|计算机辅助工程|网络、多媒体与人工智能/.test(cat))return {section:'1.1 计算机文化基础',title:'应用与人工智能'};
        if(/发展趋势|计算机的未来|量子计算机/.test(cat))return {section:'1.1 计算机文化基础',title:'未来计算机'};
      }
      if(rawSection.includes('1.2')){
        if(/数制基本概念|数制转换/.test(cat))return {section:'1.2 数制与运算',title:'数制基础与转换'};
        if(/二进制运算|逻辑运算/.test(cat))return {section:'1.2 数制与运算',title:'二进制与逻辑运算'};
      }
      if(rawSection.includes('1.3')){
        if(/存储单位|机器数|浮点数/.test(cat))return {section:'1.3 信息编码与表示',title:'存储、机器数与浮点数'};
        if(/字符编码|汉字编码/.test(cat))return {section:'1.3 信息编码与表示',title:'字符与汉字编码'};
        if(/图形编码/.test(cat))return {section:'1.3 信息编码与表示',title:'图形编码'};
      }
      if(rawSection.includes('1.4'))return {section:'1.4 计算机系统组成',title:'软件系统'};
    }
    if(subject==='英语'){
      if(rawSection==='语法总览')return {section:'语法总览',title:'词性与语法体系'};
      if(rawSection==='句子结构')return {section:'句子结构',title:'句子成分与基本句型'};
      if(rawSection==='名词'){
        if(/名词分类|名词词义转换|物质与抽象名词|集合名词|抽象名词具体化/.test(cat))return {section:'名词',title:'名词分类与词义'};
        if(/名词的数|不可数名词计量|限定词与一致/.test(cat))return {section:'名词',title:'名词的数与计量'};
        if(/名词的所有格|名词句法功能/.test(cat))return {section:'名词',title:'所有格与句法功能'};
      }
      if(rawSection==='名词与代词综合' && /名词复数|名词作定语/.test(`${cat} ${title}`))return {section:'名词',title:'名词的数与计量'};
      if(rawSection==='代词' || rawSection==='代词与不定代词' || rawSection==='名词与代词综合'){
        if(/人称代词|物主与反身相互代词|反身代词|指示代词|指示与不定代词/.test(cat))return {section:'代词',title:'代词基础'};
        return {section:'代词',title:'不定代词与辨析'};
      }
      if(rawSection==='冠词')return {section:'冠词',title:'冠词'};
      if(rawSection==='数词')return {section:'数词',title:'数词课堂笔记'};
    }
    if(subject==='数学'){
      if(/1\.1 函数概念与定义域|1\.1 函数解析式|1\.1 函数分类/.test(rawSection))return {section:'1.1 函数基础',title:'函数概念、定义域与解析式'};
      if(rawSection.includes('反函数'))return {section:'1.2 反函数',title:'反函数'};
      if(rawSection.includes('基本初等函数图像'))return {section:'1.2 基本初等函数图像',title:'基本初等函数图像'};
      if(rawSection.includes('函数的性质'))return {section:'1.3 函数的性质',title:'函数的性质'};
      if(rawSection.includes('基础公式与三角函数') || rawSection.includes('基本初等函数')){
        if(/三角函数|反三角函数/.test(cat))return {section:'1.4 基础公式与三角函数',title:'三角函数与反三角函数'};
        return {section:'1.4 基础公式与三角函数',title:'代数、指数与对数基础'};
      }
      if(rawSection.includes('极限'))return {section:'1.5 极限的概念',title:'极限的概念'};
    }
    return {section:rawSection,title:cat||title||'未分类'};
  }
  function blockKey(i){ const g=groupInfo(i); return [i?.subject||'未分类',chapter(i),g.section,g.title].join('|||'); }
  function blockLabel(i){ const g=groupInfo(i); return `${i?.subject||'未分类'} · ${chapter(i)} · ${g.section} · ${g.title}`; }

  const BY_ID=new Map(ITEMS.map(i=>[i.id,i]));
  const SORTED=[...ITEMS].sort((a,b)=>(a.order||0)-(b.order||0));
  function subjectRank(subject){ return ({'计算机':1,'英语':2,'数学':3})[subject]||9; }
  function chineseChapterRank(text){
    const m=String(text||'').match(/第([一二三四五六七八九十百零〇两]+)章/); if(!m)return 999;
    const map={'零':0,'〇':0,'一':1,'二':2,'两':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9};
    const x=m[1]; if(x==='十')return 10; if(x.includes('十')){const [a,b='']=x.split('十');return (a?map[a]:1)*10+(b?map[b]:0)} return map[x]??999;
  }
  function sectionRank(text){
    const m=String(text||'').match(/(^|[^\d])(\d+)\.(\d+)/); if(m)return Number(m[2])*100+Number(m[3]);
    const order=['语法总览','句子结构','名词','冠词','数词','代词','动词','形容词','副词'];
    const i=order.findIndex(x=>String(text||'').includes(x)); return i>=0?500+i:900;
  }
  function pdfModuleRank(block){ const m=String(block?.category||'').match(/^(\d{2})-/); return m?Number(m[1]):999; }
  function categoryRank(block){
    const key=String(block?.category||'');
    const maps={
      '计算机|1.1':['人物与发展史','特点与性能','分类与嵌入式计算机','应用与人工智能','未来计算机'],
      '计算机|1.2':['数制基础与转换','二进制与逻辑运算'],
      '计算机|1.3':['存储、机器数与浮点数','字符与汉字编码','图形编码'],
      '英语|名词':['名词分类与词义','名词的数与计量','所有格与句法功能','名词与数量表达课堂笔记'],
      '英语|代词':['代词基础','不定代词与辨析'],
      '数学|1.1':['函数概念、定义域与解析式'],
      '数学|1.2':['反函数','基本初等函数图像'],
      '数学|1.3':['函数的性质'],
      '数学|1.4':['代数、指数与对数基础','三角函数与反三角函数'],
      '数学|1.5':['极限的概念']
    };
    const sectionCode=(String(block?.section||'').match(/\d+\.\d+/)||[])[0]||String(block?.section||'');
    const arr=maps[`${block?.subject||''}|${sectionCode}`]||maps[`${block?.subject||''}|${block?.section||''}`];
    const i=arr?arr.indexOf(key):-1; return i>=0?i:999;
  }
  function compareBlocks(a,b){
    return subjectRank(a.subject)-subjectRank(b.subject)
      || chineseChapterRank(a.chapter)-chineseChapterRank(b.chapter)
      || sectionRank(a.section)-sectionRank(b.section)
      || (a.track==='pdf'||b.track==='pdf'?pdfModuleRank(a)-pdfModuleRank(b):0)
      || categoryRank(a)-categoryRank(b)
      || Number(a.order||0)-Number(b.order||0)
      || String(a.category).localeCompare(String(b.category),'zh-CN');
  }
  function pdfDisplaySection(block){ return String(block?.section||'').startsWith('1.1')?'1.1 计算机文化基础':'1.2 计算思维与计算机文化'; }
  function pdfDisplayCode(block){ const m=String(block?.category||'').match(/^(\d{2})-(.+)$/); return m?`${String(block.section).match(/\d+\.\d+/)?.[0]||''}-${m[1]} ${m[2]}`:block.category; }
  function buildBlocks(){
    const map=new Map();
    SORTED.filter(i=>!isSourceMaterial(i)).forEach(i=>{
      const g=groupInfo(i),key=blockKey(i);
      const b=map.get(key)||{key,subject:i.subject||'未分类',chapter:chapter(i),section:g.section,category:g.title,items:[],order:i.order||0,track:isPdfTrack(i)?'pdf':'daily'};
      b.items.push(i); b.order=Math.min(b.order,i.order||b.order); if(isPdfTrack(i))b.track='pdf'; map.set(key,b);
    });
    return [...map.values()].map(b=>{
      b.knowledge=b.items.filter(isKnowledge); b.understand=b.items.filter(isUnderstand); b.notes=b.items.filter(isNote); b.questions=b.items.filter(isQuestion); b.pdfs=[];
      if(/^\d{2}-/.test(b.category))b.order=Number(b.category.slice(0,2));
      b.mastered=b.knowledge.filter(i=>state(i.id).mastered).length;
      b.readCount=b.understand.filter(i=>state(i.id).read).length;
      b.started=b.items.some(i=>state(i.id).read||state(i.id).mastered||state(i.id).wrong);
      b.progress=b.knowledge.length?Math.round(b.mastered/b.knowledge.length*100):(b.understand.length?Math.round(b.readCount/b.understand.length*100):0);
      b.complete=b.knowledge.length?b.mastered===b.knowledge.length:(!!b.understand.length&&b.readCount===b.understand.length);
      return b;
    }).sort(compareBlocks);
  }
  function refreshBlocks(track='all'){ const all=buildBlocks(); return track==='all'?all:all.filter(b=>b.track===track); }
  function dailyBlocks(){ return refreshBlocks('daily'); }
  function pdfBlocks(){ return refreshBlocks('pdf'); }
  function reviewDue(i){ const r=data.reviews?.[i.id]; return !!r?.due && r.due<=dateKey(); }
  function urgency(i){
    const s=state(i.id),r=data.reviews?.[i.id]||{}; let n=0;
    if(s.wrong)n+=100; if(reviewDue(i))n+=50; if(r.lastGrade===0)n+=20; if(!s.mastered)n+=5; n+=Math.min(10,Number(r.lapses||0)*2); return n;
  }
  function blockUrgency(b){ return Math.max(0,...b.knowledge.map(urgency))+b.knowledge.filter(i=>state(i.id).wrong||reviewDue(i)).length*3; }
  function dueBlocks(){ return dailyBlocks().filter(b=>b.knowledge.length&&b.knowledge.some(i=>state(i.id).wrong||reviewDue(i))).sort((a,b)=>blockUrgency(b)-blockUrgency(a)||compareBlocks(a,b)); }
  function nextBlock(exclude=new Set()){
    return dailyBlocks().filter(b=>b.knowledge.length&&!b.complete&&!exclude.has(b.key)).sort((a,b)=>(b.started?1:0)-(a.started?1:0)||compareBlocks(a,b))[0]||null;
  }
  function dueItems(){ return SORTED.filter(i=>!isPdfTrack(i)&&(isKnowledge(i)||isQuestion(i))&&(state(i.id).wrong||reviewDue(i))).sort((a,b)=>urgency(b)-urgency(a)||(a.order||0)-(b.order||0)); }
  function relatedQuestions(block){ if(!block)return []; return SORTED.filter(isQuestion).filter(q=>blockKey(q)===block.key).slice(0,5); }
  function todayPlan(){
    const due=dueBlocks(),todayDue=due.slice(0,4),excluded=new Set(due.map(b=>b.key));
    const newBlock=due.length>=4?null:nextBlock(excluded);
    const questions=relatedQuestions(newBlock).filter(i=>!state(i.id).mastered&&!state(i.id).wrong).slice(0,3);
    const queue=[...todayDue.map(block=>({type:'block',block,due:true})),...(newBlock?[{type:'block',block:newBlock,due:false}]:[]),...questions.map(item=>({type:'question',item}))];
    return {date:dateKey(),due,todayDue,block:newBlock,learn:newBlock?[newBlock]:[],questions,queue,backlog:Math.max(0,due.length-todayDue.length)};
  }
  function examDays(){ const value=data.settings.examDate;if(!value)return null;const a=new Date(`${dateKey()}T00:00:00`),b=new Date(`${value}T00:00:00`);return Math.ceil((b-a)/86400000); }
  function markGrade(item,grade){
    if(!item)return; const old=data.reviews[item.id]||{}; let interval;
    if(grade===0)interval=1; else if(grade===1)interval=2; else interval=old.interval?clamp(Math.round(old.interval*1.8),7,90):7;
    data.reviews[item.id]={...old,last:dateKey(),due:addDays(interval),interval,count:Number(old.count||0)+1,lastGrade:grade,lapses:Number(old.lapses||0)+(grade===0?1:0)};
    data.study[item.id]={...state(item.id),read:true,mastered:grade===2,wrong:grade===0,updatedAt:new Date().toISOString()};
    data.stats.days[dateKey()]=Number(data.stats.days[dateKey()]||0)+1;
    data.eventLog.push({type:'v60-grade',itemId:item.id,grade,date:dateKey(),time:new Date().toISOString()}); save(0);
  }
  function markBlockGrade(block,grade){ if(!block)return; const key=dateKey(),before=Number(data.stats.days[key]||0); block.knowledge.forEach(i=>markGrade(i,grade)); data.stats.days[key]=before+1; data.eventLog.push({type:'v60-block-grade',blockKey:block.key,grade,date:key,time:new Date().toISOString()}); save(0); }
  function markUnderstandBlock(block){ if(!block)return; block.understand.forEach(i=>updateState(i.id,{read:true})); data.eventLog.push({type:'v60-understand-read',blockKey:block.key,date:dateKey(),time:new Date().toISOString()}); save(0); }
  function subjectStats(subject){ const all=dailyBlocks().filter(b=>b.subject===subject&&b.knowledge.length),mastered=all.filter(b=>b.complete).length;return {subject,total:all.length,mastered,pct:all.length?Math.round(mastered/all.length*100):0}; }
  function pdfStats(){ const all=pdfBlocks(),completed=all.filter(b=>b.complete).length,memorize=all.filter(b=>b.knowledge.length),mastered=memorize.filter(b=>b.complete).length;return {total:all.length,completed,memorizeTotal:memorize.length,mastered,pct:all.length?Math.round(completed/all.length*100):0}; }
  function coach(){
    const wrong=dailyBlocks().map(b=>({b,count:b.knowledge.filter(i=>state(i.id).wrong).length})).filter(x=>x.count).sort((a,b)=>b.count-a.count)[0];
    if(wrong&&wrong.count>=2)return {level:'danger',title:'先补这一块',text:`“${wrong.b.category}”里有 ${wrong.count} 条细项标记为不会。今天只复习这个核心块，不再增加零散卡片。`,block:wrong.b};
    const due=dueBlocks(); if(due.length)return {level:'warn',title:'先处理到期核心块',text:`当前有 ${due.length} 个核心块需要复习，今天最多展示前4个，避免任务堆得太满。`};
    const block=nextBlock(); if(block)return {level:'ok',title:'一次只学一个核心块',text:`下一步是“${block.category}”。原来的 ${block.knowledge.length} 张细卡已经合并在这一块里。`,block};
    return {level:'ok',title:'当前资料已完成',text:'已导入的核心背诵块暂无未完成内容，可以进入题库巩固。'};
  }
  function contentLines(i){ return uniq([...(Array.isArray(i.mustPatterns)?i.mustPatterns:[]),...(Array.isArray(i.keyPoints)?i.keyPoints:[]),...(Array.isArray(i.solutionSteps)?i.solutionSteps:[]),...(Array.isArray(i.examRefine)?i.examRefine:[])].filter(Boolean)); }
  function scoreItem(i){ let s=0; if(/总表|总览|核心|规则|方法|总结|完整/.test(i.title||''))s+=30; if(/图片|知识点图/.test(`${i.title||''} ${i.recordType||''} ${i.category||''}`))s-=55; s+=Math.min(20,(i.mustPatterns||[]).length*3); if(i.sourceOrg)s+=5; s+=(i.order||0)/1000; return s; }
  function blockSummary(block){
    const reps=[...block.knowledge].sort((a,b)=>scoreItem(b)-scoreItem(a)); const core=[];
    const push=x=>{x=String(x||'').trim();if(x&&!core.includes(x)&&core.length<6)core.push(x)};
    reps.forEach(i=>{ if(i.boldOnlyRule)(i.mustPatterns||[]).slice(0,6).forEach(push); else if(/总表|总览|核心|规则|方法|总结|完整/.test(i.title||'')&&(i.mustPatterns||[]).length)(i.mustPatterns||[]).slice(0,3).forEach(push); else push(i.oneLine||i.notebookSummary?.conclusion||(i.mustPatterns||[])[0]); });
    reps.forEach(i=>(i.mustPatterns||[]).forEach(push));
    const keywords=uniq(reps.flatMap(i=>i.keywords||[]).filter(Boolean)).slice(0,12);
    return {core,keywords,titles:block.knowledge.map(i=>i.title),representative:reps[0]||block.knowledge[0]};
  }
  function answerHtml(i){
    if(isQuestion(i))return `<div class="answer-core"><strong>答案：${esc(i.answer||'资料未提供')}</strong></div>${i.solutionSteps?.length?`<ol>${i.solutionSteps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`:''}${i.principle?.summary?`<p class="principle"><b>本题原理：</b>${esc(i.principle.summary)}</p>`:''}`;
    const lines=contentLines(i).slice(0,8); return `<p class="one-line">${esc(i.oneLine||'')}</p>${lines.length?`<ul>${lines.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}${i.keywords?.length?`<div class="keyword-row">${i.keywords.slice(0,10).map(x=>`<span>${esc(x)}</span>`).join('')}</div>`:''}`;
  }
  function questionHtml(i){ if(!isQuestion(i))return `<div class="recall-question">先闭卷说出这个知识点的定义、关键词和易错点。</div>`; return `<div class="problem">${esc(i.problem||i.oneLine||i.title)}</div>${i.choices?.length?`<div class="choices">${i.choices.map(x=>`<p>${esc(x)}</p>`).join('')}</div>`:''}`; }
  function blockQuestionHtml(block){ return `<div class="recall-question"><b>闭卷回忆：</b>先说出“${esc(block.category)}”最核心的规则、定义或结论。无需逐张背原卡。</div>`; }
  function blockAnswerHtml(block){
    const s=blockSummary(block);
    if(block.track!=='pdf'){
      const coreLines=s.core.length?s.core:['本知识块请结合原细卡进行复习。'];
      const fine=block.knowledge.length?`<details class="fine-items"><summary>查看本块 ${block.knowledge.length} 张原细卡</summary><div class="fine-item-list">${block.knowledge.map(i=>`<a href="./library.html?item=${encodeURIComponent(i.id)}">${esc(i.title)}</a>`).join('')}</div></details>`:'';
      const understand=block.understand.length?`<details class="understand-details"><summary>补充了解内容 · ${block.understand.length}项</summary><div class="understand-tip">这些内容用于理解，不单独安排背诵。</div><div class="fine-item-list">${block.understand.map(i=>`<a href="./library.html?item=${encodeURIComponent(i.id)}">${esc(i.title)}</a>`).join('')}</div></details>`:'';
      return `<div class="compact-core daily-core"><div class="compact-core-title">日常核心必背 · 最多显示6条</div><ul>${coreLines.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>${s.keywords.length?`<div class="keyword-row">${s.keywords.map(x=>`<span>${esc(x)}</span>`).join('')}</div>`:''}${understand}${fine}`;
    }
    const boldItems=block.knowledge.filter(i=>i.boldOnlyRule);
    const allMust=uniq(boldItems.flatMap(i=>i.mustPatterns||[]));
    const groups=boldItems.flatMap(i=>i.mustGroups||[]);
    const understandGroups=boldItems.flatMap(i=>i.understandGroups||[]);
    const understandLines=uniq([...boldItems.flatMap(i=>i.understandOnly||[]),...block.understand.flatMap(i=>i.understandOnly||[])]);
    const sourceLinks=uniq([...boldItems,...block.understand].map(i=>i.sourcePdfPath).filter(Boolean));
    let core='';
    if(allMust.length){
      core=`<div class="compact-core bold-only-core"><div class="compact-core-title">只背原PDF黑色加粗内容 · ${allMust.length}条</div>${groups.length?groups.map(g=>`<section class="bold-group"><h4>${esc(g.title)}</h4><ul>${(g.lines||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`).join(''):`<ul>${allMust.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`}</div>`;
    }else{
      core='<div class="understand-only-banner"><b>本页没有加粗必背内容</b><span>整页只需阅读了解，不进入PDF背诵掌握率。</span></div>';
    }
    const understandCount=understandLines.length||understandGroups.reduce((n,g)=>n+(g.lines||[]).length,0);
    const understand=`<details class="understand-details"><summary>了解内容（不背） · ${understandCount}条</summary><div class="understand-tip">普通字和浅灰字只用于理解与查阅，不生成填空，不进入日常任务。</div>${understandGroups.length?understandGroups.map(g=>`<section><h4>${esc(g.title)}</h4><ul>${(g.lines||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`).join(''):(understandLines.length?`<ul>${understandLines.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p>请直接查看原PDF完整内容。</p>')} ${block.understand.length?`<details class="fine-items"><summary>查看原来的 ${block.understand.length} 张了解细卡</summary><div class="fine-item-list">${block.understand.map(i=>`<a href="./library.html?item=${encodeURIComponent(i.id)}">${esc(i.title)}</a>`).join('')}</div></details>`:''}</details>`;
    const pdfs=sourceLinks.length?`<div class="source-pdf-row">${sourceLinks.map((p,k)=>`<a href="${esc(p)}" target="_blank" rel="noopener">打开原PDF${sourceLinks.length>1?` ${k+1}`:''}</a>`).join('')}</div>`:'';
    return `${core}${s.keywords.length?`<div class="keyword-row">${s.keywords.map(x=>`<span>${esc(x)}</span>`).join('')}</div>`:''}${understand}${pdfs}`;
  }
  function openLibrary(id){ location.href=`./library.html?item=${encodeURIComponent(id)}`; }
  function registerSW(){ if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{}); }
  function setTheme(){ const mark='zsb-v60-1-contrast-theme-fixed';let theme=data.settings.theme||'light';if(!localStorage.getItem(mark)&&theme==='system'){theme='light';data.settings.theme='light';localStorage.setItem(mark,'1');save(0)}document.documentElement.dataset.theme=theme; }
  function exportData(){ const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`专升本学习记录_${dateKey()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000); }
  function importData(file){ return file.text().then(text=>{const parsed=JSON.parse(text);if(!parsed||typeof parsed!=='object')throw new Error('无效记录');data={...defaults(),...parsed};save(0);return true}); }
  function resetProgress(){ const settings={...data.settings};data=defaults();data.settings=settings;save(0); }
  window.V60={ITEMS,SORTED,BY_ID,STORE,$,$$,esc,dateKey,addDays,data:()=>data,save,state,updateState,isQuestion,isNote,isUnderstand,isPdf,isPdfTrack,isSourceMaterial,isKnowledge,parts,chapter,section,source,dateLabel,groupInfo,blockKey,blockLabel,refreshBlocks,dailyBlocks,pdfBlocks,compareBlocks,pdfDisplaySection,pdfDisplayCode,reviewDue,urgency,dueBlocks,nextBlock,dueItems,relatedQuestions,todayPlan,examDays,markGrade,markBlockGrade,markUnderstandBlock,subjectStats,pdfStats,coach,contentLines,blockSummary,answerHtml,questionHtml,blockQuestionHtml,blockAnswerHtml,openLibrary,registerSW,setTheme,exportData,importData,resetProgress,uniq};
})();
