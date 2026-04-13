import { createCamera } from './camera.js';
import { createControls } from './controls.js';
import { createScene } from './scene.js';
import { createRenderer } from './renderer.js';
import { resizeRendererToDisplaySize } from './resize.js';
import { setupHero } from './hero.js'

function main() {

    window.history.scrollRestoration = "manual";

    window.addEventListener("beforeunload", () => {
        window.scrollTo(0, 0);
    });
    
    window.addEventListener("load", () => {
        window.scrollTo(0, 0);
    });


    setupHero() 
    

}

main()