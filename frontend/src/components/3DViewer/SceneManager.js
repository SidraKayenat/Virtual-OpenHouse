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
    this.createFloor();
  }

  setupLighting() {
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    this.scene.add(dirLight);
  }

  createFloor() {
    const floorGeo = new THREE.PlaneGeometry(
      HALL_DIMENSIONS.WIDTH * 2,
      HALL_DIMENSIONS.DEPTH * 2,
    );

    const floorMat = new THREE.ShaderMaterial({
      uniforms: {
        tileSize: { value: 8.0 },
        groutWidth: { value: 0.0 },
        tileColor: { value: new THREE.Color(0xd6cfc4) },
        groutColor: { value: new THREE.Color(0x888880) },
        light1Dir: { value: new THREE.Vector3(1, 3, 1).normalize() },
        light2Dir: { value: new THREE.Vector3(-1, 2, -1).normalize() },
        light3Dir: { value: new THREE.Vector3(0, 5, 0).normalize() },
        shininess: { value: 80.0 },
        specularStrength: { value: 0.15 },
        fresnelStrength: { value: 0.08 },
        cameraPos: { value: new THREE.Vector3() },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        varying vec3 vNormal;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          vNormal = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float tileSize;
        uniform float groutWidth;
        uniform vec3  tileColor;
        uniform vec3  groutColor;
        uniform vec3  light1Dir;
        uniform vec3  light2Dir;
        uniform vec3  light3Dir;
        uniform float shininess;
        uniform float specularStrength;
        uniform float fresnelStrength;
        uniform vec3  cameraPos;
        varying vec3 vWorldPos;
        varying vec3 vNormal;

        float blinnPhong(vec3 N, vec3 L, vec3 V, float power) {
          vec3 H = normalize(L + V);
          return pow(max(dot(N, H), 0.0), power);
        }

        void main() {
          vec2 pos  = vec2(vWorldPos.x, vWorldPos.z);
          vec2 cell = fract(pos / tileSize);
          float gw  = groutWidth;
          bool isGrout = cell.x < gw || cell.x > (1.0 - gw)
                      || cell.y < gw || cell.y > (1.0 - gw);
          vec2  tileId    = floor(pos / tileSize);
          float variation = fract(sin(dot(tileId, vec2(12.9898, 78.233))) * 43758.5453) * 0.06;
          vec3  baseColor = isGrout ? groutColor : tileColor + variation;
          vec3 N = vec3(0.0, 1.0, 0.0);
          vec3 V = normalize(cameraPos - vWorldPos);
          float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.0) * fresnelStrength;
          float spec = 0.0;
          spec += blinnPhong(N, light1Dir, V, shininess) * 1.0;
          spec += blinnPhong(N, light2Dir, V, shininess * 0.6) * 0.4;
          spec += blinnPhong(N, light3Dir, V, shininess * 1.5) * 0.6;
          spec *= specularStrength;
          if (isGrout) spec *= 0.04;
          float horizonGlow = pow(max(1.0 - abs(dot(N, V)), 0.0), 4.0) * 0.08;
          float diff = max(dot(N, light1Dir), 0.0);
          vec3 ambient = 0.4 * baseColor;
          vec3 color   = ambient + 0.2 * diff * baseColor;
          color += spec * vec3(1.0, 0.98, 0.95);
          color += fresnel * vec3(0.9, 0.92, 1.0);
          color += horizonGlow * vec3(1.0, 0.98, 0.95);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    });

    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2; // lay flat
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.floor = floor; // keep ref for cameraPos update
  }

  // Call this every frame from your render loop, passing camera.position
  updateFloorCamera(cameraPosition) {
    if (this.floor) {
      this.floor.material.uniforms.cameraPos.value.copy(cameraPosition);
    }
  }

  getScene() {
    return this.scene;
  }
}
