// Everything around the stadium: evening sky, stars, ground, plaza, trees and hills
import * as THREE from 'three';
import { COLORS } from './config.js';
import { createRandom } from '../utils/random.js';

export function createEnvironment() {
  const group = new THREE.Group();
  group.name = 'environment';
  group.add(createSky(), createStars(), createGround(), createHills(), createTrees());
  return group;
}

function createSky() {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      top: { value: new THREE.Color('#0b1536') },
      mid: { value: new THREE.Color('#3d2f6e') },
      pink: { value: new THREE.Color('#b65a86') },
      glow: { value: new THREE.Color('#ff9a5c') },
      horizon: { value: new THREE.Color(COLORS.fog) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 top, mid, pink, glow, horizon;
      varying vec3 vDir;
      void main() {
        float h = vDir.y;
        // the sunset glow is strongest toward the west
        float sunset = pow(max(dot(normalize(vDir.xz + 1e-4), normalize(vec2(-1.0, -0.35))), 0.0), 3.0);
        vec3 band = mix(pink, glow, sunset);
        vec3 c = mix(horizon, band, smoothstep(-0.02, 0.05, h));
        c = mix(c, mid, smoothstep(0.05, 0.3, h));
        c = mix(c, top, smoothstep(0.28, 0.85, h));
        gl_FragColor = vec4(c, 1.0);
      }
    `,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(1400, 48, 24), material);
}

function createStars() {
  const random = createRandom(7);
  const count = 450;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const az = random() * Math.PI * 2;
    const el = 0.35 + random() * 1.1;
    const r = 1300;
    positions[i * 3] = Math.cos(el) * Math.sin(az) * r;
    positions[i * 3 + 1] = Math.sin(el) * r;
    positions[i * 3 + 2] = Math.cos(el) * Math.cos(az) * r;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: '#ffffff',
    size: 1.6,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.75,
    fog: false,
  });
  return new THREE.Points(geo, mat);
}

function createGround() {
  const group = new THREE.Group();
  const flat = (geo, color, y) => {
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 1 }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = y;
    m.receiveShadow = true;
    group.add(m);
  };
  flat(new THREE.PlaneGeometry(5000, 5000), '#1d2431', -0.2);
  flat(new THREE.CircleGeometry(165, 64), '#3a4152', -0.12); // plaza around the stadium
  flat(new THREE.PlaneGeometry(126, 92), '#2d6c38', -0.05); // grass between pitch and stands
  return group;
}

function createHills() {
  const random = createRandom(42);
  const group = new THREE.Group();
  const colors = ['#2a2847', '#302b52', '#25243f', '#352d55'];
  const count = 30;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + random() * 0.15;
    const dist = 520 + random() * 160;
    const height = 50 + random() * 110;
    const radius = 80 + random() * 80;
    const hill = new THREE.Mesh(
      new THREE.ConeGeometry(radius, height, 5 + Math.floor(random() * 3), 1),
      new THREE.MeshStandardMaterial({ color: colors[i % colors.length], roughness: 1, flatShading: true }),
    );
    hill.position.set(Math.sin(angle) * dist, height / 2 - 4, Math.cos(angle) * dist);
    hill.rotation.y = random() * Math.PI;
    group.add(hill);
  }
  return group;
}

function createTrees() {
  const random = createRandom(11);
  const count = 110;
  const foliage = new THREE.InstancedMesh(
    new THREE.ConeGeometry(2.4, 6, 6),
    new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, flatShading: true }),
    count,
  );
  const trunks = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.3, 0.4, 1.8, 5),
    new THREE.MeshStandardMaterial({ color: '#4a3528', roughness: 1 }),
    count,
  );
  const shades = ['#2e5d4a', '#37684f', '#284f43', '#3d6e4c'].map((c) => new THREE.Color(c));
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    const angle = random() * Math.PI * 2;
    const dist = 180 + random() * 150;
    const scale = 0.8 + random() * 0.9;
    const x = Math.sin(angle) * dist;
    const z = Math.cos(angle) * dist;
    s.setScalar(scale);
    m.compose(p.set(x, 0.9 * scale + 2.8 * scale, z), q, s);
    foliage.setMatrixAt(i, m);
    foliage.setColorAt(i, shades[i % shades.length]);
    m.compose(p.set(x, 0.9 * scale, z), q, s);
    trunks.setMatrixAt(i, m);
  }
  const group = new THREE.Group();
  group.add(foliage, trunks);
  return group;
}
