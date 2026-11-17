// כל מה שקשור לתנועת המצלמה: אנימציית הפתיחה, מבט העל,
// ושליטה בעכבר/מגע (OrbitControls). בשלב 3 נוסיף כאן את הטיסה אל הכיסא.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const DEG = Math.PI / 180;
const lerp = (a, b, t) => a + (b - a) * t;

export const easing = {
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
};

export class CameraRig {
  constructor(camera, domElement) {
    this.camera = camera;
    this.tween = null;
    this.controls = new OrbitControls(camera, domElement);
    Object.assign(this.controls, {
      enabled: false,
      enableDamping: true,
      dampingFactor: 0.08,
      enablePan: false,
      rotateSpeed: 0.55,
      zoomSpeed: 0.8,
      minDistance: 35,
      maxDistance: 380,
      minPolarAngle: 8 * DEG,
      maxPolarAngle: 78 * DEG,
    });
  }

  // מיקום מבט העל, מחושב כך שכל האצטדיון ייכנס למסך (גם במסך צר של טלפון)
  overviewPose() {
    const aspect = this.camera.aspect;
    const portrait = aspect < 0.85;
    const vHalf = (this.camera.fov * DEG) / 2;
    const hHalf = Math.atan(Math.tan(vHalf) * aspect);
    const el = (portrait ? 60 : 42) * DEG;
    const halfWidth = portrait ? 48 : 78;
    const halfDepth = portrait ? 75 : 60;
    const dist =
      Math.max(halfWidth / Math.tan(hHalf), (halfDepth * Math.sin(el) + 8) / Math.tan(vHalf)) * 1.08;
    return { az: portrait ? Math.PI / 2 : 0, el, dist, target: new THREE.Vector3(0, 0, 0) };
  }

  // ממקם את המצלמה לפי זווית סביב (az), זווית גובה (el) ומרחק (dist)
  applyPose({ az, el, dist, target }) {
    const flat = Math.cos(el) * dist;
    this.camera.position.set(
      target.x + flat * Math.sin(az),
      target.y + Math.sin(el) * dist,
      target.z + flat * Math.cos(az),
    );
    this.camera.lookAt(target);
  }

  // אנימציית פתיחה: סיבוב נמוך מסביב לאצטדיון שמסתיים במבט העל
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
    if (this.tween) this.tween.elapsed = this.tween.duration;
  }

  enableOrbit(target) {
    this.controls.target.copy(target);
    this.controls.enabled = true;
    this.controls.update();
  }

  // מנוע אנימציה קטן: קורא ל-onUpdate עם התקדמות בין 0 ל-1
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
    } else if (this.controls.enabled) {
      this.controls.update();
    }
  }

  dispose() {
    this.controls.dispose();
  }
}
