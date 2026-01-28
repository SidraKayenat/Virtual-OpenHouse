// src/components/3DViewer/CameraController.js

import * as THREE from "three";

export class CameraController {
  constructor(camera, controls) {
    this.camera = camera;
    this.controls = controls;
    this.interacting = false;
    this.focusTarget = new THREE.Vector3();
  }

  focusOn(position) {
    this.focusTarget.copy(position);
    this.interacting = true;
    this.controls.enabled = false;
  }

  releaseFocus() {
    this.interacting = false;
    this.controls.enabled = true;
  }

  isInteracting() {
    return this.interacting;
  }

  update(deltaTime, playerPosition) {
    if (this.interacting) {
      // Smooth camera movement to stall
      const desiredPos = this.focusTarget
        .clone()
        .add(new THREE.Vector3(0, 6, 10));
      this.camera.position.lerp(desiredPos, 0.05);
      this.controls.target.lerp(this.focusTarget, 0.05);
    } else {
      // Follow player
      this.controls.target.lerp(playerPosition, 0.12);
    }
  }
}
