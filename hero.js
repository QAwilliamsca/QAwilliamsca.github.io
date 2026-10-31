// Dotted portrait + starfield. Scrolling through the hero scatters the dots.
(function () {
  var canvas = document.getElementById("dots");
  if (!canvas || !window.PORTRAIT_SRC) return;
  var ctx = canvas.getContext("2d");
  var reduce = window.REDUCE;
  var track = document.querySelector(".hero-track");

  // Local time in Fairfax, VA for the header
  var timeEl = document.getElementById("local-time");
  function tick() {
    if (!timeEl) return;
    try {
      timeEl.textContent = "(" + new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "America/New_York", timeZoneName: "short" }).format(new Date()) + ")";
    } catch (e) { timeEl.textContent = ""; }
  }
  tick(); setInterval(tick, 30000);

  var W = 0, H = 0, dpr = 1;
  var dots = [];   // {hx, hy, b, r, vx, vy}
  var stars = [];  // {x, y, r, a}
  var progress = 0;
  var pointer = { x: -999, y: -999 };
  var raf = 0;
  var t0 = performance.now();
  var INTRO_DELAY = 350, INTRO_MS = 2000;

  var COLS = 120, ROWS = 160;
  var cells = null; // [{c, r, b}] sampled from the photo

  var img = new Image();
  img.onload = function () {
    var off = document.createElement("canvas");
    off.width = COLS; off.height = ROWS;
    var o = off.getContext("2d", { willReadFrequently: true });
    o.drawImage(img, 0, 0, COLS, ROWS);
    var data = o.getImageData(0, 0, COLS, ROWS).data;
    cells = [];
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var i = (r * COLS + c) * 4;
        var R = data[i], G = data[i + 1], B = data[i + 2];
        var mx = Math.max(R, G, B), mn = Math.min(R, G, B);
        var lum = (0.299 * R + 0.587 * G + 0.114 * B) / 255;
        var sat = mx ? (mx - mn) / mx : 0;
        // The wall is bright and nearly grey; everything else is the subject.
        if (lum > 0.5 && sat < 0.2) continue; // wall, including its shadowed patches near the shoulder
        cells.push({ c: c, r: r, lum: lum });
      }
    }
    // Stretch contrast across the subject so the face stands out from hair and jacket.
    var sorted = cells.map(function (k) { return k.lum; }).sort(function (a, b) { return a - b; });
    var lo = sorted[Math.floor(sorted.length * 0.03)], hi = sorted[Math.floor(sorted.length * 0.97)];
    cells.forEach(function (k) {
      var t = Math.min(1, Math.max(0, (k.lum - lo) / (hi - lo)));
      // No fade: dark jacket and hair stay visible as dimmer dots, the face stays brightest.
      k.b = 0.30 + 0.70 * Math.pow(t, 0.6);
    });
        layout();
    start();
  };
  img.src = window.PORTRAIT_SRC;

  function rand(seed) { var x = Math.sin(seed * 127.1) * 43758.5453; return x - Math.floor(x); }

  function layout() {
    if (!cells) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);

    var narrow = W < 860;
    var phone = W < 520;
    var ph = narrow ? (phone ? H * 0.45 : H * 0.62) : H * 0.84;           // portrait height
    var step0 = ph / ROWS;
    var skip = Math.max(1, Math.ceil(3.6 / step0));   // use every k-th sample on small screens so dots don't merge into stripes
    var step = step0 * skip;                           // distance between dots
    var pw = step0 * COLS;
    var ox = narrow ? (phone ? (W - pw) / 2 : W - pw - 20) : W - pw - Math.max(24, W * 0.05);
    var oy = narrow ? H * 0.08 : H - ph;

    var used = skip === 1 ? cells : cells.filter(function (k) { return k.c % skip === 0 && k.r % skip === 0; });
    dots = used.map(function (k, n) {
      var stagger = (Math.floor(k.r / skip) % 2) * step * 0.5;
      var a = rand(n + 1) * Math.PI * 2;
      var sp = 260 + rand(n + 7) * 900;
      return {
        hx: ox + k.c * step0 + stagger, hy: oy + k.r * step0,
        b: k.b, r: step * 0.5 * (0.35 + 0.65 * k.b),
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120
      };
    });

    stars = [];
    var count = Math.round((W * H) / 9000);
    for (var s = 0; s < count; s++) {
      stars.push({ x: rand(s + 3) * W, y: rand(s + 11) * H, r: 0.5 + rand(s + 19) * 1.3, a: 0.25 + rand(s + 29) * 0.6, sp: 0.6 + rand(s + 37) * 1.8, ph: rand(s + 43) * 6.28 });
    }
    draw();
  }

  function readProgress() {
    var scrollable = Math.max(1, track.offsetHeight - window.innerHeight);
    var top = track.getBoundingClientRect().top;
    var p = Math.min(1, Math.max(0, -top / scrollable));
    return reduce ? 0 : p * p * (3 - 2 * p);
  }

  var LEVELS = 8;
  function draw(now) {
    raf = 0;
    if (!dots.length) return;
    now = now || performance.now();
    // Intro: the dots fly in from far away and settle into the portrait
    var pi = 0;
    if (!reduce) {
      var t = (now - t0 - INTRO_DELAY) / INTRO_MS;
      pi = t <= 0 ? 1 : t >= 1 ? 0 : Math.pow(1 - t, 3);
    }
    var ps = readProgress();
    progress = ps;
    var p = Math.max(ps, pi);
    var secs = now / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // stars drift a little as you scroll
    ctx.fillStyle = "#ffffff";
    for (var s = 0; s < stars.length; s++) {
      var st = stars[s];
      ctx.globalAlpha = st.a * (1 - ps * 0.6) * (reduce ? 1 : 0.7 + 0.3 * Math.sin(secs * st.sp + st.ph));
      ctx.beginPath();
      ctx.arc(st.x, (st.y - p * 120 * st.r + H) % H, st.r, 0, 6.2832);
      ctx.fill();
    }

    var fade = (1 - Math.min(1, ps * 1.25)) * (1 - pi * 0.9);
    if (fade > 0.01) {
      var pushing = pointer.x > -900 && ps < 0.05 && pi < 0.05 && !reduce;
      var buckets = [];
      for (var l = 0; l < LEVELS; l++) buckets.push([]);
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        var x = d.hx + d.vx * p, y = d.hy + d.vy * p;
        if (pushing) {
          var dx = x - pointer.x, dy = y - pointer.y, dist2 = dx * dx + dy * dy;
          if (dist2 < 6400) { var dist = Math.sqrt(dist2) || 1, f = (80 - dist) / 80 * 16; x += dx / dist * f; y += dy / dist * f; }
        }
        var breathe = reduce ? 1 : 1 + 0.12 * Math.sin(secs * 1.6 + d.hx * 0.02 + d.hy * 0.015);
        buckets[Math.min(LEVELS - 1, Math.floor(d.b * LEVELS))].push(x, y, d.r * breathe * (1 - p * 0.5));
      }
      ctx.fillStyle = "#eaf2ff";
      for (var k = 0; k < LEVELS; k++) {
        var arr = buckets[k];
        if (!arr.length) continue;
        ctx.globalAlpha = fade * (0.25 + 0.75 * (k + 1) / LEVELS);
        ctx.beginPath();
        for (var j = 0; j < arr.length; j += 3) {
          ctx.moveTo(arr[j] + arr[j + 2], arr[j + 1]);
          ctx.arc(arr[j], arr[j + 1], arr[j + 2], 0, 6.2832);
        }
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // Text overlays fade as the portrait breaks apart
    var stage = canvas.parentNode;
    stage.style.setProperty("--p", ps.toFixed(3));
    // keep animating (twinkle, breathing, intro) while the hero is on screen
    if (!reduce && !document.hidden && track.getBoundingClientRect().bottom > 0) request();
  }

  function request() { if (!raf) raf = requestAnimationFrame(draw); }
  document.addEventListener("visibilitychange", request);

  function start() {
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", layout);
    if (!reduce) {
      canvas.parentNode.addEventListener("pointermove", function (e) {
        var r = canvas.getBoundingClientRect();
        pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; request();
      });
      canvas.parentNode.addEventListener("pointerleave", function () { pointer.x = pointer.y = -999; request(); });
    }
  }
})();
