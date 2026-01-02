import Player from './player.js';
import InputHandler from './input.js';
import Enemy from './enemy.js';
import Background from './background.js';
import ParticleManager from './particle.js';
import AudioManager from './audio.js';
import PowerUp from './powerup.js';
import Meteor from './meteor.js';
import ShootingStar from './shooting_star.js';

export default class Game {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.width = canvas.width;
        this.height = canvas.height;

        this.input = new InputHandler(this);
        this.player = new Player(this);
        this.background = new Background(this);
        this.particles = new ParticleManager(this);
        this.audio = new AudioManager();

        this.score = 0;
        this.lives = 10;
        this.gameOver = false;
        this.menuMode = true; // Start in Menu Mode (Attract Mode)
        this.paused = false;

        // PowerUps
        this.powerups = [];

        // Meteors
        this.meteors = [];
        this.meteorTimer = 0;
        this.meteorInterval = 5000; // Spawn every 5 seconds (Reduced frequency)

        // Time Manipulation
        this.baseTimeScale = 1.0;
        this.timeScale = 1.0;
        this.energy = 100;
        this.maxEnergy = 100;
        this.isTimeFrozen = false;

        this.projectiles = [];
        this.enemies = [];
        this.enemyTimer = 0;
        this.enemyInterval = 800;

        // Screen Shake
        this.shakeTime = 0;
        this.shakeMagnitude = 0;

        // Shooting Stars (Bonus)
        this.shootingStars = [];
        this.shootingStarTimer = 0;
        this.shootingStarInterval = 10000; // Rare (10s)
    }

    update(deltaTime) {
        if (this.menuMode) {
            this.background.update(deltaTime);
            return;
        }

        if (!this.gameOver) {
            // Screen Shake Decay
            if (this.shakeTime > 0) {
                this.shakeTime -= deltaTime;
                if (this.shakeTime < 0) this.shakeMagnitude = 0;
            }

            // Time Control Logic
            // Time Control Logic
            // Time Control Logic
            // FREEZE: Shift OR Space
            if ((this.input.keys.includes('shift') || this.input.keys.includes(' ')) && this.energy > 0) {
                this.isTimeFrozen = true;
                this.timeScale = 0.05; // 0.05 from reference
                this.energy -= 40 * (deltaTime / 1000); // 40 units per second
                if (this.energy < 0) this.energy = 0;
            } else {
                this.isTimeFrozen = false;
                this.timeScale = this.baseTimeScale;
                // No passive recharge from reference
                // if (this.energy < this.maxEnergy) {
                //    this.energy += 0.2 * (deltaTime / 16);
                // }
            }

            // UI
            const energyPercent = (this.energy / this.maxEnergy) * 100;
            const energyBar = document.getElementById('time-energy-bar');
            if (energyBar) energyBar.style.width = energyPercent + '%';

            // Updates
            this.background.update(deltaTime);
            this.player.update(deltaTime);

            this.projectiles.forEach(projectile => projectile.update(deltaTime));
            this.projectiles = this.projectiles.filter(projectile => !projectile.markedForDeletion);

            if (this.enemyTimer > this.enemyInterval) {
                this.addEnemy();
                this.enemyTimer = 0;
            } else {
                this.enemyTimer += deltaTime * this.timeScale;
            }

            this.enemies.forEach(enemy => enemy.update(deltaTime));
            this.enemies = this.enemies.filter(enemy => !enemy.markedForDeletion);

            this.powerups.forEach(p => p.update(deltaTime));
            this.powerups = this.powerups.filter(p => !p.markedForDeletion);

            // Meteor Spawner
            if (this.meteorTimer > this.meteorInterval) {
                this.meteors.push(new Meteor(this));
                this.meteorTimer = 0;
            } else {
                this.meteorTimer += deltaTime * this.timeScale;
            }

            this.meteors.forEach(m => m.update(deltaTime));
            this.meteors = this.meteors.filter(m => !m.markedForDeletion);

            // Shooting Star Spawner
            if (this.shootingStarTimer > this.shootingStarInterval) {
                this.shootingStars.push(new ShootingStar(this));
                this.shootingStarTimer = 0;
                // Randomize next interval
                this.shootingStarInterval = Math.random() * 10000 + 5000;
            } else {
                this.shootingStarTimer += deltaTime * this.timeScale;
            }

            this.shootingStars.forEach(s => s.update(deltaTime));
            this.shootingStars = this.shootingStars.filter(s => !s.markedForDeletion);

            this.particles.update(deltaTime);

            this.checkCollisions();
        }
    }

    checkCollisions() {
        // Player vs Enemy Bullets
        this.projectiles.forEach(projectile => {
            if (projectile.isEnemy) {
                if (this.checkCollision(this.player, projectile)) {
                    projectile.markedForDeletion = true;
                    if (!this.player.isShielded) {
                        this.takeDamage(5); // Shake magnitude
                        this.audio.playHit();
                    } else {
                        // Shield Block sound?
                    }
                    this.particles.createExplosion(projectile.x, projectile.y, '#f00', 5);
                }
            }
        });

        this.enemies.forEach(enemy => {
            // Player vs Enemy
            if (this.checkCollision(this.player, enemy)) {
                enemy.markedForDeletion = true;
                if (!this.player.isShielded) {
                    this.takeDamage(10);
                    this.audio.playExplosion(); // Player hit sound (using explosion for impact)
                } else {
                    this.audio.playHit(); // Shield deflect?
                }
                this.particles.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color, 15);
            }

            // Projectile vs Enemy
            this.projectiles.forEach(projectile => {
                if (!projectile.isEnemy) {
                    if (this.checkCollision(projectile, enemy)) {
                        enemy.markedForDeletion = true;
                        projectile.markedForDeletion = true;
                        this.score += enemy.score;
                        // Gain Energy
                        this.energy = Math.min(this.energy + 15, this.maxEnergy);

                        const scoreDisplay = document.getElementById('score-val');
                        if (scoreDisplay) scoreDisplay.innerText = this.score;

                        // PowerUp Drop
                        if (Math.random() < 0.2) { // 20% chance
                            this.powerups.push(new PowerUp(this, enemy.x, enemy.y));
                        }

                        // FX
                        this.particles.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color, 10);
                        this.triggerShake(2);
                        this.audio.playExplosion();
                    }
                }
            });
        });

        // Player vs PowerUps
        this.powerups.forEach(p => {
            if (this.checkCollision(this.player, p)) {
                p.markedForDeletion = true;
                this.audio.playPowerUp();
                this.activatePowerUp(p.type);
            }
        });

        // Meteors - Player vs Meteor
        this.meteors.forEach(meteor => {
            // Basic circle collision check (using width as diameter approx)
            const dist = Math.hypot(meteor.x - (this.player.x + this.player.width / 2), meteor.y - (this.player.y + this.player.height / 2));
            if (dist < meteor.size / 2 + this.player.width / 3) { // Adjusted hitboxes
                meteor.markedForDeletion = true;
                if (!this.player.isShielded) {
                    this.takeDamage(20); // Heavy damage
                    this.audio.playExplosion();
                } else {
                    this.audio.playHit();
                }
                this.particles.createExplosion(meteor.x, meteor.y, '#888', 20);
            }

            // Projectile vs Meteor
            this.projectiles.forEach(projectile => {
                const pDist = Math.hypot(meteor.x - projectile.x, meteor.y - projectile.y);
                if (pDist < meteor.size) { // Simple radius check
                    projectile.markedForDeletion = true;
                    meteor.lives--;
                    this.audio.playHit();
                    this.particles.createExplosion(projectile.x, projectile.y, '#aaa', 2);

                    if (meteor.lives <= 0) {
                        meteor.markedForDeletion = true;
                        this.audio.playExplosion();
                        this.particles.createExplosion(meteor.x, meteor.y, '#888', 15);
                        this.score += 5;
                        const scoreDisplay = document.getElementById('score-val');
                        if (scoreDisplay) scoreDisplay.innerText = this.score;
                    }
                }
            });
        });

        // Shooting Stars - One Shot Kill (Fragile Bonus)
        this.shootingStars.forEach(star => {
            // Player Collision
            if (this.checkCollision(this.player, star)) {
                star.markedForDeletion = true;
                this.takeDamage(10); // Still hurts if you ram it!
                this.particles.createExplosion(star.x, star.y, '#fff', 10);
            }

            // Projectile Collision
            this.projectiles.forEach(projectile => {
                if (this.checkCollision(projectile, star)) {
                    star.markedForDeletion = true;
                    projectile.markedForDeletion = true;

                    // BIG BONUS
                    this.score += star.score;
                    this.energy = Math.min(this.energy + 50, this.maxEnergy); // Fill half energy!

                    const scoreDisplay = document.getElementById('score-val');
                    if (scoreDisplay) scoreDisplay.innerText = this.score;

                    this.audio.playPowerUp(); // Bonus sound
                    this.particles.createExplosion(star.x, star.y, '#fff', 30);
                    this.triggerShake(5);
                }
            });
        });
    }

    activatePowerUp(type) {
        if (type === 'health') {
            this.lives = Math.min(this.lives + 5, 20); // Heal 5
            document.getElementById('health-bar-fill').style.width = Math.min((this.lives * 10), 100) + '%';
        } else if (type === 'energy') {
            this.energy = this.maxEnergy;
        } else if (type === 'rapidFire') {
            this.player.activateRapidFire();
        } else if (type === 'shield') {
            this.player.activateShield();
        }
    }

    takeDamage(shakeAmount) {
        this.lives--;
        const healthBar = document.getElementById('health-bar-fill');
        if (healthBar) healthBar.style.width = (this.lives * 10) + '%';

        this.triggerShake(shakeAmount);

        if (this.lives <= 0) {
            this.gameOver = true;
            this.particles.createExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#0ff', 50);
            const gameOverScreen = document.getElementById('game-over-screen');
            if (gameOverScreen) gameOverScreen.classList.remove('hidden');
            const finalScore = document.getElementById('final-score');
            if (finalScore) finalScore.innerText = this.score;
        }
    }

    triggerShake(magnitude, duration = 200) {
        this.shakeMagnitude = magnitude;
        this.shakeTime = duration;
    }

    checkCollision(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.height + rect1.y > rect2.y
        );
    }

    draw() {
        this.ctx.save();

        // Screen Shake Apply
        if (this.shakeTime > 0) {
            const dx = (Math.random() - 0.5) * this.shakeMagnitude;
            const dy = (Math.random() - 0.5) * this.shakeMagnitude;
            this.ctx.translate(dx, dy);
        }

        // Clear / Trail
        this.ctx.fillStyle = 'rgba(5, 5, 16, 0.5)'; // Darker trail for space
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Background
        this.background.draw(this.ctx);

        if (this.menuMode) {
            this.ctx.restore();
            return;
        }

        // Entities
        this.player.draw(this.ctx);
        this.powerups.forEach(p => p.draw(this.ctx));
        this.meteors.forEach(m => m.draw(this.ctx));
        this.shootingStars.forEach(s => s.draw(this.ctx));
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        this.projectiles.forEach(projectile => projectile.draw(this.ctx));
        this.particles.draw(this.ctx);

        // Time freeze tint overlay (on top of everything?)
        if (this.isTimeFrozen) {
            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.05)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.strokeStyle = '#0ff';
            this.ctx.lineWidth = 10;
            this.ctx.strokeRect(0, 0, this.width, this.height); // Border
        }

        this.ctx.restore();
    }

    addEnemy() {
        this.enemies.push(new Enemy(this));
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        if (this.background) this.background.resize(width, height);
    }

    restart() {
        this.score = 0;
        this.lives = 10;
        this.gameOver = false;
        this.menuMode = false; // Start Game
        this.energy = 100;
        this.isTimeFrozen = false;
        this.projectiles = [];
        this.enemies = [];
        this.particles.particles = [];
        this.enemyTimer = 0;
        this.player.x = this.width / 2 - this.player.width / 2;
        this.player.y = this.height - 100;

        document.getElementById('score-val').innerText = '0';
        document.getElementById('health-bar-fill').style.width = '100%';
        document.getElementById('game-over-screen').classList.add('hidden');

        // Initial Light Hazard
        for (let i = 0; i < 3; i++) this.meteors.push(new Meteor(this));
    }
}
