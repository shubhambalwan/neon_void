export class Particle {
    constructor(game, x, y, color, velocity) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 1;
        this.vx = (Math.random() - 0.5) * velocity;
        this.vy = (Math.random() - 0.5) * velocity;
        this.life = 1.0; // Life 1.0 -> 0.0
        this.decay = Math.random() * 0.02 + 0.02;
    }

    update(deltaTime) {
        const dt = deltaTime / 16.67;
        // Particles ignore time scale for "impact" feel? Or obey it?
        // Usually visual effects look cooler if they slow down too.
        const ts = this.game.timeScale;

        this.x += this.vx * ts * dt;
        this.y += this.vy * ts * dt;
        this.life -= this.decay * ts * dt;
        this.size *= 0.95; // Shrink? Maybe scale shrink too?
        // Shrink rate is exponential, so Math.pow(0.95, dt)
        this.size *= Math.pow(0.95, dt);
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;

        // Glow - Removed expensive shadowBlur for performance
        // ctx.shadowBlur = 10;
        // ctx.shadowColor = this.color;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export default class ParticleManager {
    constructor(game) {
        this.game = game;
        this.particles = [];
    }

    createExplosion(x, y, color, count = 15) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(this.game, x, y, color, 5));
        }
    }

    createThruster(x, y, angle) {
        // Direct opposite to angle
        const speed = 2;
        const vx = Math.cos(angle + Math.PI) * speed + (Math.random() - 0.5);
        const vy = Math.sin(angle + Math.PI) * speed + (Math.random() - 0.5);
        const p = new Particle(this.game, x, y, '#0ff', 1);
        p.vx = vx;
        p.vy = vy;
        p.decay = 0.1; // Short life
        this.particles.push(p);
    }

    update(deltaTime) {
        this.particles.forEach(p => p.update(deltaTime));
        this.particles = this.particles.filter(p => p.life > 0.01);
        // Hard Cap for Performance
        if (this.particles.length > 200) {
            this.particles.splice(0, this.particles.length - 200);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        this.particles.forEach(p => p.draw(ctx));
        ctx.restore();
    }
}
