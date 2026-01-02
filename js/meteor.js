export default class Meteor {
    constructor(game) {
        this.game = game;

        // Spawn edges
        if (Math.random() < 0.5) {
            this.x = Math.random() < 0.5 ? -50 : this.game.width + 50;
            this.y = Math.random() * this.game.height;
        } else {
            this.x = Math.random() * this.game.width;
            this.y = Math.random() < 0.5 ? -50 : this.game.height + 50;
        }

        this.size = Math.random() * 30 + 20; // 20-50

        // Move towards center roughly
        const angle = Math.atan2(this.game.height / 2 - this.y, this.game.width / 2 - this.x) + (Math.random() - 0.5);
        const speed = Math.random() * 2 + 1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;

        this.lives = 5;
        this.markedForDeletion = false;

        this.vertices = [];
        const numVerts = 8;
        for (let i = 0; i < numVerts; i++) {
            const r = this.size * (0.8 + Math.random() * 0.4);
            const a = (i / numVerts) * Math.PI * 2;
            this.vertices.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
        }
    }

    update(deltaTime) {
        const dt = deltaTime / 16.67;
        const ts = this.game.timeScale;
        this.x += this.vx * ts * dt;
        this.y += this.vy * ts * dt;
        this.rotation += this.rotationSpeed * ts * dt;

        // Boundary check (far off screen)
        if (this.x < -100 || this.x > this.game.width + 100 ||
            this.y < -100 || this.y > this.game.height + 100) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        ctx.strokeStyle = '#888';
        ctx.fillStyle = '#444';
        ctx.lineWidth = 2;

        ctx.beginPath();
        this.vertices.forEach((v, i) => {
            if (i === 0) ctx.moveTo(v.x, v.y);
            else ctx.lineTo(v.x, v.y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }
}
