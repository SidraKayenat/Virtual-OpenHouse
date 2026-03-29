import * as THREE from "three";
import { CAMERA_CONFIG } from "./utils/constants";

export class CameraController {
  constructor(camera, controls) {
    this.camera = camera;
    this.controls = controls;
    this.interacting = false;
    this.returning = false; // 👈 new state
    this.focusTarget = new THREE.Vector3();
    this.lastTarget = new THREE.Vector3();

    // Saved state for smooth return
    this.savedCameraPosition = new THREE.Vector3(); // 👈
    this.savedTarget = new THREE.Vector3();          // 👈

    this.controls.maxPolarAngle = CAMERA_CONFIG.MAX_POLAR_ANGLE;
    this.controls.minPolarAngle = CAMERA_CONFIG.MIN_POLAR_ANGLE;
    this.controls.enableDamping = true;

    this._tempVec = new THREE.Vector3();
    this._targetOffset = new THREE.Vector3(0, 2, 0);
  }

  isInteracting() {
    return this.interacting;
  }

  focusOn(position) {
    // Save where camera is RIGHT NOW before zooming in
    this.savedCameraPosition.copy(this.camera.position);
    this.savedTarget.copy(this.controls.target);

    this.focusTarget.copy(position);
    this.interacting = true;
    this.returning = false;
    this.controls.enabled = false;
  }

  releaseFocus() {
    // Don't snap — start smooth return instead
    this.interacting = false;
    this.returning = true;   // 👈 trigger return lerp
    this.controls.enabled = false; // keep controls off during return
  }

  update(deltaTime, playerPosition) {
    if (!playerPosition) return;

    if (this.interacting) {
      // Lerp toward stall
      const offset = CAMERA_CONFIG.FOCUS_OFFSET;
      this._tempVec.set(
        this.focusTarget.x + offset.x,
        this.focusTarget.y + offset.y,
        this.focusTarget.z + offset.z
      );
      this.camera.position.lerp(this._tempVec, 0.05);
      this.controls.target.lerp(this.focusTarget, 0.05);

    } else if (this.returning) {
      // Smoothly lerp back to saved position
      this.camera.position.lerp(this.savedCameraPosition, 0.08);
      this.controls.target.lerp(this.savedTarget, 0.08);

      // Check if close enough to consider done
      const dist = this.camera.position.distanceTo(this.savedCameraPosition);
      if (dist < 0.5) {
        this.camera.position.copy(this.savedCameraPosition);
        this.controls.target.copy(this.savedTarget);
        this.returning = false;
        this.controls.enabled = true; // 👈 re-enable controls only when fully back
      }

    } else {
      // Normal follow player mode
      this.lastTarget.copy(this.controls.target);

      this._tempVec.copy(playerPosition).add(this._targetOffset);
      this.controls.target.lerp(this._tempVec, 0.1);

      this._tempVec.copy(this.controls.target).sub(this.lastTarget);
      this.camera.position.add(this._tempVec);
    }

    this.controls.update();
  }
}