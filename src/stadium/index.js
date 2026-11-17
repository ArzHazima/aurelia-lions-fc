// מרכיב את כל חלקי האצטדיון לסצנה אחת ומריץ את לולאת האנימציה
import { createScene } from './scene.js';
import { createEnvironment } from './environment.js';
import { createPitch } from './pitch.js';
import { createStands } from './stands.js';
import { createFloodlights } from './floodlights.js';
import { CameraRig } from './camera.js';

export function createStadium(container) {
  const world = createScene(container);
  const { scene, camera, renderer } = world;

  scene.add(
    createEnvironment(),
    createPitch(renderer.capabilities.getMaxAnisotropy()),
    createStands(),
    createFloodlights(),
  );

  const rig = new CameraRig(camera, renderer.domElement);
  rig.applyPose(rig.overviewPose());

  // בזמן פיתוח בלבד: גישה מהקונסול לבדיקות (window.__stadium)
  if (import.meta.env.DEV) window.__stadium = { scene, camera, renderer, rig };

  let last = performance.now();
  renderer.setAnimationLoop((now) => {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    rig.update(dt);
    world.render();
  });

  return {
    playIntro: () => rig.playIntro(),
    skipIntro: () => rig.skipIntro(),
    dispose() {
      renderer.setAnimationLoop(null);
      rig.dispose();
      world.dispose();
    },
  };
}
