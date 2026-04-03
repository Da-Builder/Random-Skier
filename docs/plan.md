# Plan

This document outlines the high-level idea. Refer to the Issues tab for the specific tasks and implementation details. 

## UI

Create a web UI where the user can upload a short video of them skiing. Hopefully we can make it look somewhat nice.

## Computation

Do all the computations on the server. 

Process:

- 3D pose estimation of the user based on the uploaded video
- Generate a body mesh representing the user's movement
- Identify key body parts (shoulders, hips, knees, ankles etc)
- Package the resulting mesh into a format suitable for rendering on browser

Potential challenges:

- The camera angle, distance, and resolution migght vary between videos
- Normalise (?) the coordinate system so that skiers on different terrains can be compared side-by-side 

## Rendering

Render the 3D interactive environment on the browser probably using Three.js. 

Key features:

- Display the user's reconstructed mesh next to the top skier, everything in sync (whatever you do to one, applies to the other)
- Playback controls:
    - Play
    - Pause
    - Frame-by-frame stepping (forward and backward)
    - Slow motion
- Camera control
    - Orbit
    - Pan
    - Zoom
    - Reset
- Highlight key body parts
    - Show key joints (shoulders, hips, knees, ankles etc) as vertices
    - Connect them with lines to show how they're moving