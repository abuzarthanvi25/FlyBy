import * as THREE from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise';
import gsap from 'gsap';

class FlyByApp {
  constructor() {
    this.sizes = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#81dbff"); // Softer blue for a more balanced anime feel
    this.scene.fog = new THREE.Fog(0xFFFFFF, 80, 300); // Add fog for depth and blending effect

    this.renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('.webgl'), antialias: true });
    this.renderer.outputEncoding = THREE.sRGBEncoding; // Improve texture quality
    this.renderer.shadowMap.enabled = true;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for better performance
    this.renderer.setSize(this.sizes.width, this.sizes.height);

    this.camera = new THREE.PerspectiveCamera(45, this.sizes.width / this.sizes.height, 1, 500);
    this.camera.position.set(0, 20, -30);

    this.uiDebugger = new DebugUI();
    this.mixers = []
    this.terrainSegments = new Map(); // Use a map to track segments by their keys
    this.cloudSegments = new Map(); // Track cloud segments by their keys
    this.jellyFishSegments = new Map(); // Track cloud segments by their keys
    this.keysPressed = {};
    this.segmentSize = 100;
    this.previousColorHue = 0.3;
    this.colorChangeSpeed = 0.001; // Slower color change speed for smoother transition
    this.lastUpdatePosition = new THREE.Vector3(); // Track last position for updates
    this.updateThreshold = 50; // Distance threshold for terrain/cloud updates
    this.particleMovementState = 'normal'; // Track particle movement state
    this.maxFlyingHeight = 60; // Maximum height the UFO can fly

    this.init();
  }

  async init() {
    this.addLoader();
    this.addLighting();
    this.generateInitialTerrain();
    this.addFlyingUFO();
    this.controlsEnabled = false; // Disable controls until initial animation completes
    this.addEventListeners();
    this.onWindowResize();
    this.animate();
    
  }

  addLighting() {
    const ambientLight = new THREE.HemisphereLight(0xffffe0, 0x606060, 0.8); // Softer ambient light for balanced lighting
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Neutral directional light to avoid harsh shadows
    directionalLight.position.set(30, 50, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    this.scene.add(directionalLight);
  }

  generateInitialTerrain() {
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        this.generateOptimizedTerrain(i * this.segmentSize, j * this.segmentSize);
        this.generateClouds(i * this.segmentSize, j * this.segmentSize);
        this.generateParticles(i * this.segmentSize, j * this.segmentSize);
      }
    }
  }

  generateOptimizedTerrain(offsetX = 0, offsetZ = 0) {
    const terrainKey = `${offsetX}_${offsetZ}`;
    if (this.terrainSegments.has(terrainKey)) return; // Avoid regenerating existing terrain
  
    const terrainWidth = this.segmentSize;
    const terrainDepth = this.segmentSize;
    const geometry = new THREE.PlaneGeometry(terrainWidth, terrainDepth, 32, 32); // Increased segments for smoother appearance
    geometry.rotateX(-Math.PI / 2);
  
    const vertices = geometry.attributes.position.array;
    const improvedNoise = new ImprovedNoise();
    const scale = 0.03;
    const heightScale = 10; // Increased height scale for rolling hills effect
  
    const colors = [];
    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i] + offsetX;
      const z = vertices[i + 2] + offsetZ;
      const noiseValue = improvedNoise.noise(x * scale, 0, z * scale);
      vertices[i + 1] = noiseValue * heightScale;
  
      // Create a vibrant gradient color based on the height (y value)
      const height = vertices[i + 1];
      const color = new THREE.Color();
      const gradientFactor = (height + heightScale) / (2 * heightScale); // Normalize height for gradient factor
      const hue = (x + offsetZ) * 0.0005 + 0.9; // Dynamic hue based on position for more variation
      color.setHSL(hue % 1, 1, 0.5 + 0.01 * gradientFactor); // Set color using HSL for a vibrant gradient effect
  
      colors.push(color.r, color.g, color.b);
    }
  
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.4, // Reduced roughness for a more vibrant look
      metalness: 0.1, // Slight metalness for a shiny effect
    });
  
    const terrain = new THREE.Mesh(geometry, material);
    terrain.position.set(offsetX, 0, offsetZ);
    terrain.receiveShadow = true;

    // Add outline effect to terrain
    const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide });
    const outlineMesh = new THREE.Mesh(geometry, outlineMaterial);
    outlineMesh.scale.set(1.02, 1.02, 1.02); // Slightly larger to create an outline effect
    terrain.add(outlineMesh);
    
    this.scene.add(terrain);
    this.terrainSegments.set(terrainKey, terrain);
  }
  

  addFlyingUFO() {
    const loader = new GLTFLoader();
    loader.load('models/ufo.glb', (gltf) => {
      this.flyingUFO = gltf.scene;
      this.flyingUFO.position.set(0, 100, 0);
      this.flyingUFO.scale.set(2, 2, 2); // Scale the UFO to appropriate size
      this.flyingUFO.castShadow = true;
      this.scene.add(this.flyingUFO);
      this.initialUFOAnimation(); // Start animation only after UFO is loaded
    });

    this.flyingDirection = new THREE.Vector3();
    this.flyingSpeed = 0.5;
    this.rotationSpeed = 0.05;
  }

  generateClouds(offsetX = 0, offsetZ = 0) {
    const cloudKey = `cloud_${offsetX}_${offsetZ}`;
    if (this.cloudSegments.has(cloudKey)) return; // Avoid regenerating existing clouds
  
    const cloudGroup = new THREE.Group();
    const cloudMaterial = new THREE.MeshToonMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 + Math.random() * 0.3 }); // Random opacity for clouds between 0.5 and 0.8
  
    for (let i = 0; i < 3; i++) {
      const cloud = new THREE.Group();
  
      for (let j = 0; j < 3; j++) {
        const cloudPartGeometry = new THREE.SphereGeometry(5 + Math.random() * 3, 16, 16);
        const cloudPart = new THREE.Mesh(cloudPartGeometry, cloudMaterial);
        cloudPart.position.set(
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 10
        );
        cloud.add(cloudPart);
  
      }
  
      cloud.position.set(
        offsetX + Math.random() * this.segmentSize - this.segmentSize / 2,
        20 + Math.random() * 10,
        offsetZ + Math.random() * this.segmentSize - this.segmentSize / 2
      );
  
      cloudGroup.add(cloud);
    }
  
    this.scene.add(cloudGroup);
    this.cloudSegments.set(cloudKey, cloudGroup);
  }

  animateClouds() {
    const switchDirectionInterval = 6000; // 4 seconds in milliseconds
    if (!this.cloudDirection) {
      this.cloudDirection = 1;
      setInterval(() => {
        this.cloudDirection *= -1; // Switch direction every 4 seconds
      }, switchDirectionInterval);
    }
  
    this.cloudSegments.forEach((cloudGroup) => {
      cloudGroup.position.x += this.cloudDirection * 0.06; // Move in the current direction
      
    });
  }
  
  initialUFOAnimation() {
    gsap.to(this.flyingUFO.position, {
      y: 15,
      duration: 3,
      ease: 'bounce.out',
      onComplete: () => {
        this.controlsEnabled = true;
      }
    });
  }

  addEventListeners() {
    window.addEventListener('keydown', (event) => this.handleKeyDown(event));
    window.addEventListener('keyup', (event) => this.handleKeyUp(event));
  }

  handleKeyDown(event) {
    this.keysPressed[event.key] = true;
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'w' || event.key === 's') {
      this.particleMovementState = 'opposite'; // Change particle movement when flying
      this.addMotionLines(); // Add toon motion lines when flying
    }
  }

  handleKeyUp(event) {
    this.keysPressed[event.key] = false;
    if (!this.keysPressed['ArrowUp'] && !this.keysPressed['ArrowDown'] && !this.keysPressed['w'] && !this.keysPressed['s']) {
      this.particleMovementState = 'normal'; // Resume normal particle movement when not flying
      this.removeMotionLines(); // Remove toon motion lines when flying stops
    }
  }

  addMotionLines() {
    if (!this.motionLines) {
      this.motionLines = new THREE.Group();
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 50, transparent: true, opacity: 0.5 });
      for (let i = 0; i < 10; i++) {
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3((Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, -30)
        ]);
        const line = new THREE.Line(lineGeometry, lineMaterial);
        this.motionLines.add(line);
      }
      this.flyingUFO.add(this.motionLines);
    }
  }

  removeMotionLines() {
    if (this.motionLines) {
      this.flyingUFO.remove(this.motionLines);
      this.motionLines = null;
    }
  }

  getTerrainHeightAt(x, z) {
    let height = 0;
    this.terrainSegments.forEach((terrain) => {
      const terrainPosition = terrain.position;
      const halfSize = this.segmentSize / 2;
      if (
        x >= terrainPosition.x - halfSize &&
        x <= terrainPosition.x + halfSize &&
        z >= terrainPosition.z - halfSize &&
        z <= terrainPosition.z + halfSize
      ) {
        const geometry = terrain.geometry;
        const vertices = geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
          const vx = vertices[i] + terrainPosition.x;
          const vz = vertices[i + 2] + terrainPosition.z;
          if (Math.abs(vx - x) < 1 && Math.abs(vz - z) < 1) {
            height = Math.max(height, vertices[i + 1]);
          }
        }
      }
    });
    return height;
  }

  updateFlyingUFO() {
    if (!this.flyingUFO) return;
    if (this.keysPressed['ArrowUp']) {
      this.flyingDirection.z = 1;
    } else if (this.keysPressed['ArrowDown']) {
      this.flyingDirection.z = -1;
    } else {
      this.flyingDirection.z = 0;
    }

    if (this.keysPressed['ArrowLeft']) {
      this.flyingUFO.rotation.y += this.rotationSpeed;
    }

    if (this.keysPressed['ArrowRight']) {
      this.flyingUFO.rotation.y -= this.rotationSpeed;
    }

    if (this.keysPressed['w']) {
      this.flyingDirection.y = 1;
    } else if (this.keysPressed['s']) {
      this.flyingDirection.y = -1;
    } else {
      this.flyingDirection.y = 0;
    }

    const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(this.flyingUFO.quaternion);
    direction.multiplyScalar(this.flyingDirection.z * this.flyingSpeed);
    this.flyingUFO.position.add(direction);
    this.flyingUFO.position.y += this.flyingDirection.y * this.flyingSpeed;

    // Ensure UFO does not pass through the terrain
    const terrainHeight = this.getTerrainHeightAt(this.flyingUFO.position.x, this.flyingUFO.position.z);
    if (this.flyingUFO.position.y < terrainHeight + 5) { // Maintain a minimum height above terrain
      this.flyingUFO.position.y = terrainHeight + 5;
    }

    // Ensure UFO does not exceed maximum height
    if (this.flyingUFO.position.y > this.maxFlyingHeight) {
      this.flyingUFO.position.y = this.maxFlyingHeight;
    }

    // Update terrain and clouds only if the flying UFO has moved a significant distance
    if (this.lastUpdatePosition.distanceTo(this.flyingUFO.position) > this.updateThreshold) {
      this.updateTerrain();
      this.updateClouds();
      this.lastUpdatePosition.copy(this.flyingUFO.position);
    }
  }

  updateTerrain() {
    const currentPosition = this.flyingUFO.position;
    const segmentRange = 2; // Reduced segment range to reduce the number of segments loaded at once

    // Generate new terrain segments in the vicinity of the cube
    for (let i = -segmentRange; i <= segmentRange; i++) {
      for (let j = -segmentRange; j <= segmentRange; j++) {
        const offsetX = Math.floor((currentPosition.x + i * this.segmentSize) / this.segmentSize) * this.segmentSize;
        const offsetZ = Math.floor((currentPosition.z + j * this.segmentSize) / this.segmentSize) * this.segmentSize;
        this.generateOptimizedTerrain(offsetX, offsetZ);
        this.generateClouds(offsetX, offsetZ);
        this.generateParticles(offsetX, offsetZ);
      }
    }

    // Remove old terrain segments that are far away
    this.terrainSegments.forEach((segment, key) => {
      if (currentPosition.distanceTo(segment.position) > this.segmentSize * (segmentRange + 1)) {
        this.scene.remove(segment);
        segment.geometry.dispose();
        segment.material.dispose();
        this.terrainSegments.delete(key);
      }
    });
  }

  updateClouds() {
    const currentPosition = this.flyingUFO.position;
    const segmentRange = 8; // Increase segment range to ensure clouds remain consistently visible

    // Remove old cloud segments that are far away
    this.cloudSegments.forEach((cloudGroup, key) => {
      const cloudPosition = new THREE.Vector3(cloudGroup.position.x, cloudGroup.position.y, cloudGroup.position.z);
      if (currentPosition.distanceTo(cloudPosition) > this.segmentSize * (segmentRange + 5)) {
        this.scene.remove(cloudGroup);
        cloudGroup.children.forEach((cloud) => {
          if (cloud.geometry) cloud.geometry.dispose();
          if (cloud.material) cloud.material.dispose();
        });
        this.cloudSegments.delete(key);
      }
    });
  }

  updateCamera() {
    if (!this.flyingUFO) return;
    const offset = new THREE.Vector3(0, 10, -20).applyQuaternion(this.flyingUFO.quaternion); // Adjusted offset for better view
    const desiredPosition = this.flyingUFO.position.clone().add(offset);
    this.camera.position.lerp(desiredPosition, 0.1);
    this.camera.lookAt(this.flyingUFO.position);
  }

  addLoader() {
    const loadingManager = new THREE.LoadingManager();
    const progressBar = document.getElementById('progress-bar');
    const progressBarContainer = document.getElementById('progress-bar-container');

    loadingManager.onStart = function () {
      progressBarContainer.style.display = 'block';
    };

    loadingManager.onLoad = function () {
      progressBarContainer.style.display = 'none';
    };

    loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
      progressBar.value = (itemsLoaded / itemsTotal) * 100;
    };

    this.loader = new GLTFLoader(loadingManager);
  }

  onWindowResize() {
    window.addEventListener("resize", () => {
      this.sizes.width = window.innerWidth;
      this.sizes.height = window.innerHeight;

      this.camera.aspect = this.sizes.width / this.sizes.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.sizes.width, this.sizes.height);
    });
  }

  generateParticles(offsetX = 0, offsetZ = 0) {
    const particleKey = `particle_${offsetX}_${offsetZ}`;
    if (this.particleSegments && this.particleSegments.has(particleKey)) return; // Avoid regenerating existing particles
  
    if (!this.particleSegments) {
      this.particleSegments = new Map();
    }
  
    const particleGroup = new THREE.Group();
    const particleMaterial = new THREE.MeshToonMaterial({
      color: new THREE.Color(Math.random(), Math.random(), Math.random()), // Random color for each particle,
      transparent: true,
      opacity: 0.8
    });
  
    for (let i = 0; i < 10; i++) {
      const particleGeometry = new THREE.SphereGeometry(0.2 + Math.random() * 0.5, 8, 8);
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.set(
        offsetX + Math.random() * this.segmentSize - this.segmentSize / 2,
        10 + Math.random() * 30,
        offsetZ + Math.random() * this.segmentSize - this.segmentSize / 2
      );
      particleGroup.add(particle);
    }
  
    this.scene.add(particleGroup);
    this.particleSegments.set(particleKey, particleGroup);
  }
  
  animateParticles() {
    if (this.particleSegments) {
      this.particleSegments.forEach((particleGroup) => {
        particleGroup.children.forEach((particle) => {
          if (this.particleMovementState === 'opposite') {
            const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(this.flyingUFO.quaternion);
            direction.multiplyScalar(0.1); // Move in the opposite direction of the UFO
            particle.position.add(direction);
          } else {
            particle.position.x += 0.03; // Normal random horizontal movement
            particle.position.z += 0.03; // Normal random depth movement
          }

          // Add outline to the particle
          if (particle.outline) return;
          const outlineGeometry = new THREE.SphereGeometry(particle.geometry.parameters.radius * 1.1, 8, 8);
          const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide });
          const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
          particle.add(outline);
          particle.outline = outline;
        });
      });
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Update all mixers
    this.mixers.forEach(mixer => {
      mixer.update(this.clock.getDelta());
    });

    this.updateFlyingUFO();
    this.updateCamera();
    this.animateClouds();
    this.animateParticles();

    this.renderer.render(this.scene, this.camera);
  }
}

new FlyByApp();
