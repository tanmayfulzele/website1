const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Increase the area of the playing field by 10 times the size of the canvas
const worldWidth = canvas.width * 4;
const worldHeight = canvas.height * 4;

const playerImage = new Image();
playerImage.src = 'player.png';

const zombieImage = new Image();
zombieImage.src = 'zombie.png';

const antiVaccineImage = new Image();
antiVaccineImage.src = 'anti.png';

class Ball {
    constructor(x, y, radius, image) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.image = image;
        this.dx = Math.random() * 4 - 2;
        this.dy = Math.random() * 4 - 2;
    }

    draw(offsetX, offsetY) {
        ctx.save();
        if (this.image === zombieImage) {
            // Add burning shadow effect for zombies
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'red';
        } else if (this.image === antiVaccineImage) {
            // Add glowing effect for anti-vaccine
            ctx.shadowBlur = 20;
            ctx.shadowColor = 'yellow';
        }
        ctx.drawImage(this.image, this.x - offsetX - this.radius, this.y - offsetY - this.radius, this.radius * 2, this.radius * 2);
        ctx.restore();
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;

        if (this.x + this.radius > worldWidth || this.x - this.radius < 0) {
            this.dx = -this.dx;
        }
        if (this.y + this.radius > worldHeight || this.y - this.radius < 0) {
            this.dy = -this.dy;
        }
    }

    grow(amount) {
        this.radius = Math.max(this.radius + amount, 10); 
    }
}

let player, ballsEaten, difficultyMultiplier, startTime, smallBalls, antiVaccines, highScore;
let animationId;

function initGame() {
    player = new Ball(worldWidth / 2, worldHeight / 2, 40, playerImage);
    ballsEaten = 0;
    difficultyMultiplier = 1;
    startTime = Date.now();
    smallBalls = [];
    antiVaccines = [];
    for (let i = 0; i < 100; i++) {
        spawnBall();
    }
    spawnAntiVaccine();
    gameLoop();
}

function spawnBall() {
    const radius = Math.random() * 10 + 20;
    const x = Math.random() * (worldWidth - radius * 2) + radius;
    const y = Math.random() * (worldHeight - radius * 2) + radius;
    smallBalls.push(new Ball(x, y, radius, zombieImage));
}

function spawnAntiVaccine() {
    const radius = 40; // Increase the size of the anti-vaccine
    const x = Math.random() * (worldWidth - radius * 2) + radius;
    const y = Math.random() * (worldHeight - radius * 2) + radius;
    antiVaccines.push(new Ball(x, y, radius, antiVaccineImage));
}

document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'ArrowUp':
            player.dy = -2 * difficultyMultiplier;
            player.dx = 0;
            break;
        case 'ArrowDown':
            player.dy = 2 * difficultyMultiplier;
            player.dx = 0;
            break;
        case 'ArrowLeft':
            player.dx = -2 * difficultyMultiplier;
            player.dy = 0;
            break;
        case 'ArrowRight':
            player.dx = 2 * difficultyMultiplier;
            player.dy = 0;
            break;
    }
});

function distance(ball1, ball2) {
    return Math.hypot(ball1.x - ball2.x, ball1.y - ball2.y);
}

function checkCollision(ball1, ball2) {
    return distance(ball1, ball2) < ball1.radius + ball2.radius;
}

function updateDifficulty() {
    const elapsedTime = (Date.now() - startTime) / 1000; // in seconds
    difficultyMultiplier = 1 + elapsedTime / 60; // difficulty increases every minute
}

function gameOver() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.font = '48px sans-serif';
    ctx.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2 - 50);
    ctx.font = '24px sans-serif';
    ctx.fillText('High Score: ' + highScore, canvas.width / 2 - 80, canvas.height / 2);
    ctx.fillText('Balls Eaten: ' + ballsEaten, canvas.width / 2 - 80, canvas.height / 2 + 30);

    const retryButton = document.createElement('button');
    retryButton.textContent = 'Retry';
    retryButton.style.position = 'absolute';
    retryButton.style.left = canvas.width / 2 - 50 + 'px';
    retryButton.style.top = canvas.height / 2 + 60 + 'px';
    retryButton.style.padding = '10px 20px';
    retryButton.style.fontSize = '20px';
    retryButton.onclick = () => {
        retryButton.remove();
        initGame();
    };
    document.body.appendChild(retryButton);

    cancelAnimationFrame(animationId);
}

function drawHUD() {
    ctx.fillStyle = 'black';
    ctx.font = '24px sans-serif';
    ctx.fillText('Balls Eaten: ' + ballsEaten, 10, 30);
    ctx.fillText('High Score: ' + highScore, 10, 60);
}

function drawBoundary(offsetX, offsetY) {
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 5;
    ctx.strokeRect(-offsetX, -offsetY, worldWidth, worldHeight);
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const offsetX = player.x - canvas.width / 2;
    const offsetY = player.y - canvas.height / 2;

    drawBoundary(offsetX, offsetY);

    player.draw(offsetX, offsetY);
    player.update();

    smallBalls.forEach((ball, index) => {
        ball.draw(offsetX, offsetY);
        ball.update();

        if (checkCollision(player, ball)) {
            player.grow(ball.radius * 0.2);
            smallBalls.splice(index, 1);
            ballsEaten += 1;
            spawnBall();

            // Spawn anti-vaccine every two zombies eaten
            if (ballsEaten % 2 === 0) {
                spawnAntiVaccine();
            }
        }
    });

    antiVaccines.forEach((antiVaccine, index) => {
        antiVaccine.draw(offsetX, offsetY);
        antiVaccine.update();

        if (checkCollision(player, antiVaccine)) {
            player.grow(-10); // Decrease the player's size by a fixed amount
            ballsEaten = Math.max(ballsEaten - 2, 0); // Decrease the balls eaten count
            antiVaccines.splice(index, 1);
        }
    });

    updateDifficulty();

    if (ballsEaten >= 10) {
        highScore = Math.max(highScore, Math.floor((Date.now() - startTime) / 1000));
        gameOver();
        return;
    }

    drawHUD();

    animationId = requestAnimationFrame(gameLoop);
}

// Initialize high score
highScore = 0;

// Start the game
initGame();
