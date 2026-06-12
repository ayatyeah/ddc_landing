/**
 * background.js — Three.js 3D-фон DDC NBK
 *
 * Все параметры здания, камеры, этажей, освещения и анимации сосредоточены здесь.
 * Для правки фона редактируйте только этот файл.
 *
 * Зависимость: Three.js r128 через importmap в index.html
 */

import * as THREE from 'three';
// GLTFLoader для r128. Внутри он импортирует bare-спецификатор 'three',
// который резолвится через тот же importmap → один экземпляр three, без конфликтов.
import { GLTFLoader } from 'https://unpkg.com/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';

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
// поэтому даже на пределе видимости всё растворяется в дымке, а не в темноте.
// ── Темы: светлая (день) и тёмная (ночь) ──────────────────────────────────────
// Светлая — текущее светло-синее небо. Тёмная — тёмно-синие оттенки.
const THEMES = {
  light: {
    fog: 0x6fa3d8, fogNear: isMobile ? 120 : 140, fogFar: isMobile ? 320 : 360,
    bg: 0x2f7ec8,
    sky: ['#0a3a85', '#1559b0', '#2f7ec8', '#4f9ad6', '#79b3e2', '#9cc8e8'],
    sun: 0xfff6d8, sunOpacity: 0.85, halo: 0xfff0b8, haloOpacity: 0.18,
    sunLight: 0xfff5d8, sunLightI: 1.35,
    amb: 0xd8e2f0, ambI: lowPower ? 1.15 : 0.85, hemiSky: 0xbcd2ee, hemiGround: 0x40444c, hemiI: 0.85,
  },
  dark: {
    fog: 0x0a1b3a, fogNear: isMobile ? 110 : 130, fogFar: isMobile ? 300 : 340,
    bg: 0x081226,
    sky: ['#02040c', '#04102a', '#0a1f48', '#103060', '#16407e', '#1d4f96'],
    sun: 0xbcd0f0, sunOpacity: 0.5, halo: 0x6f9ad6, haloOpacity: 0.12,
    sunLight: 0x9bb6e0, sunLightI: 0.7,
    amb: 0x2a3a5a, ambI: lowPower ? 0.9 : 0.6, hemiSky: 0x24406e, hemiGround: 0x0a0e18, hemiI: 0.55,
  },
};

scene.fog = new THREE.Fog(THEMES.light.fog, THEMES.light.fogNear, THEMES.light.fogFar);
scene.background = new THREE.Color(THEMES.light.bg);

// ── Sky ───────────────────────────────────────────────────────────────────────
// Текстуру неба перегенерируем при смене темы; ссылки на объекты храним для апдейта.
let skyTex, skyMat, sunMesh, haloMesh, sunDirLight, ambLight, hemiLight;
function makeSkyTexture(stops) {
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 4; skyCanvas.height = 512;
  const ctx = skyCanvas.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  const offs = [0.00, 0.30, 0.55, 0.75, 0.90, 1.00];
  stops.forEach((c, i) => g.addColorStop(offs[i], c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 512);
  const tex = new THREE.CanvasTexture(skyCanvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  return tex;
}
{
  const T = THEMES.light;
  skyTex = makeSkyTexture(T.sky);
  skyMat = new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, depthWrite: false });
  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(180, isMobile ? 16 : 32, isMobile ? 8 : 16),
    skyMat
  ));

  // Солнце / луна
  sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(4.2, 10, 8),
    new THREE.MeshBasicMaterial({ color: T.sun, transparent: true, opacity: T.sunOpacity, depthWrite: false })
  );
  sunMesh.position.set(70, 115, -120);
  scene.add(sunMesh);
  haloMesh = new THREE.Mesh(
    new THREE.SphereGeometry(11, 10, 8),
    new THREE.MeshBasicMaterial({ color: T.halo, transparent: true, opacity: T.haloOpacity, depthWrite: false })
  );
  haloMesh.position.copy(sunMesh.position);
  scene.add(haloMesh);

  sunDirLight = new THREE.DirectionalLight(T.sunLight, T.sunLightI);
  sunDirLight.position.set(70, 115, -120);
  scene.add(sunDirLight);
}

// Переключение темы 3D-сцены (зовётся из script.js)
window.setSceneTheme = function (theme) {
  const T = THEMES[theme] || THEMES.light;
  scene.fog.color.setHex(T.fog);
  scene.fog.near = T.fogNear; scene.fog.far = T.fogFar;
  scene.background.setHex(T.bg);
  if (skyMat) {
    const old = skyMat.map;
    skyMat.map = makeSkyTexture(T.sky);
    skyMat.needsUpdate = true;
    if (old) old.dispose();
  }
  if (sunMesh)  { sunMesh.material.color.setHex(T.sun); sunMesh.material.opacity = T.sunOpacity; }
  if (haloMesh) { haloMesh.material.color.setHex(T.halo); haloMesh.material.opacity = T.haloOpacity; }
  if (sunDirLight) { sunDirLight.color.setHex(T.sunLight); sunDirLight.intensity = T.sunLightI; }
  if (ambLight)  { ambLight.color.setHex(T.amb); ambLight.intensity = T.ambI; }
  if (hemiLight) { hemiLight.color.setHex(T.hemiSky); hemiLight.groundColor.setHex(T.hemiGround); hemiLight.intensity = T.hemiI; }
};

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

// ── Финальный «герой»-стол и влёт камеры в экран ──────────────────────────────
// Камера в конце залетает прямо в экран компьютера на этом столе.
// HERO_RY — поворот стола (тот же, что у офисных столов: налево). Экран смотрит
// в направлении нормали, и камера подлетает к экрану ВДОЛЬ этой нормали.
const HERO_X = -1.3, HERO_Z = -2.5;          // позиция героя-стола (как у офисных)
const HERO_RY = Math.PI + Math.PI / 2;       // ПОВОРОТ СТОЛА налево (как офисные столы)
const SCREEN_Y = OFFY + 1.15;                // высота центра экрана
// В какую сторону смотрит экран GLB-модели при её СОБСТВЕННОМ ry=0.
// Если камера в конце влетает в ЗАДНЮЮ сторону монитора — поменяй это значение
// на Math.PI (развернёт нормаль экрана на 180°), не трогая поворот столов HERO_RY.
const SCREEN_FACING_OFFSET = Math.PI / 2;
const screenRY = HERO_RY + SCREEN_FACING_OFFSET;
// Нормаль экрана (куда он смотрит) в горизонтальной плоскости
const sNX = Math.sin(screenRY), sNZ = Math.cos(screenRY);
// Точка экрана (чуть впереди центра стола вдоль нормали)
const SCREEN_X = HERO_X + sNX * 0.18;
const SCREEN_Z = HERO_Z + sNZ * 0.18;
// Позиции камеры. Камера приходит со стороны экрана — там же стоит кресло.
// Чтобы НЕ пролетать сквозь спинку кресла: заходим высоко и подлетаем почти
// сверху-вперёд, заканчивая ВЫШЕ верха спинки, у самого экрана.
//  - дальняя точка: высоко и подальше (над креслом)
//  - ближняя точка: близко к стеклу и приподнята над спинкой кресла
const farD = 1.7, nearD = 0.62;
const CAM_FAR  = new THREE.Vector3(SCREEN_X + sNX * farD,  SCREEN_Y + 1.05, SCREEN_Z + sNZ * farD);
const CAM_NEAR = new THREE.Vector3(SCREEN_X + sNX * nearD, SCREEN_Y + 0.42, SCREEN_Z + sNZ * nearD);
const SCREEN_TGT = new THREE.Vector3(SCREEN_X, SCREEN_Y, SCREEN_Z);

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
  // 0.90 — подлёт к столу (камера встаёт перед экраном по нормали)
  { t: 0.90, pos: CAM_FAR.clone(),  tgt: SCREEN_TGT.clone() },
  // 1.00 — влёт в экран компьютера (камера почти упирается в монитор)
  { t: 1.00, pos: CAM_NEAR.clone(), tgt: SCREEN_TGT.clone() },
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
  // Нейтральный ковролин/плитка с лёгким шумом — реалистичнее плоского серого
  ctx.fillStyle = '#6f7176';
  ctx.fillRect(0, 0, w, h);
  // мелкий шум-крапинка
  for (let n = 0; n < 1400; n++) {
    const v = 95 + Math.random() * 40;
    ctx.fillStyle = `rgba(${v},${v},${v + 4},0.10)`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
  // швы плитки
  ctx.strokeStyle = 'rgba(60,62,66,0.6)';
  ctx.lineWidth = 2;
  for (let x = 0; x <= w; x += 128) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y <= h; y += 128) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
});
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
floorTex.repeat.set(3, 3);

const ceilTex = mkTex(256, 256, (ctx, w, h) => {
  // Подвесной потолок: светлые панели Armstrong с тонкой сеткой
  ctx.fillStyle = '#eef0f3';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#c4c9d0';
  ctx.lineWidth = 3;
  for (let x = 0; x <= w; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y <= h; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  // лёгкая текстура панелей
  for (let n = 0; n < 600; n++) {
    ctx.fillStyle = 'rgba(200,206,214,0.18)';
    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
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
      color: 0x16314f, roughness: 0.06, metalness: 0.1,
      transmission: 0.62, opacity: 0.9, transparent: true,
      ior: 1.45, reflectivity: 0.7, side: THREE.DoubleSide
    })
  : new THREE.MeshStandardMaterial({  // дешёвое стекло без transmission-пасса
      color: 0x24486e, roughness: 0.14, metalness: 0.55,
      opacity: 0.6, transparent: true, side: THREE.DoubleSide
    });
const frameMat    = new THREE.MeshStandardMaterial({ color: 0x3a4654, roughness: 0.35, metalness: 0.65 });
const wfMat       = new THREE.MeshStandardMaterial({ color: 0x2a3f5c, roughness: 0.25, metalness: 0.7 });
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

// ── Общие геометрии/материалы мебели (создаются ОДИН раз, шарятся на всех этажах) ──
// Производительность: переиспользование geometry+material делает 15 заполненных
// этажей дешёвыми — добавляются только лёгкие Mesh-инстансы, а culling прячет дальние.
const fseg = isMobile ? 6 : 10;
// Геометрии
const G = {
  deskTop:  new THREE.BoxGeometry(1.5, 0.05, 0.75),
  deskLeg:  new THREE.BoxGeometry(0.05, 0.72, 0.05),
  monitor:  new THREE.BoxGeometry(0.6, 0.36, 0.025),
  monStand: new THREE.BoxGeometry(0.18, 0.16, 0.03),
  chairSeat:new THREE.BoxGeometry(0.48, 0.06, 0.48),
  chairBack:new THREE.BoxGeometry(0.46, 0.46, 0.05),
  chairPost:new THREE.CylinderGeometry(0.03, 0.03, 0.38, fseg),
  partition:new THREE.BoxGeometry(0.04, 1.1, 1.4),
  cabinet:  new THREE.BoxGeometry(0.5, 1.1, 0.45),
  rackBody: new THREE.BoxGeometry(0.7, 2.4, 0.9),
  rackFront:new THREE.BoxGeometry(0.62, 2.2, 0.04),
  table:    new THREE.BoxGeometry(2.6, 0.06, 1.1),
  tableLeg: new THREE.BoxGeometry(0.06, 0.72, 0.06),
  sofaBase: new THREE.BoxGeometry(2.0, 0.22, 0.7),
  sofaBack: new THREE.BoxGeometry(2.0, 0.4, 0.14),
  sofaSeat: new THREE.BoxGeometry(2.0, 0.12, 0.7),
  rug:      new THREE.PlaneGeometry(3.0, 2.2),
  plantPot: new THREE.CylinderGeometry(0.13, 0.10, 0.26, fseg),
  plantBush:new THREE.SphereGeometry(0.26, fseg, Math.max(4, fseg - 2)),
  deskScreenTV: new THREE.PlaneGeometry(0.56, 0.32),
  pendant:  new THREE.BoxGeometry(2.2, 0.05, 0.12),
};
// Материалы (нейтральная офисная палитра — реалистичнее, чем яркие цвета)
const M = {
  deskWood:  new THREE.MeshStandardMaterial({ color: 0xb9a98c, roughness: 0.6, metalness: 0.0 }),
  deskWhite: new THREE.MeshStandardMaterial({ color: 0xe8e6e0, roughness: 0.5, metalness: 0.0 }),
  metal:     new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.35, metalness: 0.75 }),
  darkMetal: new THREE.MeshStandardMaterial({ color: 0x2b3038, roughness: 0.4, metalness: 0.7 }),
  chair:     new THREE.MeshStandardMaterial({ color: 0x23262e, roughness: 0.8, metalness: 0.05 }),
  chairAcc:  new THREE.MeshStandardMaterial({ color: 0x35506e, roughness: 0.7, metalness: 0.05 }),
  screenOff: new THREE.MeshStandardMaterial({ color: 0x10141c, roughness: 0.25, metalness: 0.3 }),
  screenOn:  new THREE.MeshStandardMaterial({ color: 0x0a1830, roughness: 0.2, metalness: 0.2, emissive: 0x1f4fa8, emissiveIntensity: 0.5 }),
  partition: new THREE.MeshStandardMaterial({ color: 0xc9cdd4, roughness: 0.85, metalness: 0.0, transparent: true, opacity: 0.55 }),
  cabinet:   new THREE.MeshStandardMaterial({ color: 0xd8d4cc, roughness: 0.7, metalness: 0.05 }),
  rack:      new THREE.MeshStandardMaterial({ color: 0x191c22, roughness: 0.5, metalness: 0.5 }),
  rackLED:   new THREE.MeshStandardMaterial({ color: 0x0c2a18, roughness: 0.4, emissive: 0x18c060, emissiveIntensity: 0.7 }),
  sofa:      new THREE.MeshStandardMaterial({ color: 0x2a3445, roughness: 0.9, metalness: 0.02 }),
  sofaSeat:  new THREE.MeshStandardMaterial({ color: 0x394760, roughness: 0.88, metalness: 0.02 }),
  rug:       new THREE.MeshStandardMaterial({ color: 0x2f3a52, roughness: 1.0 }),
  plantPot:  new THREE.MeshStandardMaterial({ color: 0x6a4a32, roughness: 0.85 }),
  plant:     new THREE.MeshStandardMaterial({ color: 0x356b32, roughness: 0.9 }),
  pendant:   new THREE.MeshStandardMaterial({ color: 0xd0d4dc, roughness: 0.5, metalness: 0.3 }),
  pendantLED:new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4e0, emissiveIntensity: 1.0, roughness: 1 }),
};

// Помощник: добавить mesh из общей геометрии/материала
function put(g, geo, mat, x, y, z, ry) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (ry) m.rotation.y = ry;
  g.add(m);
  return m;
}

// ── Рабочие места из GLB-модели (computer_table_setup.glb в корне проекта) ─────
// GLB грузится асинхронно один раз. Пока он не загружен, addDesk только
// РЕГИСТРИРУЕТ слот (куда поставить стол). После загрузки модель клонируется
// во все слоты (клон шарит геометрию/материалы — это дёшево). Если загрузка
// не удалась — ставим процедурный стол-заглушку, чтобы этажи не были пустыми.
const deskSlots = [];               // { group, x, z, ry, lit }
let deskTemplate = null;            // нормализованная модель (масштаб/центровка)
let deskLoadDone = false;
let deskLoadFailed = false;

function addDesk(g, x, z, ry, lit) {
  deskSlots.push({ group: g, x, z, ry: ry || 0, lit: !!lit });
  // Если модель уже готова — ставим сразу; иначе слот обработается после загрузки
  if (deskLoadDone) placeDesk(deskSlots[deskSlots.length - 1]);
}

// Процедурный стол-заглушка (старый вариант) — на случай ошибки загрузки GLB
function addDeskFallback({ group: g, x, z, ry, lit }) {
  const c = Math.cos(ry), s = Math.sin(ry);
  const tx = (dx, dz) => x + dx * c - dz * s;
  const tz = (dx, dz) => z + dx * s + dz * c;
  put(g, G.deskTop, M.deskWood, x, 0.74, z, ry);
  put(g, G.deskLeg, M.metal, tx(-0.65, 0.3), 0.36, tz(-0.65, 0.3), ry);
  put(g, G.deskLeg, M.metal, tx( 0.65, 0.3), 0.36, tz( 0.65, 0.3), ry);
  put(g, G.deskLeg, M.metal, tx(-0.65,-0.3), 0.36, tz(-0.65,-0.3), ry);
  put(g, G.deskLeg, M.metal, tx( 0.65,-0.3), 0.36, tz( 0.65,-0.3), ry);
  put(g, G.monStand, M.darkMetal, tx(0, -0.22), 0.86, tz(0, -0.22), ry);
  put(g, G.monitor, lit ? M.screenOn : M.screenOff, tx(0, -0.28), 1.12, tz(0, -0.28), ry);
  put(g, G.chairSeat, M.chair, tx(0, 0.55), 0.50, tz(0, 0.55), ry);
  put(g, G.chairBack, M.chairAcc, tx(0, 0.78), 0.78, tz(0, 0.78), ry);
  put(g, G.chairPost, M.metal, tx(0, 0.55), 0.27, tz(0, 0.55), ry);
}

// Поставить один стол (клон GLB) в слот
function placeDesk(slot) {
  if (deskLoadFailed || !deskTemplate) { addDeskFallback(slot); return; }
  const inst = deskTemplate.clone(true);
  inst.position.set(slot.x, 0, slot.z);
  inst.rotation.y = slot.ry;
  slot.group.add(inst);
}

// Загрузка GLB один раз
(function loadDeskModel() {
  const loader = new GLTFLoader();
  loader.load(
    'computer_table_setup.glb',
    (gltf) => {
      const model = gltf.scene;
      // Нормализуем: масштаб к ширине ~1.6, центр по X/Z, низ на пол (y=0)
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3(); box.getSize(size);
      const center = new THREE.Vector3(); box.getCenter(center);
      const targetW = 1.7;
      const scale = targetW / Math.max(size.x, 0.0001);
      // Обёртка, чтобы применить центровку и масштаб одним объектом
      const wrap = new THREE.Group();
      model.position.set(-center.x, -box.min.y, -center.z); // центр X/Z, низ на 0
      wrap.add(model);
      wrap.scale.setScalar(scale);
      // Тени по возможности + страховка материалов: сильно металлические материалы
      // без env-карты выглядят чёрными, поэтому слегка снижаем metalness.
      model.traverse(o => {
        if (o.isMesh) {
          if (HQ) { o.castShadow = true; o.receiveShadow = true; }
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach(m => {
            if (m && m.metalness !== undefined && m.metalness > 0.7 && !m.envMap) {
              m.metalness = 0.5;
              if (m.roughness !== undefined && m.roughness < 0.2) m.roughness = 0.35;
            }
          });
        }
      });
      deskTemplate = wrap;
      deskLoadDone = true;
      // Заполняем все накопленные слоты
      deskSlots.forEach(placeDesk);
    },
    undefined,
    (err) => {
      console.warn('GLB не загрузился, ставим процедурные столы:', err);
      deskLoadFailed = true;
      deskLoadDone = true;
      deskSlots.forEach(addDeskFallback);
    }
  );
})();

function addPlant(g, x, z) {
  put(g, G.plantPot, M.plantPot, x, 0.13, z);
  put(g, G.plantBush, M.plant, x, 0.42, z);
  put(g, G.plantBush, M.plant, x + 0.12, 0.36, z + 0.06);
}


// ── Наполнение этажа по типу (опенспейс / переговорная / серверная / лобби) ────
// Все объекты — из общих геометрий/материалов. Свет НЕ добавляем пофайлово
// (используем общий ambient/hemisphere) — это ключ к производительности.
function furnishFloor(g, type, i) {
  // Светящаяся «панель» на потолке для каждого типа (дешёвый emissive-меш)
  put(g, G.pendant, M.pendantLED, -1.6, RH - 0.06, -0.6);
  put(g, G.pendant, M.pendantLED,  1.6, RH - 0.06, -0.6);

  if (type === 'open') {
    // Опенспейс: ряды рабочих мест + перегородки + растения
    const rows = isMobile ? 2 : 3;
    const lit = (i % 2 === 0); // часть мониторов «включена»
    for (let r = 0; r < rows; r++) {
      const zr = -2.4 + r * 2.2;
      const dr = Math.PI / 2; // повёрнуты налево
      if (isMobile) {
        addDesk(g, -2.2, zr, dr, lit);
        addDesk(g,  2.2, zr, dr, !lit);
      } else {
        addDesk(g, -3.0, zr, dr, lit);
        addDesk(g,  0.0, zr, dr, lit);
        addDesk(g,  3.0, zr, dr, !lit);
        put(g, G.partition, M.partition, -1.5, 0.55, zr + 1.0);
      }
    }
    addPlant(g, -4.3, 3.0);
    if (!isMobile) addPlant(g, 4.3, -3.0);

  } else if (type === 'meeting') {
    // Переговорная: длинный стол, стулья по бокам, экран на стене, ковёр
    const rug = put(g, G.rug, M.rug, 0, 0.01, 0);
    rug.rotation.x = -Math.PI / 2;
    put(g, G.table, M.deskWhite, 0, 0.74, 0);
    put(g, G.tableLeg, M.metal, -1.1, 0.36, -0.45);
    put(g, G.tableLeg, M.metal,  1.1, 0.36, -0.45);
    put(g, G.tableLeg, M.metal, -1.1, 0.36,  0.45);
    put(g, G.tableLeg, M.metal,  1.1, 0.36,  0.45);
    const chairs = isMobile ? 4 : 6;
    for (let c = 0; c < chairs; c++) {
      const cx = -1.4 + c * (2.8 / (chairs - 1));
      put(g, G.chairSeat, M.chair, cx, 0.50, -0.95);
      put(g, G.chairBack, M.chairAcc, cx, 0.78, -1.15);
      put(g, G.chairSeat, M.chair, cx, 0.50, 0.95);
      put(g, G.chairBack, M.chairAcc, cx, 0.78, 1.15);
    }
    // экран презентации на задней стене
    const scr = put(g, new THREE.PlaneGeometry(2.2, 1.25), M.screenOn, 0, 2.1, -RD / 2 + 0.06);
    addPlant(g, 4.3, 3.0);

  } else if (type === 'server') {
    // Серверная: ряды стоек с зелёными LED, прохладный свет
    const cols = isMobile ? 3 : 5;
    for (let c = 0; c < cols; c++) {
      const cx = -3.6 + c * (7.2 / (cols - 1));
      put(g, G.rackBody, M.rack, cx, 1.2, -1.6);
      put(g, G.rackFront, M.rackLED, cx, 1.2, -1.6 + 0.47);
      put(g, G.rackBody, M.rack, cx, 1.2, 1.6);
      put(g, G.rackFront, M.rackLED, cx, 1.2, 1.6 - 0.47);
    }

  } else if (type === 'lobby') {
    // Лобби/зона отдыха: диваны, журнальный стол, растения, ковёр
    const rug = put(g, G.rug, M.rug, 0, 0.01, 0.4);
    rug.rotation.x = -Math.PI / 2;
    put(g, G.sofaBase, M.sofa, -1.2, 0.11, 1.4, Math.PI / 2);
    put(g, G.sofaSeat, M.sofaSeat, -1.2, 0.28, 1.4, Math.PI / 2);
    put(g, G.sofaBack, M.sofa, -1.55, 0.42, 1.4, Math.PI / 2);
    put(g, G.sofaBase, M.sofa, 1.2, 0.11, 1.4, Math.PI / 2);
    put(g, G.sofaSeat, M.sofaSeat, 1.2, 0.28, 1.4, Math.PI / 2);
    put(g, G.sofaBack, M.sofa, 1.55, 0.42, 1.4, Math.PI / 2);
    put(g, G.table, M.darkMetal, 0, 0.4, 1.4);
    put(g, G.cabinet, M.cabinet, -4.2, 0.55, -3.0);
    put(g, G.cabinet, M.cabinet,  4.2, 0.55, -3.0);
    addPlant(g, -4.3, 2.8);
    addPlant(g,  4.3, 2.8);
    addPlant(g,  0.0, -3.2);
  }
}

// Назначение типа этажу. Этаж 13 — детальный офис (строится отдельно), его пропускаем.
// Этаж 0 — входная зона (лобби). Остальные — вперемежку.
const FLOOR_TYPES = ['lobby', 'open', 'meeting', 'open', 'server', 'open', 'meeting',
                     'open', 'server', 'open', 'meeting', 'open', 'lobby', 'office',
                     'open', 'meeting'];

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
    // На слабых устройствах освещаем только офисный этаж (13) — экономим десятки источников.
    // Споты дорогие → на слабых используем дешёвые point-light'ы.
    if (!lowPower || i === 13) {
      let pl;
      if (i === 13) {
        pl = lowPower
          ? new THREE.PointLight(0xfff5d0, 1.1, 9)
          : new THREE.SpotLight(0xfff5d0, 5.0, 10, Math.PI / 2.5, 0.5, 1.2);
      } else {
        pl = new THREE.PointLight(0xfff5d0, 1.5, 8);
      }
      pl.position.set(lx, RH - 0.12, lz);
      if (pl.target) { pl.target.position.set(lx, 0, lz); g.add(pl.target); }
      pl.castShadow = (HQ && i === 0);
      g.add(pl);
    }
  });

  // Часы (на офисном этаже №13 не ставим — их перекрывает доска)
  if (i !== 13) {
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
  }

  // Наполнение интерьера по типу этажа (кроме офиса №13 — он строится отдельно)
  const ftype = FLOOR_TYPES[i] || 'open';
  if (ftype !== 'office') {
    const furn = new THREE.Group();
    furnishFloor(furn, ftype, i);
    g.add(furn);
    g.userData.furniture = furn; // для отдельного culling по дистанции
  }

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

  // Рабочие места (GLB-модель через addDesk). Повёрнуты налево (HERO_RY).
  // Средний стол (dx = HERO_X) — «герой», в его экран влетает камера в конце.
  [-3.8, HERO_X, 1.2].forEach(dx => {
    addDesk(g, dx, HERO_Z, HERO_RY, true);
  });

  // Угол менеджера — теперь тоже GLB-стол (старый процедурный убран)
  addDesk(g, -3.3, 1.5, HERO_RY, true);

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
    // Мягкая подсветка доски — только на мощных (на мобиле экономим источники)
    if (HQ) {
      const bl = new THREE.PointLight(0xeaf2ff, 0.5, 4.5);
      bl.position.set(x, wbY + 0.3, wbZ + 1.2);
      g.add(bl);
    }
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
    if (HQ) {
      const tvLight = new THREE.PointLight(0x1840c0, 1.2, 4.5);
      tvLight.position.set(RW / 2 - 1.2, tvY, tvZ);
      g.add(tvLight);
    }
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
  // Реальные источники света офиса.
  // Споты дорогие, поэтому на слабых устройствах их НЕ ставим вообще —
  // освещение даёт point-светильник-заливка ниже + общий ambient/hemisphere.
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
    // Споты только на мощных устройствах (HQ), и лишь часть из них
    if (HQ && (idx === 0 || idx === 2 || idx === 4)) {
      const pl = new THREE.SpotLight(0xfff8e8, 3.8, 11, Math.PI / 2.3, 0.55, 1.2);
      pl.position.set(lx, ly - 0.05, lz);
      pl.target.position.set(lx, 0, lz);
      g.add(pl);
      g.add(pl.target);
    }
  });
  // Заливающий свет офиса на слабых устройствах (вместо спотов)
  if (lowPower) {
    const fill = new THREE.PointLight(0xfff4e0, 1.6, 18);
    fill.position.set(0, RH - 0.4, -0.3);
    g.add(fill);
  }

  scene.add(g);
})();

// ── Освещение ─────────────────────────────────────────────────────────────────
// Базовый свет повышен: интерьеры всех этажей теперь обставлены, но БЕЗ
// пофайловых источников (ради fps), поэтому полагаемся на ambient+hemisphere.
ambLight = new THREE.AmbientLight(THEMES.light.amb, THEMES.light.ambI);
scene.add(ambLight);
hemiLight = new THREE.HemisphereLight(THEMES.light.hemiSky, THEMES.light.hemiGround, THEMES.light.hemiI);
scene.add(hemiLight);

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
  // Экран монитора как цель для наложения формы. w/h — размер «стекла» экрана в
  // метрах сцены; подгони под видимый экран GLB. Аспект ~ под форму (≈1.16:1),
  // чтобы контактная форма заполняла экран целиком. rx/rz — правый вектор экрана.
  monitor:  { x: SCREEN_X, y: SCREEN_Y, z: SCREEN_Z, w: 0.62, h: 0.53, rx: sNZ, rz: -sNX },
};

// ── Frustum culling по этажам ─────────────────────────────────────────────────
// Раньше дистанция была мала (26) и на общем плане половина башни исчезала —
// выглядело как «чернеющий фон». Теперь радиус покрывает всю башню (высота ~64),
// а геометрия этажей дешёвая (боксы/плоскости), дорогое (свет/стекло/облака) уже урезано.
function updateFloorVisibility() {
  const camY = camera.position.y;
  const reach = isMobile ? 80 : 90;
  // Мебель видна только вблизи. На мобиле — практически только текущий этаж
  // (этажи кратны RH=4, поэтому порог 5 оставляет 1 этаж), чтобы в офисе не
  // рендерились ещё и соседние обставленные этажи — это и давало лаги.
  const furnReach = isMobile ? 5 : 22;
  floorGroups.forEach((grp, i) => {
    const dist = Math.abs(i * RH - camY);
    grp.visible = dist < reach;
    if (grp.userData.furniture) grp.userData.furniture.visible = dist < furnReach;
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
// Resize: на мобиле скрытие/появление адресной строки постоянно дёргает resize
// (меняется только высота) → если каждый раз делать setSize, это вызывает
// переаллокацию буфера, артефакты и просадки. Поэтому реагируем только на
// заметные изменения и с дебаунсом.
let lastW = window.innerWidth, lastH = window.innerHeight, resizeTimer = null;
function doResize() {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  lastW = w; lastH = h;
}
window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  // Игнорируем мелкие изменения высоты от URL-бара (ширина та же, dH небольшой)
  if (w === lastW && Math.abs(h - lastH) < 120) {
    // только обновим аспект без переаллокации буфера (дёшево)
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    lastH = h;
    return;
  }
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(doResize, 150);
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
      // Ширина откладывается вдоль правого вектора экрана (rx,0,rz), если задан
      // (для повёрнутого монитора), иначе вдоль мировой оси X (для досок).
      const rx = (tgt.rx !== undefined) ? tgt.rx : 1;
      const rz = (tgt.rz !== undefined) ? tgt.rz : 0;
      const rt = project(tgt.x + rx * tgt.w / 2, tgt.y, tgt.z + rz * tgt.w / 2);
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
