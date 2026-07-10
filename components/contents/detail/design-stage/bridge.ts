/**
 * bridge.ts — the JS injected into the design frame (WebView on native, iframe on
 * web). It is the single rendering + editing + capture surface:
 *   • reports element taps (nearest [data-el]) back to RN for comment pinning
 *   • applies a deterministic text edit and returns the new full HTML
 *   • captures the design to a PNG data URL via html2canvas
 *
 * Messages OUT (frame → RN):  {type:'ready'} | {type:'tap',id,text,rect} |
 *                             {type:'html',html} | {type:'render',dataUrl} |
 *                             {type:'error',message}
 * Messages IN  (RN → frame):  {type:'setText',id,text} | {type:'capture'}
 */

export const HTML2CANVAS_URL =
    "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";

// The bridge runs inside the frame. It works in both environments: native uses
// window.ReactNativeWebView.postMessage + a global __cmd(payload); web uses
// window.parent.postMessage + a 'message' listener.
export const BRIDGE_SCRIPT = `
(function(){
  function send(msg){
    try {
      var s = JSON.stringify(msg);
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(s);
      } else if (window.parent && window.parent !== window) {
        window.parent.postMessage(s, '*');
      }
    } catch(e){}
  }
  function target(){ return document.querySelector('[data-root]') || document.body; }
  function loadH2C(cb){
    if (window.html2canvas) return cb();
    var s = document.createElement('script');
    s.src = ${JSON.stringify(HTML2CANVAS_URL)};
    s.onload = cb;
    s.onerror = function(){ send({type:'error',message:'html2canvas failed to load'}); };
    document.head.appendChild(s);
  }
  function showSlide(i, slideWidth){
    var c = document.querySelector('[data-carousel]');
    if (c){ c.style.transition='transform .2s'; c.style.transform='translateX('+(-i*slideWidth)+'px)'; }
  }
  // Strip the display transform/clip in the html2canvas CLONE so each slide is
  // rendered at its natural size/position (the live preview keeps its transform).
  function cleanClone(doc){
    try {
      doc.body.style.transform = 'none';
      doc.body.style.width = 'auto';
      doc.body.style.height = 'auto';
      doc.body.style.overflow = 'visible';
      doc.documentElement.style.width = 'auto';
      doc.documentElement.style.height = 'auto';
      var c = doc.querySelector('[data-carousel]');
      if (c) c.style.transform = 'none';
    } catch(e){}
  }
  function captureSlides(){
    loadH2C(function(){
      var ready = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
      ready.then(function(){
        var nodes = document.querySelectorAll('[data-slide]');
        var list = nodes.length ? Array.prototype.slice.call(nodes) : [target()];
        var urls = [];
        function next(i){
          if (i >= list.length){ send({type:'renderSlides', dataUrls: urls}); return; }
          var el = list[i];
          window.html2canvas(el, {
            backgroundColor: '#ffffff',
            useCORS: true,
            scale: 1,
            width: el.offsetWidth,
            height: el.offsetHeight,
            onclone: cleanClone
          }).then(function(canvas){
            urls.push(canvas.toDataURL('image/png'));
            next(i+1);
          }).catch(function(e){ send({type:'error',message:String(e)}); });
        }
        next(0);
      });
    });
  }
  function handle(payload){
    var msg; try { msg = JSON.parse(payload); } catch(e){ return; }
    if (msg.type === 'setText'){
      var el = document.querySelector('[data-el="'+msg.id+'"]');
      if (el){ el.textContent = msg.text; }
      send({type:'html', html: '<!doctype html>'+document.documentElement.outerHTML});
    } else if (msg.type === 'showSlide'){
      showSlide(msg.index, msg.slideWidth);
    } else if (msg.type === 'captureSlides' || msg.type === 'capture'){
      captureSlides();
    }
  }
  window.__cmd = handle;                                   // native injection entry
  window.addEventListener('message', function(e){          // web iframe entry
    if (typeof e.data === 'string') handle(e.data);
  });
  document.addEventListener('click', function(e){
    var el = e.target;
    while (el && el !== document.body && !(el.getAttribute && el.getAttribute('data-el'))) el = el.parentElement;
    if (el && el.getAttribute && el.getAttribute('data-el')){
      var r = el.getBoundingClientRect();
      send({type:'tap', id: el.getAttribute('data-el'), text: el.textContent, rect:{x:r.left,y:r.top,w:r.width,h:r.height}});
    }
  }, true);
  send({type:'ready'});
})();
`;

/** Inject the bridge <script> just before </body> (or append). */
export function injectBridge(html: string): string {
    const tag = `<script>${BRIDGE_SCRIPT}</script>`;
    const i = html.toLowerCase().lastIndexOf("</body>");
    if (i === -1) return html + tag;
    return html.slice(0, i) + tag + html.slice(i);
}

/**
 * Inject the frame chrome: a CSS `zoom` so a slide fits the display width, and
 * a clip so the viewport shows exactly ONE slide (slideW×slideH) — the carousel
 * strip is translated left/right to page between slides.
 */
export function injectChrome(html: string, scale: number, slideW: number, slideH: number): string {
    // Scale via a transform on <body> (NOT `zoom`): transforms don't change an
    // element's layout size, so each slide still captures at full slideW×slideH
    // resolution via html2canvas, while the viewport clips to one slide.
    const dw = Math.round(slideW * scale);
    const dh = Math.round(slideH * scale);
    const style =
        `<style>` +
        `html{width:${dw}px;height:${dh}px;overflow:hidden;margin:0;}` +
        `body{width:${slideW}px;height:${slideH}px;overflow:hidden;margin:0;transform:scale(${scale});transform-origin:top left;}` +
        `[data-carousel]{display:flex;will-change:transform;}` +
        `</style>`;
    const i = html.toLowerCase().indexOf("</head>");
    if (i === -1) return style + html;
    return html.slice(0, i) + style + html.slice(i);
}

/** Build the final frame document: chromed + bridged. */
export function buildFrameHtml(html: string, scale: number, slideW: number, slideH: number): string {
    return injectBridge(injectChrome(html, scale, slideW, slideH));
}

export type FrameOutMsg =
    | { type: "ready" }
    | { type: "tap"; id: string; text: string; rect: { x: number; y: number; w: number; h: number } }
    | { type: "html"; html: string }
    | { type: "render"; dataUrl: string }
    | { type: "renderSlides"; dataUrls: string[] }
    | { type: "error"; message: string };

export interface DesignFrameHandle {
    setText: (id: string, text: string) => void;
    /** Page the carousel to slide `index` (slideWidth = per-slide px width). */
    showSlide: (index: number, slideWidth: number) => void;
    /** Capture each of `count` slides to a PNG (renderSlides message). */
    captureAll: (count: number) => void;
}

export interface DesignFrameProps {
    html: string;
    width: number;
    height: number;
    /** Display width in px; the frame scales the design to fit. */
    displayWidth: number;
    onMessage: (msg: FrameOutMsg) => void;
}
