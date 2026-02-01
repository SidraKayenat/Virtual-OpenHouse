// src/components/3DViewer/PlayerController.js

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { PLAYER_CONFIG, HALL_DIMENSIONS } from "./utils/constants";

export class PlayerController {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.player = new THREE.Object3D();
    this.scene.add(this.player);

    this.keys = {};
    this.mixer = null;
    this.walkAction = null;
    this.activeAction = null;

    this.setupInputListeners();
    this.loadPlayerModel();
  }

  setupInputListeners() {
    window.addEventListener("keydown", (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  async loadPlayerModel() {
    const loader = new GLTFLoader();

    try {
      const gltf = await new Promise((resolve, reject) => {
        loader.load(
          "/models/avatar.glb",
          resolve,
          undefined,
          reject,
        );
      });

      this.scene.remove(this.player);
      this.player = gltf.scene;
      this.player.scale.set(
        PLAYER_CONFIG.SCALE,
        PLAYER_CONFIG.SCALE,
        PLAYER_CONFIG.SCALE,
      );
      this.scene.add(this.player);

      if (gltf.animations.length) {
        this.mixer = new THREE.AnimationMixer(this.player);
        const walkAnim =
          gltf.animations.find((a) => a.name.toLowerCase().includes("walk")) ||
          gltf.animations[0];

        this.walkAction = this.mixer.clipAction(walkAnim);
      }
    } catch (error) {
      console.error("Failed to load player model:", error);
    }
  }

  update(deltaTime) {
    this.mixer?.update(deltaTime);
    this.handleMovement(deltaTime);
  }

  handleMovement(deltaTime) {
    let x = 0,
      z = 0;

    if (this.keys.w || this.keys.arrowup) z++;
    if (this.keys.s || this.keys.arrowdown) z--;
    if (this.keys.a || this.keys.arrowleft) x++;
    if (this.keys.d || this.keys.arrowright) x--;

    const moving = x !== 0 || z !== 0;

    // Handle walk animation
    if (this.mixer && this.walkAction) {
      if (moving && this.activeAction !== this.walkAction) {
        this.walkAction.reset().play();
        this.activeAction = this.walkAction;
      } else if (!moving && this.activeAction) {
        this.walkAction.stop();
        this.activeAction = null;
      }
    }

    if (!moving) return;

    // Calculate movement direction
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(new THREE.Vector3(0, 1, 0), forward).normalize();

    const moveDir = new THREE.Vector3();
    moveDir.addScaledVector(forward, z);
    moveDir.addScaledVector(right, x);
    moveDir.normalize();

    // Move player
    this.player.position.addScaledVector(
      moveDir,
      PLAYER_CONFIG.SPEED * deltaTime,
    );
    this.player.rotation.y = Math.atan2(moveDir.x, moveDir.z);

    // Clamp to hall boundaries
    const hw = HALL_DIMENSIONS.WIDTH / 2 - 1;
    const hd = HALL_DIMENSIONS.DEPTH / 2 - 1;
    this.player.position.x = this.clamp(this.player.position.x, -hw, hw);
    this.player.position.z = this.clamp(this.player.position.z, -hd, hd);
  }

  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  getPosition() {
    return this.player.position;
  }

  dispose() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
  }
}
