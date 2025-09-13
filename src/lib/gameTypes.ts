export interface GameState {
  state: 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';
  score: number;
  highScore: number;
  speed: number;
  groundX: number;
}

export interface DinoState {
  x: number;
  y: number;
  velocityY: number;
  state: 'RUNNING' | 'JUMPING' | 'DUCKING' | 'DEAD';
  animationFrame: number;
  animationTimer: number;
}

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'CACTUS_SMALL' | 'CACTUS_LARGE' | 'BIRD_HIGH' | 'BIRD_LOW';
}

export interface Cloud {
  x: number;
  y: number;
  speed: number;
}

export interface GameConfig {
  canvas: {
    width: number;
    height: number;
  };
  dino: {
    x: number;
    groundY: number;
    width: number;
    height: number;
    duckHeight: number;
    jumpForce: number;
    gravity: number;
    maxFallSpeed: number;
  };
  ground: {
    y: number;
    speed: number;
  };
  obstacles: {
    minDistance: number;
    maxDistance: number;
    speed: number;
  };
  game: {
    initialSpeed: number;
    speedIncrease: number;
    speedIncreaseInterval: number;
  };
}