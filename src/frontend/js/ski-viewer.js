import { createCamera } from './utils/camera.js';
import { createControls } from './utils/controls.js';
import { createRenderer } from './utils/renderer.js';
import { createScene } from './utils/scene-ski.js';
import { createScrubber } from './utils/scrubber.js'
import { loadSkier } from './utils/skier-loader.js';

export async function initSkiViewer() {

    const canvas = document.getElementById('ski-canvas');
    const renderer = createRenderer(canvas, false);
    const scene = createScene();
    const camera = createCamera();
    const controls = createControls(camera, canvas);

    camera.position.set(0, 0, -10);
    camera.lookAt(0, 0, 0);

    const {mixer, clips} = await loadSkier(scene, './assets/skier-with-animation.glb');

    const scrubber = createScrubber(mixer, clips, renderer, scene, camera, controls);

}