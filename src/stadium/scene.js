// הבסיס של עולם התלת-ממד: רנדרר, סצנה, מצלמה, תאורה וצללים.
// מטפל גם בשינוי גודל החלון ובשחרור זיכרון כשעוזבים את העמוד.
import * as THREE from 'three';
import { COLORS } from './config.js';

export function createScene(container) {
  const isMobile = window.matchMedia('(pointer: coarse)').matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.fog);
  scene.fog = new THREE.Fog(COLORS.fog, 280, 950);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.3, 3000);

  // ---- תאורה ----
  const hemi = new THREE.HemisphereLight('#8f8fe0', '#2b2233', 1.1);

  // האור הראשי מייצג את פנסי האצטדיון, והוא מטיל צללים
  const key = new THREE.DirectionalLight('#fff1dc', 2.0);
  key.position.set(35, 120, 55);
  key.castShadow = true;
  const shadowSize = isMobile ? 1024 : 2048;
  key.shadow.mapSize.set(shadowSize, shadowSize);
  Object.assign(key.shadow.camera, { left: -100, right: 100, top: 90, bottom: -90, near: 20, far: 320 });
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.03;

  const fill = new THREE.DirectionalLight('#c9b8ff', 0.6);
  fill.position.set(-60, 70, -50);

  scene.add(hemi, key, fill);

  const api = {
    renderer,
    scene,
    camera,
    onResize: null,
    render: () => renderer.render(scene, camera),
    dispose,
  };

  function resize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    api.onResize?.(camera.aspect);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  function dispose() {
    observer.disconnect();
    disposeObject(scene);
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  }

  return api;
}

// משחרר מהזיכרון של כרטיס המסך את כל הגיאומטריות, החומרים והטקסטורות
function disposeObject(root) {
  root.traverse((obj) => {
    obj.geometry?.dispose();
    const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [obj.material] : [];
    for (const mat of mats) {
      for (const value of Object.values(mat)) if (value?.isTexture) value.dispose();
      mat.dispose();
    }
  });
}
