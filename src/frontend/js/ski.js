import { createScene } from './ski-scene.js';
import { createCamera } from './utils/camera.js';
import { createControls } from './utils/controls.js';
import { createRenderer } from './utils/renderer.js';
import { resizeRendererToDisplaySize } from './utils/resize.js';

export function setupSki() {

    const canvas = document.getElementById('ski-canvas');

    const renderer = createRenderer(canvas, false);
    const scene = createScene();

    const camera = createCamera({x: 0, y: 0.1, z: 0.1});
    const controls = createControls(camera, canvas);

	function render() {

		if ( resizeRendererToDisplaySize( renderer ) ) {

			const canvas = renderer.domElement;
			camera.aspect = canvas.clientWidth / canvas.clientHeight;
			camera.updateProjectionMatrix();

		}

		renderer.render( scene, camera );

		requestAnimationFrame( render );

	}

	requestAnimationFrame( render );

}