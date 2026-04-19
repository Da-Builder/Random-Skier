import { setupHero } from './hero.js'
import { setupSki } from './ski.js'

function main() {

    window.history.scrollRestoration = "manual";

    window.addEventListener("beforeunload", () => {
        window.scrollTo(0, 0);
    });
    
    window.addEventListener("load", () => {
        window.scrollTo(0, 0);
    });


    setupHero() 

    setupSki()

}

main()