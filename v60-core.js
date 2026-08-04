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
  function normalizeText(s){ return String(s||'').toLowerCase().replace(/[\s\u3000]/g,'').replace(/[，。、“”‘’；：:!！?？（）()【】\[\]<>《》、,.;+\-_=—]/g,''); }
  function cleanSentence(s){ return String(s||'').trim().replace(/[。；;]+$/,'').trim(); }
  function splitList(s){
    return uniq(String(s||'').replace(/[。；;]+$/,'').split(/(?:、|，|,|；|;|以及|并且|和|与|或)/).map(x=>x.trim().replace(/(?:五部分|四部分|三部分|两部分|两步|两大类)$/,'')).filter(x=>x.length>=2));
  }
  function meaningfulParts(s){
    const stop=new Set(['一个','一种','这些','所有','目前','现代','实际','主要','核心','基础','理论','问题','功能','内容','方法','方面','进行','可以','能够','不能','就是','也是','以及','并且','反之亦然']);
    const raw=String(s||'').replace(/[“”‘’《》【】()（）]/g,'').split(/(?:、|，|,|；|;|以及|并且|和|与|或|是|为|指|由|采用|具有|包括|分为|提出|证明|奠定|实现|解决|建立|构建|战胜|击败|成为|属于|通过|利用|使用)/);
    return uniq(raw.map(x=>x.trim()).filter(x=>x.length>=2&&x.length<=32&&!stop.has(x)));
  }
  function makeCheckQuestion(line,group,topic,keywords){
    const full=cleanSentence(line),ctx=group||topic||'本知识块';
    let m, prompt='', points=[], required=1;
    const set=(q,ps,need)=>{prompt=q;points=uniq((ps||[]).map(cleanSentence).filter(Boolean));required=Math.max(1,Math.min(Number(need||1),points.length||1));};
    if((m=full.match(/^“?神威·太湖之光”?于(\d{4}年)投入运行，CPU采用拥有自主知识产权的(.+)$/))){
      set(`“神威·太湖之光”何时投入运行？采用哪款自主CPU？`,[m[1],m[2]],2);
    }else if((m=full.match(/^计算机运算速度快、精度高$/))){
      set(`计算机在运算速度和计算精度方面有什么特点？`,['运算速度快','精度高'],2);
    }else if((m=full.match(/^计算机具备存储能力$/))){
      set(`计算机在信息保存方面具备什么能力？`,['存储能力'],1);
    }else if((m=full.match(/^计算机具备逻辑判断能力$/))){
      set(`计算机在分析和判断方面具备什么能力？`,['逻辑判断能力'],1);
    }else if((m=full.match(/^计算机具备自动运行和自动控制的能力$/))){
      set(`计算机在运行与控制方面具备什么能力？`,['自动运行','自动控制'],2);
    }else if((m=full.match(/^计算机具备人机交互功能$/))){
      set(`计算机在与用户交互方面具备什么功能？`,['人机交互功能'],1);
    }else if((m=full.match(/^嵌入式计算机软件与硬件一体化，应用最广泛，数量超过PC$/))){
      set(`嵌入式计算机在软硬件、应用范围和数量方面有哪些特点？`,['软件与硬件一体化','应用最广泛','数量超过PC'],2);
    }else if((m=full.match(/^IoT是Internet of Things，实现(.+)$/))){
      set(`IoT的英文全称是什么？它实现了哪些对象之间的互联？`,['Internet of Things',m[1]],2);
    }else if((m=full.match(/^Artificial Intelligence（AI）指(.+?)，实现人工智能的根本途径是(.+)$/))){
      set(`人工智能（AI）指什么？实现人工智能的根本途径是什么？`,[m[1],m[2]],2);
    }else if((m=full.match(/^第三代出现操作系统，第一个经典的分时操作系统是(.+?)[（(](\d{4}年)[）)]$/))){
      set(`第三代出现的第一个经典分时操作系统是什么？出现于哪一年？`,[m[1],m[2]],2);
    }else if((m=full.match(/^(.+?)是(.+?)，首次提出(.+)$/))){
      set(`${m[1]}具有哪两项重要贡献？`,[m[2],m[3]],2);
    }else if((m=full.match(/^(.+?)是(.+?)，奠定了(.+?)的基础$/))){
      set(`${m[1]}是什么，并奠定了什么基础？`,[m[2],m[3]],2);
    }else if((m=full.match(/^(.+?)即(.+?)，主要用于(.+)$/))){
      set(`${m[1]}又叫什么，主要用于哪些领域？`,[m[2],...splitList(m[3])],2);
    }else if((m=full.match(/^(.+?)又称(.+?)，(.+)$/))){
      set(`${m[1]}又称什么？它主要用于或具有什么特点？`,[m[2],...meaningfulParts(m[3]).slice(0,4)],2);
    }else if((m=full.match(/^(.+?)把(.+?)集成在一个芯片上，是(.+)$/))){
      set(`${m[1]}把哪些部分集成在一个芯片上？它是什么系统的基础？`,[...splitList(m[2]),m[3]],2);
    }else if((m=full.match(/^(.+?)硬件采用(.+?)，软件出现(.+)$/))){
      set(`${m[1]}硬件采用什么器件？软件出现了什么系统？`,[m[2],m[3]],2);
    }else if((m=full.match(/^处理和计算(.+?)、运行(.+?)的装置称为(.+)$/))){
      set(`处理和计算什么信息、运行什么算法的装置称为什么？`,[m[1],m[2],m[3]],2);
    }else if((m=full.match(/^抽象以后就是(.+?)，抽象是(.+?)的前提(?:和基础)?$/))){
      set(`抽象以后是什么？抽象又是什么的前提和基础？`,[m[1],m[2]],2);
    }else if((m=full.match(/^(.+?)属于(.+?)，不是(.+)$/))){
      set(`${m[1]}属于谁的思维？不属于谁的思维？`,[m[2],m[3]],2);
    }else if((m=full.match(/^可计算问题可以由计算机在(.+)$/))){
      set(`什么样的问题属于可计算问题？`,[m[1]],1);
    }else if((m=full.match(/^计算思维方法分为来自数学和工程的方法、计算机科学独有的方法两大类$/))){
      set(`计算思维方法分为哪两大类？`,['来自数学和工程的方法','计算机科学独有的方法'],2);
    }else if((m=full.match(/^(.+?)通过(.+?)测试(.+)$/))){
      set(`${m[1]}通过什么方式测试什么？`,[m[2],m[3]],2);
    }else if((m=full.match(/^(.+?)拥有(.+)$/))){
      set(`${m[1]}拥有什么？`,[m[2]],1);
    }else if((m=full.match(/^(.+?)能够解决(.+)$/))){
      set(`${m[1]}能够解决什么范围的问题？`,[m[2]],1);
    }else if((m=full.match(/^(.+?)能够实现的功能是(.+)$/))){
      set(`${m[1]}能够实现的功能与图灵机功能是什么关系？`,[m[2]],1);
    }else if((m=full.match(/^(.+?)不可以计算的问题，(.+?)也不能计算$/))){
      set(`${m[1]}不能计算的问题，${m[2]}能否计算？请写出结论。`,[full],1);
    }else if((m=full.match(/^(.+?)表明(.+?)，具有(.+)$/))){
      set(`${m[1]}表明了什么，并具有什么意义？`,[m[2],m[3]],2);
    }else if((m=full.match(/^(.+?)诞生于(.+)$/))){
      set(`${m[1]}诞生于什么时间？`,[m[2]],1);
    }else if((m=full.match(/^(.+?)于(\d{4}年(?:\d{1,2}月(?:\d{1,2}日)?)?)(.+)$/))){
      set(`${m[1]}在${m[2]}发生了什么？`,meaningfulParts(m[3]).slice(0,5),1);
    }else if((m=full.match(/^(.+?)被公认为(.+)$/))){
      set(`${m[1]}被公认为何种地位或雏形？`,[m[2]],1);
    }else if((m=full.match(/^(.+?)的依据是(.+)$/))){
      set(`${m[1]}的依据是什么？`,[m[2]],1);
    }else if((m=full.match(/^并不是(.+)$/))){
      set(`是否${m[1]}？请写出正确结论。`,[full],1);
    }else if((m=full.match(/^(.+?)可由(.+?)，也可由(.+)$/))){
      set(`${m[1]}可以由谁执行？`,[m[2],m[3]],2);
    }else if((m=full.match(/^(.+?)应用于(.+)$/))){
      const ps=splitList(m[2]); set(`${m[1]}应用于哪些领域？`,ps,Math.min(3,ps.length));
    }else if((m=full.match(/^(.+?)将朝着(.+?)的方向发展$/))){
      const ps=splitList(m[2]); set(`${m[1]}将朝哪些方向发展？`,ps,Math.min(3,ps.length));
    }else if((m=full.match(/^(.+?)的装置称为(.+)$/))){
      set(`处理“${m[1]}”的装置称为什么？`,[m[2]],1);
    }else if((m=full.match(/^(.+?)处于(.+)$/))){
      set(`${m[1]}处于什么地位？`,[m[2]],1);
    }else if((m=full.match(/^(.+?)包含(.+)$/))){
      const ps=splitList(m[2]); set(`${m[1]}包含哪些内容？`,ps,Math.min(2,ps.length));
    }else if((m=full.match(/^(.+?)以(.+?)为核心，将(.+)$/))){
      set(`${m[1]}以什么为核心，并融合了哪些技术？`,[m[2],...splitList(m[3])],2);
    }else if((m=full.match(/^(.+?)离不开(.+)$/))){
      const ps=splitList(m[2]); set(`${m[1]}离不开哪些要素？`,ps,Math.min(2,ps.length));
    }else if((m=full.match(/^(.+?)以后就是(.+?)，(.+?)的前提是(.+)$/))){
      set(`${m[1]}以后是什么？${m[3]}的前提是什么？`,[m[2],m[4]],2);
    }else if((m=full.match(/^计算思维的基本问题有(.+)$/))){
      const ps=splitList(m[1]); set(`计算思维的基本问题有哪些？`,ps,Math.min(2,ps.length));
    }else if((m=full.match(/^(.+?)可以由(.+)$/))){
      set(`${m[1]}如何判定或解决？`,[m[2]],1);
    }else if((m=full.match(/^(.+?)认为(.+)$/))){
      set(`${m[1]}的核心观点是什么？`,[m[2]],1);
    }else if((m=full.match(/^(.+?)指出了(.+)$/))){
      set(`${m[1]}指出了哪些内容？`,splitList(m[2]),1);
    }else if((m=full.match(/^(.+?)具备(.+)$/))){
      set(`${m[1]}具备什么能力或功能？`,[m[2]],1);
    }else if((m=full.match(/^(.+?)以(.+?)为主$/))){
      set(`${m[1]}以什么为主？`,splitList(m[2]),1);
    }else if((m=full.match(/^(.+?)表示(.+?)(?:，(.+?)表示(.+))?$/))){
      const ps=[m[2],m[4]].filter(Boolean); set(`${[m[1],m[3]].filter(Boolean).join('和')}分别表示什么？`,ps,ps.length);
    }else if((m=full.match(/^(.+?)面向(.+?)，(.+)$/))){
      set(`${m[1]}主要面向什么应用？早期计算机主要用于什么？`,[m[2],m[3]],2);
    }else if((m=full.match(/^程序和数据以(.+)表示$/))){
      set(`程序和数据采用什么形式表示？`,[m[1]],1);
    }else if((m=full.match(/^程序和数据以同等地位存储在(.+)中，并按(.+)访问$/))){
      set(`程序和数据以什么地位存放在哪里，并按什么访问？`,['同等地位',m[1],m[2]],2);
    }else if((m=full.match(/^计算机按照(.+)执行$/))){
      set(`计算机按照什么顺序执行？`,[m[1]],1);
    }else if((m=full.match(/^(.+?)主要由(.+?)组成$/))){
      const ps=splitList(m[2]); set(`${m[1]}主要由哪些部分组成？请把组成部分写出来。`,ps,ps.length);
    }else if((m=full.match(/^(.+?)由(.+?)组成$/))){
      const ps=splitList(m[2]); set(`${m[1]}由哪些部分组成？`,ps,ps.length);
    }else if((m=full.match(/^(.+?)分为(.+)$/))){
      const ps=splitList(m[2]); set(`${m[1]}分为哪些类型或部分？`,ps,Math.min(2,ps.length));
    }else if((m=full.match(/^(.+?)包括(.+)$/))){
      const ps=splitList(m[2]); set(`${m[1]}包括哪些内容？`,ps,Math.min(2,ps.length));
    }else if((m=full.match(/^(.+?)的本质是(.+)$/))){
      set(`${m[1]}的本质是什么？`,splitList(m[2]),1);
    }else if((m=full.match(/^(.+?)的核心(?:原理|技术|思想)?是(.+)$/))){
      set(`${m[1]}的核心${full.includes('原理')?'原理':full.includes('技术')?'技术':full.includes('思想')?'思想':'内容'}是什么？`,splitList(m[2]),1);
    }else if((m=full.match(/^(.+?)的标志是(.+)$/))){
      set(`${m[1]}的标志是什么？`,splitList(m[2]),1);
    }else if((m=full.match(/^(.+?)被称为(.+)$/))){
      set(`${m[1]}被称为什么？`,splitList(m[2]),1);
    }else if((m=full.match(/^(.+?)又称(?:为)?(.+)$/))){
      set(`${m[1]}又称什么？`,splitList(m[2]),1);
    }else if((m=full.match(/^(.+?)是指(.+)$/))){
      set(`${m[1]}是指什么？`,meaningfulParts(m[2]).slice(0,4),1);
    }else if((m=full.match(/^(.+?)指(.+)$/))){
      set(`${m[1]}指什么？`,meaningfulParts(m[2]).slice(0,4),1);
    }else if((m=full.match(/^(.+?)是(.+?)，不是(.+)$/))){
      set(`${m[1]}是什么性质？它不是什么？`,[m[2],m[3]],2);
    }else if((m=full.match(/^(.+?)证明了(.+?)，奠定了(.+?)的基础$/))){
      set(`${m[1]}证明了什么，并奠定了什么基础？`,[m[2],m[3]],2);
    }else if((m=full.match(/^(.+?)由(.+?)为(.+?)而创立，是(.+)$/))){
      set(`${m[1]}由谁创立、为什么创立，它在该领域处于什么地位？`,[m[2],m[3],m[4]],2);
    }else if((m=full.match(/^(.+?)采用(.+)$/))){
      set(`${m[1]}采用什么技术、结构或方法？`,meaningfulParts(m[2]).slice(0,4),1);
    }else if((m=full.match(/^(.+?)具有(.+)$/))){
      const ps=splitList(m[2]); set(`${m[1]}具有哪些特点？`,ps,Math.min(2,ps.length));
    }else if((m=full.match(/^(.+?)能够(.+)$/))){
      set(`${m[1]}能够完成或解决什么？`,meaningfulParts(m[2]).slice(0,4),1);
    }else if((m=full.match(/^(.+?)不可能(.+)$/))){
      set(`${m[1]}是否可能${m[2]}？请写出结论。`,[full],1);
    }else if((m=full.match(/^(.+?)不可以(.+?)，(.+?)也不能(.+)$/))){
      set(`当${m[1]}不可以${m[2]}时，${m[3]}能否${m[4]}？`,[full],1);
    }else if((m=full.match(/^只有(.+?)，(.+?)才能(.+)$/))){
      set(`${m[2]}要${m[3]}，必须满足什么前提？`,[m[1]],1);
    }else if((m=full.match(/^一切(.+?)都(.+?)，反之亦然$/))){
      set(`请写出“${ctx}”中这条双向结论。题干关键词：${m[1]}。`,[m[1],m[2]],1);
    }else if((m=full.match(/^存在(.+?)，例如(.+)$/))){
      set(`是否存在${m[1]}？请写出一个例子。`,[m[1],m[2]],1);
    }else if((m=full.match(/^(\d{4}年(?:\d{1,2}月)?)[，,]?(.+)$/))){
      set(`${m[1]}发生了什么重要事件？`,meaningfulParts(m[2]).slice(0,5),1);
    }else if((m=full.match(/^(.+?)的度量标准有(.+)$/))){
      const ps=splitList(m[2]); set(`${m[1]}的度量标准有哪些？`,ps,Math.min(2,ps.length));
    }else if((m=full.match(/^(.+?)主要有(.+)$/))){
      const ps=splitList(m[2]); set(`${m[1]}主要有哪些？`,ps,Math.min(2,ps.length));
    }else if((m=full.match(/^(.+?)是(.+)$/))){
      set(`${m[1]}是什么？请写出关键定义、身份或结论。`,meaningfulParts(m[2]).slice(0,5),1);
    }else{
      const predicates=['提出','首次','发明','设计','建立','构建','战胜','击败','使用','利用','实现','奠定','解决','说明'];
      let subject='';
      for(const v of predicates){const pos=full.indexOf(v);if(pos>0){subject=full.slice(0,pos);break;}}
      if(!subject)subject=full.split(/[，,：:]/)[0];
      const basePoints=uniq([...(keywords||[]).filter(k=>full.includes(k)),...meaningfulParts(full)]).slice(0,6);
      set(`在“${ctx}”中，关于“${subject.slice(0,24)}”需要记住什么关键结论？请写关键词，不必逐字一致。`,basePoints.length?basePoints:[full],1);
    }
    if(!points.length) points=[full];
    return {prompt,points,required,line:full,group:ctx,answer:points.join('；')};
  }
  function buildBlockCheck(block){
    if(!block) return [];
    const entries=[];
    if(block.track==='pdf'){
      block.knowledge.filter(i=>i.boldOnlyRule).forEach(i=>{
        const groupMap=new Map();
        (i.mustGroups||[]).forEach(g=>(g.lines||[]).forEach(line=>groupMap.set(cleanSentence(line),g.title||i.title||block.category)));
        (i.mustPatterns||[]).forEach(line=>entries.push({line,group:groupMap.get(cleanSentence(line))||i.title||block.category,keywords:i.keywords||[]}));
      });
    }else{
      block.knowledge.forEach(i=>{
        const lines=(i.mustPatterns&&i.mustPatterns.length)?i.mustPatterns:[i.oneLine||i.notebookSummary?.conclusion||i.title];
        lines.filter(Boolean).forEach(line=>entries.push({line,group:i.title||block.category,keywords:i.keywords||[]}));
      });
    }
    const seen=new Set(),tests=[];
    entries.forEach(entry=>{
      const key=cleanSentence(entry.line); if(!key||seen.has(key))return; seen.add(key);
      tests.push(makeCheckQuestion(entry.line,entry.group,block.category,entry.keywords));
    });
    return tests;
  }
  function answerVariants(point){
    const raw=String(point||'').trim(),out=[];
    const add=x=>{x=String(x||'').trim();if(x.length>=2&&!out.includes(x)&&!/^(问题|功能|内容|方法|方面|领域|基础|理论|系统|能力)$/.test(x))out.push(x)};
    add(raw);
    const quoted=[...raw.matchAll(/[“《（(]([^”》）)]+)[”》）)]/g)].map(m=>m[1]); quoted.forEach(add);
    raw.match(/[A-Za-z][A-Za-z0-9-]{1,}/g)?.forEach(add);
    const lastDe=raw.split('的').pop(); if(lastDe&&lastDe!==raw)add(lastDe);
    add(raw.replace(/^(?:一条|一个|一种|一台|第一台|世界上|我国|现代|实际|主要|拥有自主知识产权的|具有|采用|即|是)/,''));
    splitList(raw).forEach(add);
    meaningfulParts(raw).forEach(add);
    return out;
  }
  function checkTypedAnswer(input,test){
    const a=normalizeText(input); if(!a)return {ok:false,matched:[],required:test?.required||1};
    const points=(test?.points||[test?.answer]).filter(Boolean);
    const matched=points.filter(p=>answerVariants(p).some(v=>{const b=normalizeText(v);return b.length>=2&&a.includes(b);}));
    const required=Math.max(1,Math.min(test?.required||1,points.length||1));
    return {ok:matched.length>=required,matched,required,total:points.length};
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
  window.V60={ITEMS,SORTED,BY_ID,STORE,$,$$,esc,dateKey,addDays,data:()=>data,save,state,updateState,isQuestion,isNote,isUnderstand,isPdf,isPdfTrack,isSourceMaterial,isKnowledge,parts,chapter,section,source,dateLabel,groupInfo,blockKey,blockLabel,refreshBlocks,dailyBlocks,pdfBlocks,compareBlocks,pdfDisplaySection,pdfDisplayCode,reviewDue,urgency,dueBlocks,nextBlock,dueItems,relatedQuestions,todayPlan,examDays,markGrade,markBlockGrade,markUnderstandBlock,subjectStats,pdfStats,coach,contentLines,blockSummary,buildBlockCheck,checkTypedAnswer,answerHtml,questionHtml,blockQuestionHtml,blockAnswerHtml,openLibrary,registerSW,setTheme,exportData,importData,resetProgress,uniq};
})();
