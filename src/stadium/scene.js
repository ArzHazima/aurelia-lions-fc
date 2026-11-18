// The foundation of the 3D world: renderer, scene, camera, lights and shadows.
// Also handles window resizing and freeing GPU memory when leaving the page.
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
  scene.fog = new THREE.Fog(COLORS.fog, 450, 1400);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.2, 3000);

  // ---- Lights ----
  const hemi = new THREE.HemisphereLight('#8f8fe0', '#2b2233', 1.1);

  // The key light stands in for the floodlights and casts the shadows
  const key = new THREE.DirectionalLight('#fff1dc', 2.0);
  key.position.set(60, 180, 80);
  key.castShadow = true;
  const shadowSize = isMobile ? 1024 : 2048;
  key.shadow.mapSize.set(shadowSize, shadowSize);
  Object.assign(key.shadow.camera, { left: -135, right: 135, top: 115, bottom: -115, near: 20, far: 450 });
  key.shadow.bias = -0.0006;
  key.shadow.normalBias = 0.12; // the bowl is large: a bigger offset avoids striped "shadow acne"

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

// Frees every geometry, material and texture from GPU memory
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
