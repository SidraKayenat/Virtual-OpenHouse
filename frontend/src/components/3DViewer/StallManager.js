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
    this.tileTexture = null;
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

    const PADDING = 50;
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

          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;

              if (child.name === "Plane001") {
                child.material = new THREE.MeshStandardMaterial({
                  color: new THREE.Color(0xd6cfc4),
                  roughness: 0.005, // very low = mirror-like
                  metalness: 0.8,
                  envMapIntensity: 1.5,
                });
              }
              if (child.name === "Plane001") {
                child.scale.set(2, 1, 2);
                child.material = new THREE.ShaderMaterial({
                  uniforms: {
                    tileSize: { value: 8.0 },
                    groutWidth: { value: 0.0 },
                    tileColor: { value: new THREE.Color(0xd6cfc4) },
                    groutColor: { value: new THREE.Color(0x888880) },

                    // Multiple lights for richer specular
                    light1Dir: {
                      value: new THREE.Vector3(1, 3, 1).normalize(),
                    },
                    light2Dir: {
                      value: new THREE.Vector3(-1, 2, -1).normalize(),
                    },
                    light3Dir: {
                      value: new THREE.Vector3(0, 5, 0).normalize(),
                    },

                    shininess: { value: 80.0 },
                    specularStrength: { value: 0.15 },
                    fresnelStrength: { value: 0.08 }, // edge glow like polished stone
                    cameraPos: { value: new THREE.Vector3() },
                  },
                  vertexShader: `
      varying vec3 vWorldPos;
      varying vec3 vNormal;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
                  fragmentShader: `
      uniform float tileSize;
      uniform float groutWidth;
      uniform vec3  tileColor;
      uniform vec3  groutColor;
      uniform vec3  light1Dir;
      uniform vec3  light2Dir;
      uniform vec3  light3Dir;
      uniform float shininess;
      uniform float specularStrength;
      uniform float fresnelStrength;
      uniform vec3  cameraPos;

      varying vec3 vWorldPos;
      varying vec3 vNormal;

      float blinnPhong(vec3 N, vec3 L, vec3 V, float power) {
        vec3 H = normalize(L + V);
        return pow(max(dot(N, H), 0.0), power);
      }

      void main() {
        // ── Tile pattern ──
        vec2 pos  = vec2(vWorldPos.x, vWorldPos.z);
        vec2 cell = fract(pos / tileSize);
        float gw  = groutWidth;
        bool isGrout = cell.x < gw || cell.x > (1.0 - gw)
                    || cell.y < gw || cell.y > (1.0 - gw);

        vec2  tileId    = floor(pos / tileSize);
        float variation = fract(sin(dot(tileId, vec2(12.9898, 78.233))) * 43758.5453) * 0.06;
        vec3  baseColor = isGrout ? groutColor : tileColor + variation;

        // ── Lighting vectors ──
        vec3 N = vec3(0.0, 1.0, 0.0); // floor always faces up
        vec3 V = normalize(cameraPos - vWorldPos);

        // ── Fresnel (grazing angle = more reflective, like real polished stone) ──
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0) * fresnelStrength;

        // ── Multi-light specular ──
        float spec = 0.0;
        spec += blinnPhong(N, light1Dir, V, shininess) * 1.0;
        spec += blinnPhong(N, light2Dir, V, shininess * 0.6) * 0.4;
        spec += blinnPhong(N, light3Dir, V, shininess * 1.5) * 0.6;
        spec *= specularStrength;
        if (isGrout) spec *= 0.04; // grout stays matte

        // ── Fake floor reflection: bright band near horizon ──
        // As V becomes more horizontal the floor appears brighter (like a mirror)
        float horizonGlow = pow(max(1.0 - abs(dot(N, V)), 0.0), 4.0) * 0.08; // was 0.35

        // ── Ambient + diffuse base ──
        float diff = max(dot(N, light1Dir), 0.0);
        vec3 ambient = 0.4 * baseColor;
        vec3 color   = ambient + 0.2 * diff * baseColor;

        // ── Add specular + fresnel + horizon ──
        color += spec * vec3(1.0, 0.98, 0.95);      // slightly warm highlight
        color += fresnel * vec3(0.9, 0.92, 1.0);     // cool fresnel rim
        color += horizonGlow * vec3(1.0, 0.98, 0.95);

        gl_FragColor = vec4(color, 1.0);
      }
    `,
                  side: THREE.DoubleSide,
                });
              }
            }
          });
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
