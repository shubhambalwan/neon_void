import ParticleManager from './particle.js';

export default class ShootingStart {
    constructor(game) {
        this.game = game;
        this.width = 30;
        this.height = 30;
        this.markedForDeletion = false;

        // Always spawn top/side and move diagonally down
        // Start either Left or Right side, high up
        const startSide = Math.random() < 0.5 ? 'left' : 'right';

        if (startSide === 'left') {
            this.x = -50;
            this.vx = Math.random() * 5 + 10; // Fast Right
        } else {
            this.x = game.width + 50;
            this.vx = -(Math.random() * 5 + 10); // Fast Left
        }

        this.y = Math.random() * (game.height / 2); // Upper half
        this.vy = Math.random() * 5 + 2; // Downward drift

        this.lives = 1; // One Shot Kill
        this.score = 500; // Big Bonus
        this.color = '#fff';

        this.angle = 0;
    }

    update(deltaTime) {
        const dt = deltaTime / 16.67;
        const ts = this.game.timeScale;

        this.x += this.vx * ts * dt;
        this.y += this.vy * ts * dt;
        this.angle += 0.2 * ts * dt;

        // Trail
        if (this.game.particles) {
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            // Emit trail opposite to velocity
            this.game.particles.createThruster(cx, cy, Math.atan2(this.vy, this.vx) + Math.PI);
        }

        // Bounds
        if (this.x < -100 || this.x > this.game.width + 100 || this.y > this.game.height + 100) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.angle);

        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffffaa';
        ctx.fillStyle = '#fff';

        // Star Shape
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * 15,
                -Math.sin((18 + i * 72) * Math.PI / 180) * 15);
            ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * 7,
                -Math.sin((54 + i * 72) * Math.PI / 180) * 7);
        }
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}
