import { createCamera } from './utils/camera.js';
import { createRenderer } from './utils/renderer.js';
import { resizeRendererToDisplaySize } from './utils/resize.js';
import { createScene } from './utils/hero-scene.js';
import { loadSkier } from './utils/skier-loader.js'
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "../styles/main.css";


import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger);

export async function setupHero() {

    const canvas = document.getElementById('hero-canvas');
    const renderer = createRenderer(canvas, true);
    const scene = createScene();
    const camera = createCamera();
    camera.position.set(0, 0, -10);
    camera.lookAt(0, 0, 0);

    const { mixer, clips } = await loadSkier(scene);

    const clip = clips[0];
    const duration = clip.duration;
    const action = mixer.clipAction(clip);
    action.play();

    const timer = new THREE.Timer();
    const animationProgress = { time: 0 };

    function introAnimation(){

        document.body.style.overflow = "hidden";

        const introTL = gsap.timeline({
            onComplete: () => {
                document.body.style.overflowY = "auto";
                document.body.style.overflowX = "hidden";
                scrollAnimation();
            }
        });
        introTL
            .to(
                '.loader', 
                {y: '100%', duration: 0.8, ease: "power4.inOut", 
                 delay: 1}
            )
            .to(
                animationProgress,
                {
                    time: duration / 2, 
                    duration: 4, 
                    onUpdate: () => {
                        mixer.setTime(animationProgress.time);
                        render();
                    }
                }, 
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
        		trigger: '.hero-container',
        		pin: true, // pin the trigger element while active
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
            {opacity: 0, y: '-100%', ease: "power1.out", duration: 0.6}, 
            0 // Timestamp is converted to scrol percentage
        )
        .fromTo(
            '.intro-container', 
            {opacity: 1, xPercent: 0}, 
            {opacity: 0, xPercent: 100, ease: "power4.inOut", duration: 1}, 
            "<"
        )
        .to(
            animationProgress, 
            {
                time: duration * 0.9999, 
                duration: 1,
                onUpdate: () => {
                    mixer.setTime(animationProgress.time);
                    render();
                } 
            },
            "-=0.5"
        )
        .fromTo(
            '.instruction-container', 
            {opacity: 0, xPercent: -100}, 
            {opacity: 1, xPercent: 0, ease: "power4.out", duration: 1}, 
            "-=0.6"
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

