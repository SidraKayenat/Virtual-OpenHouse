// src/components/3DViewer/SceneManager.js

import * as THREE from "three";
import { SCENE_CONFIG } from "./utils/constants";

export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(
      SCENE_CONFIG.FOG_COLOR,
      SCENE_CONFIG.FOG_DENSITY,
    );
    this.setupLighting();
  }

  setupLighting() {
    // Hemisphere light for ambient lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    this.scene.add(hemiLight);

    // Directional light (sun)
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    this.scene.add(dirLight);
  }

  getScene() {
    return this.scene;
  }
}
