import * as THREE from 'three';

export function createScene() {

    const scene = new THREE.Scene()
    // scene.background = new THREE.Color('#BED7E6')

 //    // Plane
 //    {

	// 	const planeSize = 40;

	// 	const loader = new THREE.TextureLoader();
	// 	const texture = loader.load( 'js/resources/images/checker.png' );
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
	// 	mesh.rotation.x = Math.PI * - .5;
	// 	scene.add( mesh );

	// }

    // Cube
    {

		const cubeSize = 4;
		const cubeGeo = new THREE.BoxGeometry( cubeSize, cubeSize, cubeSize );
		const cubeMat = new THREE.MeshPhongMaterial( { color: '#8AC' } );
		const mesh = new THREE.Mesh( cubeGeo, cubeMat );
		mesh.position.set( 8, cubeSize / 2, -4 );
        mesh.name = 'cube';
		scene.add( mesh );

	}

    // Sphere
 //    {

	// 	const sphereRadius = 3;
	// 	const sphereWidthDivisions = 32;
	// 	const sphereHeightDivisions = 16;
	// 	const sphereGeo = new THREE.SphereGeometry( sphereRadius, sphereWidthDivisions, sphereHeightDivisions );
	// 	const sphereMat = new THREE.MeshPhongMaterial( { color: '#CA8' } );
	// 	const mesh = new THREE.Mesh( sphereGeo, sphereMat );
	// 	mesh.position.set( - sphereRadius - 1, sphereRadius + 2, 0 );
	// 	scene.add( mesh );

	// }

    // Lighting
    {

		const color = 0xFFFFFF;
		const intensity = 3;
		const light = new THREE.DirectionalLight( color, intensity );
		light.position.set( 0, 10, 0 );
		light.target.position.set( - 5, 0, 0 );
		scene.add( light );
		scene.add( light.target );

        const ambient = new THREE.AmbientLight(0xffffff, 0.1);
        scene.add(ambient);
	}

    return scene;
    
}