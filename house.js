// Projekt Steininger, part by part: three storeys of concrete and travertine stepping down a slope to a pool.
// Every part carries the phase that builds it and its place inside that phase.
// PHASES is the programme: the Gantt chart is drawn from it, and update(week) decides from it which parts exist.
// Same table, so the chart is the build.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const START = new Date(2027, 2, 1);   // Monday 1 March 2027
export const WEEKS = 38;                     // handover Friday 19 November 2027
export const PHASES = [
  { n: 0, code: 'ST-01', name: 'Einrichtung',       w0: 0.0,  w1: 1.4,  spec: 'Bauzaun · Baucontainer · Absteckung am Hang' },
  { n: 1, code: 'ST-02', name: 'Aushub',            w0: 1.0,  w1: 3.4,  spec: 'Planum −4,30 · Böschung 1 : 1,15 · rund 900 m³ Aushub' },
  { n: 2, code: 'ST-03', name: 'Fundamente',        w0: 3.2,  w1: 6.0,  spec: 'Streifenfundamente 1,0 × 0,7 m · Bodenplatte 40 cm' },
  { n: 3, code: 'ST-04', name: 'Poolgeschoss',      w0: 6.0,  w1: 9.4,  spec: 'Wandelemente gegen den Hang · Decke ±0,00 mit Balkon · Verfüllung' },
  { n: 4, code: 'ST-05', name: 'Wohngeschoss',      w0: 9.2,  w1: 13.4, spec: 'Wandelemente 30 cm · Fertigteiltreppe · Decke +3,20' },
  { n: 5, code: 'ST-06', name: 'Obergeschoss',      w0: 13.2, w1: 17.0, spec: 'Auskragung 4,80 m über dem Balkon · Wände bis +7,20' },
  { n: 6, code: 'ST-07', name: 'Dächer',            w0: 16.8, w1: 20.6, spec: 'Flachdächer +6,80 und +7,60 · Abdichtung · Kies' },
  { n: 7, code: 'ST-08', name: 'Verglasung',        w0: 20.4, w1: 24.6, spec: 'Raumhohes Glas in schlanken Stahlprofilen · Schiebetüren · Glasbrüstungen' },
  { n: 8, code: 'ST-09', name: 'Travertin, Ausbau', w0: 22.4, w1: 33.0, spec: 'Travertinfassade · Putz · Eichendielen · Einbauten aus Nussbaum' },
  { n: 9, code: 'ST-10', name: 'Pool, Möbel',       w0: 31.6, w1: 37.4, spec: 'Poolterrasse · Pool · Bepflanzung · Möblierung · Schlüsselübergabe' },
];
export const MILESTONES = [[6.0, 'M1 · Bodenplatte'], [24.6, 'M2 · Dicht'], [38, 'M3 · Schlüssel']];
export const TOUR_W0 = 37.2;                 // the week the walk through the finished house begins

export const C = {
  paper: 0xf1f0e6, ink: 0x10241a, accent: 0x5fa512, lime: 0xc4f03e,
  earth: 0x9B8468, earthDark: 0x7E6850, concrete: 0xB3AFA6, gravel: 0xC9C2B3,
  clad: 0xE8DFCE, travertine: 0xE2D8C4, pave: 0xDAD0BC, plaster: 0xF4F1EA,
  oak: 0xC9A679, soffit: 0xCFA676, teak: 0xB98F66, walnut: 0x694631,
  frame: 0x262523, glass: 0xC6DCE0, water: 0x6FB3B4, steel: 0x565B60,
  fabric: 0xE2DDD2, linen: 0xCFC6B4, leather: 0x8A5232, brass: 0xCFA862, terracotta: 0xB85D3B,
  plant: 0x67784C, dark: 0x242321, machine: 0xDDA52E, cabin: 0xE4E2DA, mud: 0xD3C6B0, cloth: 0x2F6F3E,
};

const DAY = 864e5;
// The programme counts working days: five a week, the last one is Friday 19 November.
export const dateAt = w => {
  const d = Math.min(Math.floor(Math.max(0, w) * 5 + 1e-6), WEEKS * 5 - 1);
  return new Date(START.getTime() + (Math.floor(d / 5) * 7 + (d % 5)) * DAY);
};
export const clamp01 = v => Math.min(1, Math.max(0, v));
export const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeOut = s => 1 - Math.pow(1 - s, 3);

// House dimensions, metres. x runs west to east, down the slope; z runs north to south; y is up.
// Levels: pool level -3.20, living level 0.00, upper level +3.20, roofs +6.80 and +7.60.
// Two bays across the slope: A to the south (z -1.6 to 4), B to the north (z -8 to -1.6).
export const FOOT = { x0: 3.7, x1: 18.3, z0: -8, z1: 4 };
export const POOL = { x0: 21.9, x1: 28.5, z0: -8, z1: 4 };
export const SITE = { x0: -12, x1: 31, z0: -20, z1: 14 };
export const TOWER = { x: -5.8, z: -12.6, h: 19.5, jib: 34, tail: 10 };
export const DOOR = { x: 15.6, z0: -4.725, z1: -3.2375, zc: -3.98125, w: 1.4875, h: 2.85, y: 0 };      // living room to balcony
export const DOOR0 = { x: 18.24, z0: -4.65, z1: -3.125, zc: -3.8875, w: 1.525, h: 2.85, y: -3.2 };    // pool level to terrace
export const FOOTINGS = [[3.1, -8.4, 4.6, 4.4], [4.6, -8.4, 17.7, -7.4], [4.6, 3.4, 17.7, 4.4], [17.7, -8.4, 18.9, 4.4]];
const FILL = [8.8, 10.0];                    // the pit is filled back against the walls of the pool level
const TC = 0.03, TP = 0.012;                 // travertine and plaster, as plates over the raw concrete

// ------------------------------------------------------------------ the land: a slope from the court down to the pool
const hash2 = (x, z) => { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); };
function noise2(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z); let fx = x - ix, fz = z - iz; fx = fx * fx * (3 - 2 * fx); fz = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz), b = hash2(ix + 1, iz), c = hash2(ix, iz + 1), d = hash2(ix + 1, iz + 1);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
}
export function natural(x, z) {
  let y = -3.2 * smooth(4.2, 18.5, x);         // the court at 0 down to the pool terrace at -3.20
  y += -1.5 * smooth(19.8, 25.5, x);           // the bank the pool stands on
  y += -2.5 * smooth(26, 46, x);               // on down to the olives
  y += -16 * smooth(46, 260, x);               // and the valley
  y += 22 * smooth(-30, -260, x);              // the hill behind the court
  const far = smooth(34, 140, Math.hypot(x - 12, (z + 2) * 1.2));
  y += far * (2.6 * Math.sin(z * 0.021 + 1.3) + 1.6 * Math.sin(x * 0.017 + z * 0.011) + 0.8 * Math.sin(z * 0.07 - x * 0.03) + 1.2 * (noise2(x * 0.03, z * 0.03) - 0.5));
  return y;
}
export const PIT = { x0: 2.6, x1: 20.4, z0: -9.6, z1: 5.6, y: -4.3, k: 1.15 };
export function pitY(x, z) {
  const dx = Math.max(PIT.x0 - x, 0, x - PIT.x1), dz = Math.max(PIT.z0 - z, 0, z - PIT.z1);
  const y = PIT.y + Math.hypot(dx, dz) * PIT.k;
  const rz = Math.max(Math.abs(z) - 2.2, 0);   // the ramp the machines use, out to the east
  const ramp = PIT.y + Math.max(0, x - PIT.x1) * 0.19 + Math.hypot(Math.max(PIT.x0 - x, 0), rz) * PIT.k + rz * (x > PIT.x1 ? PIT.k : 0);
  return Math.min(y, ramp);
}
// the finished ground: filled back to the slope, kept out of the rooms of the pool level
function gradeY(x, z) {
  const y = natural(x, z);
  const room = smooth(3.85, 4.15, x) * (1 - smooth(18.02, 18.28, x)) * smooth(-7.85, -7.55, z) * (1 - smooth(3.55, 3.85, z));
  return room > 0 ? y + (Math.min(y, -3.85) - y) * room : y;
}
const digAt = T => clamp01((T - PHASES[1].w0) / (PHASES[1].w1 - 0.3 - PHASES[1].w0));
export function groundAt(x, z, T) {
  const nat = natural(x, z), y = nat + (Math.min(pitY(x, z), nat) - nat) * easeOut(digAt(T));
  return y + (gradeY(x, z) - y) * smooth(FILL[0], FILL[1], T);
}

// The ground material: paper, with contour lines every half metre so the slope reads like a site plan.
// uMud tints the fenced site (the site camera uses it), uContour fades the contour lines.
export function groundMaterial({ color = C.paper, map = null, contour = 0.2, mud = 0 } = {}) {
  const m = new THREE.MeshStandardMaterial({ color, map, roughness: 0.96, envMapIntensity: 0.2 });
  const U = m.userData.u = { uMud: { value: mud }, uMudCol: { value: new THREE.Color(C.mud) }, uEarth: { value: new THREE.Color(0xB9A283) }, uInk: { value: new THREE.Vector3(16 / 255, 36 / 255, 26 / 255) }, uContour: { value: contour } };
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, U);
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aSite;\nattribute float aNat;\nvarying float vSite;\nvarying float vCut;\nvarying vec3 vWPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSite = aSite;\nvCut = aNat - position.y;\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vSite;\nvarying float vCut;\nvarying vec3 vWPos;\nuniform float uMud;\nuniform vec3 uMudCol;\nuniform vec3 uEarth;\nuniform vec3 uInk;\nuniform float uContour;')
      .replace('#include <map_fragment>', `#include <map_fragment>
        diffuseColor.rgb = mix(diffuseColor.rgb, uMudCol, vSite * uMud);
        float cut = smoothstep(0.03, 0.35, vCut);
        diffuseColor.rgb = mix(diffuseColor.rgb, uEarth, cut);   // open earth wherever the ground has been dug`)
      // the contour lines go on last, over the lit and tone-mapped ground, so strong light cannot wash them out
      .replace('#include <dithering_fragment>', `
        float cy = (vWPos.y - 0.25) * 2.0;
        float cw = fwidth(cy);
        float cl = 1.0 - smoothstep(0.0, 1.3, abs(fract(cy - 0.5) - 0.5) / max(cw, 1e-5));
        cl *= smoothstep(0.0004, 0.004, cw) * (1.0 - smoothstep(0.3, 0.8, cw));
        cl *= 1.0 - smoothstep(70.0, 170.0, distance(vWPos, cameraPosition));
        gl_FragColor.rgb = mix(gl_FragColor.rgb, uInk, cl * max(uContour, 0.22 * cut));
        #include <dithering_fragment>`);
  };
  return m;
}

// The ground as one mesh: a fine grid over the site that coarsens out to the horizon.
// update(T) moves the vertices the excavation and the backfill touch. uv(x, z) maps the world to a sheet printed on it.
export function buildGround(material, { uv } = {}) {
  const axis = (a, b, s) => {
    const out = [];
    for (let v = a; v < b + 1e-6; v += s) out.push(v);
    for (let v = a, k = s; v > -520;) { k *= 1.22; v -= k; out.unshift(v); }
    for (let v = out[out.length - 1], k = s; v < 520;) { k *= 1.22; v += k; out.push(v); }
    return out;
  };
  const xs = axis(-18, 42, 0.3), zs = axis(-24, 20.1, 0.3), W = xs.length, H = zs.length;
  const pos = new Float32Array(W * H * 3), uvs = new Float32Array(W * H * 2), site = new Float32Array(W * H), nats = new Float32Array(W * H), idx = [], dyn = [];
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = j * W + i, x = xs[i], z = zs[j], nat = natural(x, z), pit = Math.min(pitY(x, z), nat), gr = gradeY(x, z);
    pos[k * 3] = x; pos[k * 3 + 1] = nat; pos[k * 3 + 2] = z; nats[k] = nat;
    const t = uv ? uv(x, z) : [x * 0.1, z * 0.1]; uvs[k * 2] = t[0]; uvs[k * 2 + 1] = t[1];
    site[k] = smooth(0, 1.5, Math.min(x - SITE.x0, SITE.x1 - x, z - SITE.z0, SITE.z1 - z));
    if (pit < nat - 1e-3 || gr < nat - 1e-3) dyn.push(k, nat, pit, gr);
  }
  for (let j = 0; j < H - 1; j++) for (let i = 0; i < W - 1; i++) { const a = j * W + i, b = a + 1, d = a + W, c = d + 1; idx.push(a, d, b, b, d, c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  g.setAttribute('aSite', new THREE.BufferAttribute(site, 1));
  g.setAttribute('aNat', new THREE.BufferAttribute(nats, 1));
  g.setIndex(idx); g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, material);
  mesh.receiveShadow = true; mesh.frustumCulled = false;
  let last = '';
  function update(T) {
    const e = easeOut(digAt(T)), f = smooth(FILL[0], FILL[1], T), key = e.toFixed(4) + f.toFixed(4);
    if (key === last) return;
    last = key;
    for (let n = 0; n < dyn.length; n += 4) { const y = dyn[n + 1] + (dyn[n + 2] - dyn[n + 1]) * e; pos[dyn[n] * 3 + 1] = y + (dyn[n + 3] - y) * f; }
    g.attributes.position.needsUpdate = true; g.computeVertexNormals();
  }
  return { mesh, update };
}

// ------------------------------------------------------------------ deterministic PRNG & procedural material library
let _seed = 42;
const rnd = () => {
  _seed = (_seed + 0x6D2B79F5) | 0;
  let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

let _texCache = null;
function getTextures() {
  if (_texCache) return _texCache;
  _seed = 42;

  const makeTex = (w, h, rx, ry, draw, srgb = true) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    draw(g, w, h);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx, ry);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  };
  const addGrain = (g, w, h, amp) => {
    const id = g.getImageData(0, 0, w, h);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const k = (rnd() - 0.5) * amp;
      d[i] = Math.min(255, Math.max(0, d[i] + k));
      d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + k));
      d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + k));
    }
    g.putImageData(id, 0, 0);
  };

  // 1. Fair-faced precast concrete: panel joints and tie holes
  const concreteMap = makeTex(512, 512, 1 / 2.2, 1 / 2.2, (g, w, h) => {
    g.fillStyle = '#eeece6'; g.fillRect(0, 0, w, h);
    const rows = 4;
    for (let r = 0; r < rows; r++) {
      const y = r * (h / rows), v = Math.round(232 + (rnd() - 0.5) * 12);
      g.fillStyle = `rgb(${v},${v - 1},${v - 4})`;
      g.fillRect(0, y, w, h / rows);
      for (let k = 0; k < 26; k++) {
        g.fillStyle = `rgba(85,78,68,${0.02 + rnd() * 0.03})`;
        g.fillRect(0, y + rnd() * (h / rows), w, 1 + rnd() * 1.6);
      }
      g.fillStyle = 'rgba(38,34,30,0.16)'; g.fillRect(0, y, w, 1.6);
    }
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      const cx = (c + 0.5) * (w / 4), cy = (r + 0.5) * (h / 4);
      g.fillStyle = 'rgba(32,29,25,0.34)';
      g.beginPath(); g.arc(cx, cy, 3.6, 0, Math.PI * 2); g.fill();
    }
    addGrain(g, w, h, 14);
  });
  const concreteBump = makeTex(512, 512, 1 / 2.2, 1 / 2.2, (g, w, h) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
    for (let r = 0; r < 4; r++) { g.fillStyle = '#2a2a2a'; g.fillRect(0, r * (h / 4), w, 2.2); }
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      g.fillStyle = '#141414';
      g.beginPath(); g.arc((c + 0.5) * (w / 4), (r + 0.5) * (h / 4), 4, 0, Math.PI * 2); g.fill();
    }
    addGrain(g, w, h, 24);
  }, false);

  // 2. Earth
  const earthMap = makeTex(256, 256, 1 / 2.0, 1 / 1.2, (g, w, h) => {
    g.fillStyle = '#ebe5dc'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 8) {
      const v = Math.round(222 + Math.sin(y * 0.09) * 14 + (rnd() - 0.5) * 16);
      g.fillStyle = `rgb(${v},${v - 4},${v - 10})`;
      g.fillRect(0, y, w, 8);
    }
    for (let i = 0; i < 320; i++) {
      g.fillStyle = rnd() > 0.45 ? 'rgba(55,42,28,0.28)' : 'rgba(255,250,240,0.26)';
      g.beginPath(); g.arc(rnd() * w, rnd() * h, 1.2 + rnd() * 3.2, 0, Math.PI * 2); g.fill();
    }
    addGrain(g, w, h, 24);
  });
  const earthBump = makeTex(256, 256, 1 / 2.0, 1 / 1.2, (g, w, h) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 420; i++) {
      g.fillStyle = rnd() > 0.5 ? '#c8c8c8' : '#303030';
      g.beginPath(); g.arc(rnd() * w, rnd() * h, 1.5 + rnd() * 3.5, 0, Math.PI * 2); g.fill();
    }
    addGrain(g, w, h, 32);
  }, false);

  // 3. Roof gravel
  const gravelMap = makeTex(256, 256, 1 / 1.4, 1 / 1.4, (g, w, h) => {
    g.fillStyle = '#ece8df'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      const v = Math.round(190 + rnd() * 60);
      g.fillStyle = `rgb(${v},${v - 2},${v - 5})`;
      g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 4.5, 1.8 + rnd() * 3.8);
    }
    addGrain(g, w, h, 22);
  });

  // 4. Wide planks: oak floors, timber soffits, walnut joinery (tinted by the material colour)
  const plankMap = makeTex(512, 512, 1 / 2.2, 1 / 1.4, (g, w, h) => {
    g.fillStyle = '#f3ede2'; g.fillRect(0, 0, w, h);
    const rows = 10, rh = h / rows;
    for (let r = 0; r < rows; r++) {
      const y = r * rh;
      let x = -rnd() * w * 0.5;
      while (x < w) {
        const bw = w * (0.48 + rnd() * 0.55);
        const v = Math.round(234 + (rnd() - 0.5) * 20);
        g.fillStyle = `rgb(${v},${v - 4},${v - 11})`;
        g.fillRect(x, y, bw, rh);
        for (let k = 0; k < 28; k++) {
          g.fillStyle = `rgba(82,48,18,${0.045 + rnd() * 0.075})`;
          g.fillRect(x, y + rnd() * rh, bw, 1.0 + rnd() * 1.5);
        }
        for (let k = 0; k < 8; k++) {
          g.fillStyle = `rgba(255,244,225,${0.04 + rnd() * 0.05})`;
          g.fillRect(x, y + rnd() * rh, bw, 1.2 + rnd() * 2.0);
        }
        g.fillStyle = 'rgba(38,22,8,0.44)';
        g.fillRect(x, y, 2.0, rh);
        x += bw;
      }
      g.fillStyle = 'rgba(38,22,8,0.42)';
      g.fillRect(0, y, w, 1.8);
    }
    addGrain(g, w, h, 9);
  });
  const woodBump = makeTex(512, 512, 1 / 2.2, 1 / 1.4, (g, w, h) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
    const rows = 10, rh = h / rows;
    for (let r = 0; r < rows; r++) {
      const y = r * rh;
      g.fillStyle = '#282828'; g.fillRect(0, y, w, 1.8);
      g.fillStyle = '#b8b8b8'; g.fillRect(0, y + 1.8, w, 1.2);
      for (let k = 0; k < 26; k++) { g.fillStyle = 'rgba(28,28,28,0.28)'; g.fillRect(0, y + rnd() * rh, w, 1.1); }
    }
    addGrain(g, w, h, 15);
  }, false);

  // 5. Troweled lime plaster
  const plasterMap = makeTex(512, 512, 1 / 2.5, 1 / 2.5, (g, w, h) => {
    g.fillStyle = '#f7f4ed'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 45; i++) {
      g.fillStyle = i % 2 ? 'rgba(255,253,248,0.06)' : 'rgba(185,174,156,0.05)';
      g.beginPath(); g.arc(rnd() * w, rnd() * h, 20 + rnd() * 55, 0, Math.PI * 2); g.fill();
    }
    addGrain(g, w, h, 6);
  });
  const plasterBump = makeTex(512, 512, 1 / 2.5, 1 / 2.5, (g, w, h) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 65; i++) {
      g.fillStyle = i % 2 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)';
      g.beginPath(); g.arc(rnd() * w, rnd() * h, 16 + rnd() * 44, 0, Math.PI * 2); g.fill();
    }
    addGrain(g, w, h, 12);
  }, false);

  // 6. Woven linen and a wool rug
  const fabricBump = makeTex(256, 256, 1 / 0.4, 1 / 0.4, (g, w, h) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 4) { g.fillStyle = 'rgba(255,255,255,0.24)'; g.fillRect(0, y, w, 1.5); }
    for (let x = 0; x < w; x += 4) { g.fillStyle = 'rgba(0,0,0,0.24)'; g.fillRect(x, 0, 1.5, h); }
    addGrain(g, w, h, 24);
  }, false);
  const rugMap = makeTex(512, 512, 1 / 1.6, 1 / 1.6, (g, w, h) => {
    g.fillStyle = '#d4c8b4'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 4) {
      g.fillStyle = y % 8 === 0 ? 'rgba(255,250,240,0.22)' : 'rgba(78,66,50,0.16)';
      g.fillRect(0, y, w, 2.0);
      for (let x = (y % 8 === 0 ? 0 : 3); x < w; x += 6) {
        g.fillStyle = rnd() < 0.5 ? 'rgba(250,244,232,0.18)' : 'rgba(82,70,54,0.16)';
        g.fillRect(x, y, 3.2, 2.0);
      }
    }
    addGrain(g, w, h, 16);
  });

  // 7. Travertine: honed slabs inside, and the facade in courses of 1.2 by 0.6 m with fine joints
  const veins = (g, w, h, n) => {
    for (let y = 0; y < h; y += 4 + rnd() * 12) {
      g.fillStyle = `rgba(${rnd() < 0.5 ? '160,140,112' : '252,246,234'},${0.03 + rnd() * 0.06})`;
      g.fillRect(0, y, w, 2 + rnd() * 6);
    }
    for (let i = 0; i < n; i++) {
      g.fillStyle = `rgba(118,100,78,${0.12 + rnd() * 0.2})`;
      g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 9, 1 + rnd() * 1.2);
    }
  };
  const travertineMap = makeTex(512, 512, 1 / 1.4, 1 / 1.4, (g, w, h) => {
    g.fillStyle = '#e4d8c2'; g.fillRect(0, 0, w, h);
    veins(g, w, h, 150);
    addGrain(g, w, h, 8);
  });
  const cladMap = makeTex(512, 512, 1 / 2.4, 1 / 2.4, (g, w, h) => {
    g.fillStyle = '#efe6d4'; g.fillRect(0, 0, w, h);
    veins(g, w, h, 110);
    const rows = 4, rh = h / rows;
    for (let r = 0; r < rows; r++) {
      const off = (r % 2) * (w / 4);
      for (let c = 0; c < 2; c++) {
        const x = (c * (w / 2) + off) % w, v = (rnd() - 0.5) * 0.07;
        g.fillStyle = v > 0 ? `rgba(255,250,238,${v})` : `rgba(120,98,66,${-v})`;
        g.fillRect(x, r * rh, w / 2, rh);
        g.fillStyle = 'rgba(70,56,38,0.42)'; g.fillRect(x, r * rh, 1.6, rh);
      }
      g.fillStyle = 'rgba(70,56,38,0.42)'; g.fillRect(0, r * rh, w, 1.6);
    }
    addGrain(g, w, h, 8);
  });
  const cladBump = makeTex(512, 512, 1 / 2.4, 1 / 2.4, (g, w, h) => {
    g.fillStyle = '#909090'; g.fillRect(0, 0, w, h);
    const rows = 4, rh = h / rows;
    for (let r = 0; r < rows; r++) {
      const off = (r % 2) * (w / 4);
      for (let c = 0; c < 2; c++) { g.fillStyle = '#161616'; g.fillRect((c * (w / 2) + off) % w, r * rh, 2.4, rh); }
      g.fillStyle = '#161616'; g.fillRect(0, r * rh, w, 2.4);
    }
    for (let i = 0; i < 140; i++) { g.fillStyle = 'rgba(20,20,20,0.3)'; g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 9, 1 + rnd() * 1.2); }
    addGrain(g, w, h, 12);
  }, false);

  // 8. Foliage
  const foliageBump = makeTex(256, 256, 1 / 0.9, 1 / 0.9, (g, w, h) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = i % 2 === 0 ? 'rgba(245,245,245,0.38)' : 'rgba(20,20,20,0.38)';
      g.beginPath(); g.arc(rnd() * w, rnd() * h, 2.2 + rnd() * 4.5, 0, Math.PI * 2); g.fill();
    }
    addGrain(g, w, h, 24);
  }, false);

  // 9. A framed print for the living room wall, in the colours of the house
  const art1 = makeTex(512, 512, 1, 1, (g, w, h) => {
    g.fillStyle = '#f1f0e6'; g.fillRect(0, 0, w, h);
    const pad = 28;
    g.fillStyle = '#e6e2d2'; g.fillRect(pad, pad, w - pad * 2, h - pad * 2);
    g.fillStyle = '#10241a'; g.fillRect(pad + 14, pad + 14, 210, h - pad * 2 - 28);
    g.fillStyle = '#c4f03e'; g.fillRect(pad + 236, pad + 14, w - pad * 2 - 250, 190);
    g.fillStyle = '#b98f66'; g.fillRect(pad + 236, pad + 216, w - pad * 2 - 250, h - pad * 2 - 230);
    g.fillStyle = '#f1f0e6'; g.beginPath(); g.arc(pad + 230, h * 0.52, 54, 0, Math.PI * 2); g.fill();
    addGrain(g, w, h, 12);
  });
  art1.wrapS = art1.wrapT = THREE.ClampToEdgeWrapping;

  _texCache = {
    concreteMap, concreteBump, earthMap, earthBump, gravelMap, plankMap, woodBump,
    plasterMap, plasterBump, fabricBump, rugMap, travertineMap, cladMap, cladBump, foliageBump, art1,
  };
  return _texCache;
}

// World-scale box UV projection so no texture ever stretches
function applyMetricUV(geo, mode = 'box') {
  const pos = geo.attributes.position;
  const norm = geo.attributes.normal;
  if (!pos || !norm) return geo;
  let uv = geo.attributes.uv;
  if (!uv || uv.count !== pos.count) {
    uv = new THREE.BufferAttribute(new Float32Array(pos.count * 2), 2);
    geo.setAttribute('uv', uv);
  }
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const nx = Math.abs(norm.getX(i)), ny = Math.abs(norm.getY(i)), nz = Math.abs(norm.getZ(i));
    if (mode === 'beam') {
      if (nx > ny && nx > nz) uv.setXY(i, z, y);
      else if (ny >= nx && ny >= nz) uv.setXY(i, z, x);
      else uv.setXY(i, x, y);
    } else if (mode === 'post') {
      if (ny > nx && ny > nz) uv.setXY(i, x, z);
      else if (nx > nz) uv.setXY(i, y, z);
      else uv.setXY(i, y, x);
    } else {
      if (ny > nx && ny > nz) uv.setXY(i, x, z);
      else if (nx > nz) uv.setXY(i, z, y);
      else uv.setXY(i, x, y);
    }
  }
  uv.needsUpdate = true;
  return geo;
}

// A soft, lumpy crown for trees and shrubs
function makeOrganicClusterGeo(rx, ry, rz, detail = 2) {
  const g = new THREE.SphereGeometry(1, detail >= 2 ? 24 : 14, detail >= 2 ? 18 : 10);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i), vy = pos.getY(i), vz = pos.getZ(i);
    const n = 1 + 0.08 * Math.sin(vx * 3.2 + vy * 2.4) + 0.06 * Math.cos(vz * 3.6 - vx * 2.1);
    pos.setXYZ(i, vx * rx * n, vy * ry * (vy < 0 ? 0.82 : 1.04) * n, vz * rz * n);
  }
  g.computeVertexNormals();
  return applyMetricUV(g);
}

export function buildHouse(opts = {}) {
  const root = new THREE.Group();
  const parts = [];
  const ghostRoot = new THREE.Group();
  const accent = new THREE.Color(C.accent);
  const inkCol = new THREE.Color(C.ink);
  // Fine architectural edges, so the materials read as real without turning into a cartoon
  const ink = new THREE.LineBasicMaterial({ color: C.ink, transparent: true, opacity: 0.34 });
  const dash = new THREE.LineDashedMaterial({ color: C.ink, dashSize: 0.16, gapSize: 0.11, transparent: true, opacity: 0.45 });
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const TX = getTextures();
  const ground = buildGround(opts.groundMat || groundMaterial(), { uv: opts.groundUV });
  root.add(ground.mesh);

  // Each colour of the house brings its texture, relief and gloss
  function tradeProps(color) {
    switch (color) {
      case C.concrete: return { map: TX.concreteMap, bumpMap: TX.concreteBump, bumpScale: 0.018, roughness: 0.78, envMapIntensity: 0.5 };
      case C.earth: case C.earthDark: case C.mud: return { map: TX.earthMap, bumpMap: TX.earthBump, bumpScale: 0.028, roughness: 0.94, envMapIntensity: 0.25 };
      case C.gravel: return { map: TX.gravelMap, bumpMap: TX.earthBump, bumpScale: 0.028, roughness: 0.92, envMapIntensity: 0.3 };
      case C.clad: return { map: TX.cladMap, bumpMap: TX.cladBump, bumpScale: 0.02, roughness: 0.7, envMapIntensity: 0.42 };
      case C.pave: return { map: TX.cladMap, bumpMap: TX.cladBump, bumpScale: 0.014, roughness: 0.8, envMapIntensity: 0.35 };
      case C.travertine: return { map: TX.travertineMap, bumpMap: TX.concreteBump, bumpScale: 0.008, roughness: 0.42, envMapIntensity: 0.7 };
      case C.oak: return { map: TX.plankMap, bumpMap: TX.woodBump, bumpScale: 0.016, roughness: 0.4, envMapIntensity: 0.8 };
      case C.soffit: case C.teak: return { map: TX.plankMap, bumpMap: TX.woodBump, bumpScale: 0.014, roughness: 0.6, envMapIntensity: 0.45 };
      case C.walnut: return { map: TX.plankMap, bumpMap: TX.woodBump, bumpScale: 0.012, roughness: 0.46, envMapIntensity: 0.6 };
      case C.plaster: return { map: TX.plasterMap, bumpMap: TX.plasterBump, bumpScale: 0.01, roughness: 0.82, envMapIntensity: 0.55 };
      case C.fabric: case C.linen: return { bumpMap: TX.fabricBump, bumpScale: 0.018, roughness: 0.88, envMapIntensity: 0.4 };
      case C.cloth: return { bumpMap: TX.fabricBump, bumpScale: 0.006, roughness: 0.96, envMapIntensity: 0.1 };
      case C.brass: return { roughness: 0.24, metalness: 0.88, envMapIntensity: 1.2 };
      case C.leather: return { bumpMap: TX.plasterBump, bumpScale: 0.012, roughness: 0.42, envMapIntensity: 0.7 };
      case C.terracotta: return { bumpMap: TX.plasterBump, bumpScale: 0.014, roughness: 0.74, envMapIntensity: 0.45 };
      case C.plant: return { bumpMap: TX.foliageBump, bumpScale: 0.024, roughness: 0.74, envMapIntensity: 0.4 };
      case C.water: return { roughness: 0.06, metalness: 0.2, envMapIntensity: 1.6 };
      case C.steel: return { roughness: 0.34, metalness: 0.76, envMapIntensity: 1.0 };
      case C.machine: return { roughness: 0.42, metalness: 0.2, envMapIntensity: 0.6 };
      case C.frame: case C.dark: return { roughness: 0.38, metalness: 0.55, envMapIntensity: 0.9 };
      default: return { roughness: 0.78, metalness: 0.04, envMapIntensity: 0.5 };
    }
  }
  const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, ...tradeProps(color), ...o });
  const glassM = (o = {}) => mat(C.glass, { transparent: true, opacity: 0.24, roughness: 0.06, metalness: 0.15, envMapIntensity: 1.35, depthWrite: false, side: THREE.DoubleSide, ...o });
  const glowM = () => new THREE.MeshStandardMaterial({ color: 0xfff3dc, emissive: 0xffcf8a, emissiveIntensity: 0, roughness: 0.4 });
  const glows = [];
  function solid(geo, m, { edges = 28, cast = true, uvMode = 'box' } = {}) {
    if (uvMode) applyMetricUV(geo, uvMode);
    const g = new THREE.Group();
    const mesh = new THREE.Mesh(geo, typeof m === 'number' ? mat(m) : m);
    mesh.castShadow = cast; mesh.receiveShadow = true;
    g.add(mesh);
    if (edges) g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, edges), ink));
    return g;
  }
  const boxGeo = (w, h, d) => new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  const box = (w, h, d, m, x = 0, y = 0, z = 0, o = {}) => {
    const uvMode = o.uvMode ?? (h > w * 1.8 && h > d * 1.8 ? 'post' : 'box');
    const g = solid(boxGeo(w, h, d), m, { ...o, uvMode });
    g.position.set(x, y, z);
    return g;
  };
  // a box by its two corners, the geometry in world metres so its texture runs on from its neighbours
  const bx = (x0, y0, z0, x1, y1, z1, m, o = {}) => solid(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), m, o);
  const cyl = (rt, rb, h, seg, m, x = 0, y = 0, z = 0, o = {}) => {
    const g = solid(new THREE.CylinderGeometry(rt, rb, h, seg).translate(0, h / 2, 0), m, { edges: 0, ...o });
    g.position.set(x, y, z);
    return g;
  };
  // A beam between two points, section w (sideways) by h (up).
  function beam(a, b, w, h, m, o = {}) {
    const g = solid(new THREE.BoxGeometry(w, h, a.distanceTo(b)), m, { ...o, uvMode: 'beam' });
    g.position.copy(a).add(b).multiplyScalar(0.5);
    g.lookAt(b);
    const outer = new THREE.Group(); outer.add(g); return outer;
  }
  const lines = (pts, m = ink) => new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), m);

  // Many boxes as one piece: one mesh per material, one set of edges. Each entry is [x0, y0, z0, x1, y1, z1, material, edged].
  const MK = {
    walnut: C.walnut, travertine: C.travertine, ink: C.dark, linen: C.fabric, sofaDark: C.linen, brass: C.brass, plaster: C.plaster,
    soffit: C.soffit, cloth: C.cloth, teak: C.teak, oak: C.oak, leather: C.leather, steel: C.frame, conc: C.concrete, terracotta: C.terracotta,
    clad: C.clad, pave: C.pave, galv: C.steel, machine: C.machine, cabin: C.cabin,
    book0: 0x8e3b2a, book1: 0x2f4a5a, book2: 0xd8cfb8, book3: 0x5c6b4a, book4: 0x1f1e1c,
  };
  function boxGroup(list) {
    const by = new Map(), eg = [];
    for (const [x0, y0, z0, x1, y1, z1, m, e] of list) {
      const g = new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
      applyMetricUV(g);
      (by.get(m) || by.set(m, []).get(m)).push(g);
      if (e) eg.push(new THREE.EdgesGeometry(g, 28));
    }
    const grp = new THREE.Group();
    for (const [m, gs] of by) {
      const glass = m === 'cabGlass' || m === 'glass', glow = m === 'glow';
      const material = glow ? glowM() : glass ? glassM(m === 'cabGlass' ? { color: 0x8cb0bd, opacity: 0.34 } : {}) : typeof m === 'string' ? mat(MK[m] ?? C.plaster) : mat(m);
      const mesh = new THREE.Mesh(gs.length > 1 ? mergeGeometries(gs) : gs[0], material);
      mesh.castShadow = !glass && !glow; mesh.receiveShadow = !glow;
      if (glow) glows.push(material);
      grp.add(mesh);
    }
    if (eg.length) grp.add(new THREE.LineSegments(eg.length > 1 ? mergeGeometries(eg) : eg[0], ink));
    return grp;
  }
  // a piece of furniture: boxes around its own origin, then stood in the room and turned
  function piece(list, x, y, z, ry = 0) {
    const g = boxGroup(list);
    g.rotation.y = ry;
    const holder = new THREE.Group(); holder.add(g); holder.position.set(x, y, z);
    return holder;
  }

  // The outline of a rectangular panel with rectangular openings. An opening may touch or cross the panel's edges,
  // so the outline is traced around the cells that are left, instead of punching holes into a rectangle.
  function panelShapes(u0, v0, u1, v1, holes, flip) {
    const cuts = (a, b, k) => [...new Set([a, b, ...holes.flatMap(h => [h[k], h[k + 1]])].filter(v => v >= a && v <= b))].sort((p, q) => p - q);
    const us = cuts(u0, u1, 0), vs = cuts(v0, v1, 2), nu = us.length - 1, nv = vs.length - 1;
    const full = (i, j) => {
      if (i < 0 || j < 0 || i >= nu || j >= nv) return false;
      const cu = (us[i] + us[i + 1]) / 2, cv = (vs[j] + vs[j + 1]) / 2;
      return !holes.some(h => cu > h[0] && cu < h[1] && cv > h[2] && cv < h[3]);
    };
    const next = new Map(), key = (i, j) => i * 4096 + j;
    const edge = (i0, j0, i1, j1) => { const k = key(i0, j0); (next.get(k) || next.set(k, []).get(k)).push([i1, j1]); };
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) if (full(i, j)) {
      if (!full(i, j - 1)) edge(i, j, i + 1, j);
      if (!full(i + 1, j)) edge(i + 1, j, i + 1, j + 1);
      if (!full(i, j + 1)) edge(i + 1, j + 1, i, j + 1);
      if (!full(i - 1, j)) edge(i, j + 1, i, j);
    }
    const outers = [], inners = [];
    for (const [k, outs] of next) while (outs.length) {
      const start = [Math.floor(k / 4096), k % 4096], loop = [];
      let cur = start, to = outs.pop(), guard = 0;
      while (guard++ < 4096) {
        loop.push(cur); cur = to;
        if (cur[0] === start[0] && cur[1] === start[1]) break;
        const o = next.get(key(cur[0], cur[1]));
        if (!o || !o.length) break;
        to = o.pop();
      }
      const corners = loop.filter((p, n) => { const a = loop[(n + loop.length - 1) % loop.length], b = loop[(n + 1) % loop.length]; return (p[0] - a[0]) * (b[1] - p[1]) !== (p[1] - a[1]) * (b[0] - p[0]); });
      const pts = corners.map(([i, j]) => [us[i], vs[j]]);
      let area = 0;
      pts.forEach((p, n) => { const q = pts[(n + 1) % pts.length]; area += p[0] * q[1] - q[0] * p[1]; });
      (area > 0 ? outers : inners).push(pts);
    }
    const v2 = pts => pts.map(([u, v]) => new THREE.Vector2(flip ? -u : u, v));
    return outers.map(o => {
      const s = new THREE.Shape(v2(o));
      const b = [Math.min(...o.map(p => p[0])), Math.max(...o.map(p => p[0])), Math.min(...o.map(p => p[1])), Math.max(...o.map(p => p[1]))];
      for (const h of inners) if (h[0][0] > b[0] && h[0][0] < b[1] && h[0][1] > b[2] && h[0][1] < b[3]) s.holes.push(new THREE.Path(v2(h)));
      return s;
    });
  }
  // an upright plate in the plane x = t ('x') or z = t ('z'): from a0 to a1 along the other axis, from b0 up to b1
  function plateGeo(axis, t0, t1, a0, b0, a1, b1, holes = []) {
    const g = new THREE.ExtrudeGeometry(panelShapes(a0, b0, a1, b1, holes, axis === 'x'), { depth: t1 - t0, bevelEnabled: false });
    return axis === 'x' ? g.rotateY(Math.PI / 2).translate(t0, 0, 0) : g.translate(0, 0, t0);
  }

  // Register a part. how: 'drop' (craned in), 'rise' (grows up from its base),
  // 'grow' (scales from nothing), 'show' (just appears).
  function add(obj, phase, order, how = 'drop', o = {}) {
    const ph = PHASES[phase], span = ph.w1 - ph.w0;
    const lifted = how === 'drop' && phase >= 3 && phase <= 7;
    const d = o.d ?? (lifted ? 0.36 : Math.min(0.8, span * 0.3));
    const t0 = ph.w0 + clamp01(order) * (span - d);
    const pivot = new THREE.Group();
    root.add(pivot); pivot.add(obj);
    const bb = new THREE.Box3().setFromObject(obj);
    const base = o.base ? o.base.clone() : V((bb.min.x + bb.max.x) / 2, bb.min.y, (bb.min.z + bb.max.z) / 2);
    pivot.position.copy(base);
    obj.position.sub(base);
    const mats = [];
    const edgeMats = [];
    obj.traverse(c => {
      if (c.isMesh) {
        const src = [c.material].flat(), own = src.map(m => m.clone());
        src.forEach((m, i) => { const gi = glows.indexOf(m); if (gi >= 0) glows[gi] = own[i]; });   // a glowing shade keeps glowing
        c.material = Array.isArray(c.material) ? own : own[0];
        for (const m of own) { m.userData.base = m.color.clone(); mats.push(m); }
      } else if (c.isLineSegments && c.material === ink && (o.hot ?? true)) {
        c.material = ink.clone();
        edgeMats.push(c.material);
      }
    });
    const p = { pivot, obj, phase, t0, t1: t0 + d, how, until: o.until ?? Infinity, out: o.out ?? 0.5,
      drop: o.h ?? 2.6, hot: o.hot ?? true, lift: o.lift ?? lifted,
      mats, edgeMats, home: obj.position.clone(),
      top: V((bb.min.x + bb.max.x) / 2, bb.max.y, (bb.min.z + bb.max.z) / 2),
      spanX: Math.max(0.4, (bb.max.x - bb.min.x) * 0.32), spanZ: Math.max(0.4, (bb.max.z - bb.min.z) * 0.32), s: 0 };
    if (opts.ghost && o.ghost !== false && phase >= 2) {
      pivot.updateMatrixWorld(true);
      obj.traverse(c => {
        if (c.isLineSegments && (c.material === ink || edgeMats.includes(c.material))) {
          const gl = new THREE.LineSegments(c.geometry.clone(), dash);
          gl.applyMatrix4(c.matrixWorld);
          gl.computeLineDistances();
          ghostRoot.add(gl);
          (p.ghosts ||= []).push(gl);
        }
      });
    }
    parts.push(p);
    return p;
  }
  // a lamp shade that glows at handover: its material is kept so update() can turn it up
  const shade = (geo, x, y, z) => { const m = glowM(); glows.push(m); const s = new THREE.Mesh(geo, m); s.position.set(x, y, z); s.userData.glow = true; return s; };

  // ---------------------------------------------------------------- 0 site set-up
  {
    const fence = [];
    const edge = (ax, az, bx_, bz) => {
      const n = Math.round(Math.hypot(bx_ - ax, bz - az) / 3.4);
      for (let i = 0; i < n; i++) fence.push([ax + (bx_ - ax) * i / n, az + (bz - az) * i / n, ax + (bx_ - ax) * (i + 1) / n, az + (bz - az) * (i + 1) / n]);
    };
    edge(SITE.x0, SITE.z1, SITE.x1, SITE.z1); edge(SITE.x1, SITE.z1, SITE.x1, SITE.z0);
    edge(SITE.x1, SITE.z0, SITE.x0, SITE.z0); edge(SITE.x0, SITE.z0, SITE.x0, SITE.z1);
    const gate = [-9.5, -5.5];
    const fenceM = new THREE.LineBasicMaterial({ color: C.ink, transparent: true, opacity: 0.3 });
    fence.forEach((f, i) => {
      const [ax, az, bx_, bz] = f;
      if (az === SITE.z1 && bz === SITE.z1 && Math.max(ax, bx_) > gate[0] && Math.min(ax, bx_) < gate[1]) return;
      const g = new THREE.Group();
      const pts = [];
      const H = 2.0, k = 0.03;
      const P = (t, y) => { const x = ax + (bx_ - ax) * t, z = az + (bz - az) * t; return V(x, natural(x, z) + y, z); };
      pts.push(P(k, 0.12), P(k, H), P(k, H), P(1 - k, H), P(1 - k, H), P(1 - k, 0.12), P(1 - k, 0.12), P(k, 0.12));
      for (let j = 1; j < 14; j++) pts.push(P(j / 14, 0.12), P(j / 14, H));
      for (let j = 1; j < 9; j++) pts.push(P(k, j * H / 9), P(1 - k, j * H / 9));
      g.add(lines(pts, fenceM));
      g.add(box(0.6, 0.12, 0.25, C.dark, ax, natural(ax, az), az, { cast: false, edges: 0 }));
      add(g, 0, 0.75 * i / fence.length, 'rise', { base: V(ax, natural(ax, az), az), until: 36.2 + 0.5 * i / fence.length, ghost: false, hot: false, d: 0.3 });
    });

    // the site office and its neighbours, on the level ground of the court
    const cabin = new THREE.Group();
    cabin.add(box(6, 2.6, 2.5, C.cabin, 0, 0.15, 0));
    cabin.add(box(6.2, 0.15, 2.6, C.dark, 0, 0, 0));
    cabin.add(box(6.1, 0.08, 2.56, C.dark, 0, 2.75, 0));
    for (const wx of [-1.8, 0, 1.8]) {
      cabin.add(box(1.1, 0.85, 0.05, C.frame, wx, 1.3, 1.27, { cast: false }));
      cabin.add(box(0.98, 0.73, 0.06, C.glass, wx, 1.36, 1.27, { cast: false, edges: 0 }));
    }
    cabin.add(box(0.85, 2.05, 0.05, C.frame, 2.35, 0.2, 1.27, { cast: false }));
    cabin.rotation.y = Math.PI / 2;
    const cabinAt = new THREE.Group(); cabinAt.add(cabin); cabinAt.position.set(-9.4, 0, -3.6);
    add(cabinAt, 0, 0.35, 'drop', { until: 36.0, ghost: false, h: 3, d: 0.3 });
    add(box(1.1, 2.3, 1.1, 0x8FA0A6, -9.6, 0, 1.6), 0, 0.45, 'drop', { until: 36.0, ghost: false, d: 0.3 });
    const skip = new THREE.Group();
    const sk = new THREE.ExtrudeGeometry(new THREE.Shape([[-2, 0], [2, 0], [2.6, 1.4], [-2.6, 1.4]].map(([u, v]) => new THREE.Vector2(u, v))), { depth: 1.8, bevelEnabled: false }).translate(0, 0, -0.9);
    skip.add(solid(sk, C.machine));
    skip.position.set(0.4, 0, -13.2);
    add(skip, 0, 0.6, 'drop', { until: 35.6, ghost: false, d: 0.3 });
    // travertine on pallets, waiting for the facade
    for (let i = 0; i < 3; i++) {
      const pal = new THREE.Group();
      pal.add(box(1.4, 0.15, 1.2, C.teak, 0, 0, 0));
      pal.add(box(1.3, 0.62, 1.1, C.clad, 0, 0.15, 0));
      pal.position.set(-1.0 + i * 1.8, 0, 9.4);
      add(pal, 8, 0.0, 'drop', { until: 25.4 + i * 1.3, ghost: false, d: 0.3, h: 1.5, hot: false });
    }

    // the setting out: the footprint and the pool pegged and strung across the slope
    const so = new THREE.Group(), pts = [];
    const drape = (x0, z0, x1, z1) => {
      const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / 0.6));
      for (let i = 0; i < n; i++) {
        const a = [x0 + (x1 - x0) * i / n, z0 + (z1 - z0) * i / n], b = [x0 + (x1 - x0) * (i + 1) / n, z0 + (z1 - z0) * (i + 1) / n];
        pts.push(V(a[0], natural(a[0], a[1]) + 0.3, a[1]), V(b[0], natural(b[0], b[1]) + 0.3, b[1]));
      }
    };
    const { x0, x1, z0, z1 } = FOOT;
    drape(x0 - 1.5, z0, x1 + 1.5, z0); drape(x0 - 1.5, z1, x1 + 1.5, z1); drape(x0, z0 - 1.5, x0, z1 + 1.5); drape(x1, z0 - 1.5, x1, z1 + 1.5);
    drape(x0 - 1.5, -1.6, x1 + 1.5, -1.6);
    so.add(lines(pts, new THREE.LineBasicMaterial({ color: C.accent })));
    for (const px of [x0, x1]) for (const pz of [z0, z1]) so.add(box(0.08, 0.7, 0.08, C.teak, px, natural(px, pz) - 0.1, pz, { cast: false, edges: 0 }));
    add(so, 0, 0.9, 'show', { until: 1.3, ghost: false, out: 0.3, hot: false });
  }

  // ---------------------------------------------------------------- 1 excavation
  // The ground itself is dug and filled in buildGround. Here: the excavator in the pit and the spoil heap on the court.
  const spoil = new THREE.Group();
  {
    spoil.add(solid(makeOrganicClusterGeo(4.2, 1.75, 3.0, 2).translate(0, 0.7, 0), C.earth, { edges: 0 }));
    spoil.position.set(-5.2, 0, 9.6);
    root.add(spoil);
  }
  let diggerPart = null;
  {
    const digger = new THREE.Group();
    digger.add(box(2.6, 0.55, 0.5, C.dark, 0, 0, -0.75));
    digger.add(box(2.6, 0.55, 0.5, C.dark, 0, 0, 0.75));
    digger.add(box(2.4, 0.7, 2.0, C.machine, 0.1, 0.6, 0));
    digger.add(box(1.0, 1.1, 0.9, C.machine, 0.6, 1.3, 0.45));
    digger.add(box(0.9, 0.7, 0.04, C.glass, 0.6, 1.55, 0.92, { cast: false }));
    digger.add(beam(V(-0.6, 1.2, -0.3), V(-2.4, 2.6, -0.3), 0.3, 0.35, C.machine), beam(V(-2.4, 2.6, -0.3), V(-3.6, 0.4, -0.3), 0.25, 0.3, C.machine), box(0.7, 0.55, 0.8, C.dark, -3.6, 0.0, -0.3));
    digger.rotation.y = Math.PI * 0.07;
    const at = new THREE.Group(); at.add(digger); at.position.set(11.6, 0, -2.2);
    diggerPart = add(at, 1, 0, 'show', { until: 4.2, out: 0.3, ghost: false, d: 0.1, hot: false, base: V(11.6, 0, -2.2) });   // gone before the slab is poured
  }

  // ---------------------------------------------------------------- the structure
  // what a face is made of: raw concrete first, then travertine outside, plaster and oak inside, timber under the overhangs
  const SL = { all: 'conc', top: 'floorL', bot: 'conc' };                   // slab of the pool level
  const SG = { all: 'conc', top: 'oak', bot: 'plaster' };                   // a floor inside
  const SP = { all: 'clad', top: 'pave', bot: 'plaster' };                  // a deck over a room
  const SO = { all: 'clad', top: 'pave', bot: 'soffit' };                   // a deck over open air
  const SI = { all: 'conc', top: 'oak', bot: 'soffit' };                    // a floor inside, over open air
  const RF = { all: 'clad', top: 'gravel', bot: 'plaster' };                // a roof
  const WB = { all: 'clad', px: 'plaster' }, WN = { all: 'clad', pz: 'plaster' }, WS = { all: 'clad', nz: 'plaster' };
  // finishes arrive after the structure, each as its own wave from the court to the pool: [first, spread] in the order of its phase
  const FIN = {
    clad: [8, 0.0, 0.2, C.clad], soffit: [8, 0.2, 0.08, C.soffit], plaster: [8, 0.26, 0.16, C.plaster], floorL: [8, 0.4, 0.1, C.travertine],
    oak: [8, 0.48, 0.18, C.oak], gravel: [6, 0.82, 0.14, C.gravel], pave: [9, 0.0, 0.1, C.pave],
  };
  const wave = (k, x) => FIN[k][1] + FIN[k][2] * clamp01((x - 3) / 20);
  function finish(kind, geo, x, how) {
    const f = FIN[kind]; if (!f) return;
    const quiet = kind === 'plaster' || kind === 'soffit';
    const g = solid(geo, f[3], { edges: kind === 'clad' ? 24 : 0, cast: kind === 'clad' });
    add(g, f[0], wave(kind, x), how || (kind === 'clad' ? 'rise' : 'show'), { d: kind === 'clad' ? 0.7 : 0.4, hot: !quiet, ghost: false });
  }
  const boxG = (x0, y0, z0, x1, y1, z1) => new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);

  // A wall in the plane x = t ('x') or z = t ('z'), set as precast panels about 3.3 m long.
  // A hole is [a0, a1, y0, y1] and is glazed unless its fifth entry is 'open'.
  const planWalls = [];
  function wall(axis, t0, t1, a0, a1, b0, b1, holes, spec, phase, o0, o1, o = {}) {
    const sp = typeof spec === 'string' ? { all: spec } : spec;
    const n = Math.max(1, Math.round((a1 - a0) / 3.3));
    planWalls.push(axis === 'x' ? [t0, a0, t1, a1, b0] : [a0, t0, a1, t1, b0]);
    for (let i = 0; i < n; i++) {
      const p0 = a0 + (a1 - a0) * i / n, p1 = a0 + (a1 - a0) * (i + 1) / n;
      const hs = holes.filter(h => h[1] > p0 + 1e-6 && h[0] < p1 - 1e-6).map(h => [Math.max(h[0], p0), Math.min(h[1], p1), h[2], h[3]]);
      add(solid(plateGeo(axis, t0, t1, p0, b0, p1, b1, hs), C.concrete), phase, o0 + (o1 - o0) * (n > 1 ? i / (n - 1) : 0), 'drop', { h: 3.0 });
      const cx = axis === 'x' ? t0 : (p0 + p1) / 2;
      // each of its two faces: [key in the spec, travertine from..to, plaster from..to]
      for (const [k, ca, cb, pa, pb] of [[axis === 'x' ? 'nx' : 'nz', t0 - TC, t0, t0 - TP, t0], [axis === 'x' ? 'px' : 'pz', t1, t1 + TC, t1, t1 + TP]]) {
        const m = sp[k] || sp.all;
        if (m === 'clad') finish('clad', plateGeo(axis, ca, cb, p0, b0, p1, b1, hs), cx);
        else if (m === 'plaster') finish('plaster', plateGeo(axis, pa, pb, p0, b0, p1, b1, hs), cx);
      }
    }
    // the ends and the top of a travertine wall, where they are left open to the weather
    if (sp.all === 'clad') {
      const E = (a, s) => axis === 'x' ? boxG(t0 - TC, b0, Math.min(a, a + s * TC), t1 + TC, b1, Math.max(a, a + s * TC)) : boxG(Math.min(a, a + s * TC), b0, t0 - TC, Math.max(a, a + s * TC), b1, t1 + TC);
      if (o.end0) finish('clad', E(a0, -1), axis === 'x' ? t0 : a0);
      if (o.end1) finish('clad', E(a1, 1), axis === 'x' ? t0 : a1);
      if (o.top) finish('clad', axis === 'x' ? boxG(t0 - TC, b1, a0, t1 + TC, b1 + TC, a1) : boxG(a0, b1, t0 - TC, a1, b1 + TC, t1 + TC), axis === 'x' ? t0 : (a0 + a1) / 2);
    }
    // the windows in its holes: a slim dark frame and the pane
    for (const h of holes) {
      if (h[4] === 'open') continue;
      const tm = (t0 + t1) / 2, f = 0.04, L = [];
      const B = (ta, tb, aa, ab, ya, yb, m) => L.push(axis === 'x' ? [tm + ta, ya, aa, tm + tb, yb, ab, m, m === 'steel'] : [aa, ya, tm + ta, ab, yb, tm + tb, m, m === 'steel']);
      B(-0.035, 0.035, h[0], h[1], h[2], h[2] + f, 'steel'); B(-0.035, 0.035, h[0], h[1], h[3] - f, h[3], 'steel');
      B(-0.035, 0.035, h[0], h[0] + f, h[2] + f, h[3] - f, 'steel'); B(-0.035, 0.035, h[1] - f, h[1], h[2] + f, h[3] - f, 'steel');
      if (h[1] - h[0] > 3) { const c = (h[0] + h[1]) / 2; B(-0.035, 0.035, c - 0.02, c + 0.02, h[2] + f, h[3] - f, 'steel'); }
      B(-0.01, 0.01, h[0] + f, h[1] - f, h[2] + f, h[3] - f, 'glass');
      add(boxGroup(L), 7, 0.6 + 0.3 * clamp01(((axis === 'x' ? t0 : (h[0] + h[1]) / 2) - 3) / 20), 'drop', { h: 1.2, d: 0.3 });
    }
  }

  // A slab, poured ('rise') or craned in as precast strips ('drop'), with the finishes its faces ask for
  function slab(x0, y0, z0, x1, y1, z1, spec, phase, o0, o1, how = 'drop') {
    const n = Math.max(1, Math.round((x1 - x0) / 2.6));
    for (let i = 0; i < n; i++) {
      const xa = x0 + (x1 - x0) * i / n, xb = x0 + (x1 - x0) * (i + 1) / n;
      add(bx(xa, y0, z0, xb, y1, z1, C.concrete), phase, o0 + (o1 - o0) * (n > 1 ? i / (n - 1) : 0), how, how === 'rise' ? { d: 0.5 } : { h: 2.6 });
    }
    const cx = (x0 + x1) / 2;
    if (FIN[spec.top]) finish(spec.top, boxG(x0, y1, z0, x1, y1 + 0.02, z1), cx);
    if (FIN[spec.bot]) finish(spec.bot, boxG(x0, y0 - TP, z0, x1, y0, z1), cx);
    if (spec.all === 'clad') {
      const g = mergeGeometries([boxG(x0 - TC, y0 - TP, z0 - TC, x0, y1 + 0.02, z1 + TC), boxG(x1, y0 - TP, z0 - TC, x1 + TC, y1 + 0.02, z1 + TC), boxG(x0, y0 - TP, z0 - TC, x1, y1 + 0.02, z0), boxG(x0, y0 - TP, z1, x1, y1 + 0.02, z1 + TC)]);
      finish('clad', g, cx);
    }
  }

  // ---- 2 foundations: strip footings on the floor of the pit, then the slab of the pool level
  FOOTINGS.forEach(([x0, z0, x1, z1], i) => add(bx(x0, -4.3, z0, x1, -3.6, z1, C.concrete), 2, i * 0.13, 'rise', { d: 0.5 }));
  slab(4.0, -3.6, -7.7, 18.3, -3.2, 3.7, SL, 2, 0.55, 0.92, 'rise');

  // ---- 3 pool level: the walls that hold the hill back, then the living level slab, which runs out as the balcony
  wall('x', 3.7, 4.0, -8.0, 4.0, -3.6, 0, [], { all: 'conc', px: 'plaster' }, 3, 0.0, 0.12);
  wall('z', -8.0, -7.7, 4.0, 18.3, -3.6, -0.35, [], WN, 3, 0.14, 0.3, { end1: true });
  wall('z', 3.7, 4.0, 4.0, 18.0, -3.6, -0.35, [], WS, 3, 0.3, 0.46, { end1: true });
  slab(4.0, -0.35, -7.7, 5.22, 0, -6.55, SG, 3, 0.5, 0.5);
  slab(4.0, -0.35, -1.75, 5.22, 0, 3.7, SG, 3, 0.53, 0.53);
  slab(5.22, -0.35, -7.7, 15.6, 0, 3.7, SG, 3, 0.56, 0.74);
  slab(15.6, -0.35, -1.6, 17.5, 0, 3.7, SG, 3, 0.78, 0.78);
  slab(17.5, -0.35, -1.6, 18.0, 0, 3.7, SP, 3, 0.82, 0.82);
  slab(15.6, -0.35, -7.7, 18.3, 0, -1.6, SP, 3, 0.86, 0.86);
  slab(18.3, -0.35, -8.0, 19.2, 0, -1.6, SO, 3, 0.92, 0.92);

  // ---- 4 living level: its walls, the two stair flights, the slab of the upper level
  wall('x', 3.7, 4.0, -8.0, 4.0, 0, 3.2, [[0.6, 1.9, 0, 2.4, 'open'], [-7.3, -6.75, 0.3, 2.7]], WB, 4, 0.0, 0.12);
  wall('z', -8.0, -7.7, 4.0, 18.3, -0.35, 3.2, [], WN, 4, 0.14, 0.28, { end1: true });
  wall('z', 3.7, 4.0, 4.0, 18.0, -0.35, 3.2, [[12.4, 16.4, 0, 2.6]], WS, 4, 0.28, 0.42, { end1: true });
  wall('z', -1.75, -1.45, 15.6, 18.0, 0, 2.85, [], 'clad', 4, 0.45, 0.45, { end0: true, end1: true });
  // two straight flights stacked along the back wall of the hall, each one precast piece with oak treads
  const flight = (yb, phase, ord) => {
    const L = [], T = [], n = 18, zs = -6.55, run = 4.8 / n, rise = 3.2 / n;
    for (let i = 0; i < n; i++) {
      const t = (i + 1) * rise, z0 = zs + i * run;
      L.push([4.02, Math.max(yb, yb + t - 0.42), z0, 5.2, yb + t, z0 + run, 'conc', true]);
      T.push([4.02, yb + t, z0 - 0.02, 5.2, yb + t + 0.03, z0 + run, 'oak', false]);
    }
    add(boxGroup(L), phase, ord, 'drop', { h: 3.2 });
    add(boxGroup(T), 8, 0.62, 'show', { d: 0.4, ghost: false });
  };
  flight(-3.2, 4, 0.5);
  slab(4.0, 2.85, -1.75, 16.2, 3.2, 3.7, SG, 4, 0.6, 0.78);
  slab(16.2, 2.85, -1.75, 18.0, 3.2, 3.7, SP, 4, 0.82, 0.82);
  slab(7.0, 2.85, -7.7, 15.6, 3.2, -1.75, SG, 4, 0.84, 0.97);

  // ---- 5 upper level: the floor of the tall box runs out 4.8 m over the balcony, then the walls
  flight(0, 5, 0.0);
  slab(15.6, 2.85, -7.7, 17.4, 3.2, -1.75, SI, 5, 0.06, 0.06);
  slab(17.4, 2.85, -7.7, 18.3, 3.2, -1.75, SO, 5, 0.1, 0.1);
  slab(18.3, 2.85, -8.0, 20.4, 3.2, -1.45, SO, 5, 0.14, 0.14);
  wall('x', 3.7, 4.0, -8.0, -1.45, 3.2, 7.6, [[-4.75, -4.2, 3.6, 6.3]], WB, 5, 0.2, 0.28, { top: true });
  wall('x', 3.7, 4.0, -1.45, 4.0, 3.2, 6.8, [[2.25, 2.8, 3.5, 5.9]], WB, 5, 0.3, 0.38, { top: true });
  wall('z', -8.0, -7.7, 4.0, 17.4, 3.2, 7.2, [], WN, 5, 0.4, 0.54);
  wall('z', -8.0, -7.7, 17.4, 20.4, 3.2, 7.2, [], 'clad', 5, 0.58, 0.58, { end1: true });
  wall('z', 3.7, 4.0, 4.0, 16.6, 3.2, 6.4, [[9.0, 14.0, 4.0, 5.9]], WS, 5, 0.6, 0.74, { end1: true });
  wall('z', -1.75, -1.45, 4.0, 20.4, 3.2, 7.2, [[4.0, 15.4, 3.2, 5.9, 'open']], 'clad', 5, 0.78, 0.96, { end1: true });
  // the stone canopy over the door to the court
  finish('clad', boxG(2.75, 2.5, 0.3, 3.7, 2.68, 2.2), 3);

  // ---- 6 roofs, and the deep edge beams that close the frames of the two upper boxes
  slab(4.0, 6.4, -1.45, 16.6, 6.8, 4.0, RF, 6, 0.0, 0.3);
  add(bx(16.1, 6.05, -1.45, 16.6, 6.4, 3.7, C.concrete), 6, 0.34, 'drop', { h: 2.4 });
  slab(4.0, 7.2, -8.0, 17.4, 7.6, -1.45, RF, 6, 0.38, 0.66);
  slab(17.4, 7.2, -8.0, 20.4, 7.6, -1.45, { all: 'clad', top: 'gravel', bot: 'soffit' }, 6, 0.7, 0.7);
  add(bx(20.1, 6.8, -7.7, 20.4, 7.2, -1.75, C.concrete), 6, 0.76, 'drop', { h: 2.4 });
  finish('clad', boxG(16.1 - TC, 6.05 - TC, -1.45, 16.6 + TC, 6.4, 3.7 + TC), 16.3);
  finish('clad', boxG(20.1 - TC, 6.8 - TC, -7.7 - TC, 20.4 + TC, 7.2, -1.75 + TC), 20.2);

  // ---------------------------------------------------------------- 7 glazing
  // Slim floor to ceiling glazing in n panes: the frame is craned in, then every pane. Pane `door` is left for the sliding leaf.
  let gOrd = 0;
  function glazing(axis, t, a0, a1, y0, y1, n, door = -1) {
    const step = (a1 - a0) / n, ord = gOrd; gOrd += 0.095;
    const B = (ta, tb, aa, ab, ya, yb, m) => axis === 'x' ? [t + ta, ya, aa, t + tb, yb, ab, m, m === 'steel'] : [aa, ya, t + ta, ab, yb, t + tb, m, m === 'steel'];
    const F = [];
    for (let i = 0; i <= n; i++) { const a = a0 + i * step; F.push(B(-0.045, 0.045, Math.max(a0, a - 0.022), Math.min(a1, a + 0.022), y0, y1, 'steel')); }
    F.push(B(-0.045, 0.045, a0, a1, y0, y0 + 0.045, 'steel'), B(-0.045, 0.045, a0, a1, y1 - 0.045, y1, 'steel'));
    add(boxGroup(F), 7, ord, 'drop', { h: 1.8, d: 0.3 });
    for (let i = 0; i < n; i++) if (i !== door) add(boxGroup([B(-0.015, 0.015, a0 + i * step + 0.02, a0 + (i + 1) * step - 0.02, y0 + 0.04, y1 - 0.04, 'glass')]), 7, ord + 0.02 + i * 0.014, 'drop', { h: 1.4, d: 0.26, ghost: false });
  }
  glazing('x', DOOR0.x, -7.7, -1.6, -3.2, -0.35, 4, 2);
  glazing('x', 16.6, -1.6, 3.7, -3.2, -0.35, 4);
  glazing('z', -1.6, 16.6, 18.24, -3.2, -0.35, 1);
  glazing('x', DOOR.x, -7.7, -1.75, 0, 2.85, 4, 2);
  glazing('x', 17.5, -1.45, 3.7, 0, 2.85, 4);
  glazing('x', 16.2, -1.45, 3.7, 3.2, 6.05, 4);
  glazing('x', 17.4, -7.7, -1.75, 3.2, 7.2, 4);
  add(boxGroup([[17.355, 5.9, -7.7, 17.445, 5.96, -1.75, 'steel', true]]), 7, gOrd, 'drop', { h: 1.2, d: 0.26 });

  // the two sliding doors: living room to balcony, pool level to terrace
  const slider = (D, ord) => {
    const hw = D.w / 2 - 0.025, H = D.h - 0.09;
    const leaf = boxGroup([
      [-0.025, 0.045, -hw - 0.025, 0.025, 0.045 + H, -hw + 0.025, 'steel', true], [-0.025, 0.045, hw - 0.025, 0.025, 0.045 + H, hw + 0.025, 'steel', true],
      [-0.025, 0.045, -D.w / 2, 0.025, 0.095, D.w / 2, 'steel', true], [-0.025, D.h - 0.095, -D.w / 2, 0.025, D.h - 0.045, D.w / 2, 'steel', true],
      [-0.0625, 1.0775, hw - 0.25, -0.0275, 1.1225, hw - 0.03, 'brass', false],
      [-0.009, 0.095, -D.w / 2 + 0.05, 0.009, D.h - 0.095, D.w / 2 - 0.05, 'glass', false],
    ]);
    const holder = new THREE.Group(); holder.add(leaf); holder.position.set(D.x, D.y, D.zc);
    add(holder, 7, ord, 'drop', { h: 1.4, d: 0.26, base: V(D.x, D.y, D.zc) });
    return leaf;
  };
  const leaf1 = slider(DOOR, 0.3), leaf0 = slider(DOOR0, 0.02);

  // frameless glass balustrades: a slim steel shoe, the pane, a fine polished cap
  let rOrd = 0.72;
  const rail = (axis, t, a0, a1, y, h = 1.05) => {
    const B = (ta, tb, ya, yb, m) => axis === 'x' ? [t + ta, ya, a0, t + tb, yb, a1, m, m === 'steel'] : [a0, ya, t + ta, a1, yb, t + tb, m, m === 'steel'];
    add(boxGroup([B(-0.025, 0.025, y, y + 0.05, 'steel'), B(-0.01, 0.01, y + 0.05, y + h, 'glass'), B(-0.013, 0.013, y + h, y + h + 0.012, 'galv')]), 7, rOrd, 'drop', { h: 1.0, d: 0.26 });
    rOrd += 0.024;
  };
  rail('x', 19.14, -8.0, -1.6, 0); rail('z', -7.96, 18.3, 19.1, 0); rail('z', -1.64, 18.0, 19.1, 0);     // balcony
  rail('x', 20.33, -7.7, -1.75, 3.2);                                                                   // loggia of the cantilever
  rail('x', 17.94, -1.45, 3.96, 3.2); rail('z', 3.94, 16.6, 17.9, 3.2);                                 // terrace on the roof of bay A's lower box
  rail('x', 7.05, -7.7, -1.75, 3.2); rail('z', -1.70, 5.24, 7.05, 3.2);                                 // gallery over the hall
  rail('x', 5.26, -6.55, -1.75, 0, 1.0);                                                                // slot of the lower flight

  // ---------------------------------------------------------------- 8 fit-out: the door to the court and the built-in joinery
  // the timber door to the court, hung on its north jamb so it swings into the house
  const courtDoor = boxGroup([[-0.05, 0, 0, 0.05, 2.4, 1.3, 'teak', true], [0.05, 0.95, 1.12, 0.08, 1.35, 1.15, 'brass', false], [-0.08, 0.95, 1.12, -0.05, 1.35, 1.15, 'brass', false]]);
  {
    const holder = new THREE.Group(); holder.add(courtDoor); holder.position.set(3.85, 0.02, 0.6);
    add(holder, 8, 0.24, 'drop', { h: 0.8, d: 0.4, base: V(3.85, 0.02, 0.6) });
  }
  const J = (name, phase, ord, fill) => { const L = []; fill((x0, y0, z0, x1, y1, z1, m, e = true) => L.push([x0, y0, z0, x1, y1, z1, m, e])); add(boxGroup(L), phase, ord, 'drop', { h: 0.7, d: 0.4, lift: false }); };
  // Upper level: walnut and travertine library on the north wall of the studio (x 8.0 to 13.5)
  J('library', 8, 0.7, (F) => {
    const LX = 8.0, LZ = -7.7, FL = (d0, y0, u0, d1, y1, u1, m, e) => F(LX + u0, y0, LZ + d0, LX + u1, y1, LZ + d1, m, e);
    FL(0, 3.22, 0, 0.48, 3.26, 5.5, 'ink', false); FL(0, 3.26, 0, 0.50, 3.92, 5.5, 'walnut'); FL(0, 3.92, 0, 0.53, 3.97, 5.5, 'travertine');
    FL(0, 3.97, 0, 0.05, 5.86, 5.5, 'walnut'); FL(0, 5.82, 0, 0.42, 5.86, 5.5, 'walnut');
    for (let u = 0.02; u <= 5.48; u += 1.08) FL(0.05, 3.97, u, 0.42, 5.82, u + 0.032, 'walnut');
    for (let s = 0; s < 4; s++) {
      const y = 3.97 + s * 0.45;
      if (s > 0) FL(0.05, y, 0, 0.41, y + 0.03, 5.5, 'walnut');
      let u = 0.12;
      while (u < 5.32) {
        if (Math.abs((u - 0.02) % 1.08) < 0.06) { u += 0.08; continue; }
        const w = 0.035 + rnd() * 0.055, h = 0.20 + rnd() * 0.14;
        if (rnd() < 0.78) FL(0.08, y + 0.03, u, 0.36, y + 0.03 + h, u + w, 'book' + Math.floor(rnd() * 5), false);
        u += w + 0.012 + (rnd() < 0.22 ? 0.16 : 0);
      }
    }
  });
  // the bed in the cantilever, looking out through the loggia
  J('bed', 8, 0.76, (F) => {
    F(14.0, 3.22, -7.7, 16.7, 4.25, -7.62, 'walnut'); F(14.25, 3.22, -7.62, 16.45, 3.46, -5.45, 'walnut'); F(14.3, 3.46, -7.6, 16.4, 3.68, -5.5, 'linen');
    F(14.45, 3.68, -7.56, 15.25, 3.82, -7.12, 'linen', false); F(15.45, 3.68, -7.56, 16.25, 3.82, -7.12, 'linen', false); F(14.3, 3.68, -6.3, 16.4, 3.72, -5.5, 'sofaDark', false);
  });
  // Living level: the tall walnut kitchen run on the south wall (x 7.0 to 11.3)
  J('kitchen', 8, 0.84, (F) => {
    const KX = 7.0, KZ = 3.7, FK = (d0, y0, u0, d1, y1, u1, m, e) => F(KX + u0, y0, KZ - d1, KX + u1, y1, KZ - d0, m, e);
    FK(0, 0.02, 0, 0.62, 0.08, 4.3, 'ink', false); FK(0, 0.08, 0, 0.66, 2.68, 1.25, 'walnut'); FK(0.66, 0.75, 1.18, 0.69, 1.85, 1.21, 'brass', false);
    FK(0, 0.08, 1.26, 0.66, 0.88, 2.15, 'walnut'); FK(0, 0.88, 1.26, 0.67, 1.52, 2.15, 'ink'); FK(0.67, 0.94, 1.32, 0.69, 1.46, 2.09, 'cabGlass', false);
    FK(0, 1.52, 1.26, 0.66, 2.68, 2.15, 'walnut'); FK(0, 0.08, 2.16, 0.66, 0.88, 4.3, 'walnut'); FK(0, 0.88, 2.16, 0.69, 0.93, 4.3, 'travertine');
    FK(0, 0.93, 2.16, 0.06, 1.68, 4.3, 'travertine', false); FK(0.06, 1.38, 2.25, 0.34, 1.41, 4.2, 'walnut', false); FK(0, 1.68, 2.16, 0.46, 2.68, 4.3, 'walnut');
    FK(0, 2.68, 0, 0.68, 2.85, 4.3, 'plaster', false);
  });
  // the waterfall island in front of it (x 7.5 to 10.82, z 0.95 to 2.01)
  J('island', 8, 0.9, (F) => {
    const IX = 7.5 - 6.14, IZ = 0.95 + 4.68, FI = (x0, y0, z0, x1, y1, z1, m, e) => F(x0 + IX, y0, z0 + IZ, x1 + IX, y1, z1 + IZ, m, e);
    FI(6.22, 0.02, -4.58, 9.38, 0.08, -3.72, 'ink', false); FI(6.2, 0.08, -4.62, 9.4, 0.88, -3.7, 'walnut'); FI(6.14, 0.02, -4.68, 6.2, 0.94, -3.62, 'travertine');
    FI(9.4, 0.02, -4.68, 9.46, 0.94, -3.62, 'travertine'); FI(6.14, 0.88, -4.68, 9.46, 0.94, -3.62, 'travertine'); FI(7.4, 0.94, -4.05, 8.1, 0.95, -3.75, 'ink', false);
  });

  // ---------------------------------------------------------------- 9 the pool, the garden and the furniture
  const Y0 = -3.18, Y1 = 0.02, Y2 = 3.22, TY = -3.14;   // the finished floors
  // the court, the pool terrace on its plinth, the long step down to the water, the pool standing on the bank
  add(bx(-7, -0.05, -6.5, 3.7, 0.03, 3.5, C.pave, { edges: 20 }), 9, 0.02, 'rise', { d: 0.5, ghost: false });
  add(bx(18.3, -4.5, -8.0, 21.3, -3.16, 4.0, C.pave), 9, 0.06, 'rise', { d: 0.6 });
  add(bx(21.3, -4.7, -8.0, 21.9, -3.34, 4.0, C.pave), 9, 0.1, 'rise', { d: 0.6 });
  add(bx(21.9, -5.4, -8.0, 28.5, -3.34, -7.6, C.pave), 9, 0.14, 'rise', { d: 0.6 });
  add(bx(21.9, -5.4, 3.6, 28.5, -3.34, 4.0, C.pave), 9, 0.16, 'rise', { d: 0.6 });
  add(bx(28.2, -6.0, -7.6, 28.5, -3.47, 3.6, C.pave), 9, 0.2, 'rise', { d: 0.6 });
  add(bx(21.9, -5.0, -7.6, 28.2, -3.45, 3.6, mat(C.water), { edges: 0, cast: false }), 9, 0.27, 'rise', { d: 0.7, ghost: false });

  // furniture, as simple as a model maker would cut it
  const sofa = (w, d = 0.95) => [
    [-w / 2, 0.06, -d / 2, w / 2, 0.3, d / 2, 'linen', true], [-w / 2, 0.3, -d / 2, w / 2, 0.76, -d / 2 + 0.2, 'linen', true],
    [-w / 2, 0.3, -d / 2 + 0.2, -w / 2 + 0.18, 0.6, d / 2, 'linen', true], [w / 2 - 0.18, 0.3, -d / 2 + 0.2, w / 2, 0.6, d / 2, 'linen', true],
    [-w / 2 + 0.2, 0.3, -d / 2 + 0.22, -0.02, 0.44, d / 2 - 0.02, 'linen', false], [0.02, 0.3, -d / 2 + 0.22, w / 2 - 0.2, 0.44, d / 2 - 0.02, 'linen', false],
    [-w / 2 + 0.24, 0.44, -d / 2 + 0.2, -w / 2 + 0.64, 0.74, -d / 2 + 0.36, 'terracotta', false], [w / 2 - 0.64, 0.44, -d / 2 + 0.2, w / 2 - 0.24, 0.74, -d / 2 + 0.36, 'sofaDark', false],
  ];
  const chair = () => [
    [-0.4, 0, -0.38, -0.34, 0.56, 0.38, 'walnut', true], [0.34, 0, -0.38, 0.4, 0.56, 0.38, 'walnut', true],
    [-0.34, 0.26, -0.34, 0.34, 0.4, 0.36, 'leather', false], [-0.34, 0.4, -0.38, 0.34, 0.86, -0.26, 'leather', true],
  ];
  const lowTable = (w, d) => [[-w / 2, 0.3, -d / 2, w / 2, 0.36, d / 2, 'travertine', true], [-w / 2 + 0.12, 0, -d / 2 + 0.1, -w / 2 + 0.4, 0.3, d / 2 - 0.1, 'travertine', true], [w / 2 - 0.4, 0, -d / 2 + 0.1, w / 2 - 0.12, 0.3, d / 2 - 0.1, 'travertine', true], [-0.15, 0.36, -0.1, 0.15, 0.4, 0.1, 'book3', false]];
  const credenza = (w) => [[-w / 2, 0.02, -0.22, w / 2, 0.1, 0.22, 'ink', false], [-w / 2, 0.1, -0.24, w / 2, 0.62, 0.24, 'walnut', true], [-w / 2 - 0.02, 0.62, -0.26, w / 2 + 0.02, 0.66, 0.26, 'travertine', true]];
  const rug = (w, d) => { const g = box(w, 0.018, d, mat(0xD4C8B4, { map: TX.rugMap, bumpMap: TX.fabricBump, bumpScale: 0.03, roughness: 0.94 }), 0, 0, 0, { edges: 0, cast: false }); return g; };
  const rugAt = (w, d, x, y, z) => { const g = rug(w, d); g.position.set(x, y, z); return g; };
  const lamp = (x, y, z, h = 1.5) => { const g = new THREE.Group(); g.add(cyl(0.16, 0.16, 0.03, 18, C.brass, x, y, z), cyl(0.016, 0.016, h, 10, C.brass, x, y + 0.03, z)); g.add(shade(new THREE.CylinderGeometry(0.2, 0.24, 0.3, 20), x, y + h + 0.1, z)); return g; };
  const pendants = (list, yCeil, drop) => { const g = new THREE.Group(), pts = []; for (const [x, z] of list) { g.add(shade(new THREE.SphereGeometry(0.13, 18, 12), x, yCeil - drop, z)); pts.push(V(x, yCeil - drop + 0.12, z), V(x, yCeil, z)); } g.add(lines(pts)); return g; };
  const olive = (x, y, z, k = 1) => {
    const g = new THREE.Group();
    g.add(cyl(0.3 * k, 0.24 * k, 0.5 * k, 18, C.travertine, x, y, z), cyl(0.04 * k, 0.06 * k, 1.2 * k, 8, 0x5D5246, x, y + 0.5 * k, z));
    g.add(solid(makeOrganicClusterGeo(0.62 * k, 0.5 * k, 0.58 * k, 1).translate(x, y + 1.95 * k, z), mat(0x7A885E, { bumpMap: TX.foliageBump, bumpScale: 0.024 }), { edges: 0 }));
    g.add(solid(makeOrganicClusterGeo(0.42 * k, 0.36 * k, 0.4 * k, 1).translate(x + 0.3 * k, y + 1.6 * k, z + 0.2 * k), mat(0x6C7A4F, { bumpMap: TX.foliageBump, bumpScale: 0.024 }), { edges: 0 }));
    return g;
  };
  const trough = (x, y, z, w, d) => {
    const g = boxGroup([[x - w / 2, y, z - d / 2, x + w / 2, y + 0.45, z + d / 2, 'clad', true]]);
    const n = Math.max(1, Math.round(Math.max(w, d) / 0.7));
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n - 0.5, px = x + (w > d ? u * w : 0), pz = z + (w > d ? 0 : u * d);
      g.add(solid(makeOrganicClusterGeo(0.34, 0.26, 0.34, 1).translate(px, y + 0.56, pz), mat(i % 2 ? 0x67784C : 0x78875B, { bumpMap: TX.foliageBump, bumpScale: 0.024 }), { edges: 0 }));
    }
    return g;
  };
  const F9 = (obj, ord, o = {}) => add(obj, 9, ord, 'drop', { h: 0.6, d: 0.34, lift: false, ...o });
  const R90 = Math.PI / 2;

  // upper level: the studio in front of the library, the lounge in bay A, two chairs in the loggia
  F9(rugAt(3.0, 2.0, 10.75, Y2, -5.1), 0.4, { ghost: false });
  F9(piece([[-1.1, 0.72, -0.4, 1.1, 0.76, 0.4, 'walnut', true], [-1.06, 0, -0.36, -0.98, 0.72, 0.36, 'travertine', true], [0.98, 0, -0.36, 1.06, 0.72, 0.36, 'travertine', true], [-0.7, 0.76, -0.2, -0.35, 0.92, 0.02, 'clad', false], [0.3, 0.76, -0.15, 0.62, 0.8, 0.12, 'book1', false]], 10.75, Y2, -5.35), 0.42);
  F9(piece(chair(), 10.75, Y2, -4.35, Math.PI), 0.44);
  F9(rugAt(3.6, 2.4, 10.6, Y2, 1.3), 0.45, { ghost: false });
  F9(piece(sofa(2.7), 10.6, Y2, 2.25, Math.PI), 0.47);
  F9(piece(lowTable(1.3, 0.7), 10.6, Y2, 0.9), 0.49);
  F9(piece(chair(), 8.9, Y2, 0.62, Math.atan2(1.7, 0.26)), 0.5);
  F9(piece(chair(), 12.27, Y2, 0.62, Math.atan2(-1.67, 0.26)), 0.51);
  F9(piece(chair(), 18.85, Y2, -5.95, R90), 0.52);
  F9(piece(chair(), 18.85, Y2, -4.15, R90), 0.53);
  F9(cyl(0.24, 0.24, 0.4, 24, C.travertine, 19.0, Y2, -5.05), 0.54);
  F9(lamp(8.3, Y2, 2.9), 0.55);
  F9(pendants([[10.75, -5.35], [15.35, -6.5]], 7.2, 1.7), 0.56, { ghost: false });

  // living level: stools at the island, the dining table by the glass, the living room behind the sliding door
  for (let i = 0; i < 3; i++) F9(piece([[-0.19, 0.6, -0.18, 0.19, 0.66, 0.18, 'leather', true], [-0.17, 0, -0.16, -0.14, 0.6, -0.13, 'walnut', false], [0.14, 0, -0.16, 0.17, 0.6, -0.13, 'walnut', false], [-0.17, 0, 0.13, -0.14, 0.6, 0.16, 'walnut', false], [0.14, 0, 0.13, 0.17, 0.6, 0.16, 'walnut', false]], 8.2 + i * 0.95, Y1, 0.55), 0.58 + i * 0.006);
  F9(pendants([[8.3, 1.48], [9.16, 1.48], [10.02, 1.48]], 2.85, 1.0), 0.6, { ghost: false });
  F9(rugAt(3.4, 2.2, 14.3, Y1, 1.05), 0.61, { ghost: false });
  F9(piece([[-1.2, 0.72, -0.5, 1.2, 0.77, 0.5, 'oak', true], [-1.1, 0, -0.42, -1.02, 0.72, -0.34, 'oak', false], [1.02, 0, -0.42, 1.1, 0.72, -0.34, 'oak', false], [-1.1, 0, 0.34, -1.02, 0.72, 0.42, 'oak', false], [1.02, 0, 0.34, 1.1, 0.72, 0.42, 'oak', false], [-0.2, 0.77, -0.12, 0.2, 0.85, 0.12, 'terracotta', false]], 14.3, Y1, 1.05), 0.63);
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) F9(piece([[-0.22, 0.42, -0.21, 0.22, 0.47, 0.21, 'leather', true], [-0.22, 0.47, -0.23, 0.22, 0.84, -0.18, 'oak', true], [-0.2, 0, -0.19, -0.16, 0.42, -0.15, 'oak', false], [0.16, 0, -0.19, 0.2, 0.42, -0.15, 'oak', false], [-0.2, 0, 0.15, -0.16, 0.42, 0.19, 'oak', false], [0.16, 0, 0.15, 0.2, 0.42, 0.19, 'oak', false]], 14.3 + (i - 1) * 0.75, Y1, 1.05 + s * 0.73, s > 0 ? Math.PI : 0), 0.645 + i * 0.006);
  F9(pendants([[13.6, 1.05], [14.3, 1.05], [15.0, 1.05]], 2.85, 0.9), 0.67, { ghost: false });
  F9(rugAt(4.2, 3.2, 11.6, Y1, -5.3), 0.68, { ghost: false });
  F9(piece([...sofa(3.0), [-1.5, 0.06, 0.475, -0.3, 0.3, 1.5, 'linen', true], [-1.48, 0.3, 0.49, -0.32, 0.44, 1.48, 'linen', false]], 9.9, Y1, -5.2, R90), 0.7);
  F9(piece(lowTable(1.5, 0.8), 12.2, Y1, -5.3, R90), 0.72);
  F9(piece(chair(), 14.1, Y1, -6.3, Math.atan2(12.2 - 14.1, -5.3 + 6.3)), 0.73);
  F9(piece(chair(), 14.2, Y1, -5.0, Math.atan2(12.2 - 14.2, -5.3 + 5.0)), 0.74);
  F9(piece(credenza(2.6), 12.55, Y1, -7.42), 0.75);
  {
    const art = new THREE.Group();
    art.add(bx(11.8, 1.05, -7.69, 13.3, 2.25, -7.66, C.dark, { edges: 0 }));
    art.add(bx(11.85, 1.1, -7.66, 13.25, 2.2, -7.652, mat(0xffffff, { map: TX.art1, roughness: 0.7 }), { edges: 0, uvMode: false }));
    F9(art, 0.76, { ghost: false });
  }
  F9(lamp(8.2, Y1, -6.9, 1.7), 0.765);
  F9(olive(15.0, Y1, -7.1), 0.77);

  // pool level: the lounge in front of the media wall, the sauna, the billiard table
  J('media', 9, 0.79, (F) => { F(11.2, Y0, -7.7, 16.4, Y0 + 2.62, -7.62, 'walnut'); F(12.55, Y0 + 1.0, -7.62, 15.05, Y0 + 2.36, -7.575, 'ink'); });
  F9(rugAt(4.0, 2.8, 13.5, Y0, -5.2), 0.8, { ghost: false });
  F9(piece(sofa(3.0), 13.6, Y0, -3.95, Math.PI), 0.81);
  F9(piece(lowTable(1.5, 0.8), 13.5, Y0, -5.55), 0.82);
  F9(piece(credenza(3.2), 13.8, Y0, -7.36), 0.83);
  F9(piece(chair(), 16.7, Y0, -6.35, Math.atan2(13.5 - 16.7, -5.55 + 6.35)), 0.835);
  F9(piece(chair(), 10.6, Y0, -6.2, Math.atan2(13.5 - 10.6, -5.55 + 6.2)), 0.84);
  F9(lamp(16.9, Y0, -7.2, 1.4), 0.845);
  J('sauna', 9, 0.86, (F) => {
    const SA = [4.04, 1.05, 7.3, 3.66], SH = Y0 + 2.25;
    F(SA[0], Y0, SA[1], SA[2], Y0 + 0.06, SA[3], 'soffit', false); F(SA[0], Y0 + 0.06, SA[1], SA[0] + 0.07, SH, SA[3], 'soffit'); F(SA[0], Y0 + 0.06, SA[3] - 0.07, SA[2], SH, SA[3], 'soffit');
    F(SA[0], Y0 + 0.06, SA[1], SA[2] - 1.0, SH, SA[1] + 0.07, 'soffit'); F(SA[0], SH - 0.07, SA[1], SA[2], SH, SA[3], 'soffit'); F(SA[2] - 0.07, Y0 + 0.06, SA[1], SA[2], SH - 0.07, SA[1] + 0.07, 'ink');
    F(SA[2] - 1.0, Y0 + 0.06, SA[1] + 0.02, SA[2] - 0.07, SH - 0.07, SA[1] + 0.045, 'cabGlass', false); F(SA[2] - 0.05, Y0 + 0.06, SA[1] + 0.07, SA[2] - 0.025, SH - 0.07, SA[3] - 0.07, 'cabGlass', false);
    F(SA[0] + 0.07, Y0 + 0.44, SA[3] - 0.72, SA[2] - 0.6, Y0 + 0.5, SA[3] - 0.07, 'soffit', false); F(SA[0] + 0.07, Y0 + 0.9, SA[3] - 0.46, SA[2] - 0.6, Y0 + 0.96, SA[3] - 0.07, 'soffit', false);
    F(SA[0] + 0.2, Y0 + 0.06, SA[1] + 0.22, SA[0] + 0.72, Y0 + 0.72, SA[1] + 0.74, 'ink', false); F(SA[0] + 0.24, Y0 + 0.72, SA[1] + 0.26, SA[0] + 0.68, Y0 + 0.8, SA[1] + 0.7, 'travertine', false);
  });
  J('billiard', 9, 0.89, (F) => {
    const BX = 12.4, BZ = 1.05, BH = Y0 + 0.8;
    for (const sx of [-1.2, 1.2]) for (const sz of [-0.58, 0.58]) F(BX + sx - 0.08, Y0, BZ + sz - 0.08, BX + sx + 0.08, Y0 + 0.6, BZ + sz + 0.08, 'walnut', false);
    F(BX - 1.42, Y0 + 0.6, BZ - 0.785, BX + 1.42, BH, BZ + 0.785, 'walnut');
    F(BX - 1.42, BH, BZ - 0.785, BX + 1.42, BH + 0.05, BZ - 0.635, 'walnut', false); F(BX - 1.42, BH, BZ + 0.635, BX + 1.42, BH + 0.05, BZ + 0.785, 'walnut', false);
    F(BX - 1.42, BH, BZ - 0.635, BX - 1.27, BH + 0.05, BZ + 0.635, 'walnut', false); F(BX + 1.27, BH, BZ - 0.635, BX + 1.42, BH + 0.05, BZ + 0.635, 'walnut', false);
    F(BX - 1.27, BH, BZ - 0.635, BX + 1.27, BH + 0.012, BZ + 0.635, 'cloth', false);
  });
  F9(pendants([[11.7, 1.05], [12.4, 1.05], [13.1, 1.05]], -0.36, 1.0), 0.9, { ghost: false });
  F9(piece(chair(), 15.6, Y0, 0.3, R90), 0.905);
  F9(piece(chair(), 15.6, Y0, 1.8, R90), 0.91);
  F9(olive(17.3, Y0, -7.0), 0.915);

  // the pool terrace: sunloungers, a drum table, an olive in a stone planter
  const lounger = () => [[-0.32, 0.22, -0.95, 0.32, 0.3, 0.55, 'teak', true], [-0.3, 0.3, -0.93, 0.3, 0.37, 0.53, 'linen', false], [-0.3, 0, -0.9, -0.24, 0.22, -0.84, 'teak', false], [0.24, 0, -0.9, 0.3, 0.22, -0.84, 'teak', false], [-0.3, 0, 0.44, -0.24, 0.22, 0.5, 'teak', false], [0.24, 0, 0.44, 0.3, 0.22, 0.5, 'teak', false], [-0.32, 0.3, 0.55, 0.32, 0.72, 0.68, 'linen', true]];
  for (const [i, z] of [-0.4, 0.5, 2.2].entries()) F9(piece(lounger(), 19.85, TY, z, -R90), 0.93 + i * 0.006);
  F9(cyl(0.24, 0.24, 0.36, 24, C.travertine, 19.6, TY, 1.35), 0.95);
  F9(olive(19.4, TY, -6.9, 1.15), 0.955);
  // planting: troughs on the balcony and on the upper terrace
  F9(trough(18.62, Y1, -7.2, 0.8, 1.2), 0.96);
  F9(trough(17.25, Y2, 1.15, 0.6, 4.6), 0.965);

  // ---------------------------------------------------------------- surroundings: cypresses along the court, olives down the slope
  const trees = [];
  {
    const barkMat = mat(0x5D5246, { bumpMap: TX.woodBump, bumpScale: 0.022, roughness: 0.86 });
    const springCols = [new THREE.Color(0x818C64), new THREE.Color(0x76825A), new THREE.Color(0x8C966E)];
    const summerCols = [new THREE.Color(0x6D7E52), new THREE.Color(0x5C6D42), new THREE.Color(0x7F8E63)];
    const cypressCols = [new THREE.Color(0x56664A), new THREE.Color(0x4A5A40), new THREE.Color(0x5F6F52)];
    const SPEC = {
      round: [[0, 4.4, 0, 2.1, 1.65, 2.0, 0], [-1.15, 3.85, 0.65, 1.45, 1.22, 1.4, 1], [1.1, 3.95, -0.55, 1.5, 1.25, 1.42, 2], [0.35, 4.95, 0.85, 1.38, 1.18, 1.35, 0], [-0.65, 4.8, -0.9, 1.35, 1.15, 1.3, 1]],
      olive: [[-0.4, 3.0, 0, 1.7, 0.95, 1.5, 0], [0.9, 3.4, 0.3, 1.2, 0.75, 1.1, 1], [-0.2, 3.85, -0.4, 1.1, 0.65, 1.1, 2]],
      cypress: [[0, 2.6, 0, 0.72, 2.1, 0.72, 0], [0, 4.6, 0, 0.5, 1.5, 0.5, 1]],
    };
    const tree = (kind, x, z, k, idx, wIn) => {
      const t = new THREE.Group();
      const th = kind === 'cypress' ? 1.2 : kind === 'olive' ? 2.4 : 3.1;
      t.add(solid(new THREE.CylinderGeometry(0.11 * k, 0.22 * k, th * k, 8).translate(0, th * k / 2, 0), barkMat, { edges: 0 }));
      if (kind !== 'cypress') {
        t.add(beam(V(0, th * 0.7 * k, 0), V(-0.95 * k, (th + 0.5) * k, 0.5 * k), 0.11 * k, 0.11 * k, barkMat, { edges: 0 }));
        t.add(beam(V(0, th * 0.72 * k, 0), V(0.9 * k, (th + 0.6) * k, -0.45 * k), 0.10 * k, 0.10 * k, barkMat, { edges: 0 }));
      }
      const crown = new THREE.Group(), clusters = [];
      for (const [cx, cy, cz, rx, ry, rz, ci] of SPEC[kind]) {
        const a = kind === 'cypress' ? cypressCols[ci] : springCols[ci], b = kind === 'cypress' ? cypressCols[ci] : summerCols[ci];
        const cm = new THREE.MeshStandardMaterial({ color: a.clone(), bumpMap: TX.foliageBump, bumpScale: 0.028, roughness: 0.76, envMapIntensity: 0.4 });
        const m = new THREE.Mesh(makeOrganicClusterGeo(rx * k, ry * k, rz * k, 1).translate(cx * k, cy * k, cz * k), cm);
        m.castShadow = true; m.receiveShadow = true;
        crown.add(m); clusters.push({ mesh: m, spring: a, summer: b });
      }
      t.add(crown);
      t.position.set(x, natural(x, z) - 0.05, z);
      t.rotation.y = idx * 0.85;
      if (wIn == null) { root.add(t); trees.push({ crown, clusters, grow: kind !== 'cypress' }); }
      else { const h = new THREE.Group(); h.add(t); add(h, 9, wIn, 'grow', { d: 0.5, hot: false, ghost: false, base: V(x, natural(x, z) - 0.05, z) }); trees.push({ crown, clusters, grow: false, summer: true }); }
    };
    let n = 0;
    for (let z = -22; z <= 15; z += 3.5) tree('cypress', -15 + Math.sin(z) * 0.6, z + (rnd() - 0.5), 0.85 + rnd() * 0.35, n++);
    for (const [kind, x, z, k] of [['olive', -6, -23, 1.1], ['olive', -24, 4, 1.2], ['olive', 30, -24, 1.0], ['olive', 36, -10.5, 1.1], ['olive', 37, 16, 1.2], ['olive', -2.5, 19, 1.0],
      ['olive', 42, 2, 1.1], ['round', -22, -12, 1.2], ['olive', 46, -24, 1.2], ['olive', 52, 10, 1.3], ['round', -30, -26, 1.4], ['round', -34, 14, 1.3], ['olive', 14, -30, 1.2], ['round', 6, 30, 1.3], ['olive', 60, -8, 1.4]]) tree(kind, x, z, k, n++);
    // the garden, planted in the last weeks: olives either side of the pool and below it
    for (const [kind, x, z, k, w] of [['olive', 24.6, -11.6, 0.9, 0.36], ['olive', 31.6, -9.6, 0.95, 0.38], ['round', 33.8, -2.2, 0.8, 0.4], ['olive', 15.2, 8.4, 0.85, 0.42]]) tree(kind, x, z, k, n++, w);
  }
  // rosemary and lavender banks either side of the pool
  {
    const cols = [0x67784C, 0x7C8A63, 0x8A86A0];
    let i = 0;
    for (const zz of [-9.3, 5.3]) for (let x = 19.4; x < 28.6; x += 1.5) {
      const z = zz + Math.sin(x * 1.7) * 0.3;
      const g = solid(makeOrganicClusterGeo(0.62, 0.36, 0.52, 1).translate(x, natural(x, z) + 0.2, z), mat(cols[i % 3], { bumpMap: TX.foliageBump, bumpScale: 0.024 }), { edges: 0 });
      add(g, 9, 0.44 + (i++) * 0.006, 'grow', { d: 0.3, hot: false, ghost: false });
    }
  }

  // ---------------------------------------------------------------- warm light at handover
  const warm = [[0xffdca8, 12, [12.5, 2.3, -5.2]], [0xffdca8, 11, [11, 2.3, 1.4]], [0xffdca8, 11, [13.4, -0.9, -5.2]], [0xffdca8, 11, [11, 5.6, -3.2]], [0xffb070, 8, [5.6, -1.4, 2.3]]]
    .map(([c, dist, p]) => { const l = new THREE.PointLight(c, 0, dist, 1.5); l.position.set(...p); root.add(l); return l; });

  // ---------------------------------------------------------------- the tower crane
  // It stands on the court, west of the house. Its jib turns to whatever is being set, the trolley runs out over it.
  const crane = new THREE.Group(), jib = new THREE.Group(), trolley = new THREE.Group();
  const cable = lines([V(), V(), V(), V(), V(), V()], new THREE.LineBasicMaterial({ color: C.ink }));
  const hookBlock = box(0.3, 0.38, 0.24, C.accent, 0, 0, 0, { cast: false });
  const JY = TOWER.h + 0.7;
  {
    const s = 0.8, h = TOWER.h, braces = [], L = TOWER.jib, Lc = TOWER.tail;
    const P = [[-s, -s], [s, -s], [s, s], [-s, s]];
    const mast = [[-2.5, -1, -2.5, 2.5, 0, 2.5, 'conc', true], [-1.1, h, -1.1, 1.1, h + 0.7, 1.1, 'machine', true], [0.65, h - 1.35, 0.55, 2.35, h + 0.55, 2.05, 'machine', true], [2.35, h - 0.75, 0.65, 2.4, h + 0.35, 1.95, 'cabGlass', false]];
    for (const [cx, cz] of P) mast.push([cx - 0.06, 0, cz - 0.06, cx + 0.06, h, cz + 0.06, 'machine', false]);
    for (let y = 0; y < h - 0.1; y += 1.6) for (let i = 0; i < 4; i++) {
      const a = P[i], b = P[(i + 1) % 4];
      braces.push(V(a[0], y, a[1]), V(b[0], y, b[1]), V(a[0], y, a[1]), V(b[0], Math.min(h, y + 1.6), b[1]));
    }
    const craneLine = new THREE.LineBasicMaterial({ color: 0x8C6A16 });
    crane.add(boxGroup(mast), lines(braces, craneLine));
    crane.position.set(TOWER.x, natural(TOWER.x, TOWER.z), TOWER.z);
    // the jib runs along its own +z, the counter jib along -z
    const jb = [[-0.6, 0, 0.9, -0.5, 0.1, L, 'machine', false], [0.5, 0, 0.9, 0.6, 0.1, L, 'machine', false], [-0.6, 0, -Lc, -0.48, 0.12, -0.9, 'machine', false], [0.48, 0, -Lc, 0.6, 0.12, -0.9, 'machine', false],
      [-0.8, -1.3, -Lc + 0.3, 0.8, 0.3, -Lc + 2.9, 'conc', true]];
    const jl = [], th = 1.4, topY = (u) => th * (1 - (u - 0.9) / (L - 0.9)) + 0.25 * (u - 0.9) / (L - 0.9);
    for (let u = 0.9; u < L - 1.6; u += 1.8) {
      const u2 = u + 1.8;
      jl.push(V(-0.55, 0.05, u), V(0.55, 0.05, u), V(-0.55, 0.05, u), V(0, topY(u2), u2), V(0.55, 0.05, u), V(0, topY(u2), u2), V(0, topY(u), u), V(-0.55, 0.05, u2), V(0, topY(u), u), V(0.55, 0.05, u2), V(0, topY(u), u), V(0, topY(u2), u2));
    }
    for (let u = -0.9; u > -Lc; u -= 1.5) jl.push(V(-0.55, 0.06, u), V(0.55, 0.06, u));
    for (const sx of [-0.6, 0.6]) for (const sz of [-0.7, 0.7]) jl.push(V(sx, 0, sz), V(0, 5, 0));
    jl.push(V(0, 5, 0), V(0, topY(L * 0.62), L * 0.62), V(0, 5, 0), V(0, 0.1, -Lc + 0.5));
    jib.add(boxGroup(jb), lines(jl, craneLine));
    trolley.add(box(1.0, 0.3, 1.0, C.dark, 0, -0.35, 0, { cast: false }));
    jib.add(trolley);
    jib.position.y = JY;
    crane.add(jib);
    root.add(crane, cable, hookBlock);
  }
  // where the crane wants to be (set by update) and where it is (eased by tick)
  const want = { yaw: 0.9, r: 14, hook: V(TOWER.x, JY - 6, TOWER.z), sling: null };
  const now = { yaw: 0.9, r: 14 };
  const trolleyAt = V();
  function tick(dt = 0.016, snap = false) {
    if (!crane.visible) return;
    const k = snap ? 1 : Math.min(1, dt * 4.2);
    let dy = want.yaw - now.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    now.yaw += dy * k; now.r += (want.r - now.r) * k;
    jib.rotation.y = now.yaw; trolley.position.z = now.r;
    trolley.updateWorldMatrix(true, false); trolleyAt.setFromMatrixPosition(trolley.matrixWorld); trolleyAt.y -= 0.35;
    const s = want.sling, swivel = s ? want.hook.clone().add(V(0, 1.15, 0)) : V(trolleyAt.x, Math.min(trolleyAt.y - 1, want.hook.y), trolleyAt.z);
    const a = s ? want.hook.clone().add(V(-s[0] * 0.5, -0.02, -s[1] * 0.35)) : swivel, b = s ? want.hook.clone().add(V(s[0] * 0.5, -0.02, s[1] * 0.35)) : swivel;
    cable.geometry.setFromPoints([trolleyAt, swivel, swivel, a, swivel, b]);
    hookBlock.position.copy(swivel);
  }

  const hookAt = new THREE.Vector3();
  function update(T, o = {}) {
    let active = null;
    const calm = !!o.calm;
    for (const p of parts) {
      const s = clamp01((T - p.t0) / (p.t1 - p.t0));
      const gone = T > p.until ? clamp01((T - p.until) / p.out) : 0;
      p.s = s;
      p.pivot.visible = s > 0 && gone < 1;
      if (!p.pivot.visible) { if (p.ghosts) for (const g of p.ghosts) g.visible = (o.ghost ?? 0) > 0 && s <= 0; continue; }
      const e = easeOut(s);
      p.pivot.scale.set(1, 1, 1);
      p.obj.position.copy(p.home);
      p.obj.rotation.set(0, 0, 0);
      if (p.how === 'drop') {
        // lowered on the hook: a little sway on the way down, a soft settle on landing
        const settle = !calm && s > 0.76 && s < 1 ? Math.sin(((s - 0.76) / 0.24) * Math.PI * 2.5) * Math.exp(-(s - 0.76) * 14) * 0.04 : 0;
        p.obj.position.y += (1 - e) * p.drop + settle;
        if (p.lift && s < 1 && !calm) p.obj.rotation.z = Math.sin(s * Math.PI * 2.2) * (1 - e) * 0.018;
      } else if (p.how === 'rise') {
        p.pivot.scale.y = Math.max(1e-3, e);
      } else if (p.how === 'grow') {
        p.pivot.scale.setScalar(Math.max(1e-3, e));
      }
      if (gone > 0) p.pivot.scale.multiplyScalar(Math.max(1e-3, 1 - easeOut(gone)));
      const ph = PHASES[p.phase];
      const heat = p.hot ? (s < 1 ? 1 : 0.28 * (1 - smooth(ph.w1 - 0.6, ph.w1, T)) + 0.72 * (1 - smooth(p.t1, p.t1 + 0.3, T))) : 0;
      const effHeat = T >= WEEKS ? 0 : heat;
      // the part in work keeps its material, with a green tint and green edges
      for (const m of p.mats) m.color.copy(m.userData.base).lerp(accent, effHeat * 0.24);
      for (const em of p.edgeMats) {
        em.color.copy(inkCol).lerp(accent, effHeat);
        em.opacity = 0.34 + 0.62 * effHeat;
      }
      if (p.ghosts) for (const g of p.ghosts) g.visible = false;
      if (p.lift && s > 0 && s < 1 && (!active || p.t0 > active.t0)) active = p;
    }
    dash.opacity = 0.45 * (o.ghost ?? 0);

    // the doors open for handover: the door to the court swings in, the two glass leaves slide aside
    courtDoor.rotation.y = easeOut(smooth(36.85, 37.15, T)) * 1.42;
    leaf1.position.set(0.06, 0, -(DOOR.w - 0.06) * easeOut(smooth(37.3, 37.55, T)));
    leaf0.position.set(0.06, 0, -(DOOR0.w - 0.06) * easeOut(smooth(37.6, 37.85, T)));

    // Excavation: the pit deepens under the excavator, the spoil heap grows on the court, then the backfill takes it away.
    ground.update(T);
    const dig = digAt(T), heap = dig * (1 - smooth(FILL[0], FILL[1], T));
    spoil.visible = heap > 0.01;
    spoil.scale.set(0.4 + 0.6 * heap, Math.max(1e-3, heap), 0.4 + 0.6 * heap);
    if (diggerPart.pivot.visible) diggerPart.pivot.position.y = groundAt(11.6, -2.2, T);

    // Crane: goes up while the slab cures, comes down once the glass is in.
    const cr = smooth(5.0, 5.9, T) * (1 - smooth(24.8, 25.6, T));
    crane.visible = cable.visible = hookBlock.visible = cr > 0.01;
    crane.scale.y = Math.max(1e-3, easeOut(cr));
    if (active && cr >= 1) {
      hookAt.copy(active.top); hookAt.y += active.obj.position.y - active.home.y + 0.05;
      want.hook.copy(hookAt); want.sling = [active.spanX, active.spanZ];
      want.yaw = Math.atan2(hookAt.x - TOWER.x, hookAt.z - TOWER.z);
      want.r = Math.min(TOWER.jib - 1, Math.max(3, Math.hypot(hookAt.x - TOWER.x, hookAt.z - TOWER.z)));
    } else {
      want.sling = null; want.hook.set(0, (JY - 5) * crane.scale.y, 0);
      if (cr < 1) { want.yaw = 0.9; want.r = 14; }
    }
    tick(0.016, calm || !!o.snap);

    // warm light and glowing shades ramp up towards handover
    const glow = smooth(35.6, 37.4, T);
    warm.forEach((l, i) => { l.intensity = (i < 4 ? 4.2 : 2.6) * glow; });
    for (const m of glows) m.emissiveIntensity = 1.6 * glow;

    // the trees come into leaf between March and June
    const leaf = smooth(2, 12, T);
    for (const tr of trees) {
      if (tr.grow) tr.crown.scale.setScalar(0.8 + 0.2 * leaf);
      for (const cl of tr.clusters) cl.mesh.material.color.copy(cl.spring).lerp(cl.summer, tr.summer ? 1 : leaf);
    }
    return active;
  }

  if (opts.ghost) root.add(ghostRoot);
  return { root, parts, update, tick, crane, trees, ground, ghostRoot, planWalls };
}
