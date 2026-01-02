export class Layer {
    constructor(game, width, height, speedModifier, startCount) {
        this.game = game;
        this.width = width;
        this.height = height;
        this.speedModifier = speedModifier;
        this.stars = [];
        this.baseSpeed = 1;

        const colors = ['#ffffff', '#aaccff', '#ffccaa', '#aaffcc'];

        for (let i = 0; i < startCount; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * (speedModifier * 2.5) + 0.5,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: Math.random() * 0.5 + 0.5
            });
        }
    }

    update(deltaTime) {
        const ts = this.game.timeScale;
        const speed = this.baseSpeed * this.speedModifier * ts * 20;

        this.stars.forEach(star => {
            star.y += speed * (deltaTime / 16);
            if (star.y > this.height) {
                star.y = 0;
                star.x = Math.random() * this.width;
            }
        });
    }

    draw(ctx) {
        this.stars.forEach(star => {
            ctx.globalAlpha = star.alpha;
            ctx.fillStyle = star.color;
            ctx.fillRect(star.x, star.y, star.size, star.size);
        });
        ctx.globalAlpha = 1.0;
    }
}

export default class Background {
    constructor(game) {
        this.game = game;
        this.layers = [
            new Layer(game, game.width, game.height, 0.2, 50), // Distant
            new Layer(game, game.width, game.height, 0.5, 30), // Mid
            new Layer(game, game.width, game.height, 1.0, 20)  // Close
        ];
    }

    update(deltaTime) {
        this.layers.forEach(layer => layer.update(deltaTime));
    }

    draw(ctx) {
        this.layers.forEach(layer => layer.draw(ctx));
    }

    resize(width, height) {
        this.layers.forEach(layer => {
            layer.width = width;
            layer.height = height;
        });
    }
}
