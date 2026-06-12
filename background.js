/**
 * background.js — Three.js 3D-фон DDC NBK
 *
 * Все параметры здания, камеры, этажей, освещения и анимации сосредоточены здесь.
 * Для правки фона редактируйте только этот файл.
 *
 * Зависимость: Three.js r128 через importmap в index.html
 */

import * as THREE from 'three';

// ── Определение устройства и уровня производительности ────────────────────────
const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth < 768;
// «Слабое» устройство: мало ядер или мало памяти (ноутбуки с интегрированной графикой)
const lowPower = isMobile
  || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
  || (navigator.deviceMemory && navigator.deviceMemory <= 4);
// Глобальный флаг качества — используется ниже для теней, стекла, света, дальности
const HQ = !lowPower; // high quality

// ── Renderer ──────────────────────────────────────────────────────────────────
// Антиалиасинг включаем И на мобиле — иначе «лесенки» на гранях зданий.
// MSAA на телефоне дороже, но сцена статичная по геометрии, поэтому терпимо.
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
// Пиксель-рейтио: на мобиле поднимаем до 1.5 (резкость текста/граней), но не выше,
// чтобы не плодить пиксели на плотных экранах. Это баланс «гладко, но не лагает».
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : (lowPower ? 1.25 : 1.75)));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = HQ;              // тени только на мощных
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
document.getElementById('canvas-wrap').appendChild(renderer.domElement);

// ── Scene ─────────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
// Туман отодвинут далеко, чтобы фон НЕ чернел. Цвет = цвет неба у горизонта,
// поэтому даже на пределе видимости всё растворяется в светлой дымке, а не в темноте.
scene.fog = new THREE.Fog(0xbcd6ea, isMobile ? 120 : 140, isMobile ? 320 : 360);
// Фоновый цвет сцены = небо у горизонта: гарантирует, что фон никогда не чёрный
scene.background = new THREE.Color(0x9cc8e8);

// ── Sky (дневное небо) ────────────────────────────────────────────────────────
{
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 4;
  skyCanvas.height = 512;
  const ctx = skyCanvas.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  // Сверху — насыщенная синева, у горизонта — светлая дымка (реалистичный день)
  g.addColorStop(0.00, '#1f5fb0');
  g.addColorStop(0.30, '#2f7ec8');
  g.addColorStop(0.55, '#5aa3da');
  g.addColorStop(0.75, '#9cc8e8');
  g.addColorStop(0.90, '#cfe4f2');
  g.addColorStop(1.00, '#e8f2f8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 512);
  const skyTex = new THREE.CanvasTexture(skyCanvas);
  skyTex.mapping = THREE.EquirectangularReflectionMapping;
  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(180, isMobile ? 16 : 32, isMobile ? 8 : 16),
    new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, depthWrite: false })
  ));

  // Солнце — ярче, тёплое
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(4.2, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xfff6d8, transparent: true, opacity: 0.85, depthWrite: false })
  );
  sun.position.set(70, 115, -120);
  scene.add(sun);
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(11, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xfff0b8, transparent: true, opacity: 0.18, depthWrite: false })
  );
  halo.position.copy(sun.position);
  scene.add(halo);

  const sunLight = new THREE.DirectionalLight(0xfff5d8, 1.35);
  sunLight.position.set(70, 115, -120);
  scene.add(sunLight);
}

// ── Облака (объёмные «клубы дыма» из мягких спрайтов) ─────────────────────────
// На мобиле облака ОТКЛЮЧЕНЫ полностью: прозрачные спрайты дают сильный overdraw,
// что было главной причиной лагов на телефоне. Небо остаётся чистым и светлым.
const cloudSprites = []; // для дрейфа в render loop
if (!isMobile) {
  // Мягкая текстура одного клуба: радиальный градиент с рваным краем
  function makePuffTexture() {
    const S = 128;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const cx = c.getContext('2d');
    // База — мягкий радиальный градиент
    const grd = cx.createRadialGradient(S/2, S/2, S*0.05, S/2, S/2, S*0.5);
    grd.addColorStop(0.0, 'rgba(255,255,255,0.95)');
    grd.addColorStop(0.45, 'rgba(255,255,255,0.75)');
    grd.addColorStop(0.75, 'rgba(248,250,255,0.35)');
    grd.addColorStop(1.0, 'rgba(248,250,255,0.0)');
    cx.fillStyle = grd;
    cx.fillRect(0, 0, S, S);
    // Накладываем несколько меньших комков для «клубящегося» края
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = (0.18 + Math.random() * 0.28) * S;
      const px = S/2 + Math.cos(a) * r * 0.6;
      const py = S/2 + Math.sin(a) * r * 0.5;
      const rad = (0.10 + Math.random() * 0.16) * S;
      const lg = cx.createRadialGradient(px, py, 1, px, py, rad);
      lg.addColorStop(0, 'rgba(255,255,255,0.55)');
      lg.addColorStop(1, 'rgba(255,255,255,0.0)');
      cx.fillStyle = lg;
      cx.beginPath();
      cx.arc(px, py, rad, 0, Math.PI * 2);
      cx.fill();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }

  const puffTex = makePuffTexture();
  // Затенённый вариант (низ облака чуть темнее — добавляет объём)
  const cloudMatLight = new THREE.SpriteMaterial({ map: puffTex, color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false });
  const cloudMatShade = new THREE.SpriteMaterial({ map: puffTex, color: 0xc4d2e0, transparent: true, opacity: 0.85, depthWrite: false });

  // Один «облако» = кластер из нескольких спрайтов-клубов
  function makeCloud(cx, cy, cz, scale) {
    const group = new THREE.Group();
    const puffs = isMobile ? 4 : 6;
    for (let i = 0; i < puffs; i++) {
      const shaded = i < 2; // пара нижних клубов затенена
      const s = new THREE.Sprite(shaded ? cloudMatShade : cloudMatLight);
      const ox = (Math.random() - 0.5) * scale * 1.8;
      const oy = (Math.random() - 0.5) * scale * 0.5 - (shaded ? scale * 0.18 : 0);
      const oz = (Math.random() - 0.5) * scale * 0.8;
      const ps = scale * (0.7 + Math.random() * 0.7);
      s.position.set(ox, oy, oz);
      s.scale.set(ps, ps, 1);
      group.add(s);
    }
    group.position.set(cx, cy, cz);
    scene.add(group);
    cloudSprites.push({ grp: group, speed: 0.004 + Math.random() * 0.006, resetX: 200 });
    return group;
  }

  // Раскидываем облака кольцом вокруг здания, на разной высоте/глубине.
  // На слабых устройствах — меньше облаков.
  const COUNT = lowPower ? 7 : 14;
  for (let i = 0; i < COUNT; i++) {
    const ang = (i / COUNT) * Math.PI * 2 + Math.random() * 0.4;
    const rad = 90 + Math.random() * 50;
    const cx = Math.cos(ang) * rad;
    const cz = Math.sin(ang) * rad - 30;
    const cy = 40 + Math.random() * 80;
    const scale = 14 + Math.random() * 16;
    makeCloud(cx, cy, cz, scale);
  }
}



// ── Camera ────────────────────────────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, isMobile ? 180 : 350);

// ── Keyframes (scroll-driven camera path) ─────────────────────────────────────
// Путь: фасад здания → влёт в офис → панорама вдоль 3 досок → монитор на столе.
// Офис на этаже 13: мировой Y центра досок ≈ 13*RH + 2.25 = 54.25.
// Доски на задней стене (мир Z ≈ -3.94), камера смотрит из глубины комнаты в -Z.
const OFFY = 13 * 4; // 52
const BOARD_Y = OFFY + 2.25;   // 54.25
const WALL_Z = -3.94;
const CAM_Z  = -0.55;          // камера внутри комнаты перед стеной
const keyframes = [
  // 0.00 — фасад здания (приближено)
  { t: 0.00, pos: new THREE.Vector3(24, 55, 33),            tgt: new THREE.Vector3(2, 52, 0) },
  // 0.12 — приближение к фасаду этажа
  { t: 0.12, pos: new THREE.Vector3(14, 55, 26),            tgt: new THREE.Vector3(0, 54, 0) },
  // 0.22 — влёт внутрь, разворот к задней стене
  { t: 0.22, pos: new THREE.Vector3(0, BOARD_Y, 2.6),       tgt: new THREE.Vector3(0, BOARD_Y, WALL_Z) },
  // 0.32 — ЛЕВАЯ доска «УСЛУГИ» (x = -3.15)
  { t: 0.32, pos: new THREE.Vector3(-3.15, BOARD_Y, CAM_Z), tgt: new THREE.Vector3(-3.15, BOARD_Y, WALL_Z) },
  { t: 0.42, pos: new THREE.Vector3(-3.15, BOARD_Y, CAM_Z), tgt: new THREE.Vector3(-3.15, BOARD_Y, WALL_Z) },
  // 0.52 — ЦЕНТРАЛЬНАЯ доска «О НАС» (x = 0.20)
  { t: 0.52, pos: new THREE.Vector3(0.20, BOARD_Y, CAM_Z),  tgt: new THREE.Vector3(0.20, BOARD_Y, WALL_Z) },
  { t: 0.62, pos: new THREE.Vector3(0.20, BOARD_Y, CAM_Z),  tgt: new THREE.Vector3(0.20, BOARD_Y, WALL_Z) },
  // 0.72 — ПРАВАЯ доска «НОВОСТИ» (x = 3.50)
  { t: 0.72, pos: new THREE.Vector3(3.50, BOARD_Y, CAM_Z),  tgt: new THREE.Vector3(3.50, BOARD_Y, WALL_Z) },
  { t: 0.82, pos: new THREE.Vector3(3.50, BOARD_Y, CAM_Z),  tgt: new THREE.Vector3(3.50, BOARD_Y, WALL_Z) },
  // 0.90 — переход к рабочему столу
  { t: 0.90, pos: new THREE.Vector3(-1.3, OFFY + 2.0, -0.4), tgt: new THREE.Vector3(-1.3, OFFY + 1.3, -2.8) },
  // 1.00 — монитор на столе (контактная форма)
  { t: 1.00, pos: new THREE.Vector3(-1.3, OFFY + 1.55, -1.4), tgt: new THREE.Vector3(-1.3, OFFY + 1.18, -2.82) },
];

function getKeyframedCamera(p) {
  p = Math.max(0, Math.min(1, p));
  const last = keyframes[keyframes.length - 1];
  if (p >= last.t) return { pos: last.pos.clone(), tgt: last.tgt.clone() };
  let k0 = keyframes[0], k1 = keyframes[1];
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (p >= keyframes[i].t && p <= keyframes[i + 1].t) { k0 = keyframes[i]; k1 = keyframes[i + 1]; break; }
  }
  const span = k1.t - k0.t, local = span < 0.001 ? 1 : (p - k0.t) / span;
  const e = local * local * (3 - 2 * local); // smoothstep
  return {
    pos: new THREE.Vector3().lerpVectors(k0.pos, k1.pos, e),
    tgt: new THREE.Vector3().lerpVectors(k0.tgt, k1.tgt, e)
  };
}

const camPos = keyframes[0].pos.clone();
const camTgt = keyframes[0].tgt.clone();

// scrollProgress обновляется из script.js через window.scrollProgress
window.scrollProgress = 0;

// ── Canvas texture helper ─────────────────────────────────────────────────────
function mkTex(w, h, fn) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  fn(ctx, w, h);
  return new THREE.CanvasTexture(c);
}

// ── Общие текстуры ────────────────────────────────────────────────────────────
const floorTex = mkTex(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#787878';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#585858';
  ctx.lineWidth = 2;
  for (let x = 0; x <= w; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y <= h; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
});
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
floorTex.repeat.set(4, 4);

const ceilTex = mkTex(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#dce0e8';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#b0b8c4';
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y <= h; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
});
ceilTex.wrapS = ceilTex.wrapT = THREE.RepeatWrapping;
ceilTex.repeat.set(4, 3);

// ── Общие геометрии (reused across floors) ────────────────────────────────────
const geoFloor   = new THREE.PlaneGeometry(10, 8);
const geoCeil    = new THREE.PlaneGeometry(10.2, 8.2);
const geoPillar  = new THREE.BoxGeometry(0.15, 4, 0.15);
const geoLampHsg = new THREE.BoxGeometry(0.25, 0.07, 1.4);
const geoLampDiff= new THREE.BoxGeometry(0.2, 0.025, 1.3);
const geoRailH   = new THREE.BoxGeometry(10, 0.06, 0.05);

// ── Общие материалы ───────────────────────────────────────────────────────────
const matFloor    = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.85, metalness: 0 });
const matCeil     = new THREE.MeshStandardMaterial({ map: ceilTex, roughness: 0.9 });
const glassMat = HQ
  ? new THREE.MeshPhysicalMaterial({
      color: 0x0d2a5e, roughness: 0.04, metalness: 0,
      transmission: 0.72, opacity: 0.85, transparent: true,
      ior: 1.5, reflectivity: 0.6, side: THREE.DoubleSide
    })
  : new THREE.MeshStandardMaterial({  // дешёвое стекло без transmission-пасса
      color: 0x12386e, roughness: 0.12, metalness: 0.6,
      opacity: 0.55, transparent: true, side: THREE.DoubleSide
    });
const frameMat    = new THREE.MeshStandardMaterial({ color: 0x223355, roughness: 0.3, metalness: 0.7 });
const wfMat       = new THREE.MeshStandardMaterial({ color: 0x1a3366, roughness: 0.2, metalness: 0.8 });
const closedGlass = HQ
  ? new THREE.MeshPhysicalMaterial({
      color: 0x1a3a6e, roughness: 0.03, metalness: 0,
      transmission: 0.8, opacity: 0.75, transparent: true,
      ior: 1.5, reflectivity: 0.7, side: THREE.DoubleSide
    })
  : new THREE.MeshStandardMaterial({
      color: 0x1c407a, roughness: 0.1, metalness: 0.6,
      opacity: 0.5, transparent: true, side: THREE.DoubleSide
    });
const lampMat     = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff8e0, emissiveIntensity: 1.8, roughness: 1 });
const doorMat     = new THREE.MeshStandardMaterial({ color: 0x1a2a3a, roughness: 0.15, metalness: 0.85 });
const pillarMat   = new THREE.MeshStandardMaterial({ color: 0x1a3366, roughness: 0.2, metalness: 0.8 });
const lampHsgMat  = new THREE.MeshStandardMaterial({ color: 0xc8cdd8, roughness: 0.5, metalness: 0.4 });
const clockFaceMat= new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.8 });
const clockRimMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3, metalness: 0.6 });
const clockHndMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });

// ── Параметры здания ──────────────────────────────────────────────────────────
const RW = 10, RD = 8, RH = 4, FLOORS = 16;

// ── Общие геометрии часов ─────────────────────────────────────────────────────
const geoClkFace = new THREE.CircleGeometry(0.22, isMobile ? 16 : 32);
const geoClkRim  = new THREE.TorusGeometry(0.22, 0.025, 6, isMobile ? 16 : 32);
const geoClkHH   = new THREE.BoxGeometry(0.03, 0.13, 0.02);
const geoClkMH   = new THREE.BoxGeometry(0.018, 0.18, 0.02);

// ── Построение одного этажа ───────────────────────────────────────────────────
const floorGroups = [];

function buildFloor(i) {
  const g = new THREE.Group();
  g.position.y = i * RH;

  const fl = new THREE.Mesh(geoFloor, matFloor);
  fl.rotation.x = -Math.PI / 2;
  fl.receiveShadow = true;
  g.add(fl);

  const ce = new THREE.Mesh(geoCeil, matCeil);
  ce.rotation.x = Math.PI / 2;
  ce.position.y = RH;
  g.add(ce);

  function glassWall(w, h, x, y, z, ry = 0) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassMat);
    m.position.set(x, y, z);
    m.rotation.y = ry;
    g.add(m);
    const bar = (fw, fh, fx, fy, fz) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(fw, fh, 0.05), frameMat);
      b.position.set(fx, fy, fz);
      b.rotation.y = ry;
      g.add(b);
    };
    bar(w, 0.06, x, y + h / 2, z);
    bar(w, 0.06, x, y - h / 2, z);
    const cols = Math.round(w / 1.2);
    for (let c = 0; c <= cols; c++) {
      const xoff = -w / 2 + c * (w / cols);
      if (ry === 0) bar(0.05, h, x + xoff, y, z);
      else bar(0.05, h, x, y, z - xoff);
    }
  }

  glassWall(RD, RH, -RW / 2, RH / 2, 0, Math.PI / 2);
  glassWall(RD, RH,  RW / 2, RH / 2, 0, Math.PI / 2);
  glassWall(RW, RH, 0, RH / 2, -RD / 2, 0);

  if (i === 0) {
    // Первый этаж — двойные двери
    const dW = 1.3, dH = 3.2, gap = 0.04, sideW2 = (RW - dW * 2 - gap) / 2;
    { const m = new THREE.Mesh(new THREE.PlaneGeometry(sideW2, RH), glassMat); m.position.set(-RW / 2 + sideW2 / 2, RH / 2, RD / 2); g.add(m); }
    { const m = new THREE.Mesh(new THREE.PlaneGeometry(sideW2, RH), glassMat); m.position.set( RW / 2 - sideW2 / 2, RH / 2, RD / 2); g.add(m); }
    const abH = RH - dH;
    { const m = new THREE.Mesh(new THREE.PlaneGeometry(dW * 2 + gap + 0.1, abH), glassMat); m.position.set(0, dH + abH / 2, RD / 2); g.add(m); }
    const dfMat = new THREE.MeshStandardMaterial({ color: 0x0d1e38, roughness: 0.15, metalness: 0.9 });
    [
      [dW * 2 + gap + 0.2, 0.08, 0.12, 0, dH, RD / 2],
      [0.08, dH, 0.12, -(dW + gap / 2 + 0.04), dH / 2, RD / 2],
      [0.08, dH, 0.12,  (dW + gap / 2 + 0.04), dH / 2, RD / 2],
      [0.06, dH, 0.10, 0, dH / 2, RD / 2]
    ].forEach(([w, h, d, x, y, z]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), dfMat);
      m.position.set(x, y, z);
      g.add(m);
    });
    const hndMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.1, metalness: 1 });
    [[-1, -(gap / 2 + 0.1)], [1, (gap / 2 + 0.1)]].forEach(([s, hx]) => {
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(dW - 0.04, dH - 0.06, 0.05), doorMat);
      leaf.position.set(s * (dW / 2 + gap / 2 - 0.02), dH / 2, RD / 2);
      g.add(leaf);
      const gl = new THREE.Mesh(new THREE.PlaneGeometry(dW * 0.55, dH * 0.5), closedGlass);
      gl.position.set(s * (dW / 2 + gap / 2 - 0.02), dH * 0.62, RD / 2 + 0.03);
      g.add(gl);
      const hnd = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.04), hndMat);
      hnd.position.set(hx, dH * 0.48, RD / 2 + 0.05);
      g.add(hnd);
    });
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(dW * 2 + gap + 0.3, 0.07, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x2a2e36, roughness: 0.6, metalness: 0.3 })
    );
    step.position.set(0, 0.035, RD / 2 + 0.15);
    g.add(step);
    [RH, 0].forEach(ry => { const b = new THREE.Mesh(geoRailH, frameMat); b.position.set(0, ry, RD / 2); g.add(b); });
  } else {
    // Верхние этажи — окно
    const winW = 2.8, winH = 1.8, winY = 1.8, sideW = (RW - winW) / 2;
    const belowH = winY - winH / 2, aboveY = winY + winH / 2, aboveH = RH - aboveY;
    { const m = new THREE.Mesh(new THREE.PlaneGeometry(sideW, RH), glassMat); m.position.set(-RW / 2 + sideW / 2, RH / 2, RD / 2); g.add(m); }
    { const m = new THREE.Mesh(new THREE.PlaneGeometry(sideW, RH), glassMat); m.position.set( RW / 2 - sideW / 2, RH / 2, RD / 2); g.add(m); }
    { const m = new THREE.Mesh(new THREE.PlaneGeometry(winW, belowH), glassMat); m.position.set(0, belowH / 2, RD / 2); g.add(m); }
    { const m = new THREE.Mesh(new THREE.PlaneGeometry(winW, aboveH), glassMat); m.position.set(0, aboveY + aboveH / 2, RD / 2); g.add(m); }
    const winL = -winW / 2, winTop = winY + winH / 2, winBot = winY - winH / 2;
    [
      [winW + 0.1, 0.06, 0.09, 0,         winTop, RD / 2],
      [winW + 0.1, 0.06, 0.14, 0,         winBot, RD / 2 + 0.04],
      [0.07, winH + 0.06, 0.09, winL - 0.03, winY, RD / 2],
      [0.07, winH + 0.06, 0.09, -winL + 0.03, winY, RD / 2],
      [0.05, winH, 0.06, 0, winY, RD / 2]
    ].forEach(([w, h, d, x, y, z]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wfMat);
      m.position.set(x, y, z);
      g.add(m);
    });
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(winW - 0.08, winH - 0.08), closedGlass);
    gl.position.set(0, winY, RD / 2);
    g.add(gl);
    [RH, 0].forEach(ry => { const b = new THREE.Mesh(geoRailH, frameMat); b.position.set(0, ry, RD / 2); g.add(b); });
  }

  // Колонны
  [[-RW / 2, -RD / 2], [RW / 2, -RD / 2], [RW / 2, RD / 2], [-RW / 2, RD / 2]].forEach(([px, pz]) => {
    const p = new THREE.Mesh(geoPillar, pillarMat);
    p.position.set(px, RH / 2, pz);
    g.add(p);
  });

  // Потолочные светильники (2 на этаж)
  [[-2.2, -1.0], [2.2, -1.0]].forEach(([lx, lz]) => {
    const h2 = new THREE.Mesh(geoLampHsg, lampHsgMat);
    h2.position.set(lx, RH - 0.04, lz);
    g.add(h2);
    const d = new THREE.Mesh(geoLampDiff, lampMat);
    d.position.set(lx, RH - 0.075, lz);
    g.add(d);
    // На слабых устройствах освещаем только офисный этаж (13) — экономим десятки источников
    if (!lowPower || i === 13) {
      const pl = i === 13
        ? new THREE.SpotLight(0xfff5d0, 5.0, 10, Math.PI / 2.5, 0.5, 1.2)
        : new THREE.PointLight(0xfff5d0, 1.5, 8);
      pl.position.set(lx, RH - 0.12, lz);
      if (pl.target) { pl.target.position.set(lx, 0, lz); g.add(pl.target); }
      pl.castShadow = (HQ && i === 0);
      g.add(pl);
    }
  });

  // Часы
  const face = new THREE.Mesh(geoClkFace, clockFaceMat);
  face.position.set(2.8, 3.0, -RD / 2 + 0.04);
  g.add(face);
  const rim = new THREE.Mesh(geoClkRim, clockRimMat);
  rim.position.set(2.8, 3.0, -RD / 2 + 0.05);
  g.add(rim);
  const hh = new THREE.Mesh(geoClkHH, clockHndMat);
  hh.position.set(2.8, 3.07, -RD / 2 + 0.06);
  g.add(hh);
  const mh = new THREE.Mesh(geoClkMH, clockHndMat);
  mh.position.set(2.83, 3.09, -RD / 2 + 0.06);
  mh.rotation.z = -0.5;
  g.add(mh);

  scene.add(g);
  floorGroups.push(g);
}

for (let i = 0; i < FLOORS; i++) buildFloor(i);

// ── Этаж 13: офис NBK ─────────────────────────────────────────────────────────
(function buildNBKOffice() {
  const g = new THREE.Group();
  g.position.y = 13 * RH;

  const mDesk  = new THREE.MeshStandardMaterial({ color: 0xc0aa88, roughness: 0.45, metalness: 0.05 });
  const mDark  = new THREE.MeshStandardMaterial({ color: 0x7a6550, roughness: 0.55, metalness: 0.05 });
  const mLeg   = new THREE.MeshStandardMaterial({ color: 0xb0b0b0, roughness: 0.3, metalness: 0.7 });
  const mChair = new THREE.MeshStandardMaterial({ color: 0x181828, roughness: 0.85, metalness: 0.05 });
  const mChairB= new THREE.MeshStandardMaterial({ color: 0x282840, roughness: 0.8, metalness: 0.05 });
  const mScreen= new THREE.MeshStandardMaterial({
    color: 0x050e1a, roughness: 0.1, metalness: 0.2,
    emissive: 0x1a3fff, emissiveIntensity: 0.35,
    transparent: true, opacity: 0.95
  });
  const mKbd   = new THREE.MeshStandardMaterial({ color: 0xd5d0c8, roughness: 0.8 });
  const mMouse = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.6 });
  const mSofa  = new THREE.MeshStandardMaterial({ color: 0x1e2d45, roughness: 0.9 });
  const mSofaL = new THREE.MeshStandardMaterial({ color: 0x2c3e58, roughness: 0.88 });
  const mBoard = new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.95, emissive: 0xffffff, emissiveIntensity: 0.06 });
  const mBFrame= new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4, metalness: 0.5 });
  const mGold  = new THREE.MeshStandardMaterial({ color: 0xc8960c, roughness: 0.3, metalness: 0.7, emissive: 0x6a4a00, emissiveIntensity: 0.25 });
  const mPlantP= new THREE.MeshStandardMaterial({ color: 0x5c3820, roughness: 0.8 });
  const mPlant = new THREE.MeshStandardMaterial({ color: 0x2a622a, roughness: 0.9, emissive: 0x082008, emissiveIntensity: 0.15 });
  const mCarpet= new THREE.MeshStandardMaterial({ color: 0x1a2e50, roughness: 1.0 });
  const mPart  = new THREE.MeshStandardMaterial({ color: 0xd8d2c8, roughness: 0.9 });
  const mCoffee= new THREE.MeshStandardMaterial({ color: 0x1e1e1e, roughness: 0.3, metalness: 0.6 });
  const mMug   = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.7 });
  const mFridge= new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.25, metalness: 0.6 });

  const bx = (w, h, d, mat, x, y, z, ry = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    if (ry) m.rotation.y = ry;
    g.add(m);
    return m;
  };
  const seg = isMobile ? 8 : 16;
  const cy = (r, h, mat, x, y, z, s = seg) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, Math.min(s, seg)), mat);
    m.position.set(x, y, z);
    g.add(m);
    return m;
  };
  const sp = (r, mat, x, y, z) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 6, 4), mat);
    m.position.set(x, y, z);
    g.add(m);
    return m;
  };

  // Ковёр
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.8), mCarpet); m.rotation.x = -Math.PI / 2; m.position.set(2.8, 0.004, -1.4); g.add(m); }

  // Рабочие места
  [-3.8, -1.3, 1.2].forEach(dx => {
    const dz = -2.8;
    bx(1.8, 0.06, 0.85, mDesk, dx, 0.76, dz);
    bx(1.76, 0.42, 0.04, mDark, dx, 0.55, dz - 0.42);
    bx(0.04, 0.72, 0.83, mDark, dx - 0.9, 0.36, dz);
    bx(0.04, 0.72, 0.83, mDark, dx + 0.9, 0.36, dz);
    bx(0.06, 0.70, 0.06, mLeg, dx - 0.84, 0.35, dz + 0.38);
    bx(0.06, 0.70, 0.06, mLeg, dx + 0.84, 0.35, dz + 0.38);
    bx(0.22, 0.03, 0.18, mLeg, dx, 0.80, dz - 0.08);
    bx(0.03, 0.20, 0.03, mLeg, dx, 0.91, dz - 0.08);
    bx(0.68, 0.40, 0.03, mScreen, dx, 1.22, dz - 0.10);
    bx(0.42, 0.013, 0.16, mKbd, dx - 0.04, 0.765, dz + 0.2);
    bx(0.08, 0.018, 0.12, mMouse, dx + 0.24, 0.770, dz + 0.2);
    bx(0.52, 0.06, 0.50, mChair, dx, 0.50, dz + 0.72);
    bx(0.50, 0.50, 0.05, mChairB, dx, 0.80, dz + 0.97);
    cy(0.035, 0.40, mLeg, dx, 0.22, dz + 0.72);
    bx(0.04, 0.04, 0.44, mLeg, dx - 0.26, 0.60, dz + 0.78);
    bx(0.04, 0.04, 0.44, mLeg, dx + 0.26, 0.60, dz + 0.78);
  });

  // Угол менеджера
  {
    const mx = -3.8, mz = 1.5;
    bx(0.85, 0.06, 1.80, mDesk, mx, 0.76, mz);
    bx(1.20, 0.06, 0.85, mDesk, mx + 1.05, 0.76, mz - 0.55);
    bx(0.04, 0.72, 1.78, mDark, mx - 0.44, 0.36, mz);
    bx(1.16, 0.06, 0.04, mDark, mx + 1.05, 0.36, mz - 0.97);
    bx(0.06, 0.70, 0.06, mLeg, mx - 0.38, 0.35, mz - 0.86);
    bx(0.06, 0.70, 0.06, mLeg, mx - 0.38, 0.35, mz + 0.86);
    bx(0.06, 0.70, 0.06, mLeg, mx + 1.62, 0.35, mz - 0.97);
    bx(0.22, 0.03, 0.18, mLeg, mx + 0.75, 0.80, mz - 0.58);
    bx(0.03, 0.20, 0.03, mLeg, mx + 0.75, 0.91, mz - 0.58);
    bx(0.66, 0.38, 0.03, mScreen, mx + 0.75, 1.20, mz - 0.60);
    bx(0.22, 0.03, 0.18, mLeg, mx + 1.30, 0.80, mz - 0.58);
    bx(0.03, 0.20, 0.03, mLeg, mx + 1.30, 0.91, mz - 0.58);
    bx(0.66, 0.38, 0.03, mScreen, mx + 1.30, 1.20, mz - 0.60);
    bx(0.42, 0.013, 0.16, mKbd, mx + 1.00, 0.765, mz + 0.05);
    bx(0.08, 0.018, 0.12, mMouse, mx + 1.46, 0.770, mz + 0.05);
    bx(0.16, 0.022, 0.11, mCoffee, mx + 0.52, 0.768, mz + 0.05);
    bx(0.30, 0.018, 0.09, mGold, mx + 0.75, 0.768, mz + 0.05);
    bx(0.54, 0.06, 0.52, mChair, mx + 1.00, 0.50, mz + 0.90);
    bx(0.52, 0.52, 0.05, mChairB, mx + 1.00, 0.80, mz + 1.15);
    cy(0.035, 0.40, mLeg, mx + 1.00, 0.22, mz + 0.90);
    bx(0.04, 0.04, 0.44, mLeg, mx + 0.72, 0.60, mz + 0.97);
    bx(0.04, 0.04, 0.44, mLeg, mx + 1.28, 0.60, mz + 0.97);
  }

  // Перегородка
  bx(0.06, 1.50, 1.60, mPart, 0.90, 0.75, 0.40);
  bx(0.06, 0.05, 1.60, mGold, 0.90, 1.54, 0.40);
  bx(0.06, 0.05, 1.60, mGold, 0.90, 0.01, 0.40);

  // Зона отдыха
  {
    const sx = 3.4, sz = -1.5;
    bx(0.55, 0.24, 2.20, mSofa, sx, 0.12, sz);
    bx(0.55, 0.14, 2.20, mSofaL, sx, 0.30, sz);
    bx(0.14, 0.52, 2.20, mSofaL, sx - 0.22, 0.52, sz);
    bx(0.53, 0.44, 0.12, mSofa, sx, 0.22, sz - 1.10);
    bx(0.53, 0.44, 0.12, mSofa, sx, 0.22, sz + 1.10);
    bx(0.56, 0.22, 0.56, mSofa, sx, 0.11, sz + 1.8);
    bx(0.56, 0.14, 0.56, mSofaL, sx, 0.29, sz + 1.8);
    bx(0.14, 0.50, 0.56, mSofaL, sx - 0.22, 0.51, sz + 1.8);
    bx(0.88, 0.035, 0.58, mDesk, sx - 0.85, 0.40, sz);
    cy(0.04, 0.08, mMug, sx - 0.82 - 0.18, 0.44, sz - 0.08, 8);
    bx(0.19, 0.006, 0.13, mKbd, sx - 0.82 + 0.15, 0.42, sz + 0.06);
  }

  // ── Три доски на задней стене (Услуги · О нас · Новости) ────────────────────
  // Доски смотрят в +Z (камера приходит из глубины комнаты и панорамирует вдоль стены).
  function makeBoardLabelTex(title, subtitle, accent) {
    return mkTex(512, 256, (ctx, w, h) => {
      ctx.fillStyle = '#f2f2ee';
      ctx.fillRect(0, 0, w, h);
      ctx.textAlign = 'center';
      ctx.font = 'bold 52px Arial'; ctx.fillStyle = '#0a246a';
      ctx.fillText(title, w / 2, h * 0.40);
      ctx.strokeStyle = accent; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(70, h * 0.55); ctx.lineTo(w - 70, h * 0.55); ctx.stroke();
      ctx.font = '20px Arial'; ctx.fillStyle = '#555';
      ctx.fillText(subtitle, w / 2, h * 0.74);
    });
  }

  // wbZ — плоскость стены; доски слегка перед ней. wbY — высота центра.
  const wbZ = -RD / 2 + 0.06, wbY = 2.25, wbW = 2.7, wbH = 1.55;
  // Подписи на досках по языкам (3D-надписи синхронизируются с переключателем)
  const boardLabels = {
    ru: [['УСЛУГИ', 'Services'], ['О НАС', 'About · Board'], ['НОВОСТИ', 'News']],
    kk: [['ҚЫЗМЕТТЕР', 'Қызметтер'], ['БІЗ ТУРАЛЫ', 'Директорлар кеңесі'], ['ЖАҢАЛЫҚТАР', 'Жаңалықтар']],
    en: [['SERVICES', 'Services'], ['ABOUT US', 'Board of Directors'], ['NEWS', 'Latest news']],
  };
  const boardDefs = [
    { x: -3.15, accent: '#b8800a' },
    { x:  0.20, accent: '#0a246a' },
    { x:  3.50, accent: '#b8800a' },
  ];

  const boardLabelMaterials = []; // для смены языка
  let curLang = 'ru';

  boardDefs.forEach(({ x, accent }, bi) => {
    // Рамка
    bx(wbW + 0.12, 0.06, 0.05, mBFrame, x, wbY + wbH / 2, wbZ);
    bx(wbW + 0.12, 0.06, 0.05, mBFrame, x, wbY - wbH / 2, wbZ);
    bx(0.06, wbH + 0.07, 0.05, mBFrame, x - wbW / 2 - 0.04, wbY, wbZ);
    bx(0.06, wbH + 0.07, 0.05, mBFrame, x + wbW / 2 + 0.04, wbY, wbZ);
    // Полотно доски
    bx(wbW, wbH, 0.025, mBoard, x, wbY, wbZ + 0.01);
    // Полочка снизу
    bx(wbW, 0.04, 0.07, mBFrame, x, wbY - wbH / 2 + 0.02, wbZ + 0.04);
    // Подпись на доске (видна, пока HTML-панель не наложена)
    const [t0, s0] = boardLabels[curLang][bi];
    const lblMat = new THREE.MeshStandardMaterial({
      map: makeBoardLabelTex(t0, s0, accent), roughness: 0.95, emissive: 0xffffff, emissiveIntensity: 0.05
    });
    boardLabelMaterials.push({ mat: lblMat, accent });
    const lbl = new THREE.Mesh(new THREE.PlaneGeometry(wbW - 0.10, wbH - 0.10), lblMat);
    lbl.position.set(x, wbY, wbZ + 0.026);
    g.add(lbl);
    // Маркеры на полочке
    const markerColors = [0xff2200, 0x0044ff, 0x00aa22];
    [-0.5, -0.2, 0.1].forEach((mx, i) =>
      cy(0.022, 0.09,
        new THREE.MeshStandardMaterial({ color: markerColors[i], roughness: 0.5 }),
        x + mx, wbY - wbH / 2 + 0.025, wbZ + 0.06, 6
      )
    );
    // Мягкая подсветка доски
    const bl = new THREE.PointLight(0xeaf2ff, 0.5, 4.5);
    bl.position.set(x, wbY + 0.3, wbZ + 1.2);
    g.add(bl);
  });

  // Переключение языка 3D-надписей на досках (зовётся из script.js)
  window.setBoardLanguage = function (lang) {
    if (!boardLabels[lang]) return;
    curLang = lang;
    boardLabelMaterials.forEach(({ mat, accent }, bi) => {
      const [t, s] = boardLabels[lang][bi];
      if (mat.map) mat.map.dispose();
      mat.map = makeBoardLabelTex(t, s, accent);
      mat.needsUpdate = true;
    });
  };

  // TV Dashboard
  {
    const tvY = 2.2, tvZ = -1.5;
    bx(0.045, 1.20, 2.10,
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.5 }),
      RW / 2 - 0.06, tvY, tvZ
    );
    const tvTex = mkTex(512, 256, (ctx, w, h) => {
      ctx.fillStyle = '#040e20';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(20,60,160,0.22)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= w; i += 48) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
      for (let j = 0; j <= h; j += 36) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(w, j); ctx.stroke(); }
      [[40,180,40,60],[100,165,40,75],[160,172,40,68],[220,150,40,90],[280,158,40,82],[340,142,40,98],[400,160,40,80]]
        .forEach(([x, y, bw, bh]) => {
          ctx.fillStyle = 'rgba(25,100,220,0.55)'; ctx.fillRect(x, y, bw, bh);
          ctx.fillStyle = 'rgba(60,160,255,0.4)'; ctx.fillRect(x, y, bw, 8);
        });
      ctx.fillStyle = 'rgba(255,185,30,0.95)';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('NBK ANALYTICS DASHBOARD', w / 2, 26);
      ctx.font = '12px Arial';
      ctx.fillStyle = 'rgba(160,200,255,0.7)';
      ctx.fillText('Real-time · June 2026', w / 2, 46);
    });
    const tvMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.92, 1.08),
      new THREE.MeshStandardMaterial({ map: tvTex, roughness: 0.04, emissive: 0x1030a0, emissiveIntensity: 0.55 })
    );
    tvMesh.rotation.y = -Math.PI / 2;
    tvMesh.position.set(RW / 2 - 0.065, tvY, tvZ);
    g.add(tvMesh);
    bx(0.22, 0.07, 0.07, mLeg, RW / 2 - 0.22, tvY, tvZ);
    const tvLight = new THREE.PointLight(0x1840c0, 1.2, 4.5);
    tvLight.position.set(RW / 2 - 1.2, tvY, tvZ);
    g.add(tvLight);
  }

  // Кухня (пропускаем на мобиле)
  if (!isMobile) {
    const kx = 3.2, kz = 3.3;
    bx(1.50, 0.84, 0.50, mDark, kx, 0.42, kz);
    bx(1.50, 0.06, 0.50, mDesk, kx, 0.88, kz);
    bx(0.68, 0.76, 0.03, mDesk, kx - 0.38, 0.44, kz + 0.26);
    bx(0.68, 0.76, 0.03, mDesk, kx + 0.38, 0.44, kz + 0.26);
    bx(0.20, 0.26, 0.20, mCoffee, kx - 0.45, 1.02, kz + 0.08);
    [[kx + 0.10], [kx + 0.32], [kx + 0.52]].forEach(([mx]) =>
      cy(0.045, 0.08, mMug, mx, 1.0, kz + 0.07, 8)
    );
    bx(1.50, 0.48, 0.26, mDark, kx, 1.44, kz + 0.12);
    bx(0.44, 1.58, 0.46, mFridge, kx + 1.06, 0.79, kz - 0.02);
  }

  // Растения
  [[-4.5, 0, -3.5], [4.4, 0, -3.5], [-4.5, 0, 3.5], [4.3, 0, 3.0], [0.4, 0, 3.5]].forEach(([px,, pz]) => {
    cy(0.12, 0.24, mPlantP, px, 0.12, pz, 10);
    sp(0.24, mPlant, px, 0.42, pz);
    sp(0.16, mPlant, px + 0.14, 0.36, pz + 0.08);
    sp(0.14, mPlant, px - 0.10, 0.33, pz - 0.10);
  });

  // Доп. светильники (этаж 13). Корпуса дешёвые — оставляем все.
  // Реальные источники: 6 спотов на мощных, 2 спота + заливка на слабых.
  const lampPositions = [
    [-3.2, RH - 0.03, -2.0], [0, RH - 0.03, -2.0], [3.0, RH - 0.03, -2.0],
    [-3.2, RH - 0.03,  1.5], [0, RH - 0.03,  1.5], [3.0, RH - 0.03,  1.5]
  ];
  lampPositions.forEach(([lx, ly, lz], idx) => {
    bx(0.20, 0.045, 1.10,
      new THREE.MeshStandardMaterial({ color: 0xccd0da, roughness: 0.5, metalness: 0.4 }),
      lx, ly, lz
    );
    bx(0.16, 0.020, 1.0, lampMat, lx, ly - 0.034, lz);
    // На слабых ставим спот лишь на 2 светильника (индексы 0 и 4)
    if (HQ || idx === 0 || idx === 4) {
      const pl = new THREE.SpotLight(0xfff8e8, HQ ? 3.8 : 5.5, 11, Math.PI / 2.3, 0.55, 1.2);
      pl.position.set(lx, ly - 0.05, lz);
      pl.target.position.set(lx, 0, lz);
      g.add(pl);
      g.add(pl.target);
    }
  });
  // Заливающий свет офиса на слабых устройствах (компенсирует убранные споты)
  if (lowPower) {
    const fill = new THREE.PointLight(0xfff4e0, 1.4, 16);
    fill.position.set(0, RH - 0.4, 0);
    g.add(fill);
  }

  scene.add(g);
})();

// ── Освещение ─────────────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0x2a3a5a, lowPower ? 1.35 : 0.7));
scene.add(new THREE.HemisphereLight(0x4466aa, 0x111122, 0.5));

// ── Вывески (этажи 14 и 13) ───────────────────────────────────────────────────
function makeSignTex(lines, color) {
  const W = 1024, H = 512;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  const n = lines.length, lineH = H / n, fs = Math.floor(lineH * 0.68);
  ctx.font = `bold ${fs}px "Arial Black",Arial`;
  const maxW = lines.reduce((mx, t) => Math.max(mx, ctx.measureText(t).width), 0);
  const finalFs = Math.floor(fs * Math.min(1, (W - 60) / maxW));
  lines.forEach((txt, i) => {
    ctx.save();
    ctx.font = `bold ${finalFs}px "Arial Black",Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = `rgba(${color},1)`;
    ctx.shadowBlur = 30;
    const tg = ctx.createLinearGradient(W / 2 - W * 0.4, 0, W / 2 + W * 0.4, 0);
    tg.addColorStop(0,   `rgba(${color},0.7)`);
    tg.addColorStop(0.3, '#ffffff');
    tg.addColorStop(0.7, '#ffffff');
    tg.addColorStop(1,   `rgba(${color},0.7)`);
    ctx.fillStyle = tg;
    ctx.fillText(txt, W / 2, (i + 0.5) * lineH);
    ctx.restore();
  });
  return new THREE.CanvasTexture(c);
}

[
  { flY: 14 * RH + RH / 2, lines: ['DIGITAL', 'DEVELOPMENT', 'CENTER'], color: '40,130,255',  h: RH * 0.9,  em: 0x081830, lc: 0x1144ff, li: 1.5 },
  { flY: 13 * RH + RH / 2, lines: ['NATIONAL BANK', 'OF KAZAKHSTAN'],   color: '255,185,30', h: RH * 0.72, em: 0x1a0d00, lc: 0xffaa00, li: 1.2 },
].forEach(({ flY, lines, color, h, em, lc, li }) => {
  const tex = makeSignTex(lines, color);
  const mat = new THREE.MeshStandardMaterial({
    map: tex, transparent: true, opacity: 1,
    emissive: new THREE.Color(em), emissiveIntensity: 0.4,
    roughness: 0.1, metalness: 0,
    side: THREE.FrontSide, depthWrite: false
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(RD * 0.92, h), mat);
  mesh.position.set(RW / 2 + 0.06, flY, 0);
  mesh.rotation.y = Math.PI / 2;
  scene.add(mesh);
  const gl = new THREE.PointLight(lc, li, 9);
  gl.position.set(RW / 2 + 1.5, flY, 0);
  scene.add(gl);
});

// ── Эмиттеры положения досок/монитора для HTML-наложения ──────────────────────
// Публикуем мировые координаты центров и габариты, чтобы script.js проецировал
// их в экранные прямоугольники и точно накладывал HTML-плашки.
window.sceneTargets = {
  services: { x: -3.15, y: BOARD_Y, z: WALL_Z, w: 2.7, h: 1.55 },
  about:    { x:  0.20, y: BOARD_Y, z: WALL_Z, w: 2.7, h: 1.55 },
  news:     { x:  3.50, y: BOARD_Y, z: WALL_Z, w: 2.7, h: 1.55 },
  monitor:  { x: -1.3,  y: OFFY + 1.22, z: -2.90, w: 0.68, h: 0.40 },
};

// ── Frustum culling по этажам ─────────────────────────────────────────────────
// Раньше дистанция была мала (26) и на общем плане половина башни исчезала —
// выглядело как «чернеющий фон». Теперь радиус покрывает всю башню (высота ~64),
// а геометрия этажей дешёвая (боксы/плоскости), дорогое (свет/стекло/облака) уже урезано.
function updateFloorVisibility() {
  const camY = camera.position.y;
  const reach = isMobile ? 80 : 90;
  floorGroups.forEach((grp, i) => {
    const dist = Math.abs(i * RH - camY);
    grp.visible = dist < reach;
  });
}

// ── Emissive pulse — собираем один раз ───────────────────────────────────────
const pulseMeshes = [];
scene.traverse(obj => {
  if (
    obj.isMesh &&
    obj.material.emissiveIntensity !== undefined &&
    obj.material.emissiveIntensity > 0 &&
    obj.material.emissiveIntensity < 0.5
  ) {
    pulseMeshes.push(obj);
  }
});

// ── Resize ────────────────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Инициальная позиция камеры
const cf0 = getKeyframedCamera(0);
camera.position.copy(cf0.pos);
camera.lookAt(cf0.tgt);

// ── Render loop ───────────────────────────────────────────────────────────────
let t = 0;
let pulseFrame = 0;
let prevTime = performance.now();
// Коэффициент сглаживания камеры (1/сек). Чем больше — тем «жёстче» камера
// следует за скроллом. На мобиле выше, чтобы не было «резинового» отставания,
// которое на просадках fps читается как рывки.
const CAM_K = isMobile ? 9 : 6;

function animate() {
  requestAnimationFrame(animate);

  // Дельта времени в секундах (с защитой от скачков после сворачивания вкладки)
  const now = performance.now();
  let dt = (now - prevTime) / 1000;
  prevTime = now;
  if (dt > 0.1) dt = 0.1;       // clamp: после паузы не «телепортируемся»
  if (dt < 0.0001) dt = 0.0001;

  t += dt;

  // Пульсация emissive (на слабых — через кадр)
  pulseFrame++;
  if (!lowPower || pulseFrame % 2 === 0) {
    const v = 0.15 + Math.sin(t * 1.6) * 0.04;
    pulseMeshes.forEach(m => { m.material.emissiveIntensity = v; });
  }

  // Scroll-driven camera — сглаживание, НЕЗАВИСИМОЕ от частоты кадров.
  // alpha = 1 - e^(-k·dt): при любом fps камера движется одинаково плавно.
  const cf = getKeyframedCamera(window.scrollProgress || 0);
  const alpha = 1 - Math.exp(-CAM_K * dt);
  camPos.lerp(cf.pos, alpha);
  camTgt.lerp(cf.tgt, alpha);
  camera.position.copy(camPos);
  camera.lookAt(camTgt);

  // Видимость этажей: на слабых пересчитываем не каждый кадр
  if (!lowPower || pulseFrame % 3 === 0) updateFloorVisibility();

  // Дрейф облаков (медленно плывут по X, зацикливаются)
  for (let i = 0; i < cloudSprites.length; i++) {
    const cl = cloudSprites[i];
    cl.grp.position.x += cl.speed;
    if (cl.grp.position.x > cl.resetX) cl.grp.position.x = -cl.resetX;
  }

  // Проекция досок/монитора в экранные прямоугольники для HTML-наложения.
  // На слабых считаем через кадр (плавности достаточно благодаря lerp камеры).
  if (window.sceneTargets && (!lowPower || pulseFrame % 2 === 0)) {
    const rects = {};
    const halfW = window.innerWidth / 2, halfH = window.innerHeight / 2;
    const project = (x, y, z) => {
      _projV.set(x, y, z).project(camera);
      return { x: _projV.x * halfW + halfW, y: -_projV.y * halfH + halfH, behind: _projV.z > 1 };
    };
    for (const key in window.sceneTargets) {
      const tgt = window.sceneTargets[key];
      const c  = project(tgt.x, tgt.y, tgt.z);
      const rt = project(tgt.x + tgt.w / 2, tgt.y, tgt.z);
      const tp = project(tgt.x, tgt.y + tgt.h / 2, tgt.z);
      rects[key] = {
        cx: c.x, cy: c.y,
        w: Math.abs(rt.x - c.x) * 2,
        h: Math.abs(tp.y - c.y) * 2,
        behind: c.behind
      };
    }
    window.boardRects = rects;
    if (typeof window.onBoardRects === 'function') window.onBoardRects(rects);
  }

  renderer.render(scene, camera);
}

const _projV = new THREE.Vector3();
animate();
