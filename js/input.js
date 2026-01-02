export default class InputHandler {
    constructor(game) {
        this.game = game;
        this.keys = [];
        this.mouse = { x: 0, y: 0, down: false };

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.game.togglePause();
            }
            const key = e.key.toLowerCase();
            if (this.keys.indexOf(key) === -1) {
                this.keys.push(key);
            }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            const index = this.keys.indexOf(key);
            if (index > -1) {
                this.keys.splice(index, 1);
            }
        });

        window.addEventListener('mousedown', (e) => {
            this.mouse.down = true;
        });

        window.addEventListener('mouseup', (e) => {
            this.mouse.down = false;
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
    }
}
