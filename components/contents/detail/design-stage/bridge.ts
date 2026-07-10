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
export const MP4_MUXER_URL = "https://cdn.jsdelivr.net/npm/mp4-muxer@5.0.3/build/mp4-muxer.min.js";

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
  function loadScript(url, globalName, cb){
    if (globalName && window[globalName]) return cb();
    var s = document.createElement('script');
    s.src = url;
    s.onload = cb;
    s.onerror = function(){ send({type:'error',message:'failed to load '+url}); };
    document.head.appendChild(s);
  }
  function loadH2C(cb){ loadScript(${JSON.stringify(HTML2CANVAS_URL)}, 'html2canvas', cb); }
  function sendBlob(type, blob){
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ __frameBlob: true, type: type, blob: blob }, '*');
    }
  }
  // Web-only: render the animated design to a single MP4 via html2canvas frames
  // + WebCodecs VideoEncoder + mp4-muxer.
  function captureVideo(fps){
    if (!window.VideoEncoder || !window.VideoFrame){ send({type:'error',message:'WebCodecs not supported in this browser'}); return; }
    if (!vInited) vInit();
    var H0 = vScenes[0] ? vScenes[0].offsetHeight : 0;
    var W = vSlideW - (vSlideW % 2), H = H0 - (H0 % 2);
    var totalMs = vTotal;
    if (W <= 0 || H <= 0){ send({type:'error',message:'could not measure the video frame'}); return; }
    loadH2C(function(){
      loadScript(${JSON.stringify(MP4_MUXER_URL)}, 'Mp4Muxer', function(){
        try {
          if (!window.Mp4Muxer || !window.Mp4Muxer.Muxer){ send({type:'error',message:'mp4-muxer failed to load'}); return; }
          var muxer = new window.Mp4Muxer.Muxer({
            target: new window.Mp4Muxer.ArrayBufferTarget(),
            video: { codec: 'avc', width: W, height: H },
            fastStart: 'in-memory'
          });
          var encoder = new VideoEncoder({
            output: function(chunk, meta){ muxer.addVideoChunk(chunk, meta); },
            error: function(e){ send({type:'error',message:'encoder: '+String(e)}); }
          });
          encoder.configure({ codec: 'avc1.42001f', width: W, height: H, bitrate: 5000000, framerate: fps });
          var frames = Math.max(1, Math.round(totalMs/1000*fps));
          function nextFrame(i){
            if (i >= frames){
              encoder.flush().then(function(){
                encoder.close();
                muxer.finalize();
                sendBlob('renderVideo', new Blob([muxer.target.buffer], {type:'video/mp4'}));
              }).catch(function(e){ send({type:'error',message:'flush: '+String(e)}); });
              return;
            }
            var t = i * (1000/fps);
            var idx = vSceneAt(t); vTranslate(idx); vSetTime(idx, t - vOffsets[idx]);
            var stage = vScenes[idx] || document.body;
            window.html2canvas(stage, {backgroundColor:'#ffffff', useCORS:true, scale:1, width:W, height:H, onclone:cleanClone}).then(function(canvas){
              var frame = new VideoFrame(canvas, { timestamp: Math.round(t*1000), duration: Math.round(1000000/fps) });
              encoder.encode(frame, { keyFrame: (i % fps === 0) });
              frame.close();
              i++;
              if (i % 5 === 0) send({type:'renderProgress', frame:i, total:frames});
              setTimeout(function(){ nextFrame(i); }, 0);
            }).catch(function(e){ send({type:'error',message:String(e)}); });
          }
          nextFrame(0);
        } catch(e){ send({type:'error',message:String(e)}); }
      });
    });
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
  // ── Video: multi-scene sequencer ─────────────────────────────────────────
  // A video is N [data-slide] SCENES inside [data-carousel], each with a
  // data-duration (ms). Only ONE scene is visible at a time (the viewport is
  // clipped to one scene); it plays its own CSS animations, then the player
  // pages to the next. Total length = sum of scene durations.
  var vScenes = [], vOffsets = [], vTotal = 0, vRaf = null, vStartWall = 0, vBaseMs = 0, vActive = -1, vSlideW = 0, vInited = false;
  function perfNow(){ return (window.performance && performance.now) ? performance.now() : Date.now(); }
  function vInit(){
    vScenes = Array.prototype.slice.call(document.querySelectorAll('[data-slide]'));
    vOffsets = []; vTotal = 0;
    vSlideW = vScenes[0] ? vScenes[0].offsetWidth : 0;
    for (var i=0;i<vScenes.length;i++){
      vOffsets.push(vTotal);
      var d = parseInt(vScenes[i].getAttribute('data-duration')||'', 10);
      if (!(d>0)) d = 3000;
      vTotal += d;
    }
    if (vTotal <= 0) vTotal = 3000;
    vInited = true;
  }
  function vSceneAt(ms){ var idx=0; for (var i=0;i<vScenes.length;i++){ if (ms >= vOffsets[i]) idx=i; else break; } return idx; }
  function vTranslate(i){ var c=document.querySelector('[data-carousel]'); if(c){ c.style.transition='none'; c.style.transform='translateX('+(-i*vSlideW)+'px)'; } }
  function vSceneAnims(i){ return (vScenes[i] && vScenes[i].getAnimations) ? vScenes[i].getAnimations({subtree:true}) : []; }
  function vPlayFrom(i, localMs){ vSceneAnims(i).forEach(function(a){ try{ a.currentTime = localMs; a.play(); }catch(e){} }); }
  function vSetTime(i, localMs){ vSceneAnims(i).forEach(function(a){ try{ a.pause(); a.currentTime = localMs; }catch(e){} }); }
  function vPauseAnims(i){ vSceneAnims(i).forEach(function(a){ try{ a.pause(); }catch(e){} }); }
  function vReport(ms){ send({type:'time', ms: Math.round(ms), duration: Math.round(vTotal)}); }
  function vStop(){ if(vRaf){ cancelAnimationFrame(vRaf); vRaf=null; } }
  function play(){
    if (!vInited) vInit();
    vStop();
    vStartWall = perfNow();
    var e0 = vSceneAt(vBaseMs); vActive = e0; vTranslate(e0); vPlayFrom(e0, vBaseMs - vOffsets[e0]);
    function tick(){
      var elapsed = vBaseMs + (perfNow() - vStartWall);
      if (elapsed >= vTotal){ vBaseMs = 0; vStop(); vReport(vTotal); send({type:'ended'}); return; }
      var idx = vSceneAt(elapsed);
      if (idx !== vActive){ vActive = idx; vTranslate(idx); vPlayFrom(idx, elapsed - vOffsets[idx]); }
      vReport(elapsed);
      vRaf = requestAnimationFrame(tick);
    }
    vRaf = requestAnimationFrame(tick);
  }
  function pause(){
    var elapsed = vBaseMs + (vStartWall ? (perfNow() - vStartWall) : 0);
    vBaseMs = Math.min(elapsed, vTotal); vStartWall = 0; vStop();
    if (vActive >= 0) vPauseAnims(vActive);
  }
  function seek(ms){
    if (!vInited) vInit();
    vStop(); vStartWall = 0;
    ms = Math.max(0, Math.min(ms, vTotal)); vBaseMs = ms;
    var idx = vSceneAt(ms); vActive = idx; vTranslate(idx); vSetTime(idx, ms - vOffsets[idx]);
    vReport(ms);
  }

  function handle(payload){
    var msg; try { msg = JSON.parse(payload); } catch(e){ return; }
    if (msg.type === 'play'){ play(); return; }
    if (msg.type === 'pause'){ pause(); return; }
    if (msg.type === 'seek'){ seek(msg.ms||0); return; }
    if (msg.type === 'captureVideo'){ captureVideo(msg.fps||24); return; }
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
    | { type: "time"; ms: number; duration: number }
    | { type: "ended" }
    | { type: "renderProgress"; frame: number; total: number }
    | { type: "renderVideo"; blob: Blob }
    | { type: "error"; message: string };

export interface DesignFrameHandle {
    setText: (id: string, text: string) => void;
    /** Page the carousel to slide `index` (slideWidth = per-slide px width). */
    showSlide: (index: number, slideWidth: number) => void;
    /** Capture each of `count` slides to a PNG (renderSlides message). */
    captureAll: (count: number) => void;
    // Video playback (animated designs).
    play: () => void;
    pause: () => void;
    seek: (ms: number) => void;
    /** Web only: encode the animated design to a single MP4 (renderVideo message). */
    captureVideo: (fps: number, durationMs: number) => void;
}

export interface DesignFrameProps {
    html: string;
    width: number;
    height: number;
    /** Display width in px; the frame scales the design to fit. */
    displayWidth: number;
    onMessage: (msg: FrameOutMsg) => void;
}
