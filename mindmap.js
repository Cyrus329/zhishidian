const ITEMS = window.KNOWLEDGE_ITEMS || [];
const SCHEMAS = window.DOCUMENT_MINDMAP_SCHEMAS || [];
const ITEM_BY_ID = new Map(ITEMS.map(i => [i.id, i]));
const STORE = 'zsb-knowledge-v26-day1';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const isMobile = () => window.matchMedia('(max-width: 820px)').matches;
let data = loadStudy();
let state = {subject:'', schemaId:'', source:'', type:'', q:'', selectedItem:'', selectedGroup:'', selectedOutline:''};

function loadStudy(){
  try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return {}}
}
function st(id){return data.study?.[id]||{read:false,mastered:false,wrong:false,starred:false,note:''}}
function isQuestion(i){return i?.studyMode==='question'||String(i?.recordType||'').includes('题目')}
function isNote(i){return !isQuestion(i)&&(i?.studyMode==='note'||String(i?.recordType||'').includes('笔记'))}
function isPdf(i){return String(i?.recordType||'').includes('PDF')}
function isMemoryItem(i){return !isNote(i)&&(!isPdf(i)||isQuestion(i))}
function typeKey(i){return isQuestion(i)?'questions':'knowledge'}
function typeLabel(i){return isQuestion(i)?'题目':'知识点'}
function sourceLabel(i){return i?.sourceOrg||'未标注'}
function quick(i){return i?.oneLine||i?.notebookSummary?.overview||i?.mustPatterns?.[0]||i?.basicExplain?.[0]||''}
function itemText(i){return [i.title,i.chapter,i.category,i.range,i.oneLine,...(i.keywords||[]),...(i.mustPatterns||[]),...(i.basicExplain||[]),...(i.examRefine||[])].join(' ').toLowerCase()}
function matchIncludes(value, needles){
  if(!needles?.length)return false;
  const text=String(value||'').toLowerCase();
  return needles.some(n=>text.includes(String(n).toLowerCase()));
}
function matchesRule(i, rule={}){
  if(rule.ids?.includes(i.id))return true;
  if(rule.excludeTitle?.length&&matchIncludes(i.title,rule.excludeTitle))return false;
  const tests=[];
  if(rule.title?.length)tests.push(matchIncludes(i.title,rule.title));
  if(rule.category?.length)tests.push(matchIncludes(i.category,rule.category));
  if(rule.chapter?.length)tests.push(matchIncludes(i.chapter,rule.chapter));
  if(rule.keyword?.length)tests.push(matchIncludes(itemText(i),rule.keyword));
  return tests.length?tests.some(Boolean):false;
}
function passesBasicFilters(i){
  if(!isMemoryItem(i))return false;
  if(state.source&&sourceLabel(i)!==state.source)return false;
  if(state.type&&typeKey(i)!==state.type)return false;
  return true;
}
function passesFilters(i){
  if(!passesBasicFilters(i))return false;
  if(state.q&&!itemText(i).includes(state.q.toLowerCase()))return false;
  return true;
}
function progress(items){
  const unique=[...new Map(items.map(i=>[i.id,i])).values()];
  const total=unique.length;
  const done=unique.filter(i=>st(i.id).mastered).length;
  return {total,done,pct:total?Math.round(done/total*100):0};
}
function shortChapter(ch){return String(ch||'').split('｜').slice(-1)[0]||ch||'未分章'}
function uniqueItems(items){return [...new Map((items||[]).map(i=>[i.id,i])).values()]}

function buildSchemaTree(schema){
  const subjectItems=ITEMS.filter(i=>i.subject===schema.subject&&isMemoryItem(i));
  const assigned=new Set();
  const sections=[];
  (schema.sections||[]).forEach(sec=>{
    const out={...sec,groups:[]};
    (sec.groups||[]).forEach(group=>{
      const items=subjectItems.filter(i=>!assigned.has(i.id)&&matchesRule(i,group.match));
      items.forEach(i=>assigned.add(i.id));
      out.groups.push({...group,items});
    });
    (sec.dynamicChapters||[]).forEach(chapterNeedle=>{
      const chapterItems=subjectItems.filter(i=>!assigned.has(i.id)&&String(i.chapter||'').includes(chapterNeedle));
      chapterItems.forEach(i=>assigned.add(i.id));
      if(chapterItems.length){
        out.groups.push({
          id:`dynamic-${schema.id}-${chapterNeedle}`,
          title:chapterNeedle,
          summary:`系统中已导入的“${chapterNeedle}”内容。`,
          items:chapterItems
        });
      }
    });
    sections.push(out);
  });
  const leftovers=subjectItems.filter(i=>!assigned.has(i.id));
  if(leftovers.length){
    const byChapter=new Map();
    leftovers.forEach(i=>{const k=shortChapter(i.chapter);const arr=byChapter.get(k)||[];arr.push(i);byChapter.set(k,arr)});
    sections.push({id:`${schema.id}-other`,title:'其他已导入内容',groups:[...byChapter.entries()].map(([title,items],idx)=>({id:`${schema.id}-other-${idx}`,title,summary:'尚未归入当前原文档小标题的已导入内容。',items}))});
  }
  return {...schema,sections};
}
const BUILT_SCHEMAS = SCHEMAS.map(buildSchemaTree);

function filteredGroupItems(group){return (group.items||[]).filter(passesFilters)}
function outlineText(node){return [node.title,node.summary].filter(Boolean).join(' ').toLowerCase()}
function nodeOwnItems(node, groupItems){return node.match?groupItems.filter(i=>matchesRule(i,node.match)):[]}
function nodeAllItems(node, groupItems){
  const own=nodeOwnItems(node,groupItems);
  const child=(node.children||[]).flatMap(c=>nodeAllItems(c,groupItems));
  return uniqueItems([...own,...child]);
}
function allOutlineMatchedIds(outline, groupItems){
  const set=new Set();
  (outline||[]).forEach(n=>nodeAllItems(n,groupItems).forEach(i=>set.add(i.id)));
  return set;
}
function nodeMatchesSearch(node,groupItems){
  if(!state.q)return true;
  const q=state.q.toLowerCase();
  if(outlineText(node).includes(q))return true;
  if(nodeAllItems(node,groupItems).some(i=>itemText(i).includes(q)))return true;
  return (node.children||[]).some(c=>nodeMatchesSearch(c,groupItems));
}
function groupVisible(group){
  if(!state.q)return true;
  const q=state.q.toLowerCase();
  if([group.title,group.summary].join(' ').toLowerCase().includes(q))return true;
  if((group.items||[]).some(i=>passesBasicFilters(i)&&itemText(i).includes(q)))return true;
  return (group.outline||[]).some(n=>nodeMatchesSearch(n,(group.items||[]).filter(passesBasicFilters)));
}
function currentSchema(){return BUILT_SCHEMAS.find(x=>x.id===state.schemaId)||BUILT_SCHEMAS.find(x=>x.subject===state.subject)||BUILT_SCHEMAS[0]}

function fillControls(){
  const subjects=[...new Set(BUILT_SCHEMAS.map(x=>x.subject))];
  $('#subjectSelect').innerHTML=subjects.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('');
  if(!state.subject||!subjects.includes(state.subject))state.subject=subjects[0]||'';
  $('#subjectSelect').value=state.subject;
  const maps=BUILT_SCHEMAS.filter(x=>x.subject===state.subject);
  if(!state.schemaId||!maps.some(x=>x.id===state.schemaId))state.schemaId=maps[0]?.id||'';
  $('#mapSelect').innerHTML=maps.map(x=>`<option value="${esc(x.id)}">${esc(x.title)}</option>`).join('');
  $('#mapSelect').value=state.schemaId;
  const sources=[...new Set(ITEMS.filter(i=>i.subject===state.subject&&isMemoryItem(i)).map(sourceLabel))].sort((a,b)=>a.localeCompare(b,'zh-CN'));
  $('#sourceSelect').innerHTML='<option value="">全部机构</option>'+sources.map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('');
  if(state.source&&!sources.includes(state.source))state.source='';
  $('#sourceSelect').value=state.source;
  $('#typeSelect').value=state.type;
  $('#searchInput').value=state.q;
}
function statusMark(i){
  const s=st(i.id);
  return s.mastered?'✓':(s.read?'◐':'○');
}
function statusClass(i){
  const s=st(i.id);
  if(s.mastered)return 'done';
  if(s.read)return 'started';
  return '';
}
function groupCategories(items){
  const map=new Map();
  items.forEach(i=>{const k=i.category||'未分类';const arr=map.get(k)||[];arr.push(i);map.set(k,arr)});
  return [...map.entries()];
}
function itemNode(i){
  return `<button class="map-item-node ${typeKey(i)} ${statusClass(i)} ${state.selectedItem===i.id?'selected':''}" data-item-id="${esc(i.id)}"><span class="node-status">${statusMark(i)}</span><span class="node-main"><b>${esc(i.title)}</b><em>${esc(typeLabel(i))} · ${esc(sourceLabel(i))}</em></span><span class="node-arrow">›</span></button>`;
}
function nodeContainsSelection(node){
  if(state.selectedOutline===node.id)return true;
  return (node.children||[]).some(nodeContainsSelection);
}
function renderOutlineNode(node,group,depth=0){
  const baseItems=(group.items||[]).filter(passesBasicFilters);
  if(!nodeMatchesSearch(node,baseItems))return '';
  const children=(node.children||[]).filter(c=>nodeMatchesSearch(c,baseItems));
  const own=nodeOwnItems(node,baseItems).filter(i=>!state.q||itemText(i).includes(state.q.toLowerCase()));
  const childIds=new Set(children.flatMap(c=>nodeAllItems(c,baseItems).map(i=>i.id)));
  const direct=uniqueItems(own.filter(i=>!childIds.has(i.id)));
  const all=uniqueItems([...direct,...children.flatMap(c=>nodeAllItems(c,baseItems))]);
  const p=progress(all);
  const open=depth===0||state.q||nodeContainsSelection(node);
  return `<details class="outline-branch depth-${Math.min(depth,4)}" ${open?'open':''}>
    <summary class="outline-summary" data-outline-id="${esc(node.id)}" data-group-parent="${esc(group.id)}">
      <span class="outline-dot"></span>
      <span class="outline-title"><b>${esc(node.title)}</b>${node.summary?`<small>${esc(node.summary)}</small>`:''}</span>
      <span class="outline-count">${all.length?`${p.done}/${p.total}`:'标题'}</span>
      <span class="outline-chevron">⌄</span>
    </summary>
    <div class="outline-children">
      ${children.map(c=>renderOutlineNode(c,group,depth+1)).join('')}
      ${direct.length?`<div class="outline-items">${direct.map(itemNode).join('')}</div>`:''}
    </div>
  </details>`;
}
function renderFallbackGroup(group,items){
  const cats=groupCategories(items);
  return cats.map(([cat,arr])=>`<details class="category-branch" open><summary><b>${esc(cat)}</b><em>${arr.length}</em></summary><div class="category-items">${arr.map(itemNode).join('')}</div></details>`).join('');
}
function renderTree(){
  const schema=currentSchema();if(!schema)return;
  const visibleSections=schema.sections.map(sec=>({...sec,groups:(sec.groups||[]).filter(groupVisible)})).filter(sec=>sec.groups.length);
  const allVisibleItems=uniqueItems(visibleSections.flatMap(sec=>sec.groups.flatMap(g=>filteredGroupItems(g))));
  const p=progress(allVisibleItems);
  $('#treeTitle').textContent=schema.title;
  $('#treeMeta').textContent=`${visibleSections.length}个区块 · ${p.total}张卡 · ${p.pct}%完成`;
  $('#mapTree').innerHTML=`<article class="document-map-root">
    <header><span>${esc(schema.subject)}</span><div><h2>${esc(schema.title)}</h2><p>${esc(schema.subtitle||'')}</p></div><strong>${p.done}/${p.total}</strong></header>
    <div class="root-trunk"></div>
    <div class="document-sections">${visibleSections.map((sec,si)=>{
      const secItems=uniqueItems(sec.groups.flatMap(g=>filteredGroupItems(g))),sp=progress(secItems);
      return `<details class="document-section" open><summary><span class="section-index">${String(si+1).padStart(2,'0')}</span><div><b>${esc(sec.title)}</b><em>${sec.groups.length}个原文标题 · ${sp.done}/${sp.total}</em></div></summary><div class="document-groups">${sec.groups.map(group=>{
        const items=filteredGroupItems(group),gp=progress(items);
        const matched=allOutlineMatchedIds(group.outline||[],(group.items||[]).filter(passesBasicFilters));
        const leftovers=items.filter(i=>!matched.has(i.id));
        const documentOnly=!items.length;
        return `<details class="document-group" ${state.selectedGroup===group.id?'open':''}>
          <summary data-group-id="${esc(group.id)}"><span class="group-dot"></span><div><b>${esc(group.title)}</b><em>${documentOnly?'原文提纲':`${items.length}张 · ${gp.pct}%`}</em></div><span class="group-chevron">⌄</span></summary>
          <div class="group-children">
            ${(group.outline||[]).map(n=>renderOutlineNode(n,group,0)).join('')}
            ${!group.outline?.length?renderFallbackGroup(group,items):''}
            ${leftovers.length?`<details class="category-branch"><summary><b>其他对应内容</b><em>${leftovers.length}</em></summary><div class="category-items">${leftovers.map(itemNode).join('')}</div></details>`:''}
            ${documentOnly?`<button class="outline-node" data-group-id="${esc(group.id)}">查看原文提纲与PDF</button>`:''}
          </div>
        </details>`;
      }).join('')}</div></details>`;
    }).join('')}</div>
  </article>`;
  if(!visibleSections.length)$('#mapTree').innerHTML='<div class="no-results">没有匹配的小标题或卡片。</div>';
}
function findGroup(id){
  for(const schema of BUILT_SCHEMAS)for(const sec of schema.sections||[])for(const group of sec.groups||[])if(group.id===id)return {schema,sec,group};
  return null;
}
function findOutlineIn(nodes,id,path=[]){
  for(const node of nodes||[]){
    const next=[...path,node.title];
    if(node.id===id)return {node,path:next};
    const child=findOutlineIn(node.children,id,next);
    if(child)return child;
  }
  return null;
}
function findOutline(id){
  for(const schema of BUILT_SCHEMAS){
    for(const sec of schema.sections||[]){
      for(const group of sec.groups||[]){
        const found=findOutlineIn(group.outline,id,[]);
        if(found)return {schema,sec,group,...found};
      }
    }
  }
  return null;
}
function listHTML(title,arr){
  const vals=(arr||[]).filter(Boolean);if(!vals.length)return'';
  return `<section class="preview-section"><h3>${esc(title)}</h3><ul>${vals.map(x=>`<li>${esc(typeof x==='string'?x:(x.q?`${x.q}：${x.a}`:JSON.stringify(x)))}</li>`).join('')}</ul></section>`;
}
function closeButton(){return '<button class="mobile-preview-close" data-close-preview="1" type="button">← 返回导图</button>'}
function openMobilePreview(){
  if(!isMobile())return;
  $('#previewPanel')?.classList.add('mobile-open');
  document.body.classList.add('preview-open');
}
function closeMobilePreview(){
  $('#previewPanel')?.classList.remove('mobile-open');
  document.body.classList.remove('preview-open');
}
function renderItemPreview(i){
  const s=st(i.id),images=(i.images||[]).slice(0,6),summary=i.notebookSummary||{};
  const core=summary.core?.length?summary.core:(i.mustPatterns||[]);
  const method=summary.method?.length?summary.method:[...(i.basicExplain||[]),...(i.examRefine||[])];
  const mistakes=summary.mistakes?.length?summary.mistakes:(i.confusions||[]);
  $('#previewPanel').innerHTML=`${closeButton()}<article class="item-preview">
    <header class="preview-head"><div class="preview-breadcrumb">${esc(i.subject)} / ${esc(shortChapter(i.chapter))} / ${esc(i.category||'未分类')}</div><div class="preview-badges"><span class="${typeKey(i)}">${esc(typeLabel(i))}</span><span>${esc(sourceLabel(i))}</span><span>${esc(i.importLabel||i.range||'')}</span></div><h2>${esc(i.title)}</h2><p>${esc(quick(i)||'暂无一句话摘要。')}</p></header>
    <div class="preview-status"><span>已看 <b>${s.read?'是':'否'}</b></span>${!isNote(i)?`<span>掌握 <b>${s.mastered?'是':'否'}</b></span>`:''}<span>重点 <b>${s.starred?'是':'否'}</b></span><span>错题 <b>${s.wrong?'是':'否'}</b></span></div>
    ${listHTML('核心知识点',core)}
    ${listHTML(isQuestion(i)?'本题原理 / 解题方法':'理解与复习方法',method)}
    ${listHTML('易错提醒',mistakes)}
    ${!isNote(i)&&i.clozeLines?.length?listHTML('填空背诵内容',i.clozeLines.map(x=>String(x).replace(/\[\[|\]\]/g,''))):''}
    ${images.length?`<section class="preview-section"><h3>关联原图</h3><div class="preview-images">${images.map(src=>`<a href="${esc(src)}" target="_blank"><img src="${esc(src)}" loading="lazy" alt="原图"></a>`).join('')}</div></section>`:''}
    <div class="preview-actions"><a class="primary" href="./index.html?item=${encodeURIComponent(i.id)}">进入原卡片</a><a href="./index.html?item=${encodeURIComponent(i.id)}" target="_blank">新窗口打开</a><a href="./notes.html?related=${encodeURIComponent(i.id)}">关联课堂笔记</a>${i.pdf?`<a href="${esc(i.pdf)}" target="_blank">打开原PDF</a>`:''}</div>
  </article>`;
  openMobilePreview();
}
function outlineCards(found){
  const base=(found.group.items||[]).filter(passesBasicFilters);
  return uniqueItems(nodeAllItems(found.node,base)).filter(i=>!state.q||itemText(i).includes(state.q.toLowerCase()));
}
function renderOutlinePreview(id){
  const found=findOutline(id);if(!found)return;
  const items=outlineCards(found),p=progress(items);
  $('#previewPanel').innerHTML=`${closeButton()}<article class="group-preview">
    <header class="preview-head"><div class="preview-breadcrumb">${esc(found.schema.subject)} / ${esc(found.sec.title)} / ${esc(found.group.title)}</div><div class="preview-badges"><span class="heading">原文小标题</span><span>${items.length}张对应卡片</span></div><h2>${esc(found.node.title)}</h2><p>${esc(found.node.summary||`该节点来自原思维导图：${found.path.join(' → ')}`)}</p></header>
    <section class="preview-section"><h3>原文层级</h3><div class="outline-path">${found.path.map((x,idx)=>`<span>${esc(x)}${idx<found.path.length-1?' → ':''}</span>`).join('')}</div></section>
    <section class="preview-section"><h3>对应必背知识点 / 题目</h3>${items.length?`<div class="group-item-grid">${items.map(i=>`<button data-item-id="${esc(i.id)}"><b>${esc(i.title)}</b><span>${esc(typeLabel(i))} · ${esc(sourceLabel(i))}</span></button>`).join('')}</div>`:'<p class="muted">目前还没有单独卡片挂在这个小标题下。小标题已按原文档保留，后续导入对应内容时会自动归入这里。</p>'}</section>
    <div class="group-progress"><span>本节点完成度</span><b>${p.pct}%</b><i><em style="width:${p.pct}%"></em></i><small>${p.done}/${p.total}</small></div>
    <div class="preview-actions">${found.group.pdf?`<a class="primary" href="${esc(found.group.pdf)}" target="_blank">打开原PDF</a>`:''}<button data-show-outline="${esc(found.node.id)}">定位左侧小标题</button></div>
  </article>`;
  openMobilePreview();
}
function renderGroupPreview(id){
  const found=findGroup(id);if(!found)return;
  const {schema,sec,group}=found,items=filteredGroupItems(group),p=progress(items);
  const topHeadings=(group.outline||[]).map(n=>n.title);
  $('#previewPanel').innerHTML=`${closeButton()}<article class="group-preview">
    <header class="preview-head"><div class="preview-breadcrumb">${esc(schema.subject)} / ${esc(schema.title)} / ${esc(sec.title)}</div><div class="preview-badges"><span class="document">原文标题</span><span>${items.length}张对应卡片</span></div><h2>${esc(group.title)}</h2><p>${esc(group.summary||'')}</p></header>
    ${topHeadings.length?listHTML('原思维导图一级小标题',topHeadings):''}
    <section class="preview-section"><h3>对应内容</h3>${items.length?`<div class="group-item-grid">${items.map(i=>`<button data-item-id="${esc(i.id)}"><b>${esc(i.title)}</b><span>${esc(typeLabel(i))} · ${esc(sourceLabel(i))}</span></button>`).join('')}</div>`:'<p class="muted">当前题库还没有对应卡片。该标题已按原文档保留。</p>'}</section>
    <div class="group-progress"><span>本标题完成度</span><b>${p.pct}%</b><i><em style="width:${p.pct}%"></em></i><small>${p.done}/${p.total}</small></div>
    <div class="preview-actions">${group.pdf?`<a class="primary" href="${esc(group.pdf)}" target="_blank">打开原PDF</a>`:''}<button data-show-group="${esc(group.id)}">定位左侧标题</button></div>
  </article>`;
  openMobilePreview();
}
function render(){
  fillControls();renderTree();
  if(state.selectedItem&&ITEM_BY_ID.has(state.selectedItem))renderItemPreview(ITEM_BY_ID.get(state.selectedItem));
  else if(state.selectedOutline)renderOutlinePreview(state.selectedOutline);
  else if(state.selectedGroup)renderGroupPreview(state.selectedGroup);
}

$('#subjectSelect').addEventListener('change',e=>{state.subject=e.target.value;state.schemaId='';state.source='';state.selectedItem='';state.selectedGroup='';state.selectedOutline='';closeMobilePreview();render()});
$('#mapSelect').addEventListener('change',e=>{state.schemaId=e.target.value;state.selectedItem='';state.selectedGroup='';state.selectedOutline='';closeMobilePreview();render()});
$('#sourceSelect').addEventListener('change',e=>{state.source=e.target.value;state.selectedItem='';state.selectedOutline='';closeMobilePreview();render()});
$('#typeSelect').addEventListener('change',e=>{state.type=e.target.value;state.selectedItem='';state.selectedOutline='';closeMobilePreview();render()});
let searchTimer=null;
$('#searchInput').addEventListener('input',e=>{state.q=e.target.value.trim();clearTimeout(searchTimer);searchTimer=setTimeout(()=>{state.selectedItem='';state.selectedOutline='';renderTree()},120)});
document.addEventListener('click',e=>{
  if(e.target.closest('[data-close-preview]')||e.target.id==='mobilePreviewClose'){closeMobilePreview();return}
  const item=e.target.closest('[data-item-id]');
  if(item){const id=item.dataset.itemId;if(!ITEM_BY_ID.has(id))return;state.selectedItem=id;state.selectedGroup='';state.selectedOutline='';renderTree();renderItemPreview(ITEM_BY_ID.get(id));$('#previewPanel').scrollTo({top:0,behavior:'smooth'});return}
  const outline=e.target.closest('[data-outline-id]');
  if(outline){const id=outline.dataset.outlineId;state.selectedOutline=id;state.selectedItem='';state.selectedGroup='';renderOutlinePreview(id);return}
  const group=e.target.closest('[data-group-id]');
  if(group){const id=group.dataset.groupId;state.selectedGroup=id;state.selectedItem='';state.selectedOutline='';renderGroupPreview(id);return}
  if(e.target.id==='expandBtn'){$$('#mapTree details').forEach(d=>d.open=true);return}
  if(e.target.id==='collapseBtn'){$$('#mapTree details').forEach(d=>d.open=false);return}
  if(e.target.id==='fitBtn'){window.scrollTo({top:0,behavior:'smooth'});$('#mapTree').scrollTo({top:0,behavior:'smooth'});$('#previewPanel').scrollTo({top:0,behavior:'smooth'});return}
  if(e.target.id==='themeBtn'){document.body.classList.toggle('dark');localStorage.setItem('zsb-theme',document.body.classList.contains('dark')?'dark':'light');return}
  const showGroup=e.target.closest('[data-show-group]');
  if(showGroup){closeMobilePreview();const id=showGroup.dataset.showGroup;const summary=$(`[data-group-id="${CSS.escape(id)}"]`);summary?.closest('details')?.setAttribute('open','');summary?.scrollIntoView({behavior:'smooth',block:'center'});return}
  const showOutline=e.target.closest('[data-show-outline]');
  if(showOutline){closeMobilePreview();const id=showOutline.dataset.showOutline;const summary=$(`[data-outline-id="${CSS.escape(id)}"]`);let d=summary?.closest('details');while(d){d.open=true;d=d.parentElement?.closest('details')}summary?.scrollIntoView({behavior:'smooth',block:'center'});return}
});
window.addEventListener('resize',()=>{if(!isMobile())closeMobilePreview()});
window.addEventListener('popstate',()=>{if(isMobile()&&document.body.classList.contains('preview-open'))closeMobilePreview()});

if(localStorage.getItem('zsb-theme')==='dark')document.body.classList.add('dark');
const params=new URLSearchParams(location.search);
state.subject=params.get('subject')||BUILT_SCHEMAS[0]?.subject||'';
state.schemaId=params.get('map')||'';
state.selectedItem=params.get('item')||'';
state.selectedGroup=params.get('group')||'';
state.selectedOutline=params.get('outline')||'';
render();
