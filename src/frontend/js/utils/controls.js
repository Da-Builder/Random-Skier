import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createControls(camera, canvas) {
    
    const controls = new OrbitControls(camera, canvas);
    
    controls.target.set(0, 0, 0); // CHANGE LATER TO - SET IT TO THE MESH
    controls.enableDamping = true; 
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.5;
    controls.maxDistance = 10;
    controls.update();
    
    return controls;
    
}