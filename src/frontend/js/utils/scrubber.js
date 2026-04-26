import * as THREE from 'three';
import { resizeRendererToDisplaySize } from './resize.js';

export function createScrubber(mixer, clips, renderer, scene, camera, controls) {

    if (!clips || clips.length === 0) {
        console.warn('No animation clips found in GLB.');
        return null;
    }

    // Play the first clip, paused at t=0
    const clip = clips[0];
    const action = mixer.clipAction(clip);
    action.play();
    mixer.setTime(0);

    const duration = clip.duration;
    let isPlaying = false;
    let frameId = null;
    const timer = new THREE.Timer();

    const scrubber = document.getElementById('scrubber');
    const playBtn = document.getElementById('play-button');
    const scrubInput = document.getElementById('scrub-input');
    const timeLabel = document.getElementById('time-label');
    timeLabel.textContent = `0.00 / ${duration.toFixed(2)}`;

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
        mixer.update(delta);
        const t = mixer.time % duration;
        scrubInput.value = (t / duration) * 1000;
        timeLabel.textContent = `${t.toFixed(2)} / ${duration.toFixed(2)}`;
    }
    
    function start() {
        if (isPlaying) return;
        isPlaying = true;
        timer.update();
        playBtn.textContent = '⏸';
        animateTick();
    }
    
    function stop() {
        if (frameId) cancelAnimationFrame(frameId);
        isPlaying = false;
        timer.update();
        playBtn.textContent = '▶';
    }

    function setMixerTime(t) {
        mixer.setTime(t);
        scrubInput.value = (t / duration) * 1000;
        timeLabel.textContent = `${t.toFixed(2)} / ${duration.toFixed(2)}`;
    }

    // Events
    playBtn.addEventListener('click', () => {
        isPlaying ? stop() : start();
    });

    // While dragging: pause and seek
    scrubInput.addEventListener('mousedown', () => {
        if (isPlaying) stop();
    });
    scrubInput.addEventListener('touchstart', () => {
        if (isPlaying) stop();
    });

    scrubInput.addEventListener('input', () => {
        const t = (scrubInput.value / 1000) * duration;
        setMixerTime(t);
    });

    return { start, stop, setMixerTime };
}