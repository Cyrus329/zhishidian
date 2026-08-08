(()=>{
'use strict';
const STORE='zsb-knowledge-memory-b003';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SUB={'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9','₊':'+','₋':'−','₌':'=','₍':'(','₎':')','ₐ':'a','ₑ':'e','ₕ':'h','ᵢ':'i','ⱼ':'j','ₖ':'k','ₗ':'l','ₘ':'m','ₙ':'n','ₒ':'o','ₚ':'p','ᵣ':'r','ₛ':'s','ₜ':'t','ᵤ':'u','ᵥ':'v','ₓ':'x'};
const SUP={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁺':'+','⁻':'−','⁼':'=','⁽':'(','⁾':')','ⁿ':'n','ⁱ':'i'};
function mathInner(raw){
 let h=esc(raw).replace(/全体实数\s*R/g,'全体实数 ℝ').replace(/∈\s*R/g,'∈ ℝ').replace(/∈\s*Z/g,'∈ ℤ');
 h=h.replace(/lim_\{?([^}\s]+)\}?/g,'<span class="mx-lim"><span>lim</span><sub>$1</sub></span>');
 h=h.replace(/√\[([^\]]+)\]\{([^{}]+)\}/g,(_,idx,rad)=>`<span class="mx-root"><sup>${mathInner(idx)}</sup><b>√</b><span>${mathInner(rad)}</span></span>`);
 h=h.replace(/√\{([^{}]+)\}/g,(_,rad)=>`<span class="mx-root"><b>√</b><span>${mathInner(rad)}</span></span>`);
 h=h.replace(/([₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜᵤᵥₓ]+)/g,x=>`<sub>${[...x].map(c=>SUB[c]||c).join('')}</sub>`);
 h=h.replace(/([⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿⁱ]+)/g,x=>`<sup>${[...x].map(c=>SUP[c]||c).join('')}</sup>`);
 h=h.replace(/\^\(\(([^()]*)\)\/([^()]+)\)/g,'<sup><span class="mx-frac"><span>($1)</span><span>$2</span></span></sup>');
 h=h.replace(/\^\(([^()]+)\)/g,'<sup>($1)</sup>').replace(/\^([A-Za-z0-9]+)/g,'<sup>$1</sup>');
 for(let i=0;i<3;i++)h=h.replace(/(\([^()<>]+\)|[A-Za-z0-9πℝℤ]+)\/(\([^()<>]+\)|[A-Za-z0-9πℝℤ]+)/g,'<span class="mx-frac"><span>$1</span><span>$2</span></span>');
 h=h.replace(/([A-Za-z0-9πℝℤ\)\]])(≠|≤|≥|=|&gt;|&lt;)([A-Za-z0-9πℝℤ√\(\[])/g,'$1 <span class="mx-op">$2</span> $3');
 h=h.replace(/∪/g,' <span class="mx-op">∪</span> ').replace(/∩/g,' <span class="mx-op">∩</span> ');
 return h;
}
function math(s){return `<span class="mx">${mathInner(String(s??''))}</span>`}
function loadState(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return {}}}
function saveState(st){try{localStorage.setItem(STORE,JSON.stringify(st))}catch{}}
function today(){return new Date().toISOString().slice(0,10)}
function fmt(sec){sec=Math.max(0,Math.floor(sec||0));const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60);return h?`${h}小时${m}分`:`${m}分`}
function track(getContext){let last=Date.now(),session=0;['pointerdown','keydown','touchstart','scroll'].forEach(e=>addEventListener(e,()=>last=Date.now(),{passive:true}));setInterval(()=>{if(document.visibilityState!=='visible'||Date.now()-last>120000)return;const ctx=getContext?.()||{};const st=loadState();st.time=st.time||{totalSeconds:0,todayDate:today(),todaySeconds:0,bySubject:{},byDay:{}};st.time.bySubject=st.time.bySubject||{};st.time.byDay=st.time.byDay||{};if(st.time.todayDate!==today()){st.time.todayDate=today();st.time.todaySeconds=0}st.time.totalSeconds=(st.time.totalSeconds||0)+1;st.time.todaySeconds=(st.time.todaySeconds||0)+1;if(ctx.subject)st.time.bySubject[ctx.subject]=(st.time.bySubject[ctx.subject]||0)+1;if(ctx.day!=null)st.time.byDay[ctx.day]=(st.time.byDay[ctx.day]||0)+1;session++;if(session%10===0)saveState(st);document.querySelectorAll('[data-shared-time]').forEach(el=>el.textContent=`今日 ${fmt(st.time.todaySeconds)} · 总计 ${fmt(st.time.totalSeconds)}`)},1000)}
window.KMReview={esc,math,track,fmt,loadState,saveState};
})();
