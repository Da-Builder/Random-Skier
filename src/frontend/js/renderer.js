import * as THREE from 'three';

export function createRenderer(canvas) {
    
    return new THREE.WebGLRenderer( { 
        antialias: true, // Smoothen edges
        canvas // Use an existing canvas
    } );
    
}

