// Assembles the stadium, runs the animation loop, and turns pointer input into
// seat hover / seat selection. The page talks to it through callbacks and methods.
import * as THREE from 'three';
import { createScene } from './scene.js';
import { createEnvironment } from './environment.js';
import { createPitch } from './pitch.js';
import { createStands } from './stands.js';
import { createSeats } from './seats.js';
import { createFloodlights } from './floodlights.js';
import { CameraRig } from './camera.js';

const TAP_DISTANCE = 6; // px – more movement than this counts as a drag, not a click
const TAP_TIME = 600; // ms

/**
 * @param {HTMLElement} container
 * @param {object} options
 *   match, occupancy                     – data for this match
 *   onHover(seat|null, x, y)             – pointer is over a seat (or nothing)
 *   onSeatSelected(seat)                 – a green seat was clicked; the flight starts
 *   onSeatView(seat)                     – the camera arrived at the seat
 *   onOverview()                         – the camera is back in the overview
 */
export function createStadium(container, options = {}) {
  const { match, occupancy, onHover, onSeatSelected, onSeatView, onOverview } = options;

  const world = createScene(container);
  const { scene, camera, renderer } = world;
  const dom = renderer.domElement;

  const stands = createStands({ match });
  const seats = createSeats(occupancy);
  scene.add(
    createEnvironment(),
    createPitch(renderer.capabilities.getMaxAnisotropy()),
    stands,
    seats.mesh,
    createFloodlights(),
  );

  const rig = new CameraRig(camera, dom);
  rig.applyPose(rig.overviewPose());

  // Dev only: access from the browser console for debugging (window.__stadium)
  if (import.meta.env.DEV) window.__stadium = { scene, camera, renderer, rig, seats };

  // ---------- Picking seats with the pointer ----------
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let pointer = null;
  let pointerDirty = false;
  let down = null;
  let hoveredSeat = null;

  function pickAt(x, y) {
    const rect = dom.getBoundingClientRect();
    ndc.set(((x - rect.left) / rect.width) * 2 - 1, -((y - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return seats.pick(raycaster, [stands]);
  }

  // Only green seats get highlighted; red ones just show the "taken" tooltip
  function setHover(seat, x, y) {
    hoveredSeat = seat;
    seats.setHighlighted(seat && !seat.taken ? seat : null);
    dom.style.cursor = seat ? (seat.taken ? 'not-allowed' : 'pointer') : '';
    onHover?.(seat, x, y);
  }

  function selectSeat(seat) {
    setHover(null);
    onSeatSelected?.(seat);
    rig.flyToSeat(seat).then((ok) => ok && onSeatView?.(seat));
  }

  const onPointerMove = (e) => {
    pointer = { x: e.clientX, y: e.clientY, mouse: e.pointerType === 'mouse', buttons: e.buttons };
    pointerDirty = true;
  };
  const onPointerLeave = () => {
    pointer = null;
    if (rig.mode === 'overview' && hoveredSeat) setHover(null);
  };
  const onPointerDown = (e) => {
    down = { x: e.clientX, y: e.clientY, t: performance.now() };
  };
  const onPointerUp = (e) => {
    if (!down) return;
    const isTap =
      Math.hypot(e.clientX - down.x, e.clientY - down.y) < TAP_DISTANCE && performance.now() - down.t < TAP_TIME;
    down = null;
    if (!isTap || rig.mode !== 'overview') return;

    const seat = pickAt(e.clientX, e.clientY);
    if (seat && !seat.taken) selectSeat(seat);
    else setHover(seat, e.clientX, e.clientY); // red seat: show why it can't be chosen
  };

  dom.addEventListener('pointermove', onPointerMove);
  dom.addEventListener('pointerleave', onPointerLeave);
  dom.addEventListener('pointerdown', onPointerDown);
  dom.addEventListener('pointerup', onPointerUp);

  // ---------- Animation loop ----------
  let last = performance.now();
  renderer.setAnimationLoop((now) => {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    rig.update(dt);

    // Hover check (mouse only, once per frame at most, not while dragging)
    if (pointerDirty && pointer && pointer.mouse && rig.mode === 'overview') {
      pointerDirty = false;
      if (pointer.buttons) {
        if (hoveredSeat) setHover(null);
      } else {
        const seat = pickAt(pointer.x, pointer.y);
        if (seat !== hoveredSeat || seat) setHover(seat, pointer.x, pointer.y);
      }
    }

    world.render();
  });

  return {
    playIntro: () => rig.playIntro(),
    skipIntro: () => rig.skipIntro(),
    flyBack: () =>
      rig.flyBack().then((ok) => {
        if (ok) onOverview?.();
        return ok;
      }),
    markTaken: (seat) => seats.setTaken(seat, true),
    availableCount: () => seats.availableCount(),
    totalCount: () => seats.seats.length,
    get mode() {
      return rig.mode;
    },
    dispose() {
      renderer.setAnimationLoop(null);
      dom.removeEventListener('pointermove', onPointerMove);
      dom.removeEventListener('pointerleave', onPointerLeave);
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointerup', onPointerUp);
      rig.dispose();
      world.dispose();
      if (import.meta.env.DEV) delete window.__stadium;
    },
  };
}
