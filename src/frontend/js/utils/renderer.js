import * as THREE from 'three';

export function createRenderer(canvas, transparentBG = false) {
    
    const renderer = new THREE.WebGLRenderer( { 
        canvas, // Use an existing canvas
        antialias: true, // Smoothen edges
        alpha: transparentBG
    } );

    if (transparentBG) {
        renderer.setClearAlpha(0);
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

    return renderer
    
}

