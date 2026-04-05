import * as THREE from "three";
import { ENVIRONMENT_MODELS } from "./utils/constants";

export class EnvironmentLoader {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.textureLoader = new THREE.TextureLoader();
    this.currentEnvironment = null;
  }

  

  async loadEnvironment(environmentType, customBackgroundUrl = null) {
    this.clearEnvironment();

    // If custom URL provided, use it directly as skybox
  if (customBackgroundUrl) {
    try {
      return await this.load360Image(customBackgroundUrl);
    } catch (error) {
      console.error("Failed to load custom skybox:", error);
      return this.createPlainGround();
    }
  }
  
    const path = ENVIRONMENT_MODELS[environmentType];

    if (!path) {
      console.warn(`Environment type "${environmentType}" not found. Using plain ground.`);
      return this.createPlainGround();
    }

    const extension = path.split(".").pop().toLowerCase();
    const supported = ["jpg", "jpeg", "png", "webp", "avif"];

    if (!supported.includes(extension)) {
      console.warn(`Unsupported format "${extension}". Using plain ground.`);
      return this.createPlainGround();
    }

    try {
      return await this.load360Image(path);
    } catch (error) {
      console.error("Failed to load 360 environment:", error);
      return this.createPlainGround();
    }
  }

  /* ================= 360 IMAGE ================= */

  load360Image(path) {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        path,
        (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          texture.colorSpace = THREE.SRGBColorSpace;

          this.scene.environment = texture;
          this.scene.background = texture;

          this.currentEnvironment = texture;
          console.log("✅ 360 environment loaded:", path);
          resolve(texture);
        },
        undefined,
        reject
      );
    });
  }

  /* ================= CLEANUP ================= */

  clearEnvironment() {
    if (!this.currentEnvironment) return;

    this.scene.environment = null;
    this.scene.background = null;
    this.currentEnvironment.dispose?.();
    this.currentEnvironment = null;
  }

  /* ================= FALLBACK ================= */

  
}