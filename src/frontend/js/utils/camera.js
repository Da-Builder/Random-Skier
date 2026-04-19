import * as THREE from 'three';

export function createCamera(
    initialPosition = {x: 0, y: 10, z: 30},
    initialTarget = {x: 0, y: 0, z: 0}
) {
    
    const fov = 45;
    const aspect = 2; // temporary, updated later
    const near = 0.1;
    const far = 200;
    
    const camera = new THREE.PerspectiveCamera( fov, aspect, near, far );

    camera.position.set(initialPosition.x, initialPosition.y, initialPosition.z);
    camera.lookAt(initialTarget.x, initialTarget.y, initialTarget.z);

    return camera;
    
}
