// src/components/3DViewer/CameraController.js
import * as THREE from "three";
import { PLAYER_CONFIG, CAMERA_CONFIG } from "./utils/constants";

export class CameraController {
  constructor(camera, controls) {
    this.camera = camera;
    this.controls = controls;
    this.interacting = false;
    this.focusTarget = new THREE.Vector3();
    this.lastTarget = new THREE.Vector3();

    // Set constraints from constants
    this.controls.maxPolarAngle = CAMERA_CONFIG.MAX_POLAR_ANGLE;
    this.controls.minPolarAngle = CAMERA_CONFIG.MIN_POLAR_ANGLE;
    this.controls.enableDamping = true;

    this._tempVec = new THREE.Vector3();
    this._targetOffset = new THREE.Vector3(0, 2, 0); // Offset to look at torso
  }

  // This is the function the error was complaining about
  isInteracting() {
    return this.interacting;
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

  update(deltaTime, playerPosition) {
    if (!playerPosition) return;

    if (this.interacting) {
      // Smooth movement to stall
      const offset = CAMERA_CONFIG.FOCUS_OFFSET;
      this._tempVec.set(
        this.focusTarget.x + offset.x,
        this.focusTarget.y + offset.y,
        this.focusTarget.z + offset.z
      );

      this.camera.position.lerp(this._tempVec, 0.05);
      this.controls.target.lerp(this.focusTarget, 0.05);
    } else {
      // Follow player while maintaining rotation
      this.lastTarget.copy(this.controls.target);
      
      this._tempVec.copy(playerPosition).add(this._targetOffset);
      this.controls.target.lerp(this._tempVec, 0.1);

      this._tempVec.copy(this.controls.target).sub(this.lastTarget);
      this.camera.position.add(this._tempVec);
    }
    
    this.controls.update();
  }
}