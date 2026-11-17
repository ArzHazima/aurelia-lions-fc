// Everything about camera movement:
// - the opening animation and the overview (orbit with mouse / touch)
// - the smooth flight from the overview down to a seat, and back again
// - looking around from the seat by dragging, with angle limits
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const DEG = Math.PI / 180;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export const easing = {
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
};

const OVERVIEW_FOV = 45;
const SEAT_FOV = 62;
const EYE_HEIGHT = 1.2; // seated eye height above the row floor
const YAW_LIMIT = 70 * DEG; // how far you can turn left/right from the seat
const PITCH_DOWN = -28 * DEG;
const PITCH_UP = 18 * DEG;
const PITCH_CENTER = new THREE.Vector3(0, 1, 0);

// Point on a quadratic Bézier curve (used for curved flight paths)
function bezier(a, b, c, t, out) {
  const u = 1 - t;
  return out
    .copy(a)
    .multiplyScalar(u * u)
    .addScaledVector(b, 2 * u * t)
    .addScaledVector(c, t * t);
}

// Where the camera sits for a given seat: above the seat, slightly toward the pitch
export function seatEye(seat) {
  const forward = new THREE.Vector3(-Math.sin(seat.rotationY), 0, -Math.cos(seat.rotationY));
  return seat.position.clone().add(new THREE.Vector3(0, EYE_HEIGHT, 0)).addScaledVector(forward, 0.05);
}

export class CameraRig {
  constructor(camera, domElement) {
    this.camera = camera;
    this.dom = domElement;
    this.mode = 'idle'; // idle | intro | overview | flying | seat
    this.tween = null;
    this.look = null; // look-around state while sitting in a seat
    this.saved = null; // overview camera to return to
    this.drag = null;

    this.controls = new OrbitControls(camera, domElement);
    Object.assign(this.controls, {
      enabled: false,
      enableDamping: true,
      dampingFactor: 0.08,
      enablePan: false,
      zoomToCursor: true, // zoom toward the mouse, so you can zoom into a section
      maxTargetRadius: 70,
      rotateSpeed: 0.55,
      zoomSpeed: 0.9,
      minDistance: 14,
      maxDistance: 400,
      minPolarAngle: 8 * DEG,
      maxPolarAngle: 78 * DEG,
    });

    domElement.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
  }

  // ---------- Overview ----------

  // Overview position, sized so the whole stadium fits (also on narrow phone screens)
  overviewPose() {
    const aspect = this.camera.aspect;
    const portrait = aspect < 0.85;
    const vHalf = (OVERVIEW_FOV * DEG) / 2;
    const hHalf = Math.atan(Math.tan(vHalf) * aspect);
    const el = (portrait ? 60 : 42) * DEG;
    const halfWidth = portrait ? 56 : 86;
    const halfDepth = portrait ? 82 : 66;
    const dist =
      Math.max(halfWidth / Math.tan(hHalf), (halfDepth * Math.sin(el) + 10) / Math.tan(vHalf)) * 1.05;
    return { az: portrait ? Math.PI / 2 : 0, el, dist, target: new THREE.Vector3(0, 0, 0) };
  }

  // Places the camera by angle around (az), angle above the ground (el) and distance
  applyPose({ az, el, dist, target }) {
    const flat = Math.cos(el) * dist;
    this.camera.position.set(
      target.x + flat * Math.sin(az),
      target.y + Math.sin(el) * dist,
      target.z + flat * Math.cos(az),
    );
    this.camera.lookAt(target);
  }

  setFov(fov) {
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  // Opening animation: a low sweep around the stadium that ends in the overview
  playIntro(duration = 6.5) {
    const end = this.overviewPose();
    const start = {
      az: end.az - Math.PI * 2.1,
      el: 6 * DEG,
      dist: end.dist * 1.9,
      target: new THREE.Vector3(0, 10, 0),
    };
    const target = new THREE.Vector3();
    this.controls.enabled = false;
    this.mode = 'intro';
    this.setFov(OVERVIEW_FOV);

    return this.animate(duration, (k) => {
      const e = easing.inOutCubic(k);
      this.applyPose({
        az: lerp(start.az, end.az, easing.inOutSine(k)),
        el: lerp(start.el, end.el, e),
        dist: lerp(start.dist, end.dist, e),
        target: target.lerpVectors(start.target, end.target, e),
      });
    }).then(() => this.enableOrbit(end.target));
  }

  skipIntro() {
    if (this.mode === 'intro' && this.tween) this.tween.elapsed = this.tween.duration;
  }

  enableOrbit(target) {
    this.mode = 'overview';
    this.controls.target.copy(target);
    this.controls.enabled = true;
    this.controls.update();
  }

  // ---------- Flying to a seat and back ----------

  flyToSeat(seat, duration = 2.2) {
    if (this.mode !== 'overview') return Promise.resolve(false);
    this.saved = { position: this.camera.position.clone(), target: this.controls.target.clone() };
    this.controls.enabled = false;
    this.mode = 'flying';

    const eye = seatEye(seat);
    const p0 = this.camera.position.clone();
    const t0 = this.controls.target.clone();
    const f0 = this.camera.fov;
    // Control point: stay fairly high, then swoop down onto the seat
    const ctrl = p0.clone().lerp(eye, 0.6);
    ctrl.y = lerp(p0.y, eye.y, 0.2) + 6;
    const lookPoint = new THREE.Vector3();

    return this.animate(duration, (k) => {
      const e = easing.inOutCubic(k);
      bezier(p0, ctrl, eye, e, this.camera.position);
      this.camera.lookAt(lookPoint.lerpVectors(t0, PITCH_CENTER, e));
      this.setFov(lerp(f0, SEAT_FOV, e));
    }).then(() => {
      this.startSeatLook(eye);
      return true;
    });
  }

  flyBack(duration = 2) {
    if (this.mode !== 'seat' || !this.saved) return Promise.resolve(false);
    this.mode = 'flying';
    this.drag = null;

    const p0 = this.camera.position.clone();
    const f0 = this.camera.fov;
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    const l0 = p0.clone().addScaledVector(dir, p0.distanceTo(PITCH_CENTER));
    const { position: p1, target: t1 } = this.saved;
    const ctrl = p0.clone().lerp(p1, 0.4);
    ctrl.y = lerp(p0.y, p1.y, 0.8) + 6;
    const lookPoint = new THREE.Vector3();

    return this.animate(duration, (k) => {
      const e = easing.inOutCubic(k);
      bezier(p0, ctrl, p1, e, this.camera.position);
      this.camera.lookAt(lookPoint.lerpVectors(l0, t1, e));
      this.setFov(lerp(f0, OVERVIEW_FOV, e));
    }).then(() => {
      this.look = null;
      this.enableOrbit(t1);
      return true;
    });
  }

  // ---------- Looking around from the seat ----------

  startSeatLook(eye) {
    const dir = PITCH_CENTER.clone().sub(eye);
    this.look = {
      eye,
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

  // Calls onUpdate with progress from 0 to 1 over `duration` seconds
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
    } else if (this.mode === 'overview') {
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
