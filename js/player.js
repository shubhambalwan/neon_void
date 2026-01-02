import Projectile from './projectile.js';

export default class Player {
    constructor(game) {
        this.game = game;
        this.width = 40; // Approx size
        this.height = 40;

        this.x = game.width / 2 - this.width / 2;
        this.y = game.height / 2;

        this.vx = 0;
        this.vy = 0;
        this.acceleration = 0.6;
        this.friction = 0.94;
        this.maxSpeed = 7; // Approx original speed

        this.shootTimer = 0;
        this.baseShootInterval = 100;
        this.shootInterval = this.baseShootInterval;

        this.angle = 0;

        this.isRapidFire = false;
        this.rapidFireTimer = 0;

        this.isShielded = false;
        this.shieldTimer = 0;

        // Weapon Heat System
        this.heat = 0;
        this.maxHeat = 100;
        this.heatDecay = 30; // Heat loss per second
        this.overheatThreshold1 = 40;
        this.overheatThreshold2 = 80;
        this.isOverheated = false;
    }

    update(deltaTime) {
        // PowerUp Timers
        if (this.isRapidFire) {
            this.rapidFireTimer -= deltaTime;
            if (this.rapidFireTimer <= 0) {
                this.isRapidFire = false;
                this.shootInterval = this.baseShootInterval;
            }
        }

        // Heat Decay
        if (this.heat > 0) {
            this.heat -= this.heatDecay * (deltaTime / 1000);
            if (this.heat < 0) this.heat = 0;
        }

        // Overheat Latch Logic
        if (this.heat > this.overheatThreshold2) {
            this.isOverheated = true;
        }
        if (this.isOverheated && this.heat <= 0) {
            this.isOverheated = false;
        }

        // Warning UI Logic
        const warningEl = document.getElementById('warning-display');
        if (warningEl) {
            if (this.isOverheated) {
                // Stuck in overload until fully cooled
                warningEl.innerText = "systumm overload ho gaya, garam garam systum (COOLING)"; // Level 2
                warningEl.className = "level-2";
            } else if (this.heat > this.overheatThreshold1) {
                warningEl.innerText = "Mat kr lala, systumm over heat ho jaega"; // Level 1
                warningEl.className = "level-1";
            } else {
                warningEl.className = "hidden";
            }
        }

        if (this.isShielded) {
            this.shieldTimer -= deltaTime;
            if (this.shieldTimer <= 0) {
                this.isShielded = false;
            }
        }
        // Rotation (Aim at Mouse) - Smooth Lerp
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;

        const targetAngle = Math.atan2(this.game.input.mouse.y - cy, this.game.input.mouse.x - cx);

        // Shortest angle interpolation
        let diff = targetAngle - this.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        this.angle += diff * 0.15; // Smooth factor from reference

        // Movement (Absolute WASD + Physics)
        let ax = 0;
        let ay = 0;

        if (this.game.input.keys.includes('w') || this.game.input.keys.includes('W') || this.game.input.keys.includes('ArrowUp')) {
            ay -= 1;
        }
        if (this.game.input.keys.includes('s') || this.game.input.keys.includes('S') || this.game.input.keys.includes('ArrowDown')) {
            ay += 1;
        }
        if (this.game.input.keys.includes('a') || this.game.input.keys.includes('A') || this.game.input.keys.includes('ArrowLeft')) {
            ax -= 1;
        }
        if (this.game.input.keys.includes('d') || this.game.input.keys.includes('D') || this.game.input.keys.includes('ArrowRight')) {
            ax += 1;
        }

        // Normalize Input
        const inputLen = Math.sqrt(ax * ax + ay * ay);
        if (inputLen > 0) {
            ax /= inputLen;
            ay /= inputLen;

            this.vx += ax * this.acceleration;
            this.vy += ay * this.acceleration;
        }

        // Apply Friction
        this.vx *= this.friction;
        this.vy *= this.friction;

        // Cap Speed
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.maxSpeed) {
            const ratio = this.maxSpeed / speed;
            this.vx *= ratio;
            this.vy *= ratio;
        }

        this.x += this.vx;
        this.y += this.vy;

        // Boundaries
        if (this.x < 0) this.x = 0;
        if (this.x > this.game.width - this.width) this.x = this.game.width - this.width;
        if (this.y < 0) this.y = 0;
        if (this.y > this.game.height - this.height) this.y = this.game.height - this.height;

        // Shooting
        if (this.game.input.keys.includes(' ') || this.game.input.mouse.down) {
            if (this.shootTimer > this.shootInterval) {
                this.shoot();
                this.shootTimer = 0;
            }
        }
        this.shootTimer += deltaTime;

        // Thruster Trails
        // Emit particles based on input direction, opposite to acceleration

        // Re-calculate input length to know if we are thrusting
        const isThrusting = (this.game.input.keys.includes('w') || this.game.input.keys.includes('ArrowUp') ||
            this.game.input.keys.includes('s') || this.game.input.keys.includes('ArrowDown') ||
            this.game.input.keys.includes('a') || this.game.input.keys.includes('ArrowLeft') ||
            this.game.input.keys.includes('d') || this.game.input.keys.includes('ArrowRight'));

        if (this.game.particles && isThrusting) {
            // For simplicity, just emit from rear of ship (opposite to angle)
            // Center
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            // Rear is opposite to angle
            const offset = 20;
            const tx = cx - Math.cos(this.angle) * offset;
            const ty = cy - Math.sin(this.angle) * offset;

            if (Math.random() < 0.5) { // Frequent but not every frame
                this.game.particles.createThruster(tx, ty, this.angle);
            }
        }
    }

    shoot() {
        if (this.isOverheated) return;

        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;

        const velocity = 15; // Projectile speed
        const vx = Math.cos(this.angle) * velocity;
        const vy = Math.sin(this.angle) * velocity;

        // Spawn slightly ahead of center
        const spawnDist = 20;
        const spawnX = cx + Math.cos(this.angle) * spawnDist;
        const spawnY = cy + Math.sin(this.angle) * spawnDist;

        this.game.projectiles.push(new Projectile(this.game, spawnX, spawnY, vx, vy));
        if (this.game.audio) this.game.audio.playShoot();

        // Increase Heat
        this.heat += 10;
        if (this.heat > this.maxHeat) this.heat = this.maxHeat;
    }

    draw(ctx) {
        ctx.save();

        // Translate to center of player
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        ctx.translate(cx, cy);

        ctx.rotate(this.angle + Math.PI / 2);

        ctx.strokeStyle = '#0ff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15; // Increased glow
        ctx.shadowColor = '#0ff';
        ctx.fillStyle = '#000'; // Fill black to hide stars behind

        // Draw Triangle Ship
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(this.width / 2, this.height / 2);
        ctx.lineTo(0, this.height / 2 - 10);
        ctx.lineTo(-this.width / 2, this.height / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Shield Visual
        if (this.isShielded) {
            ctx.strokeStyle = '#0ff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(0, 0, this.width, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
            ctx.fill();
        }

        // Engine Glow
        ctx.fillStyle = this.isRapidFire ? '#ff0' : '#f0f'; // Yellow glow if rapid fire
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 100) * 0.2; // Pulse
        ctx.beginPath();
        ctx.arc(0, this.height / 2 - 5, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    activateRapidFire() {
        this.isRapidFire = true;
        this.rapidFireTimer = 5000; // 5 sec
        this.shootInterval = 50; // Super fast
    }

    activateShield() {
        this.isShielded = true;
        this.shieldTimer = 8000; // 8 sec
    }
}
