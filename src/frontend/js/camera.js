import * as THREE from 'three';

export function createCamera() {
    
    const fov = 45;
    const aspect = 2; // temporary, updated later
    const near = 0.1;
    const far = 200;
    
    const camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
    camera.position.set( 0, 10, 20 );

    return camera;
    
}
