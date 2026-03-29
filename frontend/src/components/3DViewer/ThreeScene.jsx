// src/components/3DViewer/ThreeScene.jsx

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { SceneManager } from "./SceneManager";
import { EnvironmentLoader } from "./EnvironmentLoader";
import { StallManager } from "./StallManager";
import { PlayerController } from "./PlayerController";
import { CameraController } from "./CameraController";
import { CAMERA_CONFIG } from "./utils/constants";

const ThreeScene = ({ eventData, onStallClick, isUIOpen }) => {
  // 🔥 Add isUIOpen prop
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!canvasRef.current || !eventData) return;

    console.log("🚀 ThreeScene initializing...");

    let animationId;
    const clock = new THREE.Clock();

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(
      CAMERA_CONFIG.FOV,
      window.innerWidth / window.innerHeight,
      CAMERA_CONFIG.NEAR,
      CAMERA_CONFIG.FAR,
    );
    camera.position.set(0, 10, 30);

    // Initialize scene
    const sceneManager = new SceneManager();
    const scene = sceneManager.getScene();

    // Initialize controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = CAMERA_CONFIG.MIN_DISTANCE;
    controls.maxDistance = CAMERA_CONFIG.MAX_DISTANCE;
    controls.maxPolarAngle = CAMERA_CONFIG.MAX_POLAR_ANGLE;
    controls.minPolarAngle = CAMERA_CONFIG.MIN_POLAR_ANGLE;

    // Initialize managers
    const environmentLoader = new EnvironmentLoader(scene, renderer);
    const stallManager = new StallManager(scene);
    const playerController = new PlayerController(scene, camera);
    const cameraController = new CameraController(camera, controls);

    // 🔥 SET UP UI OPEN CALLBACK
    playerController.setUIOpenCallback(() => isUIOpen);

    // Load environment and stalls
    const initializeScene = async () => {
      try {
        console.log("🌍 Loading environment...");
        await environmentLoader.loadEnvironment(
          eventData.environmentType || "plain_ground",
        );

        console.log("🏗️ Creating stalls...");
        await stallManager.createStalls(
          eventData.stallCount || eventData.numberOfStalls || eventData.stalls?.length || 0,
          eventData.stalls || [],
        );
        playerController.setHitboxes(stallManager.getStalls());

        console.log("✅ Scene initialization complete");
        setIsLoading(false);
      } catch (error) {
        console.error("❌ Failed to initialize scene:", error);
        setIsLoading(false);
      }
    };

    initializeScene();

    // Raycaster for stall interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (event) => {
      // 🔥 DON'T RAYCAST IF UI IS OPEN
      if (isUIOpen) {
        console.log("⏭️ UI is open, ignoring click");
        return;
      }

      if (cameraController.isInteracting()) {
        console.log("⏭️ Already interacting, ignoring click");
        return;
      }

      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const stalls = stallManager.getStalls();
      const intersects = raycaster.intersectObjects(stalls);

      if (intersects.length > 0) {
        const stallData = intersects[0].object.userData;
        console.log("✅ Clicked stall:", stallData.name);

        cameraController.focusOn(intersects[0].object.position);

        if (onStallClick && typeof onStallClick === "function") {
          onStallClick(stallData);
        }
      }
    };

    renderer.domElement.addEventListener("pointerdown", handleClick);

    // Animation loop
    const animate = () => {
      const deltaTime = clock.getDelta();

      stallManager.update(deltaTime);
      playerController.update(deltaTime);
      cameraController.update(deltaTime, playerController.getPosition());
      controls.update();

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("pointerdown", handleClick);
      cancelAnimationFrame(animationId);
      playerController.dispose();
      stallManager.dispose();
      renderer.dispose();
    };
  }, [eventData, onStallClick, isUIOpen]); // 🔥 Add isUIOpen to dependencies

  return (
    <>
      <canvas ref={canvasRef} style={{ display: "block" }} />
      {isLoading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.8)",
            color: "white",
            fontSize: "24px",
          }}
        >
          Loading 3D Environment...
        </div>
      )}
    </>
  );
};

export default ThreeScene;
