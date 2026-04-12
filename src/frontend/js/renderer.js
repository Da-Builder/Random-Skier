import * as THREE from 'three';

export function createRenderer(canvas) {
    
    const renderer = new THREE.WebGLRenderer( { 
        canvas, // Use an existing canvas
        antialias: true, // Smoothen edges
        alpha: true
    } );

    renderer.setClearAlpha(0);

    return renderer
    
}

