import * as THREE from 'three';

export function createScene() {

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#BED7E6')
    

    // Plane
 //    {

	// 	const planeSize = 40;

	// 	const loader = new THREE.TextureLoader();
	// 	const texture = loader.load( 'https://threejs.org/manual/examples/resources/images/checker.png' );
	// 	texture.wrapS = THREE.RepeatWrapping;
	// 	texture.wrapT = THREE.RepeatWrapping;
	// 	texture.magFilter = THREE.NearestFilter;
	// 	//texture.colorSpace = THREE.SRGBColorSpace;
	// 	const repeats = planeSize / 2;
	// 	texture.repeat.set( repeats, repeats );

	// 	const planeGeo = new THREE.PlaneGeometry( planeSize, planeSize );
	// 	const planeMat = new THREE.MeshPhongMaterial( {
	// 		map: texture,
	// 		side: THREE.DoubleSide,
	// 	} );
	// 	const mesh = new THREE.Mesh( planeGeo, planeMat );
 //        mesh.position.y = -5;
	// 	mesh.rotation.x = (Math.PI / 180) * (-100) ;
	// 	scene.add( mesh );

	// }

    // Lighting
    {

		const light = new THREE.DirectionalLight( 0xFFFFFF, 3 );
		light.position.set( 0, 10, 0 );
		light.target.position.set( - 10, 0, 10 );
		scene.add( light );
		scene.add( light.target );
        
        const ambient = new THREE.AmbientLight(0xFFFFFF, 1);
        scene.add(ambient);

	}

    return scene;
    
}
    
