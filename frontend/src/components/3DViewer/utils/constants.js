// src/components/3DViewer/utils/constants.js

export const SCENE_CONFIG = {
  FOG_COLOR: 0x95a5b0,
  FOG_DENSITY: 0.0025,
};

export const HALL_DIMENSIONS = {
  WIDTH: 630,
  DEPTH: 640,
};

export const PLAYER_CONFIG = {
  SPEED: 50,
  SCALE: 5,
  CAMERA_OFFSET: { x: 0, y: 12, z: 20 },
};

export const CAMERA_CONFIG = {
  FOV: 75,
  NEAR: 1,
  FAR: 300,
  MIN_DISTANCE: 5,
  MAX_DISTANCE: 20,
  MAX_POLAR_ANGLE: Math.PI / 2.5,
  MIN_POLAR_ANGLE: Math.PI / 6,
  FOCUS_OFFSET: { x: 0, y: 6, z: 10 },
};

export const STALL_CONFIG = {
  SCALE: 7,
  HITBOX_SIZE: 38,
  DEFAULT_MODEL: "/models/fbx.glb",
};

/* ================= ENVIRONMENT ================= */

export const ENVIRONMENT_TYPES = {
  PLAIN_GROUND: "plain_ground",
  MCS_HALL: "mcs_hall",
  OUTDOOR_PARK: "outdoor_park",
  INDOOR: "indoor",
  OUTDOOR: "outdoor",
  HYBRID: "hybrid",
};

export const ENVIRONMENT_MODELS = {
  [ENVIRONMENT_TYPES.PLAIN_GROUND]: "/Environments/RetroSpaceSkybox.webp",
  [ENVIRONMENT_TYPES.MCS_HALL]: "/Environments/RetroSpaceSkybox.webp",
  [ENVIRONMENT_TYPES.INDOOR]: "/Environments/RetroSpaceSkybox.webp",
  [ENVIRONMENT_TYPES.OUTDOOR]: "/Environments/RetroSpaceSkybox.webp",
  [ENVIRONMENT_TYPES.OUTDOOR_PARK]: "/Environments/RetroSpaceSkybox.webp",
  [ENVIRONMENT_TYPES.HYBRID]: "/Environments/RetroSpaceSkybox.webp",
};
