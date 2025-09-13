import { GameState, DinoState, Obstacle, Cloud } from './gameTypes';
import { GAME_CONFIG, SPRITE_CONFIG } from './gameConfig';
import { audioManager } from './audioManager';

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameState: GameState;
  private dinoState: DinoState;
  private obstacles: Obstacle[] = [];
  private clouds: Cloud[] = [];
  private keys: Set<string> = new Set();
  private lastTime: number = 0;
  private nextObstacleDistance: number = 0;
  private animationId: number = 0;
  private isRunning: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    this.gameState = {
      state: 'MENU',
      score: 0,
      highScore: parseInt(localStorage.getItem('dino-high-score') || '0'),
      speed: GAME_CONFIG.game.initialSpeed,
      groundX: 0,
    };

    this.dinoState = {
      x: GAME_CONFIG.dino.x,
      y: GAME_CONFIG.dino.groundY,
      velocityY: 0,
      state: 'RUNNING',
      animationFrame: 0,
      animationTimer: 0,
    };

    this.setupEventListeners();
    this.generateInitialClouds();
    this.nextObstacleDistance = GAME_CONFIG.obstacles.minDistance;
  }

  private setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      this.handleInput(e.code);
      if (e.code === 'Space') {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    this.canvas.addEventListener('click', () => {
      this.handleInput('Space');
    });

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleInput('Space');
    });
  }

  private handleInput(code: string) {
    audioManager.resumeContext();

    if (this.gameState.state === 'MENU' || this.gameState.state === 'GAME_OVER') {
      if (code === 'Space') {
        this.startGame();
      }
    } else if (this.gameState.state === 'PLAYING') {
      if (code === 'Space' && this.dinoState.state !== 'JUMPING') {
        this.jump();
      } else if (code === 'ArrowDown') {
        this.duck();
      }
    }
  }

  private startGame() {
    this.gameState.state = 'PLAYING';
    this.gameState.score = 0;
    this.gameState.speed = GAME_CONFIG.game.initialSpeed;
    this.gameState.groundX = 0;
    
    this.dinoState.x = GAME_CONFIG.dino.x;
    this.dinoState.y = GAME_CONFIG.dino.groundY;
    this.dinoState.velocityY = 0;
    this.dinoState.state = 'RUNNING';
    this.dinoState.animationFrame = 0;
    this.dinoState.animationTimer = 0;

    this.obstacles = [];
    this.nextObstacleDistance = GAME_CONFIG.obstacles.minDistance;
  }

  private jump() {
    if (this.dinoState.y >= GAME_CONFIG.dino.groundY) {
      this.dinoState.velocityY = GAME_CONFIG.dino.jumpForce;
      this.dinoState.state = 'JUMPING';
      audioManager.playSound('jump', 0.3);
    }
  }

  private duck() {
    if (this.dinoState.y >= GAME_CONFIG.dino.groundY) {
      this.dinoState.state = 'DUCKING';
    }
  }

  private generateInitialClouds() {
    for (let i = 0; i < 5; i++) {
      this.clouds.push({
        x: Math.random() * GAME_CONFIG.canvas.width,
        y: 20 + Math.random() * 60,
        speed: 0.5 + Math.random() * 1,
      });
    }
  }

  private updateDino(deltaTime: number) {
    if (this.gameState.state !== 'PLAYING') return;

    // Handle ducking
    if (!this.keys.has('ArrowDown') && this.dinoState.state === 'DUCKING') {
      this.dinoState.state = 'RUNNING';
    }

    // Apply gravity
    this.dinoState.velocityY += GAME_CONFIG.dino.gravity;
    if (this.dinoState.velocityY > GAME_CONFIG.dino.maxFallSpeed) {
      this.dinoState.velocityY = GAME_CONFIG.dino.maxFallSpeed;
    }

    // Update position
    this.dinoState.y += this.dinoState.velocityY;

    // Ground collision
    if (this.dinoState.y >= GAME_CONFIG.dino.groundY) {
      this.dinoState.y = GAME_CONFIG.dino.groundY;
      this.dinoState.velocityY = 0;
      if (this.dinoState.state === 'JUMPING') {
        this.dinoState.state = 'RUNNING';
      }
    }

    // Animation
    this.dinoState.animationTimer += deltaTime;
    const frameTime = SPRITE_CONFIG.dino[this.dinoState.state.toLowerCase() as keyof typeof SPRITE_CONFIG.dino].frameTime;
    if (frameTime > 0 && this.dinoState.animationTimer >= frameTime) {
      this.dinoState.animationTimer = 0;
      this.dinoState.animationFrame = (this.dinoState.animationFrame + 1) % 
        SPRITE_CONFIG.dino[this.dinoState.state.toLowerCase() as keyof typeof SPRITE_CONFIG.dino].frames;
    }
  }

  private updateObstacles(deltaTime: number) {
    if (this.gameState.state !== 'PLAYING') return;

    // Move existing obstacles
    this.obstacles = this.obstacles.filter(obstacle => {
      obstacle.x -= this.gameState.speed;
      return obstacle.x + obstacle.width > 0;
    });

    // Generate new obstacles
    this.nextObstacleDistance -= this.gameState.speed;
    if (this.nextObstacleDistance <= 0) {
      this.generateObstacle();
      this.nextObstacleDistance = GAME_CONFIG.obstacles.minDistance + 
        Math.random() * (GAME_CONFIG.obstacles.maxDistance - GAME_CONFIG.obstacles.minDistance);
    }
  }

  private generateObstacle() {
    const types: Obstacle['type'][] = ['CACTUS_SMALL', 'CACTUS_LARGE', 'BIRD_HIGH', 'BIRD_LOW'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let obstacle: Obstacle;

    switch (type) {
      case 'CACTUS_SMALL':
        obstacle = {
          x: GAME_CONFIG.canvas.width,
          y: GAME_CONFIG.ground.y - SPRITE_CONFIG.obstacles.cactus_small.height,
          width: SPRITE_CONFIG.obstacles.cactus_small.width,
          height: SPRITE_CONFIG.obstacles.cactus_small.height,
          type,
        };
        break;
      case 'CACTUS_LARGE':
        obstacle = {
          x: GAME_CONFIG.canvas.width,
          y: GAME_CONFIG.ground.y - SPRITE_CONFIG.obstacles.cactus_large.height,
          width: SPRITE_CONFIG.obstacles.cactus_large.width,
          height: SPRITE_CONFIG.obstacles.cactus_large.height,
          type,
        };
        break;
      case 'BIRD_HIGH':
        obstacle = {
          x: GAME_CONFIG.canvas.width,
          y: GAME_CONFIG.ground.y - 80,
          width: SPRITE_CONFIG.obstacles.bird.width,
          height: SPRITE_CONFIG.obstacles.bird.height,
          type,
        };
        break;
      case 'BIRD_LOW':
        obstacle = {
          x: GAME_CONFIG.canvas.width,
          y: GAME_CONFIG.ground.y - 40,
          width: SPRITE_CONFIG.obstacles.bird.width,
          height: SPRITE_CONFIG.obstacles.bird.height,
          type,
        };
        break;
    }

    this.obstacles.push(obstacle);
  }

  private updateClouds() {
    if (this.gameState.state !== 'PLAYING') return;

    this.clouds.forEach(cloud => {
      cloud.x -= cloud.speed;
      if (cloud.x + SPRITE_CONFIG.clouds.width < 0) {
        cloud.x = GAME_CONFIG.canvas.width + Math.random() * 200;
        cloud.y = 20 + Math.random() * 60;
      }
    });
  }

  private updateGame(deltaTime: number) {
    if (this.gameState.state !== 'PLAYING') return;

    // Update score
    this.gameState.score += 0.1;

    // Increase speed
    if (Math.floor(this.gameState.score) % GAME_CONFIG.game.speedIncreaseInterval === 0) {
      this.gameState.speed = Math.min(this.gameState.speed + GAME_CONFIG.game.speedIncrease, 15);
    }

    // Update ground position
    this.gameState.groundX -= this.gameState.speed;
    if (this.gameState.groundX <= -24) {
      this.gameState.groundX = 0;
    }

    // Check collisions
    this.checkCollisions();

    // Play score sound every 100 points
    if (Math.floor(this.gameState.score) % 100 === 0 && this.gameState.score > 0) {
      audioManager.playSound('score', 0.2);
    }
  }

  private checkCollisions() {
    const dinoRect = {
      x: this.dinoState.x + 5,
      y: this.dinoState.y + 5,
      width: GAME_CONFIG.dino.width - 10,
      height: this.dinoState.state === 'DUCKING' ? GAME_CONFIG.dino.duckHeight - 10 : GAME_CONFIG.dino.height - 10,
    };

    for (const obstacle of this.obstacles) {
      const obstacleRect = {
        x: obstacle.x + 3,
        y: obstacle.y + 3,
        width: obstacle.width - 6,
        height: obstacle.height - 6,
      };

      if (this.isColliding(dinoRect, obstacleRect)) {
        this.gameOver();
        return;
      }
    }
  }

  private isColliding(rect1: any, rect2: any): boolean {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }

  private gameOver() {
    this.gameState.state = 'GAME_OVER';
    this.dinoState.state = 'DEAD';
    audioManager.playSound('hit', 0.5);

    // Update high score
    const score = Math.floor(this.gameState.score);
    if (score > this.gameState.highScore) {
      this.gameState.highScore = score;
      localStorage.setItem('dino-high-score', score.toString());
    }
  }

  private render() {
    // Clear canvas with gradient sky
    const gradient = this.ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.canvas.height);
    gradient.addColorStop(0, '#87CEEB'); // Sky blue
    gradient.addColorStop(0.7, '#98FB98'); // Light green
    gradient.addColorStop(1, '#90EE90'); // Light green
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, GAME_CONFIG.canvas.width, GAME_CONFIG.canvas.height);

    // Draw clouds
    this.renderClouds();

    // Draw ground
    this.renderGround();

    // Draw obstacles
    this.renderObstacles();

    // Draw dino
    this.renderDino();

    // Draw UI
    this.renderUI();
  }

  private renderClouds() {
    this.clouds.forEach(cloud => {
      // White fluffy clouds with shadow
      this.ctx.fillStyle = 'rgba(200, 200, 200, 0.3)'; // Shadow
      this.ctx.beginPath();
      this.ctx.arc(cloud.x + 2, cloud.y + 2, 8, 0, Math.PI * 2);
      this.ctx.arc(cloud.x + 14, cloud.y + 2, 12, 0, Math.PI * 2);
      this.ctx.arc(cloud.x + 26, cloud.y + 2, 8, 0, Math.PI * 2);
      this.ctx.fill();

      // White cloud
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.beginPath();
      this.ctx.arc(cloud.x, cloud.y, 8, 0, Math.PI * 2);
      this.ctx.arc(cloud.x + 12, cloud.y, 12, 0, Math.PI * 2);
      this.ctx.arc(cloud.x + 24, cloud.y, 8, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  private renderGround() {
    // Ground gradient
    const groundGradient = this.ctx.createLinearGradient(0, GAME_CONFIG.ground.y, 0, GAME_CONFIG.canvas.height);
    groundGradient.addColorStop(0, '#8B4513'); // Saddle brown
    groundGradient.addColorStop(0.3, '#A0522D'); // Sienna
    groundGradient.addColorStop(1, '#D2691E'); // Chocolate
    this.ctx.fillStyle = groundGradient;
    this.ctx.fillRect(0, GAME_CONFIG.ground.y, GAME_CONFIG.canvas.width, GAME_CONFIG.canvas.height - GAME_CONFIG.ground.y);

    // Ground line
    this.ctx.fillStyle = '#654321';
    this.ctx.fillRect(0, GAME_CONFIG.ground.y, GAME_CONFIG.canvas.width, 3);

    // Ground texture - grass patches
    this.ctx.fillStyle = '#228B22'; // Forest green
    for (let x = this.gameState.groundX; x < GAME_CONFIG.canvas.width + 50; x += 30) {
      const grassHeight = 3 + Math.sin(x * 0.1) * 2;
      this.ctx.fillRect(x, GAME_CONFIG.ground.y - grassHeight, 2, grassHeight);
      this.ctx.fillRect(x + 5, GAME_CONFIG.ground.y - grassHeight + 1, 2, grassHeight - 1);
      this.ctx.fillRect(x + 10, GAME_CONFIG.ground.y - grassHeight - 1, 2, grassHeight + 1);
    }

    // Small rocks
    this.ctx.fillStyle = '#696969'; // Dim gray
    for (let x = this.gameState.groundX; x < GAME_CONFIG.canvas.width; x += 45) {
      if (Math.sin(x * 0.05) > 0.3) {
        this.ctx.beginPath();
        this.ctx.arc(x, GAME_CONFIG.ground.y + 8, 3, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }

  private renderDino() {
    const dinoHeight = this.dinoState.state === 'DUCKING' ? GAME_CONFIG.dino.duckHeight : GAME_CONFIG.dino.height;
    const x = this.dinoState.x;
    const y = this.dinoState.y;

    if (this.dinoState.state === 'DEAD') {
      // Dead dino - red tint
      this.ctx.fillStyle = '#8B0000'; // Dark red
    } else {
      // Living dino - green
      this.ctx.fillStyle = '#32CD32'; // Lime green
    }

    // Dino body
    this.ctx.fillRect(x + 8, y + 5, 24, dinoHeight - 10);
    
    // Dino head
    this.ctx.fillRect(x + 20, y, 16, 15);
    
    // Dino tail
    this.ctx.fillRect(x, y + 15, 12, 8);
    
    // Legs (animated for running)
    if (this.dinoState.state === 'RUNNING') {
      const legOffset = Math.sin(Date.now() * 0.02) * 2;
      this.ctx.fillRect(x + 10, y + dinoHeight - 8 + legOffset, 4, 8);
      this.ctx.fillRect(x + 20, y + dinoHeight - 8 - legOffset, 4, 8);
    } else if (this.dinoState.state === 'DUCKING') {
      // Ducking legs
      this.ctx.fillRect(x + 8, y + dinoHeight - 4, 6, 4);
      this.ctx.fillRect(x + 18, y + dinoHeight - 4, 6, 4);
    } else {
      // Static legs
      this.ctx.fillRect(x + 12, y + dinoHeight - 8, 4, 8);
      this.ctx.fillRect(x + 20, y + dinoHeight - 8, 4, 8);
    }

    // Dino eye
    this.ctx.fillStyle = this.dinoState.state === 'DEAD' ? '#FF0000' : '#000000';
    this.ctx.fillRect(x + 28, y + 4, 4, 4);
    
    // Eye highlight
    if (this.dinoState.state !== 'DEAD') {
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillRect(x + 29, y + 5, 2, 2);
    }

    // Dino spots for texture
    if (this.dinoState.state !== 'DEAD') {
      this.ctx.fillStyle = '#228B22'; // Forest green spots
      this.ctx.fillRect(x + 12, y + 8, 3, 3);
      this.ctx.fillRect(x + 22, y + 12, 3, 3);
      this.ctx.fillRect(x + 6, y + 18, 3, 3);
    }
  }

  private renderObstacles() {
    this.obstacles.forEach(obstacle => {
      switch (obstacle.type) {
        case 'CACTUS_SMALL':
        case 'CACTUS_LARGE':
          // Cactus gradient
          const cactusGradient = this.ctx.createLinearGradient(obstacle.x, obstacle.y, obstacle.x + obstacle.width, obstacle.y);
          cactusGradient.addColorStop(0, '#228B22'); // Forest green
          cactusGradient.addColorStop(0.5, '#32CD32'); // Lime green
          cactusGradient.addColorStop(1, '#006400'); // Dark green
          this.ctx.fillStyle = cactusGradient;
          
          // Main cactus body
          this.ctx.fillRect(obstacle.x + 2, obstacle.y, obstacle.width - 4, obstacle.height);
          
          // Cactus arms
          if (obstacle.type === 'CACTUS_LARGE') {
            this.ctx.fillRect(obstacle.x - 4, obstacle.y + 10, 8, 4);
            this.ctx.fillRect(obstacle.x + obstacle.width - 4, obstacle.y + 20, 8, 4);
          }
          
          // Cactus spikes
          this.ctx.fillStyle = '#8B4513'; // Saddle brown
          for (let i = 0; i < obstacle.height; i += 6) {
            this.ctx.fillRect(obstacle.x, obstacle.y + i, 2, 2);
            this.ctx.fillRect(obstacle.x + obstacle.width - 2, obstacle.y + i + 2, 2, 2);
          }
          
          // Cactus flower (on large cactus)
          if (obstacle.type === 'CACTUS_LARGE') {
            this.ctx.fillStyle = '#FF69B4'; // Hot pink
            this.ctx.beginPath();
            this.ctx.arc(obstacle.x + obstacle.width/2, obstacle.y - 3, 3, 0, Math.PI * 2);
            this.ctx.fill();
          }
          break;
          
        case 'BIRD_HIGH':
        case 'BIRD_LOW':
          const time = Date.now() * 0.01;
          const wingOffset = Math.sin(time) * 3;
          
          // Bird body
          this.ctx.fillStyle = '#4169E1'; // Royal blue
          this.ctx.fillRect(obstacle.x + 8, obstacle.y + 8 + wingOffset, 24, 10);
          
          // Bird head
          this.ctx.fillStyle = '#1E90FF'; // Dodger blue
          this.ctx.fillRect(obstacle.x + 28, obstacle.y + 6 + wingOffset, 8, 8);
          
          // Bird beak
          this.ctx.fillStyle = '#FFA500'; // Orange
          this.ctx.fillRect(obstacle.x + 36, obstacle.y + 8 + wingOffset, 4, 3);
          
          // Animated wings
          this.ctx.fillStyle = '#0000CD'; // Medium blue
          const wingSpread = Math.abs(Math.sin(time * 2)) * 8;
          // Upper wing
          this.ctx.fillRect(obstacle.x + 5, obstacle.y + wingOffset - wingSpread, 15, 4);
          // Lower wing
          this.ctx.fillRect(obstacle.x + 5, obstacle.y + obstacle.height + 2 + wingOffset + wingSpread, 15, 4);
          
          // Bird eye
          this.ctx.fillStyle = '#000000';
          this.ctx.fillRect(obstacle.x + 30, obstacle.y + 7 + wingOffset, 2, 2);
          
          // Wing details
          this.ctx.fillStyle = '#FFFFFF';
          this.ctx.fillRect(obstacle.x + 10, obstacle.y + wingOffset - wingSpread + 1, 3, 2);
          this.ctx.fillRect(obstacle.x + 10, obstacle.y + obstacle.height + 3 + wingOffset + wingSpread, 3, 2);
          break;
      }
    });
  }

  private renderUI() {
    // Score with background
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.ctx.fillRect(GAME_CONFIG.canvas.width - 160, 5, 150, 35);
    
    this.ctx.fillStyle = '#2F4F4F'; // Dark slate gray
    this.ctx.font = 'bold 16px monospace';
    this.ctx.textAlign = 'right';
    
    // Score
    const score = Math.floor(this.gameState.score).toString().padStart(5, '0');
    this.ctx.fillText(`HI ${this.gameState.highScore.toString().padStart(5, '0')}`, 
                     GAME_CONFIG.canvas.width - 20, 22);
    this.ctx.fillStyle = '#FF6347'; // Tomato red
    this.ctx.fillText(`${score}`, GAME_CONFIG.canvas.width - 20, 35);

    // Game state messages
    this.ctx.textAlign = 'center';

    if (this.gameState.state === 'MENU') {
      // Title background
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      this.ctx.fillRect(GAME_CONFIG.canvas.width / 2 - 140, GAME_CONFIG.canvas.height / 2 - 50, 280, 60);
      
      this.ctx.fillStyle = '#FF6347'; // Tomato
      this.ctx.font = 'bold 24px monospace';
      this.ctx.fillText('🦕 DINO ADVENTURE', GAME_CONFIG.canvas.width / 2, GAME_CONFIG.canvas.height / 2 - 30);
      
      this.ctx.fillStyle = '#32CD32'; // Lime green
      this.ctx.font = 'bold 16px monospace';
      this.ctx.fillText('PRESS SPACE TO START', GAME_CONFIG.canvas.width / 2, GAME_CONFIG.canvas.height / 2 - 5);
    } else if (this.gameState.state === 'GAME_OVER') {
      // Game over background
      this.ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
      this.ctx.fillRect(0, 0, GAME_CONFIG.canvas.width, GAME_CONFIG.canvas.height);
      
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      this.ctx.fillRect(GAME_CONFIG.canvas.width / 2 - 120, GAME_CONFIG.canvas.height / 2 - 60, 240, 80);
      
      this.ctx.fillStyle = '#DC143C'; // Crimson
      this.ctx.font = 'bold 28px monospace';
      this.ctx.fillText('💀 GAME OVER', GAME_CONFIG.canvas.width / 2, GAME_CONFIG.canvas.height / 2 - 35);
      
      this.ctx.fillStyle = '#4169E1'; // Royal blue
      this.ctx.font = 'bold 16px monospace';
      this.ctx.fillText('PRESS SPACE TO RESTART', GAME_CONFIG.canvas.width / 2, GAME_CONFIG.canvas.height / 2 - 5);
    }
  }

  private gameLoop = (currentTime: number) => {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.updateDino(deltaTime);
    this.updateObstacles(deltaTime);
    this.updateClouds();
    this.updateGame(deltaTime);

    this.render();

    if (this.isRunning) {
      this.animationId = requestAnimationFrame(this.gameLoop);
    }
  };

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    audioManager.initialize();
    this.lastTime = performance.now();
    this.animationId = requestAnimationFrame(this.gameLoop);
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  getScore() {
    return Math.floor(this.gameState.score);
  }

  getHighScore() {
    return this.gameState.highScore;
  }
}