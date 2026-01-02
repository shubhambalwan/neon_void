export default class PowerUp {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.markedForDeletion = false;

        const types = ['health', 'rapidFire', 'shield', 'energy'];
        this.type = types[Math.floor(Math.random() * types.length)];

        switch (this.type) {
            case 'health':
                this.color = '#0f0'; // Green
                this.label = '+HP';
                break;
            case 'rapidFire':
                this.color = '#ff0'; // Yellow
                this.label = '<<<';
                break;
            case 'shield':
                this.color = '#0ff'; // Cyan
                this.label = '(O)';
                break;
            case 'energy':
                this.color = '#00f'; // Blue
                this.label = 'NRG';
                break;
        }

        // drift
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = (Math.random() - 0.5) * 1;

        this.timer = 0;
        this.lifeTime = 10000; // 10 seconds
    }

    update(deltaTime) {
        const ts = this.game.timeScale;
        this.x += this.vx * ts;
        this.y += this.vy * ts;

        this.timer += deltaTime * ts;
        if (this.timer > this.lifeTime) {
            this.markedForDeletion = true;
        }

        // Bounce off walls
        if (this.x < 0 || this.x > this.game.width - this.width) this.vx *= -1;
        if (this.y < 0 || this.y > this.game.height - this.height) this.vy *= -1;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;

        // Pulse Effect
        const pulse = 10 + Math.sin(Date.now() / 200) * 5;
        ctx.shadowBlur = pulse;

        ctx.shadowColor = this.color;

        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.label, this.x + this.width / 2, this.y + this.height / 2);

        ctx.restore();
    }
}
