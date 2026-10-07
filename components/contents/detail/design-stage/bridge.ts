/**
 * bridge.ts — the JS injected into the design frame (WebView on native, iframe
 * on web). It is the EDITING AND PREVIEW surface:
 *   • reports element taps (nearest [data-el]) back to RN for comment pinning
 *   • applies a deterministic text edit and returns the new full HTML
 *   • plays an animated design back, scene by scene
 *
 * It no longer renders anything publishable. Capture used to live here too —
 * html2canvas for slides, WebCodecs + mp4-muxer for video — and that is what
 * made the export a DIFFERENT rendering from the preview: html2canvas is a
 * JavaScript reimplementation of CSS painting, so soft shadows, blurs, blend
 * modes and gradient text came out wrong, and whole classes of CSS had to be
 * banned in the AI's design prompt to work around it. Rendering now happens
 * server-side in real Chromium (services/render-worker), and the frame's only
 * job is to show the user what they are editing.
 *
 * ⭐ The playback logic is NOT written here. It is imported from
 * shared-libs/design/design-runtime and inlined into the injected script, so
 * the preview seeks a scene with the very same code the renderer does. Two
 * copies of "where is this design at time T" is exactly how preview and export
 * drift apart, so there is only one.
 *
 * Messages OUT (frame → RN):  {type:'ready'} | {type:'tap',…} | {type:'deselect'} |
 *                             {type:'html',html} | {type:'time',ms,duration} |
 *                             {type:'ended'} | {type:'error',message}
 * Messages IN  (RN → frame):  {type:'setText',id,text} | {type:'deselect'} |
 *                             {type:'showSlide',index,slideWidth} |
 *                             {type:'play'|'pause'} | {type:'seek',ms}
 */
import {
    measureDesign,
    pauseScene,
    playSceneFrom,
    sceneAt,
    seekScene,
} from "@/shared-libs/design/design-runtime";

/**
 * The shared runtime, serialized into the frame.
 *
 * `Function.prototype.toString()` returns the source of each function as the
 * bundler emitted it, and every function in design-runtime is deliberately
 * self-contained (no imports, no module-scope references), so inlining them
 * like this is safe — and it is what guarantees the preview and the server
 * renderer execute identical code.
 */
const SHARED_RUNTIME = [measureDesign, sceneAt, seekScene, playSceneFrom, pauseScene]
    .map((fn) => fn.toString())
    .join("\n");

export const BRIDGE_SCRIPT = `
(function(){
${SHARED_RUNTIME}

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

  function showSlide(i, slideWidth){
    var c = document.querySelector('[data-carousel]');
    if (c){ c.style.transition='transform .2s'; c.style.transform='translateX('+(-i*slideWidth)+'px)'; }
  }

  // ── Video playback ───────────────────────────────────────────────────────
  // A video design is N [data-slide] SCENES inside [data-carousel], each with a
  // data-duration (ms). Only one is visible at a time; it plays its own CSS
  // animations, then the player pages to the next. Measurement and seeking both
  // come from the shared runtime.
  var vMeasure = null, vRaf = null, vStartWall = 0, vBaseMs = 0, vActive = -1;
  function perfNow(){ return (window.performance && performance.now) ? performance.now() : Date.now(); }
  function measure(){ if (!vMeasure) vMeasure = measureDesign(); return vMeasure; }
  function vReport(ms){ send({type:'time', ms: Math.round(ms), duration: Math.round(measure().total)}); }
  function vStop(){ if(vRaf){ cancelAnimationFrame(vRaf); vRaf=null; } }

  function play(){
    var m = measure();
    vStop();
    vStartWall = perfNow();
    var i0 = sceneAt(m.offsets, vBaseMs);
    vActive = i0;
    playSceneFrom({ index: i0, localMs: vBaseMs - m.offsets[i0] });
    function tick(){
      var elapsed = vBaseMs + (perfNow() - vStartWall);
      if (elapsed >= m.total){ vBaseMs = 0; vStop(); vReport(m.total); send({type:'ended'}); return; }
      var idx = sceneAt(m.offsets, elapsed);
      if (idx !== vActive){
        vActive = idx;
        playSceneFrom({ index: idx, localMs: elapsed - m.offsets[idx] });
      }
      vReport(elapsed);
      vRaf = requestAnimationFrame(tick);
    }
    vRaf = requestAnimationFrame(tick);
  }

  function pause(){
    var elapsed = vBaseMs + (vStartWall ? (perfNow() - vStartWall) : 0);
    vBaseMs = Math.min(elapsed, measure().total);
    vStartWall = 0;
    vStop();
    if (vActive >= 0) pauseScene(vActive);
  }

  function seek(ms){
    var m = measure();
    vStop(); vStartWall = 0;
    ms = Math.max(0, Math.min(ms, m.total));
    vBaseMs = ms;
    var idx = sceneAt(m.offsets, ms);
    vActive = idx;
    seekScene({ index: idx, localMs: ms - m.offsets[idx] });
    vReport(ms);
  }

  function handle(payload){
    var msg; try { msg = JSON.parse(payload); } catch(e){ return; }
    if (msg.type === 'play'){ play(); return; }
    if (msg.type === 'pause'){ pause(); return; }
    if (msg.type === 'seek'){ seek(msg.ms||0); return; }
    if (msg.type === 'deselect'){ setSelected(null); return; }
    if (msg.type === 'setText'){
      var el = document.querySelector('[data-el="'+msg.id+'"]');
      if (el){ el.textContent = msg.text; }
      // Strip the transient editor selection/hover classes so they never get
      // persisted into the saved HTML revision (they'd otherwise render as a
      // permanent outline on reload).
      var savedSel = selectedEl, savedHover = hoverEl;
      if (selectedEl) selectedEl.classList.remove('__el-selected');
      if (hoverEl) hoverEl.classList.remove('__el-hover');
      var outHtml = '<!doctype html>'+document.documentElement.outerHTML;
      if (savedSel) savedSel.classList.add('__el-selected');
      if (savedHover) savedHover.classList.add('__el-hover');
      send({type:'html', html: outHtml});
    } else if (msg.type === 'showSlide'){
      showSlide(msg.index, msg.slideWidth);
    }
  }
  window.__cmd = handle;                                   // native injection entry
  window.addEventListener('message', function(e){          // web iframe entry
    if (typeof e.data === 'string') handle(e.data);
  });

  // Layout scaffolding we never want to select (the slide/carousel wrappers).
  function isScaffold(el){
    return el.hasAttribute && (el.hasAttribute('data-root') || el.hasAttribute('data-carousel') || el.hasAttribute('data-slide'));
  }
  // The element a click/hover targets. Prefers the nearest AI-tagged [data-el]
  // block (its intended editable unit); otherwise falls back to the EXACT element
  // pointed at — so every content element is selectable, not just tagged ones.
  function pickEl(node){
    var el = node;
    if (el && el.nodeType === 3) el = el.parentElement;
    var t = el;
    while (t && t !== document.body && !(t.getAttribute && t.getAttribute('data-el'))) t = t.parentElement;
    if (t && t.getAttribute && t.getAttribute('data-el')) return t;
    if (!el || el === document.body || el === document.documentElement) return null;
    if (isScaffold(el)) return null;
    return el;
  }
  // Give an untagged element a stable id the first time it's selected, so text
  // edits + AI directives can reference it (and it persists into saved HTML).
  var autoSeq = 0;
  function ensureId(el){
    var id = el.getAttribute('data-el');
    if (id) return id;
    id = 'el-' + (++autoSeq);
    el.setAttribute('data-el', id);
    return id;
  }
  // Directly editable = a leaf whose own text IS its content (no child elements).
  // Containers (which aggregate children's text) are NOT text-editable — editing
  // them would flatten their structure — so they only get the Ask-AI action.
  function isEditable(el){
    return el.children.length === 0 && (el.textContent || '').trim() !== '';
  }
  var selectedEl = null, hoverEl = null;
  function setHover(el){
    if (el === hoverEl) return;
    if (hoverEl) hoverEl.classList.remove('__el-hover');
    hoverEl = el;
    if (hoverEl) hoverEl.classList.add('__el-hover');
  }
  function setSelected(el){
    if (selectedEl && selectedEl !== el) selectedEl.classList.remove('__el-selected');
    selectedEl = el;
    if (selectedEl) selectedEl.classList.add('__el-selected');
  }
  // Hover affordance (web/desktop — pointer devices only). The hovered element
  // is exactly the one a click would select, so they read as the same target.
  document.addEventListener('mouseover', function(e){ setHover(pickEl(e.target)); }, true);
  document.addEventListener('mouseleave', function(){ setHover(null); }, true);
  document.addEventListener('click', function(e){
    var el = pickEl(e.target);
    if (el){
      setSelected(el);
      var id = ensureId(el);
      var r = el.getBoundingClientRect();
      send({type:'tap', id: id, text: el.textContent, editable: isEditable(el), rect:{x:r.left,y:r.top,w:r.width,h:r.height}});
    } else if (selectedEl){
      // Clicked empty canvas — deselect.
      setSelected(null);
      send({type:'deselect'});
    }
  }, true);
  document.addEventListener('keydown', function(e){
    if ((e.key === 'Escape' || e.keyCode === 27) && selectedEl){
      setSelected(null);
      send({type:'deselect'});
    }
  });
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
 * Inject the frame chrome: a scale so a slide fits the display width, and a clip
 * so the viewport shows exactly ONE slide (slideW×slideH) — the carousel strip
 * is translated left/right to page between slides.
 */
export function injectChrome(html: string, scale: number, slideW: number, slideH: number): string {
    // Scale via a transform on <body> (NOT `zoom`): transforms don't change an
    // element's layout size, so the design keeps its true dimensions while the
    // viewport clips to one slide. The server renders those true dimensions.
    const dw = Math.round(slideW * scale);
    const dh = Math.round(slideH * scale);
    const style =
        `<style>` +
        `html{width:${dw}px;height:${dh}px;overflow:hidden;margin:0;}` +
        `body{width:${slideW}px;height:${slideH}px;overflow:hidden;margin:0;transform:scale(${scale});transform-origin:top left;}` +
        `[data-carousel]{display:flex;will-change:transform;}` +
        // Editor selection affordances: a dashed outline + pointer cursor on the
        // hovered element, and a persistent solid outline on the selected one.
        // Class-based (not [data-el]) so ANY element shows them. The server
        // render never sees them — it loads the saved HTML, not this frame.
        `.__el-hover{outline:2px dashed #3b82f6 !important;outline-offset:2px;cursor:pointer;}` +
        `.__el-selected{outline:2px solid #2563eb !important;outline-offset:2px;box-shadow:0 0 0 4px rgba(37,99,235,0.18) !important;}` +
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
    | { type: "tap"; id: string; text: string; editable: boolean; rect: { x: number; y: number; w: number; h: number } }
    | { type: "deselect" }
    | { type: "html"; html: string }
    | { type: "time"; ms: number; duration: number }
    | { type: "ended" }
    | { type: "error"; message: string };

export interface DesignFrameHandle {
    setText: (id: string, text: string) => void;
    /** Clear the frame's persistent selection outline. */
    deselect: () => void;
    /** Page the carousel to slide `index` (slideWidth = per-slide px width). */
    showSlide: (index: number, slideWidth: number) => void;
    // Video playback (animated designs). Preview only — the publishable MP4 is
    // produced by the server render worker.
    play: () => void;
    pause: () => void;
    seek: (ms: number) => void;
}

export interface DesignFrameProps {
    html: string;
    width: number;
    height: number;
    /** Display width in px; the frame scales the design to fit. */
    displayWidth: number;
    onMessage: (msg: FrameOutMsg) => void;
}
