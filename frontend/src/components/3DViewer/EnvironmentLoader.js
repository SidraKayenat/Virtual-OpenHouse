// src/components/3DViewer/EnvironmentLoader.js

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ENVIRONMENT_MODELS } from "./utils/constants";

export class EnvironmentLoader {
  constructor(scene) {
    this.scene = scene;
    this.loader = new GLTFLoader();
    this.currentEnvironment = null;
  }

  async loadEnvironment(environmentType) {
    // Remove existing environment
    if (this.currentEnvironment) {
      this.scene.remove(this.currentEnvironment);
    }

    const modelPath = ENVIRONMENT_MODELS[environmentType];

    if (!modelPath) {
      console.warn(
        `Environment type "${environmentType}" not found. Using plain ground.`,
      );
      return this.createPlainGround();
    }

    try {
      const gltf = await this.loadModel(modelPath);
      this.currentEnvironment = gltf.scene;
      this.currentEnvironment.position.set(0, -50, 0);
      this.scene.add(this.currentEnvironment);
      return this.currentEnvironment;
    } catch (error) {
      console.error("Failed to load environment:", error);
      return this.createPlainGround();
    }
  }

  loadModel(path) {
    return new Promise((resolve, reject) => {
      this.loader.load(
        path,
        (gltf) => resolve(gltf),
        undefined,
        (error) => reject(error),
      );
    });
  }

  createPlainGround() {
    // Fallback: create simple ground plane
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 140),
      new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 1 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -50;
    this.scene.add(floor);
    this.currentEnvironment = floor;
    return floor;
  }
}
