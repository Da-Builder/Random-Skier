import { createCamera } from './camera.js';
import { createControls } from './controls.js';
import { createScene } from './scene.js';
import { createRenderer } from './renderer.js';
import { resizeRendererToDisplaySize } from './resize.js';


function main() {

	const canvas = document.querySelector( '#ski' );

    const renderer = createRenderer(canvas);
    const camera = createCamera();
    const controls = createControls(camera, canvas);
    const scene = createScene();

	function render() {
        
        // If the size of the canvas changes
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

main()