import Projectile from './projectile.js';

export default class Enemy {
    constructor(game) {
        this.game = game;
        this.width = 40;
        this.height = 40;
        this.angle = 0;
        this.markedForDeletion = false;

        // Types: 0=Drone, 1=Fighter, 2=Chaser
        const typeRand = Math.random();
        if (typeRand < 0.5) {
            this.type = 'drone';
            this.lives = 2;
            this.score = 10;
            this.color = '#0af'; // Blue
            this.speedMultiplier = 1.0;
        } else if (typeRand < 0.8) {
            this.type = 'fighter';
            this.lives = 3;
            this.score = 20;
            this.color = '#f0f'; // Purple/Redish
            this.speedMultiplier = 0.8;
        } else {
            this.type = 'chaser';
            this.lives = 1; // Kamikazeish
            this.score = 15;
            this.color = '#f50'; // Orange
            this.speedMultiplier = 2.0;
        }

        // Randomly pick a side to spawn from: 0=Top, 1=Right, 2=Bottom, 3=Left
        // DIFFICULTY TWEAK: User requested enemies only from top for now.
        const side = 0; // Always Top

        // Setup initial spawn and velocity
        let bSpeed = 2 * this.speedMultiplier;

        switch (side) {
            case 0: // Top
                this.x = Math.random() * (game.width - this.width);
                this.y = -this.height;
                this.vx = (Math.random() - 0.5) * 2;
                this.vy = Math.random() * bSpeed + bSpeed;
                break;
            case 1: // Right
                this.x = game.width;
                this.y = Math.random() * (game.height - this.height);
                this.vx = -(Math.random() * bSpeed + bSpeed);
                this.vy = (Math.random() - 0.5) * 2;
                break;
            case 2: // Bottom
                this.x = Math.random() * (game.width - this.width);
                this.y = game.height;
                this.vx = (Math.random() - 0.5) * 2;
                this.vy = -(Math.random() * bSpeed + bSpeed);
                break;
            case 3: // Left
                this.x = -this.width;
                this.y = Math.random() * (game.height - this.height);
                this.vx = Math.random() * bSpeed + bSpeed;
                this.vy = (Math.random() - 0.5) * 2;
                break;
        }

        // AI Tracking (Shooting)
        this.shootTimer = 0;
        this.shootInterval = 2000;

        if (this.type === 'fighter') {
            this.shootInterval = 1500;
        }
    }

    update(deltaTime) {
        const ts = this.game.timeScale;

        // Update Position
        this.x += this.vx * ts;
        this.y += this.vy * ts;

        // Calculate Angle (Face velocity or Player)
        if (this.type === 'chaser' || this.type === 'fighter') {
            // Face Player
            const targetAngle = Math.atan2(this.game.player.y - this.y, this.game.player.x - this.x);
            // Smooth lerp
            let diff = targetAngle - this.angle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.angle += diff * 0.1 * ts;
        } else {
            // Drone spins or faces direction
            this.angle += 0.05 * ts;
        }

        // Chaser AI: Adjust Velocity
        if (this.type === 'chaser') {
            // Move towards player
            const dirAngle = Math.atan2(this.game.player.y - this.y, this.game.player.x - this.x);
            const speed = 3 * this.speedMultiplier;
            // Lerp velocity for smoother turns
            const targetVx = Math.cos(dirAngle) * speed;
            const targetVy = Math.sin(dirAngle) * speed;
            this.vx += (targetVx - this.vx) * 0.05 * ts;
            this.vy += (targetVy - this.vy) * 0.05 * ts;
        }

        // Shooting AI (Fighter)
        if (this.type === 'fighter') {
            if (this.shootTimer > this.shootInterval) {
                const velocity = 8;
                const pvx = Math.cos(this.angle) * velocity;
                const pvy = Math.sin(this.angle) * velocity;
                // Spawn projectile from nose
                const noseX = this.x + this.width / 2 + Math.cos(this.angle) * 20;
                const noseY = this.y + this.height / 2 + Math.sin(this.angle) * 20;

                this.game.projectiles.push(new Projectile(this.game, noseX, noseY, pvx, pvy, true));
                this.shootTimer = 0;
            }
            this.shootTimer += deltaTime * ts;
        }

        // Bounds check
        const buffer = 100;
        if (this.x < -buffer || this.x > this.game.width + buffer ||
            this.y < -buffer || this.y > this.game.height + buffer) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();

        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        ctx.translate(cx, cy);
        ctx.rotate(this.angle); // Rotate context

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = '#000';

        if (this.type === 'chaser') {
            // Aggressive Spiky Shape
            ctx.beginPath();
            ctx.moveTo(15, 0); // Nose
            ctx.lineTo(-10, 10); // Wing R
            ctx.lineTo(-5, 0); // Notch
            ctx.lineTo(-10, -10); // Wing L
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Core
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();

        } else if (this.type === 'fighter') {
            // Sleek Tie-Fighter-ish / Dart
            ctx.beginPath();
            ctx.moveTo(15, 0);
            ctx.lineTo(-5, 12);
            ctx.lineTo(-5, -12);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Wings
            ctx.beginPath();
            ctx.moveTo(-5, 12);
            ctx.lineTo(-15, 20);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-5, -12);
            ctx.lineTo(-15, -20);
            ctx.stroke();

        } else {
            // Drone: Hexagon with spinning rim
            // Draw Hexagon
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const a = i * Math.PI / 3;
                const r = 15;
                ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Inner Eye
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 200) * 0.5;
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.fill();
        }

        // Engine Glow (Rear)
        ctx.globalAlpha = 1;
        if (Math.random() < 0.3) {
            const thrustLen = Math.random() * 15 + 5;
            ctx.strokeStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(-10, 0);
            ctx.lineTo(-10 - thrustLen, 0);
            ctx.stroke();
        }

        ctx.restore();
    }
}
