import * as THREE from 'three'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export function loadSkier(scene) {
    
    return new Promise((resolve, reject) => {
        
        const loader = new GLTFLoader();
        loader.load(
            './assets/skier-with-animation.glb',
            (gltf) => {
                const skier = gltf.scene;
                
                // Blender's z-up (stupid) coord to the standard y-up coord 
                skier.rotation.x = -Math.PI / 2;
                
                scene.add(skier);
                const mixer = new THREE.AnimationMixer(gltf.scene);
                const clips = gltf.animations

                resolve({ mixer, clips }); // ← pass everything back
            },
            undefined,
            (error) => reject(error) // ← handle load failures
        );
        
    });
    
}