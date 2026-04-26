import { initHero } from './hero.js'
import { initSkiViewer } from './ski-viewer.js'

function main() {

    window.history.scrollRestoration = "manual";

    window.addEventListener("beforeunload", () => {
        window.scrollTo(0, 0);
    });
    
    window.addEventListener("load", () => {
        window.scrollTo(0, 0);
    });

    initHero() 

    initSkiViewer()

}

main()