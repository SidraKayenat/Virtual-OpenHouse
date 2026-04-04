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
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

const ThreeScene = ({ eventData, onStallClick, isUIOpen }) => {
  const isUIOpenRef = useRef(isUIOpen);
  const onStallClickRef = useRef(onStallClick);
  const cameraControllerRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
  isUIOpenRef.current = isUIOpen;
}, [isUIOpen]);

useEffect(() => {
  onStallClickRef.current = onStallClick;
}, [onStallClick]);

useEffect(() => {
  isUIOpenRef.current = isUIOpen;

  // When popup closes, release camera focus
  if (!isUIOpen && cameraControllerRef.current) {
    cameraControllerRef.current.releaseFocus(); // 👈 this is the key line
  }
}, [isUIOpen]);

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
    cameraControllerRef.current = cameraController;

    //  SET UP UI OPEN CALLBACK
    playerController.setUIOpenCallback(() => isUIOpenRef.current);

    // Load environment and stalls
    const initializeScene = async () => {
      try {
        console.log("🌍 Loading environment...");
        await environmentLoader.loadEnvironment(
  eventData.environmentType || "plain_ground",
  ["custom", "upload"].includes(eventData.backgroundType)
    ? eventData.customBackground
    : null,
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

    // After creating the main renderer
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none'; // so clicks pass through to Three.js
canvasRef.current.parentElement.appendChild(labelRenderer.domElement);

    const handleClick = (event) => {
      // 🔥 DON'T RAYCAST IF UI IS OPEN
      if (isUIOpenRef.current) {
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

        if (onStallClickRef.current && typeof onStallClickRef.current === "function") {
  onStallClickRef.current(stallData); 
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
      labelRenderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      labelRenderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("pointerdown", handleClick);
      cancelAnimationFrame(animationId);
      labelRenderer.domElement.remove();
      cameraControllerRef.current = null;
      playerController.dispose();
      stallManager.dispose();
      renderer.dispose();
    };
  }, [eventData]); 

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
