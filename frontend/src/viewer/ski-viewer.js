import { createCamera } from '../graphics/camera.js';
import { createControls } from '../graphics/controls.js';
import { createRenderer } from '../graphics/renderer.js';
import { createScene } from './scene.js';
import { createScrubber } from './scrubber.js'
import { loadSkier } from '../graphics/skier-loader.js';

export async function initSkiViewer() {

    const canvas = document.getElementById('ski-viewer-canvas');
    const renderer = createRenderer(canvas, false);
    const scene = createScene();
    const camera = createCamera();
    const controls = createControls(camera, canvas);

    camera.position.set(0, 1, -10);
    camera.lookAt(0, 0, 0);

    const {mixer, clips} = await loadSkier(scene, '/skier-with-animation.glb');

    const action = mixer.clipAction(clips[0]);

    // Show the first frame
    mixer.setTime(0);
    action.play();

    const scrubber = createScrubber(mixer, clips, action, renderer, scene, camera, controls);

}