// Everything about camera movement:
//  intro    – opening sweep around the stadium
//  overview – whole bowl, orbit with mouse/touch, pick a section
//  section  – close-up of one section, orbit a little, pick a seat
//  seat     – eye level in the chosen seat, drag to look around (with limits)
//  flying   – smooth curved flights between all of the above
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const DEG = Math.PI / 180;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export const easing = {
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
};

export const FOV = { overview: 45, section: 50, seat: 62 };
const EYE_HEIGHT = 1.15; // seated eye height above the row floor
const YAW_LIMIT = 70 * DEG; // how far you can turn left/right from the seat
const PITCH_DOWN = -28 * DEG;
const PITCH_UP = 20 * DEG;
export const PITCH_CENTER = new THREE.Vector3(0, 1, 0);

const ORBIT_LIMITS = {
  overview: {
    minDistance: 70,
    maxDistance: 600,
    minPolarAngle: 8 * DEG,
    maxPolarAngle: 76 * DEG,
    zoomToCursor: false,
    rotateSpeed: 0.5,
  },
  section: {
    minDistance: 6,
    maxDistance: 80,
    minPolarAngle: 10 * DEG,
    maxPolarAngle: 88 * DEG,
    zoomToCursor: true,
    rotateSpeed: 0.4,
  },
};

// Point on a quadratic Bézier curve (curved flight paths)
function bezier(a, b, c, t, out) {
  const u = 1 - t;
  return out
    .copy(a)
    .multiplyScalar(u * u)
    .addScaledVector(b, 2 * u * t)
    .addScaledVector(c, t * t);
}

// Where the camera sits for a seat: above the seat, a touch toward the pitch
export function seatEye(seat) {
  const forward = new THREE.Vector3(-Math.sin(seat.rotationY), 0, -Math.cos(seat.rotationY));
  return seat.position.clone().add(new THREE.Vector3(0, EYE_HEIGHT, 0)).addScaledVector(forward, 0.05);
}

export class CameraRig {
  constructor(camera, domElement) {
    this.camera = camera;
    this.dom = domElement;
    this.mode = 'idle';
    this.flightTo = null; // destination mode while flying
    this.tween = null;
    this.look = null; // look-around state in the seat view
    this.saved = null; // where to return to after the seat view
    this.drag = null;

    this.controls = new OrbitControls(camera, domElement);
    Object.assign(this.controls, {
      enabled: false,
      enableDamping: true,
      dampingFactor: 0.08,
      enablePan: false,
      zoomSpeed: 0.9,
    });

    domElement.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
  }

  // Roof is drawn solid in the intro and in the seat view, see-through while choosing
  get roofSolid() {
    return this.mode === 'intro' || this.mode === 'seat' || (this.mode === 'flying' && this.flightTo === 'seat');
  }

  // ---------- Poses ----------

  // Overview, sized so the whole bowl fits the screen (phones get an end-on view)
  overviewPose() {
    const aspect = this.camera.aspect;
    const portrait = aspect < 0.85;
    const vHalf = (FOV.overview * DEG) / 2;
    const hHalf = Math.atan(Math.tan(vHalf) * aspect);
    const el = (portrait ? 62 : 48) * DEG;
    const halfWidth = portrait ? 80 : 112;
    const halfDepth = portrait ? 112 : 92;
    const dist = Math.max(halfWidth / Math.tan(hHalf), (halfDepth * Math.sin(el) + 18) / Math.tan(vHalf));
    return { az: portrait ? Math.PI / 2 : 0, el, dist, target: new THREE.Vector3(0, 0, 0) };
  }

  static positionOf({ az, el, dist, target }) {
    const flat = Math.cos(el) * dist;
    return new THREE.Vector3(target.x + flat * Math.sin(az), target.y + Math.sin(el) * dist, target.z + flat * Math.cos(az));
  }

  applyPose(pose) {
    this.camera.position.copy(CameraRig.positionOf(pose));
    this.camera.lookAt(pose.target);
  }

  setFov(fov) {
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  // ---------- Intro ----------

  playIntro(duration = 7) {
    const end = this.overviewPose();
    const start = { az: end.az - Math.PI * 2.1, el: 5 * DEG, dist: end.dist * 1.7, target: new THREE.Vector3(0, 18, 0) };
    const target = new THREE.Vector3();
    this.controls.enabled = false;
    this.mode = 'intro';
    this.setFov(FOV.overview);

    return this.animate(duration, (k) => {
      const e = easing.inOutCubic(k);
      this.applyPose({
        az: lerp(start.az, end.az, easing.inOutSine(k)),
        el: lerp(start.el, end.el, e),
        dist: lerp(start.dist, end.dist, e),
        target: target.lerpVectors(start.target, end.target, e),
      });
    }).then(() => this.enableOrbit(end.target, 'overview'));
  }

  skipIntro() {
    if (this.mode === 'intro' && this.tween) this.tween.elapsed = this.tween.duration;
  }

  enableOrbit(target, mode) {
    this.mode = mode;
    Object.assign(this.controls, ORBIT_LIMITS[mode]);
    this.controls.target.copy(target);
    this.controls.enabled = true;
    this.controls.update();
    this.dom.style.cursor = '';
  }

  // ---------- Flights ----------

  // The point the camera is currently looking at (used as the start of a flight)
  lookPoint() {
    if (this.mode === 'overview' || this.mode === 'section') return this.controls.target.clone();
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    return this.camera.position.clone().addScaledVector(dir, this.camera.position.distanceTo(PITCH_CENTER));
  }

  // Curved, eased flight to { position, target, fov, mode }
  flyTo(dest, duration = 2) {
    const l0 = this.lookPoint();
    this.controls.enabled = false;
    this.drag = null;
    this.look = null;
    this.mode = 'flying';
    this.flightTo = dest.mode;

    const p0 = this.camera.position.clone();
    const f0 = this.camera.fov;
    const p1 = dest.position.clone();
    const l1 = dest.target.clone();
    // Going down: stay high, then swoop. Going up: rise first, then settle.
    const down = p1.y < p0.y;
    const ctrl = p0.clone().lerp(p1, down ? 0.6 : 0.4);
    ctrl.y = lerp(p0.y, p1.y, down ? 0.2 : 0.8) + 6;
    const look = new THREE.Vector3();

    return this.animate(duration, (k) => {
      const e = easing.inOutCubic(k);
      bezier(p0, ctrl, p1, e, this.camera.position);
      this.camera.lookAt(look.lerpVectors(l0, l1, e));
      this.setFov(lerp(f0, dest.fov, e));
    }).then(() => {
      this.flightTo = null;
      if (dest.mode === 'seat') this.startSeatLook(p1, l1);
      else this.enableOrbit(l1, dest.mode);
      return true;
    });
  }

  flyToOverview() {
    const pose = this.overviewPose();
    return this.flyTo({ position: CameraRig.positionOf(pose), target: pose.target, fov: FOV.overview, mode: 'overview' }, 1.8);
  }

  // In front of the section, over the pitch, looking at its middle
  flyToSection(section) {
    const upper = section.tierId === 'upper';
    const target = section.center.clone().add(new THREE.Vector3(0, 1, 0));
    const position = section.center
      .clone()
      .addScaledVector(section.normal, upper ? -30 : -24)
      .add(new THREE.Vector3(0, upper ? 7 : 9, 0));
    return this.flyTo({ position, target, fov: FOV.section, mode: 'section' }, 1.8);
  }

  flyToSeat(seat) {
    if (this.mode !== 'overview' && this.mode !== 'section') return Promise.resolve(false);
    this.saved = {
      position: this.camera.position.clone(),
      target: this.controls.target.clone(),
      fov: this.camera.fov,
      mode: this.mode,
    };
    return this.flyTo({ position: seatEye(seat), target: PITCH_CENTER, fov: FOV.seat, mode: 'seat' }, 2.2);
  }

  flyBack() {
    if (this.mode !== 'seat' || !this.saved) return Promise.resolve(false);
    return this.flyTo(this.saved, 2);
  }

  // ---------- Looking around from the seat ----------

  startSeatLook(eye, target) {
    const dir = target.clone().sub(eye);
    this.look = {
      eye: eye.clone(),
      baseYaw: Math.atan2(dir.x, dir.z),
      basePitch: Math.atan2(dir.y, Math.hypot(dir.x, dir.z)),
      yaw: 0,
      pitch: 0,
      targetYaw: 0,
      targetPitch: 0,
    };
    this.mode = 'seat';
    this.dom.style.cursor = 'grab';
  }

  updateSeatLook(dt) {
    const l = this.look;
    const f = 1 - Math.exp(-dt * 12); // smooth follow
    l.yaw += (l.targetYaw - l.yaw) * f;
    l.pitch += (l.targetPitch - l.pitch) * f;
    const yaw = l.baseYaw + l.yaw;
    const pitch = l.basePitch + l.pitch;
    const dir = new THREE.Vector3(Math.cos(pitch) * Math.sin(yaw), Math.sin(pitch), Math.cos(pitch) * Math.cos(yaw));
    this.camera.position.copy(l.eye);
    this.camera.lookAt(l.eye.clone().add(dir));
  }

  onPointerDown = (e) => {
    if (this.mode !== 'seat') return;
    this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    this.dom.style.cursor = 'grabbing';
  };

  onPointerMove = (e) => {
    if (!this.drag || e.pointerId !== this.drag.id || !this.look) return;
    const dx = e.clientX - this.drag.x;
    const dy = e.clientY - this.drag.y;
    this.drag.x = e.clientX;
    this.drag.y = e.clientY;
    // "Grab" style: dragging right pulls the view to the right
    const k = 0.0045;
    const l = this.look;
    l.targetYaw = clamp(l.targetYaw + dx * k, -YAW_LIMIT, YAW_LIMIT);
    l.targetPitch = clamp(l.targetPitch + dy * k, PITCH_DOWN, PITCH_UP);
  };

  onPointerUp = (e) => {
    if (!this.drag || e.pointerId !== this.drag.id) return;
    this.drag = null;
    if (this.mode === 'seat') this.dom.style.cursor = 'grab';
  };

  // ---------- Tiny animation engine ----------

  animate(duration, onUpdate) {
    return new Promise((resolve) => {
      this.tween = { elapsed: 0, duration, onUpdate, resolve };
      onUpdate(0);
    });
  }

  update(dt) {
    const tw = this.tween;
    if (tw) {
      tw.elapsed += dt;
      const k = Math.min(1, tw.elapsed / tw.duration);
      tw.onUpdate(k);
      if (k >= 1) {
        this.tween = null;
        tw.resolve();
      }
    } else if (this.mode === 'seat') {
      this.updateSeatLook(dt);
    } else if (this.mode === 'overview' || this.mode === 'section') {
      this.controls.update();
    }
  }

  dispose() {
    this.dom.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerUp);
    this.controls.dispose();
  }
}
