// Assembles the stadium, runs the animation loop, and turns pointer input into
// section/seat hover and selection. The page talks to it through callbacks and methods.
import * as THREE from 'three';
import { createScene } from './scene.js';
import { createEnvironment } from './environment.js';
import { createPitch } from './pitch.js';
import { buildLayout } from './bowl/layout.js';
import { createTiers } from './bowl/tiers.js';
import { createSeats } from './seats.js';
import { createRoof } from './roof.js';
import { createVip } from './vip.js';
import { createPitchside } from './pitchside.js';
import { createScreens } from './screens.js';
import { CameraRig } from './camera.js';

const TAP_DISTANCE = 5; // px – moving this far or more during a press makes it a drag, not a click

/**
 * @param {HTMLElement} container
 * @param {object} options
 *   match, occupancy                         – data for this match
 *   onHover(info|null, x, y)                 – info = { kind: 'section', section, free, total } | { kind: 'seat', seat }
 *   onModeChange(mode, context)              – 'overview' | 'section' (context = section) | 'seat' (context = seat) | 'flying'
 */
export function createStadium(container, options = {}) {
  const { match, occupancy, onHover, onModeChange } = options;

  const world = createScene(container);
  const { scene, camera, renderer } = world;
  const dom = renderer.domElement;

  const tiers = createTiers();
  const seats = createSeats(buildLayout(), occupancy);
  const roof = createRoof();
  const vip = createVip();
  const pitchside = createPitchside(match);
  const screens = createScreens(match);
  const animated = [roof, vip, pitchside, screens]; // objects with update(dt, time, rig)
  scene.add(
    createEnvironment(),
    createPitch(renderer.capabilities.getMaxAnisotropy()),
    tiers.group,
    ...seats.meshes,
    vip.group,
    roof.group,
    pitchside.group,
    screens.group,
  );

  const rig = new CameraRig(camera, dom);
  rig.applyPose(rig.overviewPose());

  // Dev only: access from the browser console for debugging (window.__stadium)
  if (import.meta.env.DEV) window.__stadium = { scene, camera, renderer, rig, seats, tiers };

  // ---------- Picking ----------
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let pointer = null;
  let pointerDirty = false;
  let down = null;
  let hoverSection = null;
  let hoverSeat = null;
  let currentSection = null;

  function setRay(x, y) {
    const rect = dom.getBoundingClientRect();
    ndc.set(((x - rect.left) / rect.width) * 2 - 1, -((y - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
  }

  function pickSection(x, y) {
    setRay(x, y);
    const hit = raycaster.intersectObjects(tiers.bodies, false)[0];
    return hit ? seats.sectionAt(hit.point, hit.object === tiers.upperBody) : null;
  }

  function pickSeat(x, y) {
    setRay(x, y);
    return seats.pick(raycaster, tiers.bodies);
  }

  function setHoverSection(section, x, y) {
    if (section !== hoverSection) seats.setSectionHighlight(section);
    hoverSection = section;
    dom.style.cursor = section ? 'pointer' : '';
    onHover?.(section ? { kind: 'section', section, ...seats.stats(section) } : null, x, y);
  }

  // Only green seats get highlighted; red/grey ones just explain themselves in the tooltip
  function setHoverSeat(seat, x, y) {
    hoverSeat = seat;
    seats.setHighlighted(seat && seat.status === 'free' ? seat : null);
    dom.style.cursor = seat ? (seat.status === 'free' ? 'pointer' : 'not-allowed') : '';
    onHover?.(seat ? { kind: 'seat', seat } : null, x, y);
  }

  function clearHover() {
    if (hoverSection) seats.setSectionHighlight(null);
    if (hoverSeat) seats.setHighlighted(null);
    hoverSection = hoverSeat = null;
    dom.style.cursor = '';
    onHover?.(null);
  }

  function enterSection(section) {
    clearHover();
    currentSection = section;
    onModeChange?.('flying');
    rig.flyToSection(section).then(() => onModeChange?.('section', section));
  }

  function selectSeat(seat) {
    clearHover();
    onModeChange?.('flying');
    rig.flyToSeat(seat).then((ok) => ok && onModeChange?.('seat', seat));
  }

  // Click vs drag: a press counts as a click only if the pointer never moved
  // TAP_DISTANCE px or more from where it went down (mouse, pen and touch alike).
  // No time limit – a slow or long press is still a click. A second finger on the
  // screen (pinch to zoom) cancels the click.
  const activePointers = new Set();

  const onPointerMove = (e) => {
    pointer = { x: e.clientX, y: e.clientY, mouse: e.pointerType === 'mouse', buttons: e.buttons };
    pointerDirty = true;
    if (down && e.pointerId === down.id) {
      down.moved = Math.max(down.moved, Math.hypot(e.clientX - down.x, e.clientY - down.y));
    }
  };
  const onPointerLeave = () => {
    pointer = null;
    if (hoverSection || hoverSeat) clearHover();
  };
  const onPointerDown = (e) => {
    activePointers.add(e.pointerId);
    if (activePointers.size > 1) {
      down = null; // multi-touch gesture, not a click
      return;
    }
    if (e.pointerType === 'mouse' && e.button !== 0) return; // left button only
    down = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0 };
  };
  const onPointerCancel = (e) => {
    activePointers.delete(e.pointerId);
    if (down && e.pointerId === down.id) down = null;
  };
  const onPointerUp = (e) => {
    activePointers.delete(e.pointerId);
    if (!down || e.pointerId !== down.id) return;
    const moved = Math.max(down.moved, Math.hypot(e.clientX - down.x, e.clientY - down.y));
    down = null;
    if (moved >= TAP_DISTANCE) return; // it was a drag / rotate

    if (rig.mode === 'overview') {
      const section = pickSection(e.clientX, e.clientY);
      if (section) enterSection(section);
    } else if (rig.mode === 'section') {
      const seat = pickSeat(e.clientX, e.clientY);
      if (seat && seat.status === 'free') selectSeat(seat);
      else setHoverSeat(seat, e.clientX, e.clientY); // explain why it can't be chosen
    }
  };

  dom.addEventListener('pointermove', onPointerMove);
  dom.addEventListener('pointerleave', onPointerLeave);
  dom.addEventListener('pointerdown', onPointerDown);
  dom.addEventListener('pointerup', onPointerUp);
  dom.addEventListener('pointercancel', onPointerCancel);

  // ---------- Animation loop ----------
  let last = performance.now();
  let time = 0;
  renderer.setAnimationLoop((now) => {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    time += dt;
    rig.update(dt);
    for (const a of animated) a.update(dt, time, rig);
    screens.setOpacity(roof.opacity);

    // Hover check: mouse only, at most once per frame, not while dragging
    if (pointerDirty && pointer && pointer.mouse) {
      pointerDirty = false;
      if (pointer.buttons) {
        if (hoverSection || hoverSeat) clearHover();
      } else if (rig.mode === 'overview') {
        const section = pickSection(pointer.x, pointer.y);
        if (section || hoverSection) setHoverSection(section, pointer.x, pointer.y);
      } else if (rig.mode === 'section') {
        const seat = pickSeat(pointer.x, pointer.y);
        if (seat || hoverSeat) setHoverSeat(seat, pointer.x, pointer.y);
      }
    }

    world.render();
  });

  return {
    scene,
    animated,
    playIntro: () => rig.playIntro().then(() => onModeChange?.('overview')),
    skipIntro: () => rig.skipIntro(),
    backToOverview() {
      if (rig.mode !== 'section') return;
      clearHover();
      currentSection = null;
      onModeChange?.('flying');
      rig.flyToOverview().then(() => onModeChange?.('overview'));
    },
    backFromSeat() {
      onModeChange?.('flying');
      rig.flyBack().then((ok) => ok && onModeChange?.(rig.mode, currentSection));
    },
    markTaken: (seat) => seats.setStatus(seat, 'taken'),
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
      dom.removeEventListener('pointercancel', onPointerCancel);
      rig.dispose();
      world.dispose();
      if (import.meta.env.DEV) delete window.__stadium;
    },
  };
}
