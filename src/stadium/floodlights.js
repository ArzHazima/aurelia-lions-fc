// Four corner floodlight towers with glowing lamps and soft translucent light beams
import * as THREE from 'three';

const TOWER_HEIGHT = 46;
const CORNERS = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

export function createFloodlights() {
  const group = new THREE.Group();
  group.name = 'floodlights';

  const poleMat = new THREE.MeshStandardMaterial({ color: '#4a5168', roughness: 0.7, metalness: 0.3, flatShading: true });
  const frameMat = new THREE.MeshStandardMaterial({ color: '#232a3d', roughness: 0.6 });
  const lampMat = new THREE.MeshBasicMaterial({ color: '#fffaf0' });
  const beamMat = createBeamMaterial();
  const haloMat = new THREE.SpriteMaterial({
    map: glowTexture(),
    color: '#ffe9c4',
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    fog: false,
  });

  const poleGeo = new THREE.CylinderGeometry(0.45, 1.1, TOWER_HEIGHT, 6);
  const frameGeo = new THREE.BoxGeometry(10, 5.6, 0.7);
  const lampGeo = new THREE.BoxGeometry(1.9, 1.3, 0.3);

  for (const [sx, sz] of CORNERS) {
    const x = sx * 68;
    const z = sz * 52;

    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(x, TOWER_HEIGHT / 2, z);
    pole.castShadow = true;

    // The head of the tower aims at a point on the pitch
    const head = new THREE.Group();
    head.position.set(x, TOWER_HEIGHT + 2, z);
    const target = new THREE.Vector3(sx * 14, 0, sz * 10);
    head.lookAt(target);

    head.add(new THREE.Mesh(frameGeo, frameMat));
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        const lamp = new THREE.Mesh(lampGeo, lampMat);
        lamp.position.set((c - 1.5) * 2.3, (r - 1) * 1.65, 0.45);
        head.add(lamp);
      }
    }

    // Glowing halo in front of the lamps
    const halo = new THREE.Sprite(haloMat);
    halo.scale.setScalar(22);
    halo.position.set(0, 0, 1.5);
    head.add(halo);

    // Light beam: a translucent cone that fades out before reaching the grass
    const dir = target.clone().sub(head.position);
    const len = dir.length() * 0.75;
    dir.normalize();
    const coneGeo = new THREE.ConeGeometry(len * 0.4, len, 32, 1, true);
    coneGeo.translate(0, -len / 2, 0); // put the cone's tip at (0,0,0)
    const beam = new THREE.Mesh(coneGeo, beamMat);
    beam.position.copy(head.position);
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
    beam.renderOrder = 10;

    group.add(pole, head, beam);
  }
  return group;
}

// A round texture that fades from the center outwards, used for light halos
export function glowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.2, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.12)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createBeamMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color('#fff2d0') },
      intensity: { value: 0.09 },
    },
    vertexShader: /* glsl */ `
      varying float vV;
      void main() {
        vV = uv.y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 color;
      uniform float intensity;
      varying float vV;
      void main() {
        gl_FragColor = vec4(color, pow(vV, 2.4) * intensity);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
}
