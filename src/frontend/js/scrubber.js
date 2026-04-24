import * as THREE from 'three';

export function createScrubber(gltf, renderer, scene, camera, controls) {
    const mixer = new THREE.AnimationMixer(gltf.scene);
    const clips = gltf.animations;

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
    const clock = new THREE.Clock(false); // false = don't auto-start

    // --- Build the scrubber UI ---
    const bar = document.createElement('div');
    bar.style.cssText = `
        position: absolute;
        bottom: 0; left: 0; right: 0;
        height: 48px;
        background: rgba(0,0,0,0.55);
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 16px;
        box-sizing: border-box;
        font-family: sans-serif;
    `;

    const playBtn = document.createElement('button');
    playBtn.textContent = '▶';
    playBtn.style.cssText = `
        background: none;
        border: 1px solid rgba(255,255,255,0.4);
        color: #fff;
        border-radius: 4px;
        width: 32px; height: 32px;
        cursor: pointer;
        font-size: 14px;
        flex-shrink: 0;
    `;

    const scrubInput = document.createElement('input');
    scrubInput.type = 'range';
    scrubInput.min = 0;
    scrubInput.max = 1000; // internal units — mapped to clip duration
    scrubInput.value = 0;
    scrubInput.style.cssText = `flex: 1; cursor: pointer;`;

    const timeLabel = document.createElement('span');
    timeLabel.style.cssText = `color: #fff; font-size: 12px; min-width: 72px; text-align: right;`;
    timeLabel.textContent = `0.00 / ${duration.toFixed(2)}s`;

    bar.appendChild(playBtn);
    bar.appendChild(scrubInput);
    bar.appendChild(timeLabel);

    // The canvas's parent needs position:relative for the bar to anchor correctly
    const container = renderer.domElement.parentElement;
    container.style.position = 'relative';
    container.appendChild(bar);

    // --- Helpers ---
    function setMixerTime(t) {
        mixer.setTime(t);
        scrubInput.value = (t / duration) * 1000;
        timeLabel.textContent = `${t.toFixed(2)} / ${duration.toFixed(2)}s`;
    }

    function renderFrame() {
        controls.update();
        renderer.render(scene, camera);
    }

    // --- Loop ---
    function animate() {
        frameId = requestAnimationFrame(animate);
        const delta = clock.getDelta();
        mixer.update(delta);

        // Keep scrubber in sync while playing
        const t = mixer.time % duration;
        scrubInput.value = (t / duration) * 1000;
        timeLabel.textContent = `${t.toFixed(2)} / ${duration.toFixed(2)}s`;

        renderFrame();
    }

    function start() {
        if (isPlaying) return;
        isPlaying = true;
        clock.start();
        playBtn.textContent = '⏸';
        animate();
    }

    function stop() {
        if (frameId) cancelAnimationFrame(frameId);
        isPlaying = false;
        clock.stop();
        playBtn.textContent = '▶';
        renderFrame(); // draw one final frame so display doesn't freeze
    }

    // --- Events ---
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
        renderFrame();
    });

    // Render the first frame so the canvas isn't blank
    renderFrame();

    return { start, stop, setMixerTime };
}