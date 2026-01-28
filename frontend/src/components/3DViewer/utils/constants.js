// src/components/3DViewer/utils/constants.js

export const SCENE_CONFIG = {
  FOG_COLOR: 0x95a5b0,
  FOG_DENSITY: 0.0025,
};

export const HALL_DIMENSIONS = {
  WIDTH: 80,
  DEPTH: 140,
};

export const PLAYER_CONFIG = {
  SPEED: 8,
  SCALE: 2,
};

export const CAMERA_CONFIG = {
  FOV: 75,
  NEAR: 1,
  FAR: 300,
  MIN_DISTANCE: 5,
  MAX_DISTANCE: 20,
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
};

export const ENVIRONMENT_MODELS = {
  [ENVIRONMENT_TYPES.PLAIN_GROUND]: "/models/environments/plain_ground.glb",
  [ENVIRONMENT_TYPES.MCS_HALL]: "/models/environments/mcs_hall.glb",
  [ENVIRONMENT_TYPES.OUTDOOR_PARK]: "/models/environments/outdoor_park.glb",
};
