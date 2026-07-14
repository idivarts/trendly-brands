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
export const MP4_MUXER_URL = "https://cdn.jsdelivr.net/npm/mp4-muxer@5.2.2/build/mp4-muxer.min.js";

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
    var done = false;
    // A CDN request that stalls or is silently aborted (bad version, offline,
    // ad/privacy blocker) can fire neither onload nor onerror — which would leave
    // the render spinning forever. Fail loudly after a timeout instead.
    var to = setTimeout(function(){
      if (done) return; done = true;
      send({type:'error',message:'timed out loading '+url});
    }, 20000);
    s.src = url;
    s.onload = function(){
      if (done) return; done = true; clearTimeout(to);
      // Some CDNs answer a missing version with a 200 text body: onload fires but
      // the expected global is never defined. Treat that as a load failure.
      if (globalName && !window[globalName]){ send({type:'error',message:'failed to load '+url}); return; }
      cb();
    };
    s.onerror = function(){ if (done) return; done = true; clearTimeout(to); send({type:'error',message:'failed to load '+url}); };
    document.head.appendChild(s);
  }
  function loadH2C(cb){ loadScript(${JSON.stringify(HTML2CANVAS_URL)}, 'html2canvas', cb); }
  function sendBlob(type, blob){
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ __frameBlob: true, type: type, blob: blob }, '*');
    }
  }
  // Decode + mix the music bed (ducked) + voiceover into rendered PCM channels,
  // for muxing into the MP4. Resolves null if audio is absent or unsupported —
  // the render then falls back to video-only (never blocks the export).
  function prepAudio(cfg, totalMs){
    return new Promise(function(resolve){
      if (!cfg || (!cfg.musicUrl && !cfg.voiceoverUrl)){ resolve(null); return; }
      var AC = window.AudioContext || window.webkitAudioContext;
      var OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      if (!AC || !OAC || !window.AudioEncoder || !window.AudioData){ resolve(null); return; }
      var sampleRate = 44100;
      var length = Math.max(1, Math.ceil((totalMs/1000) * sampleRate));
      var ctx = new AC();
      function fetchDecode(url){
        if (!url) return Promise.resolve(null);
        return fetch(url, {mode:'cors'}).then(function(r){ return r.arrayBuffer(); }).then(function(b){ return ctx.decodeAudioData(b); }).catch(function(){ return null; });
      }
      Promise.all([fetchDecode(cfg.musicUrl), fetchDecode(cfg.voiceoverUrl)]).then(function(res){
        var music = res[0], voice = res[1];
        if (!music && !voice){ try{ctx.close();}catch(e){} resolve(null); return; }
        var offline = new OAC(2, length, sampleRate);
        if (music){
          var m = offline.createBufferSource(); m.buffer = music; m.loop = true;
          var mg = offline.createGain();
          var base = (cfg.musicVolume==null?0.7:cfg.musicVolume);
          mg.gain.value = (cfg.duckMusic!==false && voice) ? base*0.35 : base;
          m.connect(mg); mg.connect(offline.destination); m.start(0);
        }
        if (voice){
          var v = offline.createBufferSource(); v.buffer = voice;
          var vg = offline.createGain(); vg.gain.value = (cfg.voiceoverVolume==null?1:cfg.voiceoverVolume);
          v.connect(vg); vg.connect(offline.destination); v.start(0);
        }
        offline.startRendering().then(function(rendered){
          try{ctx.close();}catch(e){}
          var ch0 = rendered.getChannelData(0);
          var ch1 = rendered.numberOfChannels>1 ? rendered.getChannelData(1) : ch0;
          resolve({ ch0: ch0, ch1: ch1, sampleRate: sampleRate, length: rendered.length });
        }).catch(function(){ try{ctx.close();}catch(e){} resolve(null); });
      }).catch(function(){ try{ctx.close();}catch(e){} resolve(null); });
    });
  }

  // Web-only: render the animated design to a single MP4 (html2canvas frames +
  // WebCodecs VideoEncoder) with the soundtrack (AAC) muxed in via mp4-muxer.
  function captureVideo(fps, audioCfg){
    if (!window.VideoEncoder || !window.VideoFrame){ send({type:'error',message:'WebCodecs not supported in this browser'}); return; }
    if (!vInited) vInit();
    var H0 = vScenes[0] ? vScenes[0].offsetHeight : 0;
    var W = vSlideW - (vSlideW % 2), H = H0 - (H0 % 2);
    var totalMs = vTotal;
    if (W <= 0 || H <= 0){ send({type:'error',message:'could not measure the video frame'}); return; }
    loadH2C(function(){
      loadScript(${JSON.stringify(MP4_MUXER_URL)}, 'Mp4Muxer', function(){
        if (!window.Mp4Muxer || !window.Mp4Muxer.Muxer){ send({type:'error',message:'mp4-muxer failed to load'}); return; }
        prepAudio(audioCfg, totalMs).then(function(audio){
          try {
            var muxerCfg = { target: new window.Mp4Muxer.ArrayBufferTarget(), video: { codec: 'avc', width: W, height: H }, fastStart: 'in-memory' };
            if (audio){ muxerCfg.audio = { codec: 'aac', numberOfChannels: 2, sampleRate: audio.sampleRate }; }
            var muxer = new window.Mp4Muxer.Muxer(muxerCfg);

            var venc = new VideoEncoder({ output: function(c,m){ muxer.addVideoChunk(c,m); }, error: function(e){ send({type:'error',message:'venc: '+String(e)}); } });
            venc.configure({ codec: 'avc1.42001f', width: W, height: H, bitrate: 5000000, framerate: fps });

            // Encode the mixed audio up-front in ~1s AudioData chunks.
            var audioDone = Promise.resolve();
            if (audio){
              try {
                var aenc = new AudioEncoder({ output: function(c,m){ muxer.addAudioChunk(c,m); }, error: function(){} });
                aenc.configure({ codec: 'mp4a.40.2', numberOfChannels: 2, sampleRate: audio.sampleRate, bitrate: 128000 });
                var chunk = audio.sampleRate; // 1s
                for (var off = 0; off < audio.length; off += chunk){
                  var n = Math.min(chunk, audio.length - off);
                  var planar = new Float32Array(n*2);
                  planar.set(audio.ch0.subarray(off, off+n), 0);
                  planar.set(audio.ch1.subarray(off, off+n), n);
                  var ad = new AudioData({ format:'f32-planar', sampleRate: audio.sampleRate, numberOfFrames: n, numberOfChannels: 2, timestamp: Math.round(off/audio.sampleRate*1000000), data: planar });
                  aenc.encode(ad); ad.close();
                }
                audioDone = aenc.flush().then(function(){ aenc.close(); }).catch(function(){});
              } catch(e){ /* audio best-effort */ }
            }

            var frames = Math.max(1, Math.round(totalMs/1000*fps));
            function nextFrame(i){
              if (i >= frames){
                audioDone.then(function(){
                  venc.flush().then(function(){
                    venc.close(); muxer.finalize();
                    sendBlob('renderVideo', new Blob([muxer.target.buffer], {type:'video/mp4'}));
                  }).catch(function(e){ send({type:'error',message:'flush: '+String(e)}); });
                });
                return;
              }
              var t = i * (1000/fps);
              var idx = vSceneAt(t); vTranslate(idx); vSetTime(idx, t - vOffsets[idx]);
              var stage = vScenes[idx] || document.body;
              window.html2canvas(stage, {backgroundColor:'#ffffff', useCORS:true, scale:1, width:W, height:H, onclone:cleanClone}).then(function(canvas){
                var frame = new VideoFrame(canvas, { timestamp: Math.round(t*1000), duration: Math.round(1000000/fps) });
                venc.encode(frame, { keyFrame: (i % fps === 0) });
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
    });
  }
  function showSlide(i, slideWidth){
    var c = document.querySelector('[data-carousel]');
    if (c){ c.style.transition='transform .2s'; c.style.transform='translateX('+(-i*slideWidth)+'px)'; }
  }
  // ── Export-safe gradient fix ─────────────────────────────────────────────
  // html2canvas renders the CSS keyword \`transparent\` as transparent BLACK, so
  // our soft blob/glow shapes (radial-gradients fading to \`transparent\`) come out
  // as muddy gray blobs in the export while looking fine in the live preview.
  // Rewrite each gradient's transparent stops to the SAME color at alpha 0 — which
  // renders identically in the browser but cleanly in html2canvas. String-scanned
  // (no regex) so it stays safe inside this bridge template literal, and only ever
  // applied to the html2canvas CLONE, so the live design is untouched.
  function gradFirstColor(body){
    var hi = body.indexOf('#');
    if (hi !== -1){
      var hex='';
      for (var p=hi+1; p<body.length; p++){ var ch=body[p];
        if ((ch>='0'&&ch<='9')||(ch>='a'&&ch<='f')||(ch>='A'&&ch<='F')){ hex+=ch; } else { break; } }
      if (hex.length>=6){ return parseInt(hex.slice(0,2),16)+','+parseInt(hex.slice(2,4),16)+','+parseInt(hex.slice(4,6),16); }
      if (hex.length>=3){ var s=hex.slice(0,3); return parseInt(s[0]+s[0],16)+','+parseInt(s[1]+s[1],16)+','+parseInt(s[2]+s[2],16); }
    }
    var low=body.toLowerCase(), from=0;
    while (true){
      var ri=low.indexOf('rgb', from);
      if (ri===-1) break;
      var lp=body.indexOf('(', ri), rp=body.indexOf(')', ri);
      if (lp===-1||rp===-1) break;
      var parts=body.slice(lp+1, rp).split(',');
      if (parts.length>=3){
        var a = parts.length>=4 ? parseFloat(parts[3]) : 1;
        if (a>0){ return parseInt(parts[0],10)+','+parseInt(parts[1],10)+','+parseInt(parts[2],10); }
      }
      from=rp+1;
    }
    return null;
  }
  function gradReplaceAll(str, needleLower, rep){
    var out='', low=str.toLowerCase(), i=0;
    while (true){ var idx=low.indexOf(needleLower, i); if (idx===-1){ out+=str.slice(i); break; } out+=str.slice(i, idx)+rep; i=idx+needleLower.length; }
    return out;
  }
  function gradFixBody(body){
    var c=gradFirstColor(body); if (!c) return body;
    var rep='rgba('+c+',0)';
    body=gradReplaceAll(body, 'transparent', rep);
    body=gradReplaceAll(body, 'rgba(0, 0, 0, 0)', rep);
    body=gradReplaceAll(body, 'rgba(0,0,0,0)', rep);
    return body;
  }
  function fixTransparentGradients(css){
    if (!css) return css;
    var low=css.toLowerCase();
    if (low.indexOf('gradient(')===-1) return css;
    var out='', i=0, n=css.length;
    while (i<n){
      var g=low.indexOf('gradient(', i);
      if (g===-1){ out+=css.slice(i); break; }
      var open=g+8;                    // index of '(' after 'gradient'
      out += css.slice(i, open+1);
      var depth=1, j=open+1;
      for (; j<n; j++){ var ch=css[j]; if (ch==='('){ depth++; } else if (ch===')'){ depth--; if (depth===0){ break; } } }
      out += gradFixBody(css.slice(open+1, j)) + ')';
      i = j+1;
    }
    return out;
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
      // Never bake the editor's hover/selection outline into the export.
      var marked = doc.querySelectorAll('.__el-hover, .__el-selected');
      for (var i=0;i<marked.length;i++){ marked[i].classList.remove('__el-hover'); marked[i].classList.remove('__el-selected'); }
      // Fix gradients fading to \`transparent\` so soft blobs don't export as gray.
      var gStyles = doc.querySelectorAll('style');
      for (var gi=0; gi<gStyles.length; gi++){ gStyles[gi].textContent = fixTransparentGradients(gStyles[gi].textContent); }
      var gEls = doc.querySelectorAll('[style]');
      for (var gk=0; gk<gEls.length; gk++){
        var st = gEls[gk].getAttribute('style');
        if (st && st.toLowerCase().indexOf('gradient(') !== -1){ gEls[gk].setAttribute('style', fixTransparentGradients(st)); }
      }
      // Cache-bust cross-origin images so html2canvas always fetches a CORS-enabled
      // response. A logo cached earlier as a non-CORS copy by a plain <img> in the
      // live preview would otherwise be reused for html2canvas's crossOrigin request
      // and silently dropped from the export. The asset CloudFront distributions use
      // QueryString:false, so this extra query param doesn't fragment the edge cache —
      // it only changes the URL the browser keys its own HTTP cache on.
      var cimgs = doc.querySelectorAll('img');
      for (var ci=0; ci<cimgs.length; ci++){
        var isrc = cimgs[ci].getAttribute('src');
        if (isrc && isrc.indexOf('http')===0 && isrc.indexOf('__cors=')===-1){
          cimgs[ci].setAttribute('src', isrc + (isrc.indexOf('?')===-1 ? '?' : '&') + '__cors=1');
        }
      }
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
            // Report progress per slide so the UI can show a determinate bar.
            send({type:'renderProgress', frame: i+1, total: list.length});
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
    if (msg.type === 'deselect'){ setSelected(null); return; }
    if (msg.type === 'captureVideo'){ captureVideo(msg.fps||24, msg.audio); return; }
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
    } else if (msg.type === 'captureSlides' || msg.type === 'capture'){
      captureSlides();
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
        // Editor selection affordances: a dashed outline + pointer cursor on the
        // hovered element, and a persistent solid outline on the selected one.
        // Class-based (not [data-el]) so ANY element shows them. Stripped from the
        // html2canvas clone so they never bake into the export.
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
    | { type: "render"; dataUrl: string }
    | { type: "renderSlides"; dataUrls: string[] }
    | { type: "time"; ms: number; duration: number }
    | { type: "ended" }
    | { type: "renderProgress"; frame: number; total: number }
    | { type: "renderVideo"; blob: Blob }
    | { type: "error"; message: string };

export interface CaptureAudio {
    musicUrl?: string;
    voiceoverUrl?: string;
    musicVolume?: number;
    voiceoverVolume?: number;
    duckMusic?: boolean;
}

export interface DesignFrameHandle {
    setText: (id: string, text: string) => void;
    /** Clear the frame's persistent selection outline. */
    deselect: () => void;
    /** Page the carousel to slide `index` (slideWidth = per-slide px width). */
    showSlide: (index: number, slideWidth: number) => void;
    /** Capture each of `count` slides to a PNG (renderSlides message). */
    captureAll: (count: number) => void;
    // Video playback (animated designs).
    play: () => void;
    pause: () => void;
    seek: (ms: number) => void;
    /** Web only: encode the animated design to a single MP4 with the soundtrack
     *  muxed in (renderVideo message). `audio` carries the music/voice URLs + mix. */
    captureVideo: (fps: number, audio?: CaptureAudio) => void;
}

export interface DesignFrameProps {
    html: string;
    width: number;
    height: number;
    /** Display width in px; the frame scales the design to fit. */
    displayWidth: number;
    onMessage: (msg: FrameOutMsg) => void;
}
