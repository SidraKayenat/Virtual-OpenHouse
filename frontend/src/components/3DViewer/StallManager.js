// src/components/3DViewer/StallManager.js

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { STALL_CONFIG, HALL_DIMENSIONS } from './utils/constants';

export class StallManager {
  constructor(scene) {
    this.scene = scene;
    this.loader = new GLTFLoader();
    this.stalls = [];
    this.mixers = [];
  }

  /**
   * Create stalls based on event configuration
   * @param {number} stallCount - Number of stalls to create
   * @param {Array} stallData - Array of stall data from API
   */
  async createStalls(stallCount, stallData) {
    const positions = this.calculateStallPositions(stallCount);

    for (let i = 0; i < stallCount; i++) {
      const position = positions[i];
      const data = stallData[i] || { id: i + 1, name: `Stall ${i + 1}` };
      
      await this.createSingleStall(position.x, position.z, data);
    }
  }

  /**
   * Calculate optimal stall positions based on count
   */
  calculateStallPositions(count) {
    const positions = [];
    const MARGIN = 10;
    const STALL_SPACING = 25;

    // Calculate rows and columns
    const stallsPerRow = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / stallsPerRow);

    const startX = -(stallsPerRow - 1) * STALL_SPACING / 2;
    const startZ = -(rows - 1) * STALL_SPACING / 2;

    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / stallsPerRow);
      const col = i % stallsPerRow;

      positions.push({
        x: startX + col * STALL_SPACING,
        z: startZ + row * STALL_SPACING,
      });
    }

    return positions;
  }

  async createSingleStall(x, z, stallData) {
    try {
      const gltf = await this.loadStallModel();
      const model = gltf.scene;
      
      model.scale.set(STALL_CONFIG.SCALE, STALL_CONFIG.SCALE, STALL_CONFIG.SCALE);
      model.position.set(x, 0, z);
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      this.scene.add(model);

      // Create invisible hitbox for raycasting
      const hitbox = this.createHitbox(x, z, stallData);
      this.stalls.push(hitbox);

      // Setup animations if any
      if (gltf.animations.length) {
        const mixer = new THREE.AnimationMixer(model);
        mixer.clipAction(gltf.animations[0]).play();
        this.mixers.push(mixer);
      }

    } catch (error) {
      console.error(`Failed to load stall at (${x}, ${z}):`, error);
    }
  }

  loadStallModel() {
    return new Promise((resolve, reject) => {
      this.loader.load(
        STALL_CONFIG.DEFAULT_MODEL,
        (gltf) => resolve(gltf),
        undefined,
        (error) => reject(error)
      );
    });
  }

  createHitbox(x, z, stallData) {
    const hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(
        STALL_CONFIG.HITBOX_SIZE,
        STALL_CONFIG.HITBOX_SIZE,
        STALL_CONFIG.HITBOX_SIZE
      ),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.position.set(x, 3, z);
    hitbox.userData = stallData; // Store stall data in hitbox
    this.scene.add(hitbox);
    return hitbox;
  }

  update(deltaTime) {
    this.mixers.forEach((mixer) => mixer.update(deltaTime));
  }

  getStalls() {
    return this.stalls;
  }

  dispose() {
    this.stalls.forEach((stall) => {
      this.scene.remove(stall);
      stall.geometry.dispose();
      stall.material.dispose();
    });
    this.stalls = [];
    this.mixers = [];
  }
}