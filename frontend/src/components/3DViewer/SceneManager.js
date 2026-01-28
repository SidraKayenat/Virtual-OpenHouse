// src/components/3DViewer/SceneManager.js

import * as THREE from "three";
import { SCENE_CONFIG, HALL_DIMENSIONS } from "./utils/constants";

export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(
      SCENE_CONFIG.FOG_COLOR,
      SCENE_CONFIG.FOG_DENSITY,
    );
    this.setupLighting();
    this.setupSkybox();
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

  setupSkybox() {
    const loader = new THREE.CubeTextureLoader();
    this.scene.background = loader.load([
      "/textures/skybox/px.jpg",
      "/textures/skybox/nx.jpg",
      "/textures/skybox/py.jpg",
      "/textures/skybox/ny.jpg",
      "/textures/skybox/pz.jpg",
      "/textures/skybox/nz.jpg",
    ]);
  }

  createFloor() {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(HALL_DIMENSIONS.WIDTH, HALL_DIMENSIONS.DEPTH),
      new THREE.MeshStandardMaterial({
        color: 0x777777,
        roughness: 1,
        metalness: 0.1,
      }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -50;
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  getScene() {
    return this.scene;
  }
}
