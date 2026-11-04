import * as THREE from 'three';
import { resizeRendererToDisplaySize } from './resize.js';

export function createScrubber(mixer, clips, action, renderer, scene, camera, controls) {

    const duration = clips[0].duration;
    let isPlaying = false;
    let frameId = null;
    const timer = new THREE.Timer();

    const playBtn = document.getElementById('play-button');
    const scrubInput = document.getElementById('scrub-input');
    const timeLabel = document.getElementById('time-label');
    timeLabel.textContent = `0:00 / ${duration.toFixed(2)}`;

    renderLoop();
    
    function renderLoop() {
        
		if ( resizeRendererToDisplaySize( renderer ) ) {

			const canvas = renderer.domElement;
			camera.aspect = canvas.clientWidth / canvas.clientHeight;
			camera.updateProjectionMatrix();

		}

        controls.update();

        renderer.render(scene, camera);
        requestAnimationFrame(renderLoop);

    }
    
    function animateTick() {
        if (!isPlaying) return;
        frameId = requestAnimationFrame(animateTick);
        timer.update()
        const delta = timer.getDelta();
        mixer.update(delta * playbackSpeed);
        const t = mixer.time % duration;
        const val = (t / duration) * 1000;
        scrubInput.value = val;
        updateTrackFill(val);
        timeLabel.textContent = `${t.toFixed(2)} / ${duration.toFixed(2)}`;
    }
    
    function start() {
        if (isPlaying) return;
        isPlaying = true;
        timer.update();
        animateTick();
    }
    
    function stop() {
        if (frameId) cancelAnimationFrame(frameId);
        isPlaying = false;
        timer.update();
    }

    function updateTrackFill(val) {
        // val is 0–1000, so clamp it between 0–100
        scrubInput.style.setProperty('--progress', val / 10);
    }

    function setMixerTime(t) {
        mixer.setTime(t);
        const val = (t / duration) * 1000;
        scrubInput.value = val;
        updateTrackFill(val);
        timeLabel.textContent = `${t.toFixed(2)} / ${duration.toFixed(2)}`;
    }

    // Events
    playBtn.addEventListener('click', () => {
        isPlaying ? stop() : start();
        document.getElementById('play-icon').style.display = isPlaying ? 'none' : 'block';
        document.getElementById('pause-icon').style.display = isPlaying ? 'block' : 'none';

    });

    // While dragging: pause and seek
    scrubInput.addEventListener('mousedown', () => {
        if (isPlaying) stop();
        document.getElementById('play-icon').style.display = isPlaying ? 'none' : 'block';
        document.getElementById('pause-icon').style.display = isPlaying ? 'block' : 'none';
    });
    
    scrubInput.addEventListener('touchstart', () => {
        if (isPlaying) stop();
    });

    scrubInput.addEventListener('input', () => {
        const t = (scrubInput.value / 1000) * duration;
        setMixerTime(t);
    });

    // Speed control
    let playbackSpeed = 1;
    const speedBtn = document.getElementById('speed-button');
    const speedLabel = document.getElementById('speed-label');
    const speedMenu = document.getElementById('speed-menu');
    const speedOptions = document.querySelectorAll('.speed-option');
 
    speedBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        speedMenu.classList.toggle('open');
    });
 
    document.addEventListener('click', () => {
        speedMenu.classList.remove('open');
    });
 
    speedOptions.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            playbackSpeed = parseFloat(btn.dataset.speed);
            speedLabel.textContent = btn.textContent;
            speedOptions.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            speedMenu.classList.remove('open');
        });
    });
    

    return { start, stop, setMixerTime };
}