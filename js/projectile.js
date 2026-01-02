export default class Projectile {
    constructor(game, x, y, vx, vy, isEnemy = false) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.isEnemy = isEnemy;
        this.width = 5;
        this.height = 5;
        this.markedForDeletion = false;
        this.color = isEnemy ? '#f00' : '#ff0';
    }

    update(deltaTime) {
        const dt = deltaTime / 16.67;
        const timeScale = this.game.timeScale;
        this.x += this.vx * timeScale * dt;
        this.y += this.vy * timeScale * dt;

        // Bounds check (off screen)
        if (this.x < 0 || this.x > this.game.width || this.y < 0 || this.y > this.game.height) {
            this.markedForDeletion = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.restore();
    }
}
