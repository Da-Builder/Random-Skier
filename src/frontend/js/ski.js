import { createScene } from './utils/ski-scene.js';
import { loadSkier } from './utils/skier-loader.js';
import { createCamera } from './utils/camera.js';
import { createControls } from './utils/controls.js';
import { createRenderer } from './utils/renderer.js';

import { createScrubber } from './utils/scrubber.js'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export async function setupSki() {

    const canvas = document.getElementById('ski-canvas');

    const renderer = createRenderer(canvas, false);
    const scene = createScene();
    const camera = createCamera();
    camera.position.set(0, 0, -10);
    camera.lookAt(0, 0, 0);

    const controls = createControls(camera, canvas);

    const {mixer, clips} = await loadSkier(scene);

    createScrubber(mixer, clips, renderer, scene, camera, controls);

}