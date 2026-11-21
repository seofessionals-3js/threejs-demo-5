// What stands on the site besides the house: the tower crane, the machines, the falsework under the slabs,
// the scaffold, the stacks of material and the people. Every piece is registered with the weeks it is there
// and with a line of words (what it is, how big, what it is made of) for the label that follows the build.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function buildSite(K) {
  const { C, V, add, mat, ink, natural, glassM, flatten, PIT, TOWER } = K;
  const UP = new THREE.Vector3(0, 1, 0);
  const bxg = (x0, y0, z0, x1, y1, z1) => new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  // a square bar between two points
  const bar = (a, b, r = 0.06) => {
    const d = b.clone().sub(a), len = d.length();
    return new THREE.BoxGeometry(r, len, r).translate(0, len / 2, 0).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, d.normalize())).translate(a.x, a.y, a.z);
  };
  const cyl = (r0, r1, h, x, y, z, seg = 14, axis = 'y') => {
    const g = new THREE.CylinderGeometry(r0, r1, h, seg);
    if (axis === 'z') g.rotateX(Math.PI / 2); else if (axis === 'x') g.rotateZ(Math.PI / 2);
    return g.translate(x, y, z);
  };
  const COL = {
    yellow: C.machine, dark: C.dark, steel: C.steel, galv: 0xC4C6C4, conc: C.concrete, timber: C.teak, white: C.cabin, lime: C.lime,
    ballast: 0xA8A49C, skin: 0xD9B08C, cloth: 0x3E4A52, coat: 0x8A8172, rubber: 0x2A2B2D, clad: C.clad, earth: C.earth, rebar: 0x6B4A36, linen: C.fabric, leaf: C.plant,
  };
  // geometries by material, merged into one mesh each; `edged` ones also get fine ink edges
  function build(sets, edged = []) {
    const g = new THREE.Group();
    for (const k in sets) {
      const list = sets[k]; if (!list || !list.length) continue;
      const m = new THREE.Mesh(list.length > 1 ? mergeGeometries(list) : list[0], k === 'glass' ? glassM({ color: 0x8cb0bd, opacity: 0.4 }) : mat(COL[k] ?? C.dark));
      m.castShadow = k !== 'glass'; m.receiveShadow = true;
      g.add(m);
    }
    if (edged.length) g.add(new THREE.LineSegments(mergeGeometries(edged.map(e => new THREE.EdgesGeometry(e, 28))), ink));
    return g;
  }
  const put = (obj, x, y, z, ry = 0) => { obj.rotation.y = ry; const h = new THREE.Group(); h.add(obj); h.position.set(x, y, z); return h; };
  const gnd = (x, z) => natural(x, z);
  // on site from week w0 to week w1
  const on = (obj, w0, w1, info, o = {}) => add(obj, 0, 0, o.how || 'grow', { at: w0, until: w1, d: 0.3, out: 0.4, hot: false, ghost: false, lift: false, site: true, info, ...o });

  // ---------------------------------------------------------------- the tower crane: mast, jib, trolley, hook
  function crane() {
    const h = TOWER.h, L = TOWER.jib, Lc = TOWER.tail, s = 0.8;
    const Y = [], D = [], G = [], GL = [], E = [];
    const P = [[-s, -s], [s, -s], [s, s], [-s, s]];
    for (const [cx, cz] of P) Y.push(bar(V(cx, 0.3, cz), V(cx, h, cz), 0.13));
    for (let y = 0.3; y < h - 0.1; y += 1.6) for (let i = 0; i < 4; i++) {
      const a = P[i], b = P[(i + 1) % 4], y2 = Math.min(h, y + 1.6);
      Y.push(bar(V(a[0], y, a[1]), V(b[0], y, b[1]), 0.06), bar(V(a[0], y, a[1]), V(b[0], y2, b[1]), 0.05));
    }
    const ring = bxg(-1.1, h, -1.1, 1.1, h + 0.7, 1.1), cab = bxg(0.75, h - 1.35, 0.6, 2.35, h + 0.55, 2.1);
    Y.push(ring, cab); E.push(ring, cab);
    GL.push(bxg(2.35, h - 0.75, 0.7, 2.41, h + 0.35, 2.0), bxg(0.95, h - 0.75, 2.1, 2.2, h + 0.35, 2.16));
    // the cross on the ground and its ballast
    D.push(bxg(-2.9, 0, -0.22, 2.9, 0.3, 0.22), bxg(-0.22, 0, -2.9, 0.22, 0.3, 2.9));
    for (const [sx, sz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (let k = 0; k < 2; k++) {
      const b = bxg(sx * 2.0 - 0.75, 0.3 + k * 0.62, sz * 2.0 - 0.75, sx * 2.0 + 0.75, 0.9 + k * 0.62, sz * 2.0 + 0.75); G.push(b); E.push(b);
    }
    const mast = flatten(build({ yellow: Y, dark: D, ballast: G, glass: GL }, E));   // the crane is not a part: four objects that move, each drawn in one go

    // the jib along its own +z, the counter jib along -z
    const J = [], JD = [], JG = [], JE = [], th = 1.4, topY = (u) => th * (1 - (u - 0.9) / (L - 0.9)) + 0.28 * (u - 0.9) / (L - 0.9);
    for (const x of [-0.55, 0.55]) J.push(bar(V(x, 0, 0.9), V(x, 0, L), 0.1), bar(V(x, 0, -0.9), V(x, 0, -Lc), 0.12));
    J.push(bar(V(0, topY(0.9), 0.9), V(0, topY(L - 1), L - 1), 0.09));
    for (let u = 0.9; u < L - 1.6; u += 1.8) {
      const u2 = u + 1.8;
      J.push(bar(V(-0.55, 0, u), V(0.55, 0, u), 0.05), bar(V(-0.55, 0, u), V(0, topY(u2), u2), 0.045), bar(V(0.55, 0, u), V(0, topY(u2), u2), 0.045),
        bar(V(0, topY(u), u), V(-0.55, 0, u2), 0.045), bar(V(0, topY(u), u), V(0.55, 0, u2), 0.045));
    }
    for (let u = -0.9; u > -Lc; u -= 1.5) J.push(bar(V(-0.55, 0, u), V(0.55, 0, u), 0.06));
    for (const sx of [-0.7, 0.7]) for (const sz of [-0.6, 0.6]) J.push(bar(V(sx, 0, sz), V(0, 5, 0), 0.14));
    JD.push(bar(V(0, 5, 0), V(0, topY(L * 0.62), L * 0.62), 0.04), bar(V(0, 5, 0), V(0, 0.1, -Lc + 0.6), 0.04));
    JD.push(bxg(-0.6, -0.06, -Lc, 0.6, 0, -1.0));                                 // walkway of the counter jib
    for (let k = 0; k < 3; k++) { const b = bxg(-0.75, -1.25, -Lc + 0.3 + k * 0.82, 0.75, 0.2, -Lc + 1.02 + k * 0.82); JG.push(b); JE.push(b); }   // counterweights
    const jib = flatten(build({ yellow: J, dark: JD, ballast: JG }, JE));
    const trolley = flatten(build({ dark: [bxg(-0.55, -0.5, -0.5, 0.55, -0.2, 0.5), cyl(0.12, 0.12, 1.2, 0, -0.14, -0.38, 10, 'x'), cyl(0.12, 0.12, 1.2, 0, -0.14, 0.38, 10, 'x')] }));
    const hook = flatten(build({ yellow: [bxg(-0.2, -0.05, -0.14, 0.2, 0.5, 0.14)], dark: [cyl(0.16, 0.16, 0.34, 0, 0.3, 0, 14, 'z'), bxg(-0.04, -0.4, -0.04, 0.04, -0.05, 0.04), bxg(-0.14, -0.46, -0.04, 0.04, -0.38, 0.04)] }));
    return { mast, jib, trolley, hook };
  }

  // ---------------------------------------------------------------- machines
  // a tracked excavator, its arm reaching out along -x
  function excavator() {
    const Y = [], R = [], D = [], G = [], GL = [], E = [];
    for (const z of [-0.98, 0.98]) {
      R.push(bxg(-1.55, 0.1, z - 0.3, 1.55, 0.78, z + 0.3), cyl(0.37, 0.37, 0.6, -1.55, 0.44, z, 14, 'z'), cyl(0.37, 0.37, 0.6, 1.55, 0.44, z, 14, 'z'));
      for (const x of [-1.05, -0.35, 0.35, 1.05]) G.push(cyl(0.13, 0.13, 0.64, x, 0.2, z, 10, 'z'));
    }
    D.push(bxg(-1.1, 0.45, -0.7, 1.1, 0.82, 0.7), cyl(0.78, 0.78, 0.18, 0, 0.91, 0, 20), bxg(2.3, 1.02, -1.28, 2.8, 1.95, 1.28));
    const deck = bxg(-1.0, 1.0, -1.28, 2.3, 1.22, 1.28), hood = bxg(0.55, 1.22, -1.22, 2.3, 2.12, 1.22), cab = bxg(-1.0, 1.22, 0.22, 0.5, 2.8, 1.22);
    Y.push(deck, hood, cab); E.push(deck, hood, cab);
    GL.push(bxg(-1.03, 1.65, 0.3, -0.99, 2.7, 1.14), bxg(-0.9, 1.65, 1.22, 0.4, 2.7, 1.26), bxg(-0.9, 1.65, 0.18, 0.4, 2.7, 0.22));
    D.push(cyl(0.07, 0.07, 0.7, 1.9, 2.45, -0.8, 8));                             // exhaust
    Y.push(bar(V(-0.6, 1.5, -0.4), V(-3.9, 4.3, -0.4), 0.44), bar(V(-3.9, 4.3, -0.4), V(-5.5, 1.5, -0.4), 0.32));
    G.push(bar(V(-0.2, 1.25, -0.4), V(-2.3, 3.35, -0.4), 0.15), bar(V(-3.1, 4.35, -0.4), V(-4.7, 3.3, -0.4), 0.12), bar(V(-4.7, 2.9, -0.4), V(-5.5, 1.6, -0.4), 0.1));
    const bucket = bxg(-6.25, 0.55, -0.85, -5.25, 1.45, 0.05); D.push(bucket); E.push(bucket);
    for (let k = 0; k < 4; k++) G.push(bxg(-6.4, 0.5, -0.78 + k * 0.22, -6.2, 0.62, -0.72 + k * 0.22));   // teeth
    return build({ yellow: Y, rubber: R, dark: D, galv: G, glass: GL }, E);
  }
  // a three-axle truck, front towards +x: tipper, mixer or flatbed
  function truck(kind) {
    const S = { dark: [], rubber: [], white: [], yellow: [], conc: [], galv: [], glass: [], earth: [], lime: [] }, E = [];
    S.dark.push(bxg(-3.7, 0.55, -0.45, 3.4, 0.85, 0.45), bxg(3.45, 0.55, -1.22, 3.72, 1.05, 1.22));
    for (const x of [2.55, -1.55, -2.85]) for (const z of [-1.02, 1.02]) { S.rubber.push(cyl(0.52, 0.52, 0.42, x, 0.52, z, 16, 'z')); S.galv.push(cyl(0.22, 0.22, 0.44, x, 0.52, z, 10, 'z')); }
    const cab = bxg(1.65, 0.85, -1.22, 3.6, 3.0, 1.22); S.white.push(cab); E.push(cab);
    S.glass.push(bxg(3.6, 1.9, -1.08, 3.65, 2.82, 1.08), bxg(2.45, 1.95, 1.22, 3.4, 2.75, 1.26), bxg(2.45, 1.95, -1.26, 3.4, 2.75, -1.22));
    if (kind === 'tipper') {
      const body = bxg(-3.7, 0.95, -1.24, 1.4, 2.4, 1.24); S.yellow.push(body); E.push(body);
      S.earth.push(new THREE.SphereGeometry(1, 16, 8).scale(2.2, 0.55, 1.05).translate(-1.15, 2.35, 0));
    } else if (kind === 'mixer') {
      const turn = (g) => g.rotateZ(Math.PI / 2 - 0.2).translate(-1.0, 2.3, 0);
      S.white.push(turn(mergeGeometries([new THREE.CylinderGeometry(1.15, 1.15, 2.4, 20), new THREE.CylinderGeometry(0.5, 1.15, 1.6, 20).translate(0, 2.0, 0), new THREE.CylinderGeometry(1.15, 0.8, 0.8, 20).translate(0, -1.6, 0)])));
      S.lime.push(turn(new THREE.CylinderGeometry(1.17, 1.17, 0.32, 20)), turn(new THREE.CylinderGeometry(1.03, 0.92, 0.2, 20).translate(0, 1.6, 0)));
      S.galv.push(bxg(-3.75, 2.75, -0.4, -3.2, 3.35, 0.4), bar(V(-3.6, 2.2, 0), V(-4.7, 1.0, 0.5), 0.3));
    } else {
      const bed = bxg(-3.7, 0.9, -1.24, 1.5, 1.08, 1.24); S.dark.push(bed); E.push(bed);
      S.dark.push(bar(V(-3.2, 1.08, 0), V(-3.2, 3.6, 0), 0.1), bar(V(1.0, 1.08, 0), V(1.0, 3.6, 0), 0.1), bar(V(-3.2, 3.6, 0), V(1.0, 3.6, 0), 0.1));
      for (const s of [-1, 1]) for (let k = 0; k < 2; k++) { const p = bxg(-3.4, 1.08, s * (0.14 + k * 0.36), 1.2, 3.5, s * (0.42 + k * 0.36)); S.conc.push(p); E.push(p); }
    }
    return build(S, E);
  }

  // ---------------------------------------------------------------- people: scale figures in helmets and lime vests
  function person(visitor = false) {
    const S = { cloth: [bxg(-0.16, 0, -0.09, -0.02, 0.84, 0.09), bxg(0.02, 0, -0.09, 0.16, 0.84, 0.09)], skin: [new THREE.SphereGeometry(0.11, 12, 8).translate(0, 1.6, 0)] };
    const torso = [bxg(-0.2, 0.84, -0.12, 0.2, 1.44, 0.12), bxg(-0.3, 0.9, -0.07, -0.2, 1.42, 0.07), bxg(0.2, 0.9, -0.07, 0.3, 1.42, 0.07)];
    if (visitor) S.coat = torso;
    else { S.lime = torso; S.white = [new THREE.SphereGeometry(0.135, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2).translate(0, 1.62, 0), bxg(-0.14, 1.6, 0.04, 0.14, 1.63, 0.2)]; }
    return build(S);
  }
  // [x, z, floor height or null for the ground, turn, from week, to week, visitor]
  for (const [x, z, y, ry, w0, w1, vis] of [
    [1.6, 6.2, null, 0.6, 0.3, 1.6], [3.4, 6.6, null, -2.2, 0.5, 1.6],                    // setting out
    [-6.9, -1.4, null, 1.2, 0.7, 36.2],                                                   // the site manager at the office
    [0.2, 2.6, null, 1.9, 1.3, 3.3], [22.6, -5.4, null, -1.6, 1.3, 3.3],                  // watching the dig
    [7.6, -4.6, -3.2, 0.4, 5.7, 7.4], [13.2, 1.4, -3.2, 2.4, 5.7, 7.4],                   // on the slab of the pool level
    [-2.6, -9.2, null, 0.9, 5.9, 24.6],                                                   // the banksman at the crane
    [8.8, -3.0, 0, 1.0, 9.4, 13.0], [13.6, 1.6, 0, -2.0, 9.6, 13.0],                      // on the living level
    [9.6, 1.0, 3.2, 0.5, 13.6, 16.8], [13.0, -5.0, 3.2, 2.6, 13.8, 16.8],                 // on the upper level
    [9.0, 1.4, 6.82, 1.4, 18.2, 20.4], [11.0, -4.6, 7.62, -0.6, 19.4, 21.0],              // on the roofs
    [17.3, -5.4, 0.02, 1.57, 21.2, 24.4], [19.6, -2.6, null, 1.57, 20.6, 22.4],           // glaziers
    [9.0, 5.6, null, 3.1, 22.6, 26.2], [2.6, -3.2, null, -1.57, 22.6, 25.4],              // facade crew
    [20.2, 1.6, -3.14, 1.2, 32.4, 34.6], [23.6, 6.0, null, 2.4, 33.8, 36.2],              // pool builder, gardener
    [1.9, 3.1, 0.03, -0.9, 36.9, 99, true], [2.6, 3.7, 0.03, -1.3, 36.9, 99, true],       // the owners, waiting for their key
  ]) on(put(person(!!vis), x, y ?? gnd(x, z), z, ry), w0, w1, vis ? ['Bauherrschaft', 'Schlüsselübergabe', '2 Personen'] : null, { d: 0.2, out: 0.25 });

  // ---------------------------------------------------------------- the machines come and go
  // the excavator stands in the pit and sinks with its floor (house.js moves it), gone before the slab is poured
  const digger = on(put(flatten(excavator()), 11.6, 0, -2.2, Math.PI * 0.07), 1.0, 4.2, ['Kettenbagger', 'Stahl, 22 t', 'Reichweite 9,50 m · Löffel 1,2 m³'], { live: true, base: V(11.6, 0, -2.2), how: 'show', d: 0.1, out: 0.3 });
  on(put(truck('tipper'), 24.6, gnd(24.6, 0.4) - 0.1, 0.4, Math.PI), 1.2, 3.3, ['Dreiachs-Kipper', 'Stahlmulde, 18 t Nutzlast', '7,40 × 2,50 × 3,00 m']);
  on(put(truck('mixer'), -4.6, 0, -2.4, 0), 3.4, 5.9, ['Fahrmischer', 'Trommel 8 m³, Beton C30/37', '7,40 × 2,50 × 3,60 m']);
  on(put(truck('flatbed'), -4.4, 0, 4.4, 0), 6.1, 16.6, ['Tieflader mit Wandelementen', 'Stahlbeton-Fertigteile auf A-Bock', '7,40 × 2,50 × 3,60 m']);

  // ---------------------------------------------------------------- falsework: telescopic props and timber beams under every slab
  // each field is [x0, x1, z0, z1, floor, soffit, in, out]; the prop lines leave an aisle free on the axis of the sliding doors
  const PROP_ZS = [-7.15, -5.75, -2.05, -0.65, 0.75, 2.15, 3.3];
  for (const [x0, x1, z0, z1, yb, yt, wIn, wOut] of [
    [4.2, 18.0, -1.6, 3.6, -3.2, -0.35, 6.9, 11.0], [5.3, 18.0, -7.6, -1.7, -3.2, -0.35, 7.1, 11.2],
    [4.2, 17.9, -1.6, 3.6, 0.0, 2.85, 10.8, 16.4], [7.1, 19.1, -7.6, -1.7, 0.0, 2.85, 11.0, 16.8],
    [4.2, 16.4, -1.3, 3.6, 3.2, 6.4, 16.2, 20.6], [7.1, 20.2, -7.6, -1.7, 3.2, 7.2, 17.4, 21.2],
  ]) {
    const Y = [], G = [], T = [], zs = PROP_ZS.filter(z => z >= z0 + 0.3 && z <= z1 - 0.3);
    let n = 0;
    for (const z of zs) {
      T.push(bxg(x0, yt - 0.2, z - 0.04, x1, yt, z + 0.04));
      for (let x = x0 + 0.45; x <= x1 - 0.35; x += 1.35) {
        const mid = yb + (yt - 0.2 - yb) * 0.58; n++;
        Y.push(cyl(0.04, 0.04, mid - yb, x, (yb + mid) / 2, z, 8), bxg(x - 0.09, yb, z - 0.09, x + 0.09, yb + 0.02, z + 0.09));
        G.push(cyl(0.028, 0.028, yt - 0.2 - mid, x, (mid + yt - 0.2) / 2, z, 8), bxg(x - 0.08, yt - 0.22, z - 0.08, x + 0.08, yt - 0.2, z + 0.08));
      }
    }
    on(build({ yellow: Y, galv: G, timber: T }), wIn, wOut, ['Deckenstützen mit Jochträgern', 'Stahlrohr, ausziehbar · Holzträger H20', `${n} Stützen · Höhe ${(yt - yb).toFixed(2).replace('.', ',')} m`], { how: 'rise', d: 0.4, out: 0.5 });
  }

  // ---------------------------------------------------------------- scaffold on the three closed sides, lift by lift
  {
    const tube = new THREE.LineBasicMaterial({ color: 0x5F666B, transparent: true, opacity: 0.85 });
    // a run of frames from a to b at the offset line; `axis` is the direction it runs in
    const run = (axis, a, b, t, out, y0, y1) => {
      const pts = [], decks = [], n = Math.max(1, Math.round((b - a) / 2.5)), w = 0.72, P = (u, o, y) => axis === 'x' ? V(u, y, t + out * o) : V(t + out * o, y, u);
      const foot = (u, o) => { const p = P(u, o, 0); return Math.max(y0, natural(p.x, p.z)); };
      for (let i = 0; i <= n; i++) {
        const u = a + (b - a) * i / n;
        for (const o of [0, w]) pts.push(P(u, o, y0 > -50 ? foot(u, o) : 0), P(u, o, y1));
        for (let y = Math.ceil((Math.max(y0, foot(u, w)) + 0.3) / 2) * 2; y <= y1 - 0.5; y += 2) pts.push(P(u, 0, y), P(u, w, y));
      }
      for (let i = 0; i < n; i++) {
        const u0 = a + (b - a) * i / n, u1 = a + (b - a) * (i + 1) / n, base = Math.max(y0, foot((u0 + u1) / 2, w));
        for (let y = Math.ceil((base + 0.3) / 2) * 2; y <= y1 - 0.5; y += 2) {
          pts.push(P(u0, 0, y), P(u1, 0, y), P(u0, w, y), P(u1, w, y), P(u0, w, y + 1.0), P(u1, w, y + 1.0), P(u0, w, y + 0.5), P(u1, w, y + 0.5));
          if ((i + Math.round(y / 2)) % 2 === 0) pts.push(P(u0, w, y), P(u1, w, y + 2 > y1 ? y1 : y + 2));
          const c0 = P(u0, 0.06, y), c1 = P(u1, w - 0.06, y + 0.05);
          decks.push(bxg(c0.x, c0.y, c0.z, c1.x, c1.y, c1.z));
        }
      }
      const g = new THREE.Group();
      g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), tube));
      if (decks.length) { const m = new THREE.Mesh(mergeGeometries(decks), mat(C.teak)); m.castShadow = true; m.receiveShadow = true; g.add(m); }
      return g;
    };
    const lifts = [[-3.6, 3.4, 9.3], [3.4, 7.5, 13.5]];
    const sides = [['x', 4.2, 17.8, 4.25, 1, 26.0, 'Süd'], ['x', 4.2, 17.2, -8.25, -1, 26.3, 'Nord'], ['z', -7.8, -0.2, 3.45, -1, 25.4, 'West'], ['z', 2.6, 3.8, 3.45, -1, 25.4, 'West']];
    for (const [axis, a, b, t, out, wOut, name] of sides) for (const [y0, y1, wIn] of lifts) {
      on(run(axis, a, b, t, out, y0, y1), wIn, wOut + (y0 > 0 ? 0 : 0.3), [`Fassadengerüst ${name}`, 'Stahlrohr, Beläge aus Holz', `${(b - a).toFixed(2).replace('.', ',')} m lang · Lagen alle 2,00 m`], { how: 'rise', d: 0.5, out: 0.5 });
    }
  }

  // ---------------------------------------------------------------- the pit: a guard rail round its rim, a ladder, starter bars with caps
  {
    const pts = [], posts = [], x0 = PIT.x0 - 4.9, x1 = PIT.x1 + 1.2, z0 = PIT.z0 - 4.4, z1 = PIT.z1 + 4.4;
    const leg = (ax, az, bx, bz) => {
      const n = Math.round(Math.hypot(bx - ax, bz - az) / 2);
      for (let i = 0; i < n; i++) {
        const xa = ax + (bx - ax) * i / n, za = az + (bz - az) * i / n, xb = ax + (bx - ax) * (i + 1) / n, zb = az + (bz - az) * (i + 1) / n, ya = gnd(xa, za), yb = gnd(xb, zb);
        posts.push(bxg(xa - 0.03, ya, za - 0.03, xa + 0.03, ya + 1.1, za + 0.03));
        for (const h of [0.55, 1.05]) pts.push(V(xa, ya + h, za), V(xb, yb + h, zb));
      }
    };
    leg(x0, z0, x1, z0); leg(x1, z0, x1, -3.2); leg(x1, 3.2, x1, z1); leg(x1, z1, x0, z1); leg(x0, z1, x0, z0);
    const g = build({ lime: posts });
    g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: C.ink, transparent: true, opacity: 0.6 })));
    on(g, 1.3, 9.6, ['Absturzsicherung', 'Stahlpfosten, zwei Holme', 'Höhe 1,10 m · rund 90 m'], { how: 'rise', d: 0.3 });

    const L = [], top = V(15.8, gnd(15.8, 9.0) + 1.0, 9.0), bot = V(15.8, PIT.y, 5.2), d = top.clone().sub(bot);
    for (const s of [-0.22, 0.22]) L.push(bar(V(bot.x + s, bot.y, bot.z), V(top.x + s, top.y, top.z), 0.05));
    for (let t = 0.08; t < 0.97; t += 0.07) { const p = bot.clone().addScaledVector(d, t); L.push(bxg(p.x - 0.22, p.y - 0.015, p.z - 0.015, p.x + 0.22, p.y + 0.015, p.z + 0.015)); }
    on(build({ galv: L }), 2.9, 8.9, ['Baugrubenleiter', 'Aluminium', `${d.length().toFixed(2).replace('.', ',')} m`], { how: 'rise' });

    // starter bars along the edge of the slab, capped until the walls take them in
    const bars = [], caps = [];
    const sb = (x, z) => { bars.push(bxg(x - 0.012, -3.2, z - 0.012, x + 0.012, -2.3, z + 0.012)); caps.push(bxg(x - 0.035, -2.3, z - 0.035, x + 0.035, -2.24, z + 0.035)); };
    for (let z = -7.8; z <= 3.85; z += 0.45) sb(3.85, z);
    for (let x = 4.4; x <= 18.0; x += 0.45) { sb(x, -7.85); sb(x, 3.85); }
    on(build({ rebar: bars, lime: caps }), 5.5, 6.9, ['Anschlussbewehrung', 'Betonstahl B500, Schutzkappen', 'Ø 12 mm · alle 45 cm'], { how: 'rise', d: 0.3, out: 0.6 });
  }

  // ---------------------------------------------------------------- stores of material on the court
  // precast walls waiting on an A-frame, then the glass on the same spot
  {
    const frame = (S) => { S.dark = [bxg(-1.9, 0, -1.0, 1.9, 0.14, 1.0), bar(V(-1.7, 0.14, 0), V(-1.7, 3.3, 0), 0.1), bar(V(1.7, 0.14, 0), V(1.7, 3.3, 0), 0.1), bar(V(-1.7, 3.3, 0), V(1.7, 3.3, 0), 0.1)]; return S; };
    const E = [], walls = frame({ conc: [] });
    for (const s of [-1, 1]) for (let k = 0; k < 2; k++) { const p = bxg(-1.7, 0.14, s * (0.14 + k * 0.36), 1.7, 3.5, s * (0.44 + k * 0.36)); walls.conc.push(p); E.push(p); }
    on(put(build(walls, E), -0.6, 0, -8.6, 0.25), 5.9, 16.8, ['Wandelemente auf A-Bock', 'Stahlbeton C30/37, Fertigteile', '4 Stück · 3,40 × 3,36 m · d 30 cm']);
    const glass = frame({ glass: [] });
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) glass.glass.push(bxg(-0.75, 0.14, s * (0.12 + k * 0.1), 0.75, 2.9, s * (0.16 + k * 0.1)));
    on(put(build(glass), -0.6, 0, -8.6, 0.25), 20.2, 24.6, ['Glasbock', 'Dreifach-Isolierglas', '6 Scheiben · 1,49 × 2,77 m']);
  }
  {
    // slab strips stacked on timber bearers
    const S = { conc: [], timber: [] }, E = [];
    for (let k = 0; k < 4; k++) { const p = bxg(-3.0, 0.14 + k * 0.26, -1.2, 3.0, 0.3 + k * 0.26, 1.2); S.conc.push(p); E.push(p); for (const x of [-2.2, 0, 2.2]) S.timber.push(bxg(x - 0.06, 0.04 + k * 0.26, -1.2, x + 0.06, 0.14 + k * 0.26, 1.2)); }
    on(put(build(S, E), -4.4, 0, -1.6, 0.06), 7.0, 20.2, ['Deckenplatten, gestapelt', 'Stahlbeton, Fertigteil', '4 Stück · 6,00 × 2,40 m']);
    // reinforcing bars in bundles
    const R = { rebar: [], timber: [bxg(-2.2, 0, -0.5, -2.0, 0.12, 0.5), bxg(2.0, 0, -0.5, 2.2, 0.12, 0.5)] };
    for (let k = 0; k < 14; k++) R.rebar.push(cyl(0.022, 0.022, 6.4, 0, 0.15 + (k % 2) * 0.05, -0.36 + k * 0.055, 6, 'x'));
    on(put(build(R), -4.0, 0, -7.0, 0.04), 2.9, 6.6, ['Betonstahl im Bund', 'B500B, Ø 12 und 16 mm', 'Länge 6,40 m']);
  }
  {
    // the mortar silo, the water tank and the distribution box by the office
    const S = { white: [cyl(1.1, 1.1, 3.4, 0, 4.1, 0, 20), cyl(1.1, 0.22, 1.3, 0, 1.75, 0, 20)], lime: [cyl(1.115, 1.115, 0.4, 0, 4.9, 0, 20)], dark: [cyl(0.5, 0.5, 0.12, 0, 5.86, 0, 14)], galv: [] };
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) S.galv.push(bar(V(sx * 0.95, 0, sz * 0.95), V(sx * 0.78, 2.6, sz * 0.78), 0.09));
    S.galv.push(bar(V(1.14, 0.2, 0), V(1.14, 5.8, 0), 0.05), bar(V(1.14, 0.2, 0.36), V(1.14, 5.8, 0.36), 0.05));
    on(put(build(S), -10.2, 0, -9.4), 3.0, 33.0, ['Mörtelsilo', 'Stahl, 12 m³', 'Ø 2,20 m · Höhe 5,90 m'], { how: 'rise' });
    const T = { white: [bxg(-0.5, 0.16, -0.6, 0.5, 1.16, 0.6)], timber: [bxg(-0.55, 0, -0.65, 0.55, 0.16, 0.65)], galv: [] };
    for (const x of [-0.52, 0, 0.52]) for (const z of [-0.62, 0.62]) T.galv.push(bxg(x - 0.015, 0.16, z - 0.015, x + 0.015, 1.2, z + 0.015));
    for (const y of [0.5, 0.86, 1.2]) T.galv.push(bxg(-0.53, y - 0.015, -0.63, 0.53, y + 0.015, -0.61), bxg(-0.53, y - 0.015, 0.61, 0.53, y + 0.015, 0.63));
    on(put(build(T), -7.4, 0, 3.2), 0.8, 36.0, ['Wassertank', 'Kunststoff im Stahlkäfig', '1 000 Liter']);
    on(put(build({ dark: [bxg(-0.3, 0.5, -0.18, 0.3, 1.4, 0.18), bxg(-0.26, 0, -0.14, -0.2, 0.5, 0.14), bxg(0.2, 0, -0.14, 0.26, 0.5, 0.14)], lime: [bxg(-0.2, 0.9, 0.18, 0.2, 1.2, 0.19)] }), -7.2, 0, 1.2), 0.6, 36.0, ['Baustromverteiler', 'Stahlblech', '63 A']);
    // gravel for the roofs and the garden in big bags
    const B = { white: [], earth: [] };
    for (const [x, z] of [[0, 0], [1.05, 0.1], [0.5, 1.0]]) { B.white.push(bxg(x - 0.45, 0, z - 0.45, x + 0.45, 0.85, z + 0.45)); B.earth.push(bxg(x - 0.4, 0.85, z - 0.4, x + 0.4, 0.93, z + 0.4)); }
    on(put(build(B), 2.2, 0, -11.4), 18.6, 21.0, ['Dachkies in Big Bags', 'Kies 16/32', '3 × 1 m³']);
    on(put(build(B), 22.4, gnd(22.4, 6.4), 6.4), 31.6, 35.6, ['Pflanzsubstrat in Big Bags', 'Erde, Splitt', '3 × 1 m³']);
  }

  // ---------------------------------------------------------------- the site board at the gate, in the colours of the project
  const signCanvas = document.createElement('canvas'); signCanvas.width = 768; signCanvas.height = 512;
  const signTex = new THREE.CanvasTexture(signCanvas); signTex.colorSpace = THREE.SRGBColorSpace; signTex.anisotropy = 8;
  function drawSign() {
    const g = signCanvas.getContext('2d'), w = 768, h = 512;
    g.fillStyle = '#10241a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c4f03e'; g.fillRect(0, 0, 14, h);
    g.textBaseline = 'alphabetic';
    g.font = "400 86px 'BBH Bogle', Arimo, 'Arial Black', sans-serif"; g.fillStyle = '#f1f0e6'; g.fillText('PROJEKT', 54, 150);
    g.fillStyle = '#c4f03e'; g.fillText('STEININGER', 54, 248);
    g.font = "700 30px Arimo, Arial, sans-serif"; g.fillStyle = '#f1f0e6';
    g.fillText('HAUS AM HANG · 38 WOCHEN', 56, 330);
    g.font = "600 25px Arimo, Arial, sans-serif"; g.fillStyle = 'rgba(241,240,230,0.82)';
    g.fillText('START 1. MÄR 2027 · SCHLÜSSEL 19. NOV 2027', 56, 380);
    g.fillText('STAHLBETON · TRAVERTIN · BGF 480 M²', 56, 424);
    g.strokeStyle = '#c4f03e'; g.lineWidth = 3; g.strokeRect(40, 40, w - 80, h - 80);
    signTex.needsUpdate = true;
  }
  drawSign();
  {
    const g = build({ timber: [bxg(-1.5, 0, -0.06, -1.38, 3.5, 0.06), bxg(1.38, 0, -0.06, 1.5, 3.5, 0.06)], dark: [bxg(-1.74, 1.3, -0.04, 1.74, 3.6, 0.02)] });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.24), new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.7 }));
    face.position.set(0, 2.45, 0.03); g.add(face);
    on(put(g, -3.6, 0, 13.1, 0.2), 0.4, 36.6, ['Bauschild', 'Holzpfosten, bedruckte Tafel', '3,40 × 2,24 m'], { how: 'rise' });
  }

  return { crane, drawSign, digger };
}
