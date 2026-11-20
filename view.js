// Projekt Steininger, built from its programme. One scene, three ways of showing it.
//   ?dir=a  The Programme: the Gantt docked at the bottom, the site above it, one "today" line drives both.
//   ?dir=b  The Sheet is the Site: the foundation plan and the programme printed at 1:1 on the slope.
//   ?dir=c  Site Camera: the builder's time-lapse, the programme as a band along the bottom.
// Other params: wk (week, 0 to 38), shot (camera), tod (hour of day), ghost (0 to 1), open (A: chart only),
// room (entry|kitchen|living|stair|lounge|terrace).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildHouse, groundMaterial, natural, PHASES, MILESTONES, WEEKS, TOUR_W0, C, dateAt, clamp01, POOL, SITE, PIT, FOOTINGS } from './house.js';

const SEQ = window.SEQ || (window.SEQ = {});
const prefs = () => SEQ.prefs || {};
const q = new URLSearchParams(location.search);
const DIR = ['a', 'b', 'c'].includes(q.get('dir')) ? q.get('dir') : 'a';
const INIT_WK = Math.min(WEEKS, Math.max(0, parseFloat(q.get('wk') ?? '11.6')));
const INIT_SHOT = q.get('shot') || 'sig';
const INIT_TOD = parseFloat(q.get('tod') ?? '10');
const INIT_GHOST = parseFloat(q.get('ghost') ?? (DIR === 'b' ? '1' : '0'));
const INIT_OPEN = q.has('open');
const INIT_ROOM = q.get('room') || null;
const CENTER = [12, 0, -2];

// ------------------------------------------------------------------ the walk through the finished house, six stops on one spline
const INTERIOR_STOPS = [
  { id: 'entry',   u: 0.00, tab: '01 EINGANG',  lv: 'STATION 01 // HOF ±0,00',                 title: 'Eingang vom Hof',  spec: 'Tür aus Teak unter dem Vordach aus Travertin · Blick durch das Haus zum See' },
  { id: 'kitchen', u: 0.26, tab: '02 KÜCHE',    lv: 'STATION 02 // WOHNGESCHOSS ±0,00',        title: 'Küche und Essen',  spec: 'Küchenzeile aus Nussbaum · Insel aus Travertin · Esstisch für sechs am Glas' },
  { id: 'living',  u: 0.48, tab: '03 WOHNEN',   lv: 'STATION 03 // WOHNGESCHOSS ±0,00',        title: 'Wohnen',           spec: 'Sofa mit Blick über den Balkon · Schiebetür 2,85 m hoch · Eichendielen' },
  { id: 'stair',   u: 0.76, tab: '04 TREPPE',   lv: 'STATION 04 // HALLE · 18 STUFEN',         title: 'Treppe hinab',     spec: 'Fertigteillauf mit Eichenstufen an der Rückwand der zweigeschossigen Halle' },
  { id: 'lounge',  u: 0.86, tab: '05 POOLGESCHOSS', lv: 'STATION 05 // POOLGESCHOSS −3,20',    title: 'Lounge, Sauna, Billard', spec: 'Medienwand aus Nussbaum · Sauna mit Glasfront · Boden aus Travertin' },
  { id: 'terrace', u: 1.00, tab: '06 POOL',     lv: 'STATION 06 // POOLTERRASSE −3,16',        title: 'Übergabe am Pool', spec: 'Pool 6,6 × 11,2 m auf der Böschung · darüber die Auskragung von 4,80 m' },
];

// Keyframes of the walk (u in [0, 1]): in from the court, across the living level, down the lower flight, out to the pool.
const flightY = z => -3.2 * clamp01((-1.75 - z) / 4.8) + 1.6;
const TOUR_KEYS = [
  { u: 0.00, pos: [-2.6, 1.64, 1.25],  at: [8.0, 1.5, 1.2],     fov: 52 }, // 01 on the court, the door ahead
  { u: 0.09, pos: [2.6, 1.62, 1.25],   at: [9.5, 1.4, 0.9],     fov: 56 }, // under the canopy
  { u: 0.17, pos: [5.4, 1.6, 0.6],     at: [9.3, 1.1, 1.9],     fov: 60 }, // inside, the kitchen to the right
  { u: 0.26, pos: [6.9, 1.56, -2.5],   at: [9.3, 1.0, 1.9],     fov: 60 }, // 02 kitchen and island
  { u: 0.37, pos: [9.4, 1.56, -1.7],   at: [14.3, 0.9, 1.0],    fov: 60 }, // the dining table by the glass
  { u: 0.48, pos: [11.7, 1.56, 0.6],   at: [12.9, 0.95, -5.3],  fov: 62 }, // 03 across the living room
  { u: 0.56, pos: [13.4, 1.6, -1.9],   at: [10.2, 1.0, -5.6],   fov: 62 }, // the sofa, the hall behind it
  { u: 0.62, pos: [6.2, 1.6, 0.1],     at: [4.0, 1.0, -3.2],    fov: 60 }, // back to the hall
  { u: 0.66, pos: [4.61, 1.6, -0.75],  at: [4.9, 0.2, -5.0],    fov: 60 }, // at the head of the lower flight
  { u: 0.70, pos: [4.61, flightY(-1.75), -1.75], at: [5.2, -1.2, -6.4], fov: 60 }, // 04 down the stair
  { u: 0.74, pos: [4.61, flightY(-3.35), -3.35], at: [6.4, -2.2, -7.0], fov: 60 },
  { u: 0.78, pos: [4.61, flightY(-4.95), -4.95], at: [8.0, -2.3, -6.9], fov: 60 },
  { u: 0.81, pos: [4.61, flightY(-6.55), -6.55], at: [9.5, -2.2, -6.6], fov: 60 },
  { u: 0.86, pos: [6.6, -1.62, -6.2],  at: [12.5, -2.2, -5.9],  fov: 62 }, // 05 the lounge in front of the media wall
  { u: 0.90, pos: [9.3, -1.62, -1.6],  at: [5.6, -2.2, 2.3],    fov: 62 }, // the sauna, the billiard table beside it
  { u: 0.93, pos: [14.2, -1.62, -2.3], at: [19.5, -2.0, -3.7],  fov: 60 }, // towards the open door
  { u: 0.955, pos: [17.3, -1.62, -3.85], at: [24.0, -2.5, -3.6], fov: 58 }, // on its axis
  { u: 0.972, pos: [19.9, -1.56, -3.5], at: [26.0, -2.6, -6.0],  fov: 58 }, // out on the terrace, the pool ahead
  { u: 0.986, pos: [22.6, -1.5, -1.9],  at: [17.5, -0.6, -6.5],  fov: 60 }, // turning round at the edge of the water
  { u: 1.00, pos: [27.6, -1.25, -1.5],  at: [14.2, 1.5, -3.5],   fov: 64 }, // 06 back over the pool, the whole house ahead
];

const tourPosCurve = new THREE.CatmullRomCurve3(TOUR_KEYS.map(k => new THREE.Vector3(...k.pos)), false, 'centripetal');
const tourAtCurve = new THREE.CatmullRomCurve3(TOUR_KEYS.map(k => new THREE.Vector3(...k.at)), false, 'centripetal');

function sampleTourSpline(u) {
  const uc = clamp01(u);
  let idx = 0;
  for (let i = 0; i < TOUR_KEYS.length - 1; i++) {
    if (uc >= TOUR_KEYS[i].u && uc <= TOUR_KEYS[i + 1].u) { idx = i; break; }
  }
  const k0 = TOUR_KEYS[idx], k1 = TOUR_KEYS[idx + 1];
  const localT = k1.u > k0.u ? (uc - k0.u) / (k1.u - k0.u) : 0;
  const splineT = (idx + localT) / (TOUR_KEYS.length - 1);
  const pos = tourPosCurve.getPoint(splineT);
  const at = tourAtCurve.getPoint(splineT);
  const fov = k0.fov + (k1.fov - k0.fov) * localT;
  return { pos: [pos.x, pos.y, pos.z], at: [at.x, at.y, at.z], fov };
}

function activeInteriorStop(u) {
  let best = INTERIOR_STOPS[0], minDist = Infinity;
  for (const st of INTERIOR_STOPS) {
    const d = Math.abs(u - st.u);
    if (d < minDist) { minDist = d; best = st; }
  }
  return best;
}

const initRoomObj = INIT_ROOM ? INTERIOR_STOPS.find(s => s.id === INIT_ROOM) : null;
const initTourVal = initRoomObj ? initRoomObj.u : (INIT_SHOT === 'inside' ? 0.26 : 0.0);

const state = {
  dir: DIR,
  wk: INIT_WK,
  targetWk: INIT_WK,
  shot: INIT_SHOT,
  camMode: q.has('shot') ? INIT_SHOT : 'auto',
  tod: INIT_TOD,
  ghost: INIT_GHOST,
  open: INIT_OPEN,
  playing: false,
  userMoved: false,
  tour: initTourVal,
  targetTour: initTourVal,
  roomPinned: !!initRoomObj,
};

const pad2 = n => String(n).padStart(2, '0');
const fmtDay = d => d.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/[.,]/g, '');
const weekNo = w => Math.min(WEEKS, Math.floor(w) + 1);
const activePhases = w => PHASES.filter(p => w >= p.w0 && w < p.w1);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// ------------------------------------------------------------------ renderer & PBR environment
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.04;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.domElement.setAttribute('aria-label', 'Projekt Steininger, ein 3D-Modell, das sich nach dem Bauzeitenplan aufbaut');
renderer.domElement.setAttribute('role', 'img');
document.getElementById('stage').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const bgCol = new THREE.Color(DIR === 'c' ? 0xE1E5DC : C.paper);
scene.background = bgCol;
scene.fog = new THREE.Fog(bgCol, 80, 230);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.65;

const hemi = new THREE.HemisphereLight(0xfffcf5, 0xd5cbb8, 1.25);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1dc, 2.65);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -38, right: 38, top: 38, bottom: -38, near: 1, far: 170 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);

// Cool sky fill from the north-east, so the glass front and the shaded walls keep their relief
const fillLight = new THREE.DirectionalLight(0xe2ebf6, 0.62);
fillLight.position.set(46, 26, -20);
scene.add(fillLight);

// The sun at an hour of the day, in the season the week falls in: March to November.
function placeSun(hour, week) {
  const phi = (hour - 12) / 6 * Math.PI / 2;
  const elMax = THREE.MathUtils.degToRad(Math.max(30, 40 + 23 * Math.sin(2 * Math.PI * week / 52)));
  const el = Math.max(THREE.MathUtils.degToRad(5), elMax * Math.sin(Math.PI * clamp01((hour - 5) / 15)));
  const d = new THREE.Vector3(-Math.sin(phi) * Math.cos(el), Math.sin(el), Math.cos(phi) * Math.cos(el));
  sun.target.position.set(...CENTER);
  sun.position.copy(d.multiplyScalar(75)).add(sun.target.position);
  const warm = 1 - clamp01((el - 0.12) / 0.5);
  sun.color.set(0xfff4e6).lerp(new THREE.Color(0xffc48a), warm * 0.8);
  sun.intensity = 2.65 * (0.55 + 0.45 * clamp01(el / 0.5));
  return el;
}

// ------------------------------------------------------------------ the ground and the house
const SHEET = { x0: -12, x1: 40, z0: -15, z1: 24 };
const SHEET_PX = 80;
const uvSheet = (x, z) => [(x - SHEET.x0) / (SHEET.x1 - SHEET.x0), 1 - (z - SHEET.z0) / (SHEET.z1 - SHEET.z0)];
const GANTT_BOX = { x0: -9.5, x1: 23.5, z0: 9.6, z1: 21.6 }, GANTT_LAB = 7.2;
const INK = '#10241a', LEAF = '#5fa512';
const LABEL_FONT = "Arimo, 'Helvetica Neue', Arial, sans-serif", DISPLAY_FONT = "'BBH Bogle', Arimo, 'Arial Black', sans-serif";
let planWalls = [];   // filled once the house is built; the sheet is drawn again then
let sheetTex = null;
let sheetBaseCanvas = null;
let sheetWorkCanvas = null;
const groundMat = DIR === 'b' ? groundMaterial({ color: 0xE9E9E4, map: drawSheet(state.wk), contour: 0 })
  : DIR === 'c' ? groundMaterial({ color: 0xD3D2B6, contour: 0.08, mud: 1 })
  : groundMaterial({ color: 0xE2E0D3, contour: 0.2 });

const house = buildHouse({ ghost: DIR === 'b', groundMat, groundUV: DIR === 'b' ? uvSheet : null });
scene.add(house.root);
planWalls = house.planWalls;

if (DIR === 'a') {
  // the boundary of the site, dashed across the slope
  const m = 1.5, pts = [];
  const run = (x0, z0, x1, z1) => { const n = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 1.5); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, z = z0 + (z1 - z0) * i / n; pts.push(new THREE.Vector3(x, natural(x, z) + 0.05, z)); } };
  run(SITE.x0 - m, SITE.z0 - m, SITE.x1 + m, SITE.z0 - m); run(SITE.x1 + m, SITE.z0 - m, SITE.x1 + m, SITE.z1 + m);
  run(SITE.x1 + m, SITE.z1 + m, SITE.x0 - m, SITE.z1 + m); run(SITE.x0 - m, SITE.z1 + m, SITE.x0 - m, SITE.z0 - m);
  const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: C.ink, dashSize: 1.2, gapSize: 0.4, transparent: true, opacity: 0.42 }));
  l.computeLineDistances();
  scene.add(l);
}

// ------------------------------------------------------------------ cameras
const SHOTS = {
  sig:      { pos: [53, 21, 40],        at: [13.5, -1.2, 0.8],   fov: 34 },
  a2:       { pos: [44, 31, 31],        at: [10.5, -2.2, -1.5],  fov: 32 },
  top:      { pos: [13.5, 76, 4.56],    at: [13.5, 0, 4.5],      fov: 34 },
  b2:       { pos: [27, 36, 38],        at: [12, -3, 3.5],       fov: 36 },
  b3:       { pos: [40, 17, 32],        at: [12.5, -1.5, 3.0],   fov: 38 },
  inside:   sampleTourSpline(initTourVal),
  cam:      { pos: [50, 16.5, 34],      at: [14, -0.8, -0.4],    fov: 38 },
  path:     { pos: [-11, 1.7, 6.5],     at: [6, 3.2, -1.2],      fov: 46 },
};

const curCamPos = new THREE.Vector3(...(SHOTS[state.shot] || SHOTS.sig).pos);
const curCamAt = new THREE.Vector3(...(SHOTS[state.shot] || SHOTS.sig).at);
let curCamFov = (SHOTS[state.shot] || SHOTS.sig).fov;

const camera = new THREE.PerspectiveCamera(curCamFov, innerWidth / innerHeight, 0.08, 700);

function getTargetCameraPose(shotKey) {
  if (shotKey === 'inside') return sampleTourSpline(state.tour);
  return SHOTS[shotKey] || SHOTS.sig;
}

function applyCamera(shotKey, lerpFactor = 1) {
  const s = getTargetCameraPose(shotKey);
  if (lerpFactor >= 0.999 || prefs().calm) {
    curCamPos.set(...s.pos);
    curCamAt.set(...s.at);
    curCamFov = s.fov;
  } else {
    curCamPos.lerp(new THREE.Vector3(...s.pos), lerpFactor);
    curCamAt.lerp(new THREE.Vector3(...s.at), lerpFactor);
    curCamFov += (s.fov - curCamFov) * lerpFactor;
  }
  camera.fov = curCamFov;
  camera.aspect = innerWidth / innerHeight;
  if (state.dir === 'a' && !state.open) {
    const yOff = state.shot === 'inside' ? Math.round(innerHeight * 0.05) : Math.round(innerHeight * 0.095);
    camera.setViewOffset(innerWidth, innerHeight, 0, yOff, innerWidth, innerHeight);
  } else {
    camera.clearViewOffset();
  }
  camera.updateProjectionMatrix();
  camera.position.copy(curCamPos);
  camera.lookAt(curCamAt);
}

// The camera that follows the weeks once the visitor has moved
function autoShotForWeek(w) {
  if (!state.userMoved) return state.shot;
  if (state.dir === 'a') {
    if (w < 3.3) return 'a2';
    if (w >= TOUR_W0) return 'inside';
    return 'sig';
  } else if (state.dir === 'b') {
    if (w < 1.0 || w >= 37.7) return 'top';
    if (w < 6.0) return 'b2';
    return 'b3';
  } else {
    if (w >= TOUR_W0 + 0.08) return 'inside';
    if (w >= 36.8) return 'path';
    return 'cam';
  }
}

function updateSceneForWeek(w, lerpCam = 1) {
  const targetShot = state.camMode === 'auto' ? autoShotForWeek(w) : state.camMode;
  state.shot = targetShot;

  // Once the house is handed over, the last weeks of the scroll drive the walk through it
  if (targetShot === 'inside' && state.userMoved && !state.roomPinned) {
    const startW = state.dir === 'c' ? TOUR_W0 + 0.08 : TOUR_W0;
    state.targetTour = clamp01((w - startW) / Math.max(0.01, WEEKS - startW));
    if (lerpCam >= 0.999 || prefs().calm) state.tour = state.targetTour;
  }

  applyCamera(targetShot, lerpCam);

  if (state.userMoved) {
    if (state.dir === 'c') {
      state.tod = 7.3 + (w / WEEKS) * 9.6;
    } else if (state.dir === 'b') {
      state.ghost = w < 0.9 || w > 37.0 ? 0 : w < 5.5 ? 0.45 : 1.0;
    }
  }
  const hour = state.dir === 'c' ? state.tod : state.dir === 'b' ? 12.6 : 10;
  placeSun(hour, w);
  hemi.intensity = state.shot === 'inside' ? 1.65 : 1.25;
  scene.environmentIntensity = state.shot === 'inside' ? 0.82 : 0.65;
  if (state.dir === 'c') { hemi.color.set(0xf4f7ff); groundMat.userData.u.uMud.value = w > 0.5 && w < 36.4 ? 1 : 0; }

  house.update(w, { ghost: state.ghost, calm: prefs().calm, snap: lerpCam >= 0.999 });
}

updateSceneForWeek(state.wk, 1);

// ------------------------------------------------------------------ the programme SVG, drawn from PHASES
// The colours follow the view options: higher contrast darkens every tone, larger labels scale the type.
function chartLook() {
  const hi = !!prefs().contrast, big = prefs().large ? 1.16 : 1;
  const rgb = hi ? '6,20,13' : '16,36,26';
  const a = v => `rgba(${rgb},${Math.min(1, hi ? v * 1.7 : v)})`;
  return { ink: `rgb(${rgb})`, a, leaf: hi ? '#3d7607' : '#5fa512', leafInk: hi ? '#2c5903' : '#3d7607', lime: '#c4f03e', paper: '#f1f0e6', big, font: "Arimo, 'Helvetica Neue', Arial, sans-serif" };
}

function programmeSVG(T, W, H, o = {}) {
  const L = chartLook(), f = n => (n * L.big).toFixed(1);
  const compact = !!o.compact;
  const showDur = o.showDur ?? !compact;
  const labelW = (o.labelW ?? (compact ? 176 : 210)) * (L.big > 1 ? 1.08 : 1);
  const durW = showDur ? 48 : 0;
  const headH = compact ? 22 : 54;
  const rows = PHASES.length;
  const msH = compact ? 0 : 34;
  const rowH = Math.max(12, (H - headH - msH) / rows);
  const x0 = labelW, x1 = Math.max(x0 + 50, W - durW);
  const X = w => x0 + (x1 - x0) * w / WEEKS;
  const Y = i => headH + i * rowH;
  const txt = (x, y, size, str, fill, o2 = {}) => `<text x="${x}" y="${y}" font-family="${L.font}" font-size="${f(size)}" font-weight="${o2.w || 600}" fill="${fill}" letter-spacing="${o2.ls ?? '0.08em'}"${o2.anchor ? ` text-anchor="${o2.anchor}"` : ''}>${esc(str)}</text>`;

  let s = `<svg class="gantt-svg" role="img" aria-label="Bauzeitenplan, ${WEEKS} Wochen. Ziehen, um durch den Bau zu spulen." data-x0="${x0}" data-x1="${x1}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">`;
  s += `<defs><pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="5" stroke="${L.a(0.3)}" stroke-width="1"/></pattern></defs>`;

  if (!compact) {
    s += `<line x1="0" y1="${headH - 2}" x2="${W}" y2="${headH - 2}" stroke="${L.ink}" stroke-width="1.2"/>`;
    s += txt(0, headH - 23, 9.5, 'PSP // PHASE', L.a(0.72), { w: 700 });
    s += txt(0, headH - 9, 8.5, 'KRITISCHER PFAD', L.a(0.6));
    s += txt(W, headH - 23, 9.5, 'DAUER', L.a(0.72), { w: 700, anchor: 'end' });
  } else {
    s += `<line x1="0" y1="${headH - 2}" x2="${W}" y2="${headH - 2}" stroke="${L.a(0.28)}" stroke-width="1"/>`;
    s += txt(0, 14, 9, 'PSP // KRITISCHER PFAD', L.a(0.72), { w: 700 });
    if (showDur) s += txt(W, 14, 9, 'DAUER', L.a(0.72), { w: 700, anchor: 'end' });
  }

  // the weeks: a tick for each, a number for every second one, the months underneath on the full sheet
  const colW = (x1 - x0) / WEEKS, every = colW >= 26 * L.big ? 1 : colW >= 13 * L.big ? 2 : 4;
  for (let k = 0; k <= WEEKS; k++) {
    const x = X(k);
    s += `<line x1="${x}" y1="${compact ? 0 : headH - 10}" x2="${x}" y2="${H - msH}" stroke="${L.a(k % 4 === 0 ? 0.24 : 0.09)}" stroke-width="1"/>`;
    if (k < WEEKS) {
      const d = dateAt(k), prev = k ? dateAt(k - 1) : null;
      if ((k + 1) % every === 0) s += txt(X(k + 0.5), compact ? 14 : headH - 23, compact ? 9 : 10, pad2(k + 1), L.ink, { w: 700, anchor: 'middle', ls: '0.02em' });
      if (!compact && (!prev || prev.getMonth() !== d.getMonth())) s += txt(X(k) + 3, headH - 9, 8.5, d.toLocaleDateString('de-DE', { month: 'short' }).replace('.', '').toUpperCase(), L.a(0.66));
    }
  }

  PHASES.forEach((p, i) => {
    const y = Y(i), bh = rowH * (compact ? 0.58 : 0.45), by = y + (rowH - bh) / 2;
    const live = T >= p.w0 && T < p.w1, done = T >= p.w1;
    s += `<g class="gantt-row" data-phase="${p.n}" data-w0="${p.w0}" data-w1="${p.w1}">`;
    s += `<rect class="row-bg" x="0" y="${y}" width="${W}" height="${rowH}" fill="${live ? 'rgba(95,165,18,0.12)' : 'transparent'}"/>`;
    s += `<line x1="0" y1="${y + rowH}" x2="${W}" y2="${y + rowH}" stroke="${L.a(0.11)}"/>`;

    const fs = compact ? 10.5 : 12.5, base = y + rowH / 2 + fs * L.big * 0.35;
    s += txt(0, base, compact ? 9 : 10, pad2(p.n + 1), live ? L.leafInk : done ? L.ink : L.a(0.6), { w: 700, ls: '0.02em' });
    s += txt(compact ? 24 : 30, base, fs, p.name.toUpperCase(), L.ink, { w: 700, ls: '0.06em' });

    s += `<rect x="${X(p.w0)}" y="${by}" width="${Math.max(2, X(p.w1) - X(p.w0))}" height="${bh}" fill="url(#hatch)" stroke="${L.ink}" stroke-width="1"/>`;
    const pe = Math.min(T, p.w1);
    if (pe > p.w0) s += `<rect x="${X(p.w0)}" y="${by}" width="${Math.max(1, X(pe) - X(p.w0))}" height="${bh}" fill="${live ? L.leaf : L.ink}"/>`;
    if (showDur) s += txt(W, y + rowH / 2 + 3.5, 9, `${Math.round((p.w1 - p.w0) * 5)} T`, live ? L.leafInk : L.a(0.7), { w: live ? 700 : 500, anchor: 'end', ls: '0.04em' });
    if (i < rows - 1) {
      const n = PHASES[i + 1];
      if (n.w0 >= p.w1 - 0.25) s += `<path d="M${X(p.w1)} ${by + bh / 2} H${X(n.w0) - 5} V${Y(i + 1) + rowH / 2}" fill="none" stroke="${L.a(0.38)}" stroke-width="1"/>`;
      else s += `<path d="M${X(n.w0) - 5} ${by + bh} V${Y(i + 1) + rowH / 2} H${X(n.w0)}" fill="none" stroke="${L.a(0.38)}" stroke-width="1"/>`;
    }
    s += `</g>`;
  });

  if (!compact) {
    const my = H - msH / 2 + 3;
    s += txt(0, my + 4, 9.5, 'MEILENSTEINE', L.a(0.7), { w: 700 });
    for (const [w, name] of MILESTONES) {
      const x = X(w), on = T >= w - 0.02, left = w > WEEKS * 0.6;
      s += `<path d="M${x} ${my - 6} L${x + 6} ${my} L${x} ${my + 6} L${x - 6} ${my} Z" fill="${on ? L.leaf : L.paper}" stroke="${L.ink}" stroke-width="1.2"/>`;
      s += txt(x + (left ? -10 : 10), my + 4, 9.5, name.toUpperCase(), L.ink, { w: on ? 700 : 500, anchor: left ? 'end' : 'start' });
    }
  }

  const tx = X(T);
  s += `<line x1="${tx}" y1="0" x2="${tx}" y2="${H - (compact ? 0 : msH - 6)}" stroke="${L.leaf}" stroke-width="2"/>`;
  const lab = `HEUTE · ${fmtDay(dateAt(T)).toUpperCase()}`;
  const lw = (lab.length * 6.4 + 14) * L.big;
  const lx = Math.min(Math.max(tx - lw / 2, x0), W - lw);
  s += `<rect x="${lx}" y="${compact ? -11 : -7}" width="${lw}" height="${16 * L.big}" fill="${L.ink}"/>`;
  s += `<text x="${lx + lw / 2}" y="${compact ? 0.5 * L.big : 4.5 * L.big}" font-family="${L.font}" font-size="${f(9)}" font-weight="700" fill="${L.lime}" text-anchor="middle" letter-spacing="0.08em">${lab}</text>`;
  return s + '</svg>';
}

// ------------------------------------------------------------------ the CAD bar and the HUD
const hud = document.getElementById('hud');
hud.innerHTML = '<div id="hud-bar"></div><div id="hud-body"></div>';
const hudBar = hud.firstChild, hudBody = hud.lastChild;
const BRAND = '<span class="brand-badge">Projekt Steininger</span>';
const META = `<span><b>HAUS AM HANG</b></span><span>START MO 1. MÄR 2027</span><span>SCHLÜSSEL FR 19. NOV 2027</span><span>BGF 480 M² · STAHLBETON, TRAVERTIN</span>`;
const META_SHORT = `<span><b>HAUS AM HANG</b></span><span>START 1. MÄR 2027</span><span>SCHLÜSSEL 19. NOV 2027</span><span>BGF 480 M²</span>`;

function renderCadBar() {
  const wkStr = `WO ${pad2(Math.floor(state.wk))}.${Math.floor((state.wk % 1) * 10)}`;
  const cam = (k, label, title) => `<button class="cad-btn ${state.camMode === k || (k === 'inside' && state.shot === 'inside') ? 'on' : ''}" data-cam="${k}" title="${title}" aria-pressed="${state.camMode === k}">${label}</button>`;
  return `
    <div class="cad-bar" role="toolbar" aria-label="Variante, Kamera und Bauwoche">
      <div class="grp">
        <span class="grp-lbl">VAR</span>
        <button class="cad-btn ${state.dir === 'a' ? 'on' : ''}" data-dir="a" title="Variante A: Der Bauzeitenplan">A // PLAN</button>
        <button class="cad-btn ${state.dir === 'b' ? 'on' : ''}" data-dir="b" title="Variante B: Plan im Maßstab 1:1">B // 1:1 BLATT</button>
        <button class="cad-btn ${state.dir === 'c' ? 'on' : ''}" data-dir="c" title="Variante C: Baustellenkamera">C // KAM</button>
      </div>
      <div class="grp grp-cam">
        <span class="grp-lbl">KAM</span>
        ${cam('auto', 'AUTO', 'Die Kamera folgt den Wochen')}${cam('sig', 'ISO', 'Schrägansicht von Südosten')}${cam('a2', 'HOCH', 'Hohe Schrägansicht')}${cam('top', 'OBEN', 'Draufsicht')}${cam('path', 'HOF', 'Auf Augenhöhe im Hof')}${cam('inside', 'INNEN', 'Rundgang durch das Haus')}
      </div>
      <div class="grp">
        <div class="cad-scrub">
          <input type="range" min="0" max="${WEEKS}" step="0.05" value="${state.wk.toFixed(2)}" aria-label="Bauwoche wählen" aria-valuetext="Woche ${weekNo(state.wk)} von ${WEEKS}">
          <span class="wk-readout">${wkStr}</span>
        </div>
      </div>
    </div>`;
}

let barKey = '';
function renderBar() {
  const key = [state.dir, state.camMode, state.shot === 'inside'].join('|');
  if (key !== barKey) { barKey = key; hudBar.innerHTML = renderCadBar(); bindBarEvents(); return; }
  const sl = hudBar.querySelector('input[type="range"]');
  sl.value = state.wk.toFixed(2);
  sl.setAttribute('aria-valuetext', `Woche ${weekNo(state.wk)} von ${WEEKS}`);
  hudBar.querySelector('.wk-readout').textContent = `WO ${pad2(Math.floor(state.wk))}.${Math.floor((state.wk % 1) * 10)}`;
}

const roomTabs = (isInside, curStop) => `<div class="room-tabs" role="group" aria-label="Stationen des Rundgangs">${INTERIOR_STOPS.map(st => `<button class="room-tab ${isInside && curStop.id === st.id ? 'on' : ''}" data-room="${st.id}">${st.tab}</button>`).join('')}</div>`;

// what is being built this week, as words
function nowText(T) {
  const live = activePhases(T);
  return {
    names: live.map(p => p.name),
    title: live.length ? live.map(p => p.name).join(' + ') : 'Schlüsselübergabe',
    spec: live.length ? live[live.length - 1].spec : 'Das Haus ist fertig · Scrollen oder eine Station wählen, um hineinzugehen',
    code: live.length ? live.map(p => p.code).join('+') : 'ST-10',
  };
}

function renderRoomOrPhaseCard(T) {
  const isInside = state.shot === 'inside';
  const curStop = activeInteriorStop(state.tour);
  const tabsHtml = isInside || T >= 36.9 ? roomTabs(isInside, curStop) : '';
  if (isInside) {
    return `
      <div class="room-card">
        <span class="lv">${curStop.lv}</span>
        <b>${curStop.title}</b>
        <span class="nt">${curStop.spec}</span>
        ${tabsHtml}
      </div>`;
  }
  const N = nowText(T);
  return `
    <div class="room-card">
      <span class="lv">${N.code} // WO ${pad2(weekNo(T))} · ${Math.round(100 * T / WEEKS)}% FERTIG</span>
      <b>${N.title}</b>
      <span class="nt">${N.spec}</span>
      ${tabsHtml}
    </div>`;
}

function renderHud() {
  const T = state.wk;
  const day = dateAt(T);
  const pct = Math.round(100 * T / WEEKS);
  const N = nowText(T);
  const curStop = activeInteriorStop(state.tour);
  const isInside = state.shot === 'inside';
  document.body.classList.toggle('open', state.dir === 'a' && state.open);
  renderBar();

  if (state.dir === 'a') {
    if (state.open) {
      hudBody.innerHTML = `
        <div class="prog full">
          <div class="top mono">
            ${BRAND}
            <span class="dwg-tag">BLATT A-905 · BAUZEITENPLAN</span>
          </div>
          <h1>Ihr Haus in<br><em>38 Wochen.</em></h1>
          <div class="meta mono">${META}</div>
          <div class="chart"></div>
          <div class="foot">
            <div class="hint mono"><i></i>Jeder Balken ist ein Teil des Hauses. Scrollen oder ziehen Sie den Zeitplan, um es zu bauen.</div>
            <div class="note mono">Konzept, UX &amp; three.js-Umsetzung // <b>Micha Schwan</b> · UX Designer // <a href="mailto:schwanmicha07@gmail.com">schwanmicha07@gmail.com</a></div>
          </div>
        </div>`;
      const ch = hudBody.querySelector('.chart');
      const r = ch.getBoundingClientRect();
      ch.innerHTML = programmeSVG(T, r.width, r.height, { labelW: 236 });
    } else {
      const sideLv = isInside ? curStop.lv : `${N.code} // ${pct}% FERTIG`;
      const sideTitle = isInside ? curStop.title : N.title;
      const sideSpec = isInside ? curStop.spec : N.spec;
      hudBody.innerHTML = `
        <div class="prog-hero ${isInside ? 'inside-dim' : ''}">
          <div class="top-row mono">
            ${BRAND}
            <span class="dwg-tag">BLATT A-905 · BAUZEITENPLAN</span>
          </div>
          <h1><span>Ihr Haus in</span> <em>38 Wochen.</em></h1>
          <div class="meta mono">${META_SHORT}</div>
        </div>
        <div class="prog">
          <div class="prog-side">
            <div class="side-top">
              <div class="count">Wo. ${pad2(weekNo(T))}<small> / ${WEEKS}</small></div>
              <span class="date-badge">${fmtDay(day).toUpperCase()} 2027</span>
            </div>
            <div class="side-body">
              <span class="lv">${sideLv}</span>
              <b class="title">${sideTitle}</b>
              <span class="spec-line">${sideSpec}</span>
            </div>
            ${roomTabs(isInside, curStop)}
          </div>
          <div class="chart"></div>
        </div>`;
      const ch = hudBody.querySelector('.prog .chart');
      const r = ch.getBoundingClientRect();
      const narrow = innerWidth < 760;
      ch.innerHTML = programmeSVG(T, r.width, r.height, { compact: true, labelW: narrow ? 136 : 172, showDur: !narrow });
    }
  } else if (state.dir === 'b') {
    hudBody.innerHTML = `
      <div class="corner tl mono">
        ${BRAND}
        <span class="dwg-tag">BLATT A-905 · Fundamentplan &amp; Bauzeitenplan · Maßstab 1:1</span>
      </div>
      ${renderRoomOrPhaseCard(T)}
      <div class="corner br mono">
        <b>${fmtDay(day).toUpperCase()} 2027</b> · [${N.code}]<br>Scrollen oder Regler ziehen: bauen &amp; hineingehen
      </div>`;
  } else {
    const hh = Math.floor(state.tod), mm = Math.round((state.tod - hh) * 60) % 60;
    const inside = state.shot === 'path' || state.shot === 'inside';
    hudBody.innerHTML = `
      <div class="cam ${inside ? 'inside' : ''}">
        ${inside ? '' : '<div class="frame"></div>'}
        <div class="corner tl mono">
          <span class="brand-badge ${inside ? '' : 'cam-badge'}">${inside ? 'Projekt Steininger' : 'Cam 02'}</span>
          <span class="stamp">${fmtDay(day).toUpperCase()} 2027 · ${pad2(hh)}:${pad2(mm)}</span>
        </div>
        <div class="band">
          <div class="now">
            <div class="wk">Wo. ${pad2(weekNo(T))}<small> / ${WEEKS} · ${pct}%</small></div>
            <div class="ph mono">
              ${state.shot === 'inside'
                ? `<b>${curStop.title.toUpperCase()}</b><div class="sub">${curStop.spec}</div>`
                : `${T >= WEEKS ? '<b>SCHLÜSSEL ÜBERGEBEN</b>' : `[${N.code}] <b>${N.names.join(' + ') || 'ÜBERGABE'}</b>`}<div class="sub">${N.spec}</div>`}
              ${inside || T >= 36.9 ? roomTabs(state.shot === 'inside', curStop) : ''}
            </div>
          </div>
          <div class="chart"></div>
        </div>
      </div>`;
    const ch = hudBody.querySelector('.band .chart');
    const r = ch.getBoundingClientRect();
    ch.innerHTML = programmeSVG(T, r.width, r.height, { compact: true, labelW: innerWidth < 760 ? 136 : 160 });
  }
  bindHudEvents();
  if (SEQ.say) SEQ.say(isInside ? `${curStop.title}. ${curStop.spec}` : `Woche ${weekNo(T)} von ${WEEKS}, ${N.title}. ${N.spec}`);
}

// ------------------------------------------------------------------ B: the sheet printed on the site (cached static base + fast dynamic overlay)
function ensureSheetBase() {
  if (sheetBaseCanvas) return sheetBaseCanvas;
  const PX = SHEET_PX;
  const cw = (SHEET.x1 - SHEET.x0) * PX, chh = (SHEET.z1 - SHEET.z0) * PX;
  const cv = document.createElement('canvas');
  cv.width = cw; cv.height = chh;
  const g = cv.getContext('2d');
  const X = x => (x - SHEET.x0) * PX, Z = z => (z - SHEET.z0) * PX;
  const A = v => `rgba(16,36,26,${v})`;
  g.fillStyle = '#f1f0e6'; g.fillRect(0, 0, cw, chh);
  let s = 19;
  const r01 = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  for (let i = 0; i < 16000; i++) {
    g.fillStyle = `rgba(60,80,55,${r01() * 0.04})`;
    g.fillRect(8 + r01() * (cw - 16), 8 + r01() * (chh - 16), 2, 2);
  }
  const line = (pts, w = 2, c = INK, dash = []) => { g.beginPath(); g.setLineDash(dash.map(d => d * PX)); pts.forEach(([x, z], i) => i ? g.lineTo(X(x), Z(z)) : g.moveTo(X(x), Z(z))); g.strokeStyle = c; g.lineWidth = w * 2.6; g.stroke(); g.setLineDash([]); };
  const rectL = (x0, z0, x1, z1, w, c, dash) => line([[x0, z0], [x1, z0], [x1, z1], [x0, z1], [x0, z0]], w, c, dash);
  const text = (str, x, z, size, o = {}) => {
    g.font = `${o.weight || 700} ${size * 1.3 * PX}px ${o.font || LABEL_FONT}`;
    g.fillStyle = o.color || INK; g.textAlign = o.align || 'left'; g.textBaseline = o.base || 'alphabetic';
    g.letterSpacing = `${(o.ls ?? 0.03) * PX}px`;
    g.fillText(str, X(x), Z(z));
  };
  rectL(SHEET.x0 + 0.8, SHEET.z0 + 0.8, SHEET.x1 - 0.8, SHEET.z1 - 0.8, 6);
  rectL(SHEET.x0 + 1.1, SHEET.z0 + 1.1, SHEET.x1 - 1.1, SHEET.z1 - 1.1, 2);

  // the grid: four axes down the slope, three across it
  const AX = [['A', 3.85], ['B', 7.0], ['C', 15.6], ['D', 18.15]], AZ = [['1', -7.85], ['2', -1.6], ['3', 3.85]];
  const bubble = (name, x, z) => {
    g.beginPath(); g.arc(X(x), Z(z), 0.55 * PX, 0, Math.PI * 2); g.fillStyle = '#f1f0e6'; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
    text(name, x, z + 0.03, 0.58, { align: 'center', base: 'middle', font: DISPLAY_FONT, weight: 400, ls: 0 });
  };
  for (const [name, x] of AX) { line([[x, -12.4], [x, 7.2]], 2, A(0.55), [0.9, 0.18, 0.12, 0.18]); bubble(name, x, -13.0); }
  for (const [name, z] of AZ) { line([[-0.6, z], [30.4, z]], 2, A(0.55), [0.9, 0.18, 0.12, 0.18]); bubble(name, -1.2, z); }

  // the pit, the strip footings, the slab, the walls, the pool
  rectL(PIT.x0, PIT.z0, PIT.x1, PIT.z1, 2, A(0.5), [0.3, 0.2]);
  for (const [x0, z0, x1, z1] of FOOTINGS) rectL(x0, z0, x1, z1, 2.5, INK, [0.16, 0.1]);
  rectL(4.0, -7.7, 18.3, 3.7, 2.5, INK, [0.16, 0.1]);
  g.fillStyle = INK;
  for (const [x0, z0, x1, z1, lv] of planWalls) if (lv < -3) g.fillRect(X(x0), Z(z0), (x1 - x0) * PX, (z1 - z0) * PX);
  rectL(18.3, POOL.z0, 21.9, POOL.z1, 2.5, A(0.7));
  rectL(POOL.x0, POOL.z0, POOL.x1, POOL.z1, 5);
  rectL(POOL.x0, POOL.z0 + 0.4, POOL.x1 - 0.3, POOL.z1 - 0.4, 2, A(0.6));
  for (let z = POOL.z0 + 1.2; z < POOL.z1 - 0.6; z += 1.0) line([[POOL.x0 + 0.5, z], [POOL.x0 + 2.2 + 1.5 * Math.sin(z), z]], 1.5, A(0.3));

  // dimension chains along the north side
  const dim = (z, xs, labels) => {
    line([[xs[0], z], [xs[xs.length - 1], z]], 2);
    for (const x of xs) { line([[x - 0.18, z + 0.18], [x + 0.18, z - 0.18]], 3); line([[x, z + 0.4], [x, z - 0.25]], 1.5); }
    labels.forEach((t, i) => text(t, (xs[i] + xs[i + 1]) / 2, z - 0.22, 0.38, { align: 'center' }));
  };
  dim(-10.2, [3.7, 7.0, 15.6, 18.3], ['3 300', '8 600', '2 700']);
  dim(-11.3, [3.7, 18.3], ['14 600']);

  text('BODENPLATTE 400 STB, OK −3.200', 5.0, -5.9, 0.34);
  text('STREIFENFUNDAMENT 1000 × 700 UMLAUFEND', 5.0, -5.25, 0.34);
  text('WANDELEMENTE 300 STB GEGEN DEN HANG', 5.0, -4.6, 0.34);
  text('HOF ±0.000', -8.0, -1.2, 0.34, { color: A(0.75) });
  text('POOL OK −3.340', 23.2, 5.2, 0.34, { color: A(0.75) });
  text('FUNDAMENTPLAN', 22.4, -12.2, 1.0, { font: DISPLAY_FONT, weight: 400, ls: 0.02 });
  text('MASSSTAB 1:1. DIESE ZEICHNUNG IST DIE BAUSTELLE.', 22.4, -11.3, 0.34);

  // north points up the sheet
  g.beginPath(); g.arc(X(35.6), Z(-3.4), 1.1 * PX, 0, Math.PI * 2); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
  g.beginPath(); g.moveTo(X(35.6), Z(-4.65)); g.lineTo(X(35.98), Z(-3.05)); g.lineTo(X(35.6), Z(-3.35)); g.lineTo(X(35.22), Z(-3.05)); g.closePath(); g.fillStyle = INK; g.fill();
  text('N', 35.6, -4.95, 0.55, { align: 'center', font: DISPLAY_FONT, weight: 400, ls: 0 });

  // the programme, printed below the house
  const P = GANTT_BOX, wx = w => P.x0 + GANTT_LAB + (P.x1 - P.x0 - GANTT_LAB) * w / WEEKS;
  const rowH = (P.z1 - P.z0 - 1.3) / PHASES.length;
  text(`BAUZEITENPLAN · ${WEEKS} WOCHEN · START MO 1. MÄR 2027`, P.x0, P.z0 - 0.5, 0.46, { weight: 700 });
  for (let k = 0; k <= WEEKS; k++) {
    line([[wx(k), P.z0 + 0.35], [wx(k), P.z1]], k % 4 === 0 ? 2.5 : 1.2, A(k % 4 === 0 ? 0.38 : 0.2));
    if (k < WEEKS && k % 2 === 1) text(pad2(k + 1), wx(k + 0.5), P.z0 + 0.9, 0.34, { align: 'center', ls: 0 });
  }
  PHASES.forEach((p, i) => {
    const z = P.z0 + 1.3 + i * rowH, bh = rowH * 0.5, bz = z + (rowH - bh) / 2;
    line([[P.x0, z + rowH], [P.x1, z + rowH]], 1.5, A(0.25));
    g.strokeStyle = INK; g.lineWidth = 2.5;
    g.strokeRect(X(wx(p.w0)), Z(bz), (wx(p.w1) - wx(p.w0)) * PX, bh * PX);
    g.save(); g.beginPath(); g.rect(X(wx(p.w0)), Z(bz), (wx(p.w1) - wx(p.w0)) * PX, bh * PX); g.clip();
    g.strokeStyle = A(0.3); g.lineWidth = 2;
    for (let h = X(wx(p.w0)) - bh * PX; h < X(wx(p.w1)); h += 12) { g.beginPath(); g.moveTo(h, Z(bz + bh)); g.lineTo(h + bh * PX, Z(bz)); g.stroke(); }
    g.restore();
  });
  rectL(P.x0 - 0.45, P.z0 - 1.45, P.x1 + 0.45, P.z1 + 0.35, 3);

  // the title block
  const tb = { x0: 26.2, x1: 38.4, z0: 12.6, z1: 22.4 };
  rectL(tb.x0, tb.z0, tb.x1, tb.z1, 4);
  line([[tb.x0, tb.z0 + 2.5], [tb.x1, tb.z0 + 2.5]], 2);
  line([[tb.x0, tb.z0 + 5.6], [tb.x1, tb.z0 + 5.6]], 2);
  line([[tb.x0, tb.z0 + 7.9], [tb.x1, tb.z0 + 7.9]], 2);
  text('PROJEKT', tb.x0 + 0.5, tb.z0 + 1.15, 0.82, { font: DISPLAY_FONT, weight: 400, ls: 0.03 });
  text('STEININGER', tb.x0 + 0.5, tb.z0 + 2.1, 0.82, { font: DISPLAY_FONT, weight: 400, ls: 0.03 });
  text('HAUS AM HANG', tb.x0 + 0.5, tb.z0 + 3.4, 0.4, { weight: 700 });
  text('FUNDAMENTPLAN UND BAUZEITENPLAN', tb.x0 + 0.5, tb.z0 + 4.1, 0.34);
  text('STAHLBETON, TRAVERTIN · BGF 480 M²', tb.x0 + 0.5, tb.z0 + 4.8, 0.34);
  text('BLATT A-905   REV C   M 1:1', tb.x0 + 0.5, tb.z0 + 6.5, 0.34);
  text('SCHLÜSSEL FR 19. NOV 2027', tb.x0 + 0.5, tb.z0 + 7.2, 0.34, { color: '#3d7607', weight: 700 });
  text('KONZEPT, UX, THREE.JS', tb.x0 + 0.5, tb.z0 + 8.65, 0.3, { color: A(0.75) });
  text('MICHA SCHWAN · UX DESIGNER', tb.x0 + 0.5, tb.z0 + 9.3, 0.34, { weight: 700 });

  sheetBaseCanvas = cv;
  return cv;
}

function drawSheet(T) {
  const base = ensureSheetBase();
  const PX = SHEET_PX;
  if (!sheetWorkCanvas) {
    sheetWorkCanvas = document.createElement('canvas');
    sheetWorkCanvas.width = base.width;
    sheetWorkCanvas.height = base.height;
  }
  const g = sheetWorkCanvas.getContext('2d');
  g.drawImage(base, 0, 0);

  const X = x => (x - SHEET.x0) * PX, Z = z => (z - SHEET.z0) * PX;
  const P = GANTT_BOX, wx = w => P.x0 + GANTT_LAB + (P.x1 - P.x0 - GANTT_LAB) * w / WEEKS;
  const rowH = (P.z1 - P.z0 - 1.3) / PHASES.length;

  PHASES.forEach((p, i) => {
    const z = P.z0 + 1.3 + i * rowH, bh = rowH * 0.5, bz = z + (rowH - bh) / 2;
    const live = T >= p.w0 && T < p.w1;
    g.font = `700 ${0.36 * PX}px ${LABEL_FONT}`;
    g.letterSpacing = `${0.03 * PX}px`;
    g.fillStyle = live ? '#3d7607' : INK;
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.fillText(`${pad2(p.n + 1)}  ${p.name.toUpperCase()}`, X(P.x0), Z(z + rowH * 0.66));
    const pe = Math.min(T, p.w1);
    if (pe > p.w0) {
      g.fillStyle = live ? LEAF : INK;
      g.fillRect(X(wx(p.w0)), Z(bz), (wx(pe) - wx(p.w0)) * PX, bh * PX);
    }
  });
  g.beginPath();
  g.moveTo(X(wx(T)), Z(P.z0 + 0.2));
  g.lineTo(X(wx(T)), Z(P.z1 + 0.35));
  g.strokeStyle = LEAF; g.lineWidth = 6; g.stroke();
  g.font = `700 ${0.34 * PX}px ${LABEL_FONT}`;
  g.fillStyle = '#3d7607';
  const lab = `HEUTE ${fmtDay(dateAt(T)).toUpperCase()}`;
  g.textAlign = T > WEEKS * 0.8 ? 'right' : 'left';
  g.fillText(lab, X(wx(T) + (T > WEEKS * 0.8 ? -0.3 : 0.3)), Z(P.z1 + 0.95));

  if (!sheetTex) {
    sheetTex = new THREE.CanvasTexture(sheetWorkCanvas);
    sheetTex.colorSpace = THREE.SRGBColorSpace;
    sheetTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  } else {
    sheetTex.needsUpdate = true;
  }
  return sheetTex;
}

// ------------------------------------------------------------------ Interactivity: scroll, Gantt scrub, the walk, play, keys
const WHEEL = 0.0045 * WEEKS / 14;         // weeks a pixel of wheel travel is worth
const TOUR_STEP = 0.036;                   // the walk takes the last weeks slowly
let lastSheetUpdateWk = state.wk;
let isDraggingGantt = false;

function setPlaying(on) {
  state.playing = !!on;
  if (SEQ.setPlaying) SEQ.setPlaying(state.playing);
}

function setTargetWeek(w, immediate = false) {
  state.userMoved = true;
  state.roomPinned = false;
  if (state.dir === 'a' && state.open && w > 0.05) state.open = false;
  state.targetWk = Math.min(WEEKS, Math.max(0, w));
  if (immediate) state.wk = state.targetWk;
}

function scrubFromSvgEvent(e, svg) {
  const rect = svg.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (svg.viewBox.baseVal.width / rect.width);
  const x0 = parseFloat(svg.dataset.x0 || '190');
  const x1 = parseFloat(svg.dataset.x1 || String(svg.viewBox.baseVal.width));
  if (x < x0) {
    const row = e.target.closest('.gantt-row');
    if (row) {
      const w0 = parseFloat(row.dataset.w0), w1 = parseFloat(row.dataset.w1);
      setTargetWeek(w0 + (w1 - w0) * 0.55, true);
      syncVisuals(1);
    }
    return;
  }
  const w = clamp01((x - x0) / Math.max(1, x1 - x0)) * WEEKS;
  setTargetWeek(w, true);
  syncVisuals(1);
}

function goToRoom(stop) {
  setPlaying(false);
  state.userMoved = true;
  state.roomPinned = true;
  state.camMode = 'inside';
  state.shot = 'inside';
  if (state.dir === 'a') state.open = false;
  if (state.wk < WEEKS - 0.01) { state.wk = WEEKS; state.targetWk = WEEKS; }
  state.targetTour = stop.u;
  if (prefs().calm) state.tour = stop.u;
  syncVisuals(prefs().calm ? 1 : 0.2);
}

function bindBarEvents() {
  hudBar.querySelectorAll('[data-dir]').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const d = btn.dataset.dir;
      if (d === state.dir) return;
      const u = new URL(location.href);
      u.searchParams.set('dir', d);
      u.searchParams.set('wk', state.wk.toFixed(2));
      u.searchParams.delete('open');
      u.searchParams.delete('shot');
      u.searchParams.delete('room');
      location.href = u.toString();
    };
  });

  hudBar.querySelectorAll('[data-cam]').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      state.camMode = btn.dataset.cam;
      state.userMoved = true;
      if (state.camMode === 'inside') {
        if (state.wk < TOUR_W0) { state.wk = WEEKS; state.targetWk = WEEKS; }
        state.roomPinned = true;
        if (state.tour < 0.05) { state.tour = 0.26; state.targetTour = 0.26; }
      } else {
        state.roomPinned = false;
      }
      if (state.dir === 'a' && state.open && state.camMode !== 'auto') state.open = false;
      syncVisuals(0.35);
    };
  });

  const slider = hudBar.querySelector('.cad-scrub input[type="range"]');
  slider.oninput = (e) => {
    setPlaying(false);
    setTargetWeek(parseFloat(e.target.value), true);
    syncVisuals(1);
  };
}

function bindHudEvents() {
  hudBody.querySelectorAll('[data-room]').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const stop = INTERIOR_STOPS.find(s => s.id === btn.dataset.room);
      if (stop) goToRoom(stop);
    };
  });

  const svg = hudBody.querySelector('.gantt-svg');
  if (svg) {
    svg.onpointerdown = (e) => {
      isDraggingGantt = true;
      setPlaying(false);
      scrubFromSvgEvent(e, svg);
    };
  }
}
// the chart is redrawn while it is dragged, so the drag is followed on the window
addEventListener('pointermove', (e) => {
  if (!isDraggingGantt) return;
  const svg = hudBody.querySelector('.gantt-svg');
  if (svg) scrubFromSvgEvent(e, svg);
});
addEventListener('pointerup', () => { isDraggingGantt = false; });
addEventListener('pointercancel', () => { isDraggingGantt = false; });

function stepWeeks(delta) {
  // in the walk, a step moves along the rooms; before it, through the weeks
  if (state.camMode === 'inside') {
    state.userMoved = true;
    state.roomPinned = true;
    state.targetTour = clamp01(state.targetTour + (delta / WHEEL) * 0.00054);
    if (prefs().calm) { state.tour = state.targetTour; syncVisuals(1); }
    return;
  }
  // the last weeks are the walk through the house, wherever the camera follows the weeks inside (A and C)
  const walks = state.camMode === 'auto' && state.dir !== 'b';
  const slow = walks && state.targetWk >= TOUR_W0 - 0.02 && (delta > 0 || state.targetWk > TOUR_W0 + 0.02);
  let w = state.targetWk + delta * (slow ? TOUR_STEP : 1);
  if (walks && !slow && delta > 0) w = Math.min(w, TOUR_W0);   // no step jumps over the walk: it stops at the door first
  setTargetWeek(w, false);
}

window.addEventListener('wheel', (e) => {
  if (e.target.closest && e.target.closest('.panel')) return;
  e.preventDefault();
  setPlaying(false);
  const px = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  if (state.dir === 'a' && state.open && px > 0) {
    state.open = false;
    state.userMoved = true;
    renderHud();
    return;
  }
  stepWeeks(px * WHEEL);
}, { passive: false });

let touchY = null;
window.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) touchY = e.touches[0].clientY;
}, { passive: true });
window.addEventListener('touchmove', (e) => {
  if (touchY == null || e.touches.length !== 1) return;
  const dy = touchY - e.touches[0].clientY;
  touchY = e.touches[0].clientY;
  setPlaying(false);
  if (state.dir === 'a' && state.open && dy > 0) { state.open = false; state.userMoved = true; renderHud(); }
  stepWeeks(dy * WHEEL * 4);
}, { passive: true });

window.addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  applyCamera(state.shot, 1);
  renderHud();
});

function syncVisuals(camLerp = 0.2) {
  updateSceneForWeek(state.wk, camLerp);
  if (state.dir === 'b' && Math.abs(state.wk - lastSheetUpdateWk) > 0.08) {
    lastSheetUpdateWk = state.wk;
    drawSheet(state.wk);
  }
  renderHud();
  window.__state = { DIR: state.dir, WK: state.wk, SHOT: state.shot, TOUR: state.tour, house };
}

// ------------------------------------------------------------------ the page controls: play, view options, chapters, keys (access.js)
SEQ.onPlay = () => {
  const on = !state.playing;
  state.userMoved = true;
  state.roomPinned = false;
  if (on) {
    if (state.dir === 'a' && state.open) state.open = false;
    if (state.camMode === 'inside') state.camMode = 'auto';
    if (state.wk >= WEEKS - 0.02) { state.wk = 0; state.targetWk = 0; state.tour = 0; state.targetTour = 0; }
  }
  setPlaying(on);
  syncVisuals(0.2);
};
SEQ.onStep = (dir, big) => { setPlaying(false); if (state.dir === 'a' && state.open && dir > 0) state.open = false; stepWeeks(dir * (big ? 2 : 0.5)); };
SEQ.onEdge = (end) => { setPlaying(false); state.camMode = 'auto'; setTargetWeek(end ? TOUR_W0 - 0.05 : 0, true); syncVisuals(1); };
SEQ.onJump = (c) => {
  setPlaying(false);
  state.camMode = 'auto';
  state.roomPinned = false;
  state.userMoved = true;
  state.targetWk = state.wk = Math.min(WEEKS, Math.max(0, c.wk));
  state.open = state.dir === 'a' && !!c.open;
  if (c.wk < TOUR_W0) { state.tour = 0; state.targetTour = 0; }
  syncVisuals(1);
};
SEQ.onPrefs = () => { applyCamera(state.shot, 1); syncVisuals(1); };

// ------------------------------------------------------------------ go
try { await Promise.all([document.fonts.load(`700 12px Arimo`), document.fonts.load(`12px 'BBH Bogle'`)]); } catch (e) { /* the fallback faces will do */ }
await document.fonts.ready;
if (DIR === 'b') {
  sheetBaseCanvas = null;
  drawSheet(state.wk);
}
renderHud();
document.body.classList.add('ready');

let frames = 0;
let lastTime = performance.now();
function loop(now = performance.now()) {
  const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
  lastTime = now;
  const calm = !!prefs().calm;

  const tourDiff = Math.abs(state.targetTour - state.tour);
  if (tourDiff > 0.0004) {
    state.tour += (state.targetTour - state.tour) * (calm ? 1 : Math.min(1, dt * 3.2));
    if (Math.abs(state.targetTour - state.tour) <= 0.0004) state.tour = state.targetTour;
  }

  if (state.playing) {
    // the build runs in under a minute, the walk through the house takes its time
    const rate = state.wk >= TOUR_W0 ? 0.03 : 0.75;
    state.targetWk = Math.min(WEEKS, state.targetWk + dt * rate);
    state.wk = state.targetWk;
    if (state.wk >= WEEKS) setPlaying(false);
    syncVisuals(0.18);
  } else if (Math.abs(state.targetWk - state.wk) > 0.0015 || tourDiff > 0.0004) {
    state.wk += (state.targetWk - state.wk) * (calm ? 1 : Math.min(1, dt * 9));
    if (Math.abs(state.targetWk - state.wk) <= 0.0015) state.wk = state.targetWk;
    syncVisuals(0.18);
  } else if (frames >= 4 && curCamPos.distanceToSquared(new THREE.Vector3(...getTargetCameraPose(state.shot).pos)) > 0.005) {
    applyCamera(state.shot, 0.15);
  }

  house.tick(dt, calm);
  renderer.render(scene, camera);
  if (++frames === 4) window.__ready = true;
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
window.__state = { DIR: state.dir, WK: state.wk, SHOT: state.shot, TOUR: state.tour, house };
