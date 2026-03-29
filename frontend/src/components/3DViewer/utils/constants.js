// src/components/3DViewer/utils/constants.js

export const SCENE_CONFIG = {
  FOG_COLOR: 0x95a5b0,
  FOG_DENSITY: 0.0025,
};

export const HALL_DIMENSIONS = {
  WIDTH: 230,
  DEPTH: 340,
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
  HITBOX_SIZE: 35,
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
  [ENVIRONMENT_TYPES.PLAIN_GROUND]: "/Environments/McsHallWebp.webp",
  [ENVIRONMENT_TYPES.MCS_HALL]: "/Environments/McsHallWebp.webp",
  [ENVIRONMENT_TYPES.INDOOR]: "/Environments/McsHallWebp.webp",
  [ENVIRONMENT_TYPES.OUTDOOR]: "/Environments/McsHallWebp.webp",
  [ENVIRONMENT_TYPES.OUTDOOR_PARK]: "/Environments/McsHallWebp.webp",
  [ENVIRONMENT_TYPES.HYBRID]: "/Environments/McsHallWebp.webp",
};

/* ================= PLAYER MODELS ================= */

// export const PLAYER_MODEL_TYPES = {
//   MALE: "male",
//   FEMALE: "female",
//   ROBOT: "robot",
//   AVATAR_1: "avatar_1",
//   AVATAR_2: "avatar_2",
// };

// export const PLAYER_MODELS = {
//   [PLAYER_MODEL_TYPES.MALE]: "/models/male.glb",
//   [PLAYER_MODEL_TYPES.FEMALE]: "/models/Avatar 1 Walking.fbx",
//   [PLAYER_MODEL_TYPES.ROBOT]: "/models/robot.glb",
//   [PLAYER_MODEL_TYPES.AVATAR_1]: "/models/avatar1.fbx",
//   [PLAYER_MODEL_TYPES.AVATAR_2]: "/models/avatar2.fbx",
// };

// // Default player model to use if none selected
// export const DEFAULT_PLAYER_MODEL = PLAYER_MODEL_TYPES.FEMALE;