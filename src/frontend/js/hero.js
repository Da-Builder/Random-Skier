import { createCamera } from './camera.js';
import { createScene } from './scene.js';
import { createRenderer } from './renderer.js';
import { resizeRendererToDisplaySize } from './resize.js';
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "../styles/main.scss"

gsap.registerPlugin(ScrollTrigger);

export function heroAnimation() {

    const canvas = document.getElementById('hero-canvas');

    const renderer = createRenderer(canvas);
    const camera = createCamera();
    const scene = createScene();

    const cube = scene.getObjectByName('cube');
    const position = cube.position;

    function introAnimation(){

        const introTL = gsap.timeline({
            onComplete: () => {
                scrollAnimation();
            }
        });
        introTL
            .to(
                '.loader', 
                {y: '100%', duration: 0.8, ease: "power4.inOut", 
                 delay: 1}
            )
            .fromTo(
                position, 
                {x: 8, y: 2, z: -4}, 
                {x: -6, y: 2, z: 10, duration: 4, onUpdate: render}, 
                '-=0.8'
            )
            .fromTo(
                '.header-container', 
                {opacity: 0, y: '-100%'}, 
                {opacity: 1, y: '0%', ease: "power1.inOut", duration: 0.8}, 
                '-=1'
            )
            .fromTo(
                '.intro-container', 
                {opacity: 0, x: '100%'}, 
                {opacity: 1, x: '0%', ease: "power4.inOut", duration: 1.8}, 
                '-=1'
            )
 
    }


    function scrollAnimation() {

        const scrollTL = gsap.timeline({
        	scrollTrigger: {
        		trigger: '#hero-container',
        		pin: true, // pin the trigger element while active
                pinSpacing: false,
        		start: 'top top',
        		end: '200% top',
        		scrub: 1,
                onUpdate: render,
        	}
        });
    
        scrollTL
        .fromTo(
            '.header-container', 
            {opacity: 1, y: '0%'}, 
            {opacity: 0, y: '-100%', ease: "power1.Out", duration: 0.6}, 
            0
        )
        .fromTo(
            '.intro-container', 
            {opacity: 1, xPercent: 0}, 
            {opacity: 0, xPercent: 100, ease: "power4.inOut", duration: 1}, 
            "<"
        )
        .fromTo(
            position, 
            {x: -6, y: 2, z: 10}, 
            {x: 6, y: 4, z: 12, ease: "power4.out", onUpdate: render, duration: 1},
            0.5
        )
        .fromTo(
            '.instruction-container', 
            {opacity: 0, xPercent: -100}, 
            {opacity: 1, xPercent: 0, ease: "power4.out", duration: 1}, 
            0.8
        )
        
    }

    
    function render() {
        
		if ( resizeRendererToDisplaySize( renderer ) ) {
			const canvas = renderer.domElement;
			camera.aspect = canvas.clientWidth / canvas.clientHeight;
			camera.updateProjectionMatrix();
		}
		renderer.render( scene, camera );
        
    }


    introAnimation()

}

