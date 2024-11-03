# FlyBy

FlyBy is an immersive 3D experience where you pilot a UFO over dynamic voxel terrain, navigating through rolling hills, drifting clouds, and interacting with lively particles—all powered by Three.js. This project brings a vibrant, anime-inspired aesthetic to life, featuring smooth transitions, responsive controls, and dynamic scenery.

## Project Overview

**FlyBy** is a real-time, interactive 3D application built entirely using Three.js. It creates a dynamic and engaging visual experience as you control a UFO navigating over procedurally generated terrain. The scene features rolling hills, animated clouds, and colorful particles, creating a vibrant world to explore.

### Key Features
- **UFO Controls**: Pilot a UFO with smooth movement controls, including rotation, ascent, and descent.
- **Dynamic Voxel Terrain**: The terrain is procedurally generated and updated based on the UFO's movement, providing a rich and varied landscape.
- **Clouds and Particles**: Animated clouds drift across the sky, and particles respond to the UFO's movement, adding to the immersive experience.
- **Toon Motion Lines**: Motion lines are generated while flying to enhance the sense of speed and movement.
- **Fog and Lighting Effects**: Soft lighting and fog provide depth and atmosphere to the scene.

## Technologies Used
- **Three.js**: Core 3D rendering library used to create the scene, objects, and animations.
- **GSAP**: For smooth animations, including the UFO's initial bounce effect and other transitions.
- **GLTFLoader**: For loading 3D models such as the UFO.
- **ImprovedNoise**: To generate realistic height variations in the terrain.

### This was a test project initially, to check ChatGPT-4o's capabilities and how ideas can be brought to code seamlessly

## How It Was Built
This project was almost entirely built by ChatGPT, with assistance provided by the developer where needed. The entire Vite architecture was done by the dev - Muhammad Abuzar Thanvi, but the 3D experience from rendering pipeline to animation logic, was designed and implemented by ChatGPT, showcasing the capabilities of AI in developing complex interactive applications. The developer assisted by integrating specific assets, making minor adjustments, and ensuring compatibility with the project requirements.

### Developer Contributions
- Asset integration, including 3D models and textures.
- Testing and debugging for performance optimization.
- Minor adjustments to parameters for a more immersive feel.

## Getting Started
To run the project locally:
1. Clone this repository.
2. Install dependencies (e.g., Three.js, GSAP).
3. Open the `index.html` file in a browser to view the project.

### Prerequisites
- A modern web browser.
- Node.js and npm (optional, if setting up a local server).

### Installation
```sh
# Clone the repository
git clone https://github.com/yourusername/flyby.git

# Navigate into the directory
cd flyby

# Install dependencies (if applicable)
npm install
