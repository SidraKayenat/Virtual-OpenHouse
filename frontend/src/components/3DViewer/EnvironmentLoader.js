
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";
import { ENVIRONMENT_MODELS } from "./utils/constants";

export class EnvironmentLoader {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;

    this.gltfLoader = new GLTFLoader();
    this.exrLoader = new EXRLoader();

    this.currentEnvironment = null;
  }

  async loadEnvironment(environmentType) {
    // Clean previous environment
    this.clearEnvironment();

    const path = ENVIRONMENT_MODELS[environmentType];

    if (!path) {
      console.warn(
        `Environment type "${environmentType}" not found. Using plain ground.`,
      );
      return this.createPlainGround();
    }

    const extension = path.split(".").pop().toLowerCase();

    try {
      if (extension === "glb" || extension === "gltf") {
        return await this.loadGLTFEnvironment(path);
      }

      if (extension === "exr") {
        return await this.loadEXREnvironment(path);
      }

      console.warn("Unsupported environment format:", extension);
      return this.createPlainGround();
    } catch (error) {
      console.error("Failed to load environment:", error);
      return this.createPlainGround();
    }
  }

  /* ================= GLTF ENV ================= */

  loadGLTFEnvironment(path) {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        path,
        (gltf) => {
          this.currentEnvironment = gltf.scene;
          this.currentEnvironment.position.set(0, -50, 0);
          this.scene.add(this.currentEnvironment);
          resolve(this.currentEnvironment);
        },
        undefined,
        reject,
      );
    });
  }

  /* ================= EXR ENV ================= */

  loadEXREnvironment(path) {
    return new Promise((resolve, reject) => {
      this.exrLoader.load(
        path,
        (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;

          this.scene.environment = texture;
          this.scene.background = texture; // remove if you want lighting only

          this.currentEnvironment = texture;
          resolve(texture);
        },
        undefined,
        reject,
      );
    });
  }

  /* ================= CLEANUP ================= */

  clearEnvironment() {
    if (!this.currentEnvironment) return;

    if (this.currentEnvironment.isObject3D) {
      this.scene.remove(this.currentEnvironment);
    } else {
      this.scene.environment = null;
      this.scene.background = null;
      this.currentEnvironment.dispose?.();
    }

    this.currentEnvironment = null;
  }

  /* ================= FALLBACK ================= */

  createPlainGround() {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 140),
      new THREE.MeshStandardMaterial({
        color: 0x777777,
        roughness: 1,
      }),
    );

    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -50;

    this.scene.add(floor);
    this.currentEnvironment = floor;

    return floor;
  }
}
