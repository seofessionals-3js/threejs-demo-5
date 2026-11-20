// Access: the view options (reduce motion, larger labels, higher contrast), a Play button that runs the build
// for you, chapter jumps, keyboard shortcuts, and a spoken line for screen readers.
// A classic script with no dependencies. view.js reads SEQ.prefs every frame and hangs its own actions on
// SEQ.onPlay, SEQ.onJump, SEQ.onStep, SEQ.onEdge and SEQ.onPrefs.
(function () {
  const SEQ = window.SEQ = window.SEQ || {}, KEY = 'steininger.view'; // the same key as the other Steininger pages, so a choice made once holds
  const $ = (id) => document.getElementById(id);
  const mq = matchMedia('(prefers-reduced-motion: reduce)'), mc = matchMedia('(prefers-contrast: more)');
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { /* private window: defaults */ }
  // what the visitor chose wins; otherwise the system setting decides
  const P = SEQ.prefs = { calm: saved.calm ?? mq.matches, large: !!saved.large, contrast: saved.contrast ?? mc.matches };
  const boxes = { calm: $('optCalm'), large: $('optLarge'), contrast: $('optContrast') };
  const apply = () => {
    for (const k in boxes) { document.body.classList.toggle(k, !!P[k]); boxes[k].checked = !!P[k]; }
    if (SEQ.onPrefs) SEQ.onPrefs(P); // view.js redraws the chart, label sizes and colours may have changed
  };
  for (const k in boxes) boxes[k].addEventListener('change', () => {
    P[k] = boxes[k].checked;
    try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) { /* not stored, still applied */ }
    apply();
  });
  mq.addEventListener('change', () => { if (saved.calm == null) { P.calm = mq.matches; apply(); } });
  apply();

  // ---- chapters: where each part of the build starts, in weeks of the programme
  SEQ.CHAPTERS = [
    { n: 'Bauzeitenplan', wk: 0, open: true }, { n: 'Einrichtung', wk: 0.9 }, { n: 'Aushub', wk: 2.6 }, { n: 'Fundamente', wk: 5.0 },
    { n: 'Poolgeschoss', wk: 7.8 }, { n: 'Wohngeschoss', wk: 11.6 }, { n: 'Obergeschoss', wk: 15.6 }, { n: 'Dächer, Glas', wk: 21.6 },
    { n: 'Travertin, Pool', wk: 32.4 }, { n: 'Übergabe', wk: 37.15 },
  ];
  const jump = (i) => { const c = SEQ.CHAPTERS[i]; if (c && SEQ.onJump) SEQ.onJump(c); };
  $('chapters').innerHTML = SEQ.CHAPTERS.map((c, i) => `<li><button type="button" data-i="${i}"><kbd>${(i + 1) % 10}</kbd>${c.n}</button></li>`).join('');
  $('chapters').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) jump(+b.dataset.i); });

  // ---- play: the build runs by itself until you touch it. view.js owns the clock and reports back here.
  const playBtn = $('playBtn');
  SEQ.setPlaying = (on) => {
    SEQ.playing = !!on;
    playBtn.setAttribute('aria-pressed', SEQ.playing ? 'true' : 'false');
    playBtn.querySelector('span').textContent = SEQ.playing ? 'Pause' : 'Abspielen';
    document.body.classList.toggle('playing', SEQ.playing);
  };
  playBtn.addEventListener('click', () => { if (SEQ.onPlay) SEQ.onPlay(); });

  // ---- the panel: a plain disclosure, closed by Escape or a click outside it
  const viewBtn = $('viewBtn'), panel = $('viewPanel');
  const open = (on) => {
    panel.hidden = !on; viewBtn.setAttribute('aria-expanded', on ? 'true' : 'false');
    if (on) boxes.calm.focus();
  };
  viewBtn.addEventListener('click', () => open(panel.hidden));
  addEventListener('pointerdown', (e) => { if (!panel.hidden && !panel.contains(e.target) && !viewBtn.contains(e.target)) open(false); });

  // ---- keys: P plays or pauses, 1 to 0 jump, the arrow keys move through the weeks, Escape closes the panel
  addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'Escape' && !panel.hidden) { open(false); viewBtn.focus(); return; }
    const t = e.target, field = /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && t.type !== 'checkbox'; // the week slider keeps its own arrow keys
    if (field) return;
    if (e.key === 'p' || e.key === 'P') { playBtn.click(); e.preventDefault(); return; }
    if (/^[0-9]$/.test(e.key)) { jump((+e.key + 9) % 10); return; } // 1 to 9, then 0 for the tenth
    const step = { ArrowDown: 1, ArrowRight: 1, PageDown: 4, ArrowUp: -1, ArrowLeft: -1, PageUp: -4 }[e.key];
    if (step && SEQ.onStep) { SEQ.onStep(Math.sign(step), Math.abs(step) > 1); e.preventDefault(); return; }
    if ((e.key === 'Home' || e.key === 'End') && SEQ.onEdge) { SEQ.onEdge(e.key === 'End'); e.preventDefault(); }
  });

  // ---- a spoken line: the week and what is being built, at most every two seconds
  const live = $('live');
  let said = '', due = 0, timer = 0;
  SEQ.say = (text) => {
    text = String(text).replace(/\s*·\s*/g, ', ').replace(/\s*\/\/\s*/g, ', ').replace(/\s+/g, ' ').trim();
    if (!text || text === said) return;
    said = text; clearTimeout(timer);
    timer = setTimeout(() => { live.textContent = said; due = performance.now() + 2000; }, Math.max(0, due - performance.now()));
  };
})();
