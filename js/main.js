import Game from './game.js';

window.addEventListener('load', () => {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas to full screen
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const game = new Game(canvas, ctx);

    // Game Loop
    let lastTime = 0;
    function animate(timeStamp) {
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;

        game.update(deltaTime);
        game.draw();

        requestAnimationFrame(animate);
    }

    animate(0);

    // Handle resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        game.resize(canvas.width, canvas.height);
    });

    // UI Buttons
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const startScreen = document.getElementById('start-screen');

    startBtn.addEventListener('click', () => {
        startScreen.classList.add('hidden');
        // Ensure others are hidden
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('pause-screen').classList.add('hidden');
        game.restart();
        startBtn.blur(); // Release focus so Space doesn't click it again
    });

    restartBtn.addEventListener('click', () => {
        game.restart();
        restartBtn.blur();
    });

    // Pause Menu
    const resumeBtn = document.getElementById('resume-btn');
    const quitBtn = document.getElementById('quit-btn');

    resumeBtn.addEventListener('click', () => {
        game.togglePause();
    });

    quitBtn.addEventListener('click', () => {
        game.resetMenu();
        // Hide pause, show start
        document.getElementById('pause-screen').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
    });

    // Dev Message
    const devMsgBtn = document.getElementById('dev-msg-btn');
    const closeMsgBtn = document.getElementById('close-msg-btn');
    const devMsgPanel = document.getElementById('dev-msg-panel');

    devMsgBtn.addEventListener('click', () => {
        devMsgPanel.classList.remove('hidden');
    });

    closeMsgBtn.addEventListener('click', () => {
        devMsgPanel.classList.add('hidden');
    });
});
