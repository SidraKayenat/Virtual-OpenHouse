import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { STALL_CONFIG, HALL_DIMENSIONS } from "./utils/constants";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";

export class StallManager {
  constructor(scene) {
    this.scene = scene;
    this.loader = new GLTFLoader();
    this.stalls = [];
    this.mixers = [];
    this.labels = [];
  }

  async createStalls(stallCount, stallData) {
    const positions = this.calculateStallPositions(stallCount);

    for (let i = 0; i < stallCount; i++) {
      const position = positions[i];
      const data = stallData[i] || { id: i + 1, name: `Stall ${i + 1}` };
      await this.createSingleStall(
        position.x,
        position.z,
        data,
        position.rotation,
      );
    }
  }

  /* ================= STALL POSITIONING ================= */

  calculateStallPositions(count) {
    const positions = [];

    const PADDING = 30;
    const maxX = HALL_DIMENSIONS.WIDTH - PADDING;
    const maxZ = HALL_DIMENSIONS.DEPTH - PADDING;

    const walls = [
      {
        name: "top",
        fixedAxis: "z",
        fixedVal: -maxZ + 150,
        spreadAxis: "x",
        spreadMax: maxX,
        rotation: Math.PI,
        spacing: 60,
      },
      {
        name: "bottom",
        fixedAxis: "z",
        fixedVal: maxZ - 150,
        spreadAxis: "x",
        spreadMax: maxX,
        rotation: 0,
        spacing: 60,
      },
      {
        name: "left",
        fixedAxis: "x",
        fixedVal: -maxX,
        spreadAxis: "z",
        spreadMax: maxZ,
        rotation: -Math.PI / 2,
        spacing: 40,
      },
      {
        name: "right",
        fixedAxis: "x",
        fixedVal: maxX,
        spreadAxis: "z",
        spreadMax: maxZ,
        rotation: Math.PI / 2,
        spacing: 40,
      },
    ];

    const stallsPerWall = this.distributeStalls(count, walls, maxX, maxZ);

    let stallIndex = 0;

    for (let w = 0; w < walls.length; w++) {
      const wall = walls[w];
      const wallCount = stallsPerWall[w];
      if (wallCount === 0) continue;

      const spreadMax = wall.spreadAxis === "x" ? maxX : maxZ;
      const wallSpacing = wall.spacing;
      const totalWidth = (wallCount - 1) * wallSpacing;
      const startSpread = -Math.min(totalWidth / 2, spreadMax - PADDING);

      for (let i = 0; i < wallCount; i++) {
        const spreadVal = startSpread + i * wallSpacing;
        const clampedSpread = Math.max(
          -spreadMax + PADDING,
          Math.min(spreadMax - PADDING, spreadVal),
        );

        const x = wall.fixedAxis === "x" ? wall.fixedVal : clampedSpread;
        const z = wall.fixedAxis === "z" ? wall.fixedVal : clampedSpread;

        positions.push({ x, z, rotation: wall.rotation });
        stallIndex++;

        if (stallIndex >= count) break;
      }

      if (stallIndex >= count) break;
    }

    // Overflow stalls go to center grid
    if (stallIndex < count) {
      const overflowPositions = this.calculateCenterGrid(
        count - stallIndex,
        60,
      );
      positions.push(...overflowPositions);
    }

    return positions;
  }

  distributeStalls(count, walls, maxX, maxZ) {
    const capacities = [
      Math.floor((maxX * 2) / walls[0].spacing), // top
      Math.floor((maxX * 2) / walls[1].spacing), // bottom
      Math.floor((maxZ * 2) / walls[2].spacing), // left
      Math.floor((maxZ * 2) / walls[3].spacing), // right
    ];

    const result = [0, 0, 0, 0];
    let remaining = count;

    let wallIndex = 0;
    const totalCapacity = capacities.reduce((a, b) => a + b, 0);

    while (remaining > 0) {
      const wall = wallIndex % 4;
      if (result[wall] < capacities[wall]) {
        result[wall]++;
        remaining--;
      }
      wallIndex++;

      if (result.reduce((a, b) => a + b, 0) >= totalCapacity) break;
    }

    return result;
  }

  calculateCenterGrid(count, spacing) {
    const positions = [];
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);

    const startX = (-(cols - 1) * spacing) / 2;
    const startZ = (-(rows - 1) * spacing) / 2;

    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;

      const x = Math.max(
        -(HALL_DIMENSIONS.WIDTH - 50),
        Math.min(HALL_DIMENSIONS.WIDTH - 50, startX + col * spacing),
      );
      const z = Math.max(
        -(HALL_DIMENSIONS.DEPTH - 50),
        Math.min(HALL_DIMENSIONS.DEPTH - 50, startZ + row * spacing),
      );

      positions.push({ x, z, rotation: 0 });
    }

    return positions;
  }

  createLabel(x, z, name) {
    const div = document.createElement("div");
    div.textContent = name;
    div.style.cssText = `
    background: rgba(0, 0, 0, 0.65);
    color: white;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 13px;
    font-family: sans-serif;
    font-weight: 500;
    white-space: nowrap;
    pointer-events: none;
    border: 1px solid rgba(255,255,255,0.15);
  `;

    const label = new CSS2DObject(div);
    // HITBOX_SIZE is 38, SCALE is 7 — position label above stall
    label.position.set(x + 3, 28, z); // 👈 tweak y if too high/low
    this.scene.add(label);
    this.labels.push(label);
  }

  /* ================= STALL CREATION ================= */

  async createSingleStall(x, z, stallData, rotation = 0) {
    try {
      const gltf = await this.loadStallModel();
      const model = gltf.scene;

      model.scale.set(
        STALL_CONFIG.SCALE,
        STALL_CONFIG.SCALE,
        STALL_CONFIG.SCALE,
      );
      model.position.set(x, 0, z);
      model.rotation.y = rotation;

      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.scene.add(model);

      const hitbox = this.createHitbox(x, z, stallData);
      this.stalls.push(hitbox);

      this.createLabel(x, z, stallData.name || `Stall ${stallData.id}`);

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
        (error) => reject(error),
      );
    });
  }

  createHitbox(x, z, stallData) {
    const hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(
        STALL_CONFIG.HITBOX_SIZE - 15,
        STALL_CONFIG.HITBOX_SIZE,
        STALL_CONFIG.HITBOX_SIZE - 15,
      ),
      new THREE.MeshBasicMaterial({
        visible: false,
      }),
    );
    hitbox.position.set(x + 2, 3, z);
    hitbox.userData = stallData;
    this.scene.add(hitbox);
    return hitbox;
  }

  /* ================= UPDATE / DISPOSE ================= */

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
    this.labels.forEach((label) => {
      // 👈 add this block
      this.scene.remove(label);
      label.element.remove();
    });
    this.stalls = [];
    this.mixers = [];
  }
}
