import { GameConfig } from './gameTypes';

export const GAME_CONFIG: GameConfig = {
  canvas: {
    width: 800,
    height: 200,
  },
  dino: {
    x: 50,
    groundY: 150,
    width: 40,
    height: 40,
    duckHeight: 25,
    jumpForce: -12,
    gravity: 0.6,
    maxFallSpeed: 12,
  },
  ground: {
    y: 170,
    speed: 3,
  },
  obstacles: {
    minDistance: 400,
    maxDistance: 800,
    speed: 3,
  },
  game: {
    initialSpeed: 3,
    speedIncrease: 0.05,
    speedIncreaseInterval: 150, // every 150 points
  },
};

export const SPRITE_CONFIG = {
  dino: {
    running: { frames: 2, frameTime: 200 },
    jumping: { frames: 1, frameTime: 0 },
    ducking: { frames: 2, frameTime: 200 },
    dead: { frames: 1, frameTime: 0 },
  },
  obstacles: {
    cactus_small: { width: 17, height: 35 },
    cactus_large: { width: 25, height: 50 },
    bird: { width: 40, height: 25, frames: 2, frameTime: 300 },
  },
  clouds: {
    width: 46,
    height: 14,
  },
};