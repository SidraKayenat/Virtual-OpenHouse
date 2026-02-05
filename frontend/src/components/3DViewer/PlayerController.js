import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { PLAYER_CONFIG } from "./utils/constants";

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

    // ]Function to check if controls should be disabled
    this.isUIOpen = () => false; // Default: UI not open

    this.setupInputListeners();
    this.loadPlayerModel();
  }

  setupInputListeners() {
    this.handleKeyDown = (e) => {
      //  IGNORE INPUT IF UI IS OPEN
      if (this.isUIOpen()) return;
      this.keys[e.key.toLowerCase()] = true;
    };

    this.handleKeyUp = (e) => {
      this.keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  async loadPlayerModel() {
    const loader = new GLTFLoader();

    try {
      const gltf = await new Promise((resolve, reject) => {
        loader.load("/models/avatar.glb", resolve, undefined, reject);
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

  //  ADD THIS METHOD
  setUIOpenCallback(callback) {
    this.isUIOpen = callback;
  }

  update(deltaTime) {
    this.mixer?.update(deltaTime);
    this.handleMovement(deltaTime);
  }

  handleMovement(deltaTime) {
    //  DON'T MOVE IF UI IS OPEN
    if (this.isUIOpen()) {
      // Stop walking animation if playing
      if (this.activeAction) {
        this.walkAction?.stop();
        this.activeAction = null;
      }
      return;
    }

    let x = 0,
      z = 0;

    if (this.keys.w || this.keys.arrowup) z++;
    if (this.keys.s || this.keys.arrowdown) z--;
    if (this.keys.a || this.keys.arrowleft) x++;
    if (this.keys.d || this.keys.arrowright) x--;

    const moving = x !== 0 || z !== 0;

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

    this.player.position.addScaledVector(
      moveDir,
      PLAYER_CONFIG.SPEED * deltaTime,
    );
    this.player.rotation.y = Math.atan2(moveDir.x, moveDir.z);

    const hw = 130 / 2 - 1;
    const hd = 140 / 2 - 1;
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
