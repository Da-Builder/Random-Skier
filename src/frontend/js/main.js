import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initHero } from "./hero.js";
import { initSkiViewer } from "./ski-viewer.js";

import "/styles/main.css";

gsap.registerPlugin(ScrollTrigger);

function main() {
    window.history.scrollRestoration = "manual";
    
    window.addEventListener("beforeunload", () => {
        window.scrollTo(0, 0);
    });
    
    window.addEventListener("load", () => {
        window.scrollTo(0, 0);
    });

    // document.querySelector('.loader').style.display = 'none';
    // onHeroComplete();
    initHero(onHeroComplete);

    function onHeroComplete() {

        initSkiViewer();

        gsap.set('.video-uploader', {opacity: 0, y: '200%'})
        gsap.set('.processing', {opacity: 0, y: '200%'})
        gsap.set('#ski-viewer-container', {opacity: 0, y: '100%'})
        
        const mainTL = gsap.timeline({
            scrollTrigger: {
                trigger: '.main-container',
                start: '75% bottom',
            },
        });
    
        mainTL
            .to(
                '.video-uploader',
                {opacity: 1, y: '0%', ease: "power4.out", duration: 3}
            )
            .to(
                '.video-uploader',
                {opacity: 0, ease: "power4.out", duration: 1}
            )
            .to(
                '.processing',
                {opacity: 1, y: '0%', ease: "power4.out", duration: 3},
                '-=1'
            )
            .to(
                '.processing',
                {opacity: 0, ease: "power4.out", duration: 1}
            )
            .to(
                "#ski-viewer-container",
                {opacity: 1, y: '0%', ease: "power4.out", duration: 3},
                '-=0.5'
            )

    }
    
    
}

main();
