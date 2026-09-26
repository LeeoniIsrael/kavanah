import type { ReaderLanguage, SiddurSegment, TextAnnotation } from "./model";
const escape = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
export function createReaderHtml(
  segments: SiddurSegment[],
  language: ReaderLanguage,
  scale: number,
  annotations: TextAnnotation[],
  dark: boolean,
): string {
  let previousMissing = false;
  const body = segments
    .map((s) => {
      const value = language === "he" ? s.he : s.en;
      if (!value) {
        if (previousMissing) return "";
        previousMissing = true;
        const other = language === "he" ? s.en : s.he;
        return `<p class="missing" dir="ltr">${other ? (language === "he" ? "Hebrew text is unavailable in this approved edition. English remains available." : "English translation is unavailable in approved editions. Hebrew remains available.") : "Text is unavailable in approved editions."}</p>`;
      }
      previousMissing = false;
      return `<p data-segment-id="${escape(s.id)}" dir="${language === "he" ? "rtl" : "ltr"}">${escape(value)}</p>`;
    })
    .join("");
  const payload = JSON.stringify(
    annotations.filter((a) => a.language === language),
  ).replace(/</g, "\\u003c");
  const css = `:root{color-scheme:${dark ? "dark" : "light"}}html,body{margin:0;padding:0;background:${dark ? "#17212D" : "#FFFFFF"};color:${dark ? "#E9EEF4" : "#152137"}}body{box-sizing:border-box;padding:29px 28px 48px;font-family:${language === "he" ? "'NotoSansHebrew_400Regular',-apple-system,'Arial Hebrew',Arial,sans-serif" : "'Manrope_400Regular',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"};font-size:${Math.round((language === "he" ? 22 : 19) * scale)}px;line-height:${language === "he" ? 1.82 : 1.72};font-weight:400;text-rendering:optimizeLegibility;-webkit-text-size-adjust:100%;-webkit-user-select:text;user-select:text}p{margin:0 0 1.15em;unicode-bidi:plaintext;overflow-wrap:break-word}p:last-child{margin-bottom:0}.missing{font-family:-apple-system,Arial,sans-serif;font-size:14px;line-height:1.5;color:${dark ? "#A7B4C3" : "#647184"};user-select:none;-webkit-user-select:none}.highlight{background:rgba(174,190,219,.42);border-radius:3px}::highlight(saved){background:rgba(174,190,219,.42)}::selection{background:rgba(110,151,216,.35)}#scroll-track{position:fixed;${language === "he" ? "left" : "right"}:7px;top:12%;height:76%;width:4px;border-radius:4px;background:${dark ? "#354658" : "#E4E8ED"};opacity:.72;pointer-events:none;z-index:10}#scroll-fill{width:100%;height:0;border-radius:4px;background:linear-gradient(to bottom,${dark ? "#8DB6E8,#E9EEF4" : "#B7CCE8,#0B1A3B"})}#scroll-track[hidden]{display:none}`;
  return `<!doctype html><html lang="${language}" dir="${language === "he" ? "rtl" : "ltr"}"><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><style>${css}</style></head><body>${body}<div id="scroll-track" aria-hidden="true"><div id="scroll-fill"></div></div><script>(function(){
 const send=(v)=>window.ReactNativeWebView.postMessage(JSON.stringify(v));
 const anns=${payload};
 function locate(node,offset){let p=node.nodeType===1?node:node.parentElement;while(p&&!p.dataset?.segmentId)p=p.parentElement;if(!p)return null;const walker=document.createTreeWalker(p,NodeFilter.SHOW_TEXT);let count=0,n;while(n=walker.nextNode()){if(n===node)return{id:p.dataset.segmentId,offset:count+offset};count+=n.textContent.length}return{id:p.dataset.segmentId,offset:count}}
 function point(p,offset){const walker=document.createTreeWalker(p,NodeFilter.SHOW_TEXT);let n;while(n=walker.nextNode()){if(offset<=n.textContent.length)return[n,offset];offset-=n.textContent.length}return[p,p.childNodes.length]}
 function rangeFor(a){let first=document.querySelector('[data-segment-id="'+CSS.escape(a.startSegmentId)+'"]'),last=document.querySelector('[data-segment-id="'+CSS.escape(a.endSegmentId)+'"]');if(!first||!last)return null;let r=document.createRange(),s=point(first,a.startOffset),e=point(last,a.endOffset);try{r.setStart(...s);r.setEnd(...e);return r}catch{return null}}
 const ranges=anns.map(rangeFor).filter(Boolean);if(CSS.highlights&&window.Highlight){CSS.highlights.set('saved',new Highlight(...ranges))}else for(const r of ranges){try{let mark=document.createElement('mark');mark.className='highlight';r.surroundContents(mark)}catch{}}
 const track=document.getElementById('scroll-track'),fill=document.getElementById('scroll-fill');function updateScroll(){const root=document.documentElement,max=root.scrollHeight-innerHeight;track.hidden=max<=2;if(max>2)fill.style.height=Math.max(5,Math.min(100,root.scrollTop/max*100))+'%'}window.addEventListener('scroll',updateScroll,{passive:true});window.addEventListener('resize',updateScroll);requestAnimationFrame(updateScroll);
 let timer;document.addEventListener('selectionchange',()=>{clearTimeout(timer);timer=setTimeout(()=>{let s=window.getSelection();if(!s||s.isCollapsed){send({type:'selectionEnd'});return}let r=s.getRangeAt(0),start=locate(r.startContainer,r.startOffset),end=locate(r.endContainer,r.endOffset);if(start&&end)send({type:'selection',start,end,text:s.toString(),y:r.getBoundingClientRect().top})},100)});
 let x=0,y=0,t=0,pinching=false;document.addEventListener('touchstart',e=>{if(e.touches.length>1){pinching=true;send({type:'pinchStart'});return}x=e.touches[0].clientX;y=e.touches[0].clientY;t=Date.now()},{passive:true});document.addEventListener('touchend',e=>{if(pinching){pinching=false;send({type:'pinchEnd'});return}if(window.getSelection()?.toString())return;let dx=e.changedTouches[0].clientX-x,dy=e.changedTouches[0].clientY-y;if(Math.abs(dx)>26&&Math.abs(dx)>Math.abs(dy)*1.4&&Date.now()-t<650){send({type:'swipe',dx});return}if(Math.abs(dx)<8&&Math.abs(dy)<8&&Date.now()-t<300){let side=x/innerWidth;if(side<.2||side>.8)send({type:'edge',side})}},{passive:true});
 document.addEventListener('gesturestart',e=>{window._pinch=e.scale;send({type:'pinchStart'})});document.addEventListener('gestureend',e=>{send({type:'pinch',scale:e.scale});send({type:'pinchEnd'})});
})();</script></body></html>`;
}
