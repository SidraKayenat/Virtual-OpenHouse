// src/components/3DViewer/utils/constants.js

export const SCENE_CONFIG = {
  FOG_COLOR: 0x95a5b0,
  FOG_DENSITY: 0.0025,
};

export const HALL_DIMENSIONS = {
  WIDTH: 130,
  DEPTH: 140,
};

export const PLAYER_CONFIG = {
  SPEED: 10,
  SCALE: 2,
  // for the camera behavior
  CAMERA_OFFSET: { x: 0, y: 12, z: 20 }, // Y is height, Z is distance back
};

export const CAMERA_CONFIG = {
  FOV: 75,
  NEAR: 1,
  FAR: 300,
  MIN_DISTANCE: 5,
  MAX_DISTANCE: 20,
  MAX_POLAR_ANGLE: Math.PI / 2.5, // Slightly above 90 degrees to hide the horizon seam
  MIN_POLAR_ANGLE: Math.PI / 6,   // Prevents looking straight up
  FOCUS_OFFSET: { x: 0, y: 6, z: 10 }
};

export const STALL_CONFIG = {
  SCALE: 2,
  HITBOX_SIZE: 6,
  DEFAULT_MODEL: "/models/fbx.glb",
};

export const ENVIRONMENT_TYPES = {
  PLAIN_GROUND: "plain_ground",
  MCS_HALL: "mcs_hall",
  OUTDOOR_PARK: "outdoor_park",
    INDOOR: "indoor",
    OUTDOOR: "outdoor",
    HYBRID: "hybrid",
};

export const ENVIRONMENT_MODELS = {
  [ENVIRONMENT_TYPES.PLAIN_GROUND]: "/Environments/2.exr",
  [ENVIRONMENT_TYPES.MCS_HALL]: "/Environments/2.exr",
  // [ENVIRONMENT_TYPES.OUTDOOR_PARK]: "/models/Environments/outdoor_park.glb",
  [ENVIRONMENT_TYPES.INDOOR]: "/Environments/2.exr",
  [ENVIRONMENT_TYPES.OUTDOOR]: "/Environments/2k.exr",
  [ENVIRONMENT_TYPES.OUTDOOR_PARK]: "/Environments/2k.exr",
  [ENVIRONMENT_TYPES.HYBRID]: "/Environments/2k.exr",
};
