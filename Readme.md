# About

This project was motivated by a simple frustration. I love skiing (we both do), and my dream is to carve bigg clean turns, hip on the snow, down a wide-open slope enjoying the beautiful view. But, everytime I try to compare my skiing with a top skier I have to go through a lot. I have to go back and forth between videos, look for the exact frame, and repeat this so many times to analyse what's looking good and what's not. Also, it is often the case that the camera angle and distance isn't exactly the same (mine might be taken from down the slope but the other might be taken from across the slope), making an analysis so much more tiring than it should be.

Random-skier is a web platform that seeks to address this. The user can upload a short video of them making a (carved) turn, and the server reconstructs their movement as a 3D model, then the browser renders it side-by-side with a top skier, with lots of additional features so that the user can analyse their skiing through an interactive 3D experience.

# Our Approach

## Server-Side Computation

Our reconstruction pipeline is built on SAM-Body4D, which is a training-free framework for temporally consistent 4D human mesh reconstruction (HMR) from videos, proposed in a recent paper by Gao et al., 2025. Under the hood, it's a composite pipeline that uses SAM 3 for masking, diffusion-VAS for handling occlusions, and SAM 3D Body for HMR at each frame.

## Browser-Side Rendering

We're going to use Three.js

# Acknowledgements

This project builds on the work of Gao et al. (2025) and the broader ecosystem of SAM‑based models, diffusion methods, and human mesh reconstruction research. Their contributions make this project possible.

