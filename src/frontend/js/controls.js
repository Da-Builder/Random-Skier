import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createControls(camera, canvas) {
    
    const controls = new OrbitControls(camera, canvas);
    
    controls.target.set(0, 5, 0);
    controls.update();
    
    return controls;
    
}