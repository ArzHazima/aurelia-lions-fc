// The roof: one continuous canopy ring over the whole bowl, open above the pitch.
// Floodlights are built into its inner edge (a strip of lamps with glowing halos).
// While choosing seats the roof turns see-through so it never hides the upper tier.
import * as THREE from 'three';
import { COLORS, ROOF, UPPER_BACK } from './config.js';
import { sweepProfile, ribbon, alongLoop, fillInstances } from './bowl/geometry.js';
import { canvasTexture, glowTexture } from './textures.js';

const SEE_THROUGH = 0.14;

export function createRoof() {
  const group = new THREE.Group();
  group.name = 'roof';
  const { inner, outer, innerY, outerY, thickness: th } = ROOF;
  const slope = Math.atan2(innerY - outerY, outer - inner);
  const yAt = (d) => innerY + ((outerY - innerY) * (d - inner)) / (outer - inner);

  // Materials that fade when the roof becomes see-through
  const roofMat = new THREE.MeshStandardMaterial({
    color: '#c3cadb',
    roughness: 0.6,
    metalness: 0.2,
    flatShading: true,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const steelMat = new THREE.MeshStandardMaterial({ color: '#59627a', roughness: 0.5, metalness: 0.5, transparent: true });
  const fasciaTex = canvasTexture(8, 64, (ctx) => {
    ctx.fillStyle = COLORS.navy;
    ctx.fillRect(0, 0, 8, 64);
    ctx.fillStyle = COLORS.gold;
    ctx.fillRect(0, 10, 8, 6);
  });
  fasciaTex.wrapS = THREE.RepeatWrapping;
  const fasciaMat = new THREE.MeshStandardMaterial({ map: fasciaTex, roughness: 0.5, transparent: true, side: THREE.DoubleSide });
  const fading = [roofMat, steelMat, fasciaMat];

  // Canopy: a thin sloped slab swept around the bowl
  const slab = new THREE.Mesh(
    sweepProfile([
      [inner, innerY - th],
      [inner, innerY],
      [outer, outerY],
      [outer, outerY - th],
    ]),
    roofMat,
  );
  slab.receiveShadow = true;

  // Navy/gold fascia along the inner edge
  const fascia = new THREE.Mesh(ribbon(inner - 0.03, innerY - th - 1.2, innerY + 0.25, { facing: 'in' }), fasciaMat);

  // Radial steel trusses on top of the roof
  const trussItems = alongLoop((inner + outer) / 2, 9);
  const trusses = fillInstances(
    new THREE.InstancedMesh(new THREE.BoxGeometry(0.45, 1.3, outer - inner), steelMat, trussItems.length),
    trussItems,
    (o, it) => {
      o.position.set(it.x, yAt((inner + outer) / 2) + 0.65, it.z);
      o.rotation.set(slope, it.beta, 0);
    },
  );

  // Columns around the outside carrying the roof (stay solid – they never block seats)
  const postItems = alongLoop(UPPER_BACK + 1.6, 14);
  const posts = fillInstances(
    new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.35, 0.5, outerY, 8),
      new THREE.MeshStandardMaterial({ color: '#59627a', roughness: 0.5, metalness: 0.5 }),
      postItems.length,
    ),
    postItems,
    (o, it) => o.position.set(it.x, outerY / 2, it.z),
  );
  posts.castShadow = true;

  // Floodlights: a strip of lamps under the inner edge, plus soft halos
  const lampItems = alongLoop(inner + 0.9, 3.2);
  const lamps = fillInstances(
    new THREE.InstancedMesh(new THREE.BoxGeometry(1.7, 0.3, 0.9), new THREE.MeshBasicMaterial({ color: '#fffaf0' }), lampItems.length),
    lampItems,
    (o, it) => {
      o.position.set(it.x, yAt(inner + 0.9) - th - 0.3, it.z);
      o.rotation.y = it.beta;
    },
  );

  const haloMat = new THREE.SpriteMaterial({
    map: glowTexture(),
    color: '#ffe9c4',
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    fog: false,
  });
  const halos = new THREE.Group();
  alongLoop(inner + 0.2, 9.6).forEach((p) => {
    const halo = new THREE.Sprite(haloMat);
    halo.position.set(p.x, innerY - th - 0.8, p.z);
    halo.scale.setScalar(10);
    halos.add(halo);
  });

  group.add(slab, fascia, trusses, posts, lamps, halos);

  let opacity = 1;
  function setOpacity(o) {
    opacity = o;
    for (const m of fading) {
      m.opacity = o;
      m.depthWrite = o > 0.99;
    }
  }

  return {
    group,
    setOpacity,
    // Fade toward solid (intro / seat view) or see-through (choosing seats)
    update(dt, time, rig) {
      const target = rig.roofSolid ? 1 : SEE_THROUGH;
      if (Math.abs(target - opacity) > 0.001) setOpacity(opacity + (target - opacity) * (1 - Math.exp(-dt * 5)));
    },
  };
}
