// Variables globales
let tileSize = 32;
let rows = 16;
let columns = 16;
let boardWidth = tileSize * columns;
let boardHeight = tileSize * rows;
let enemyDirectionX = 1;
const enemyVelocityX = 10;
const enemyVelocityY = 10;
let gameOver = false;
let isPaused = false;
let score = 0;
let startTime = Date.now();
let enemies = [];
let player;
let wave = 1;


function updateGame() {
    if (gameOver || isPaused) return;
    player.moveProjectiles(enemies);
    const collision = limitDetected(enemies);
    enemies.forEach(enemy => enemy.moveEnemy(collision, player));
    if (enemies.length === 0) {
        if (wave === 4) {
            gameOver = true;
            document.getElementById("victoryMessage").classList.remove("hidden");
            return;
        }
        wave += 1;
        enemies = createEnemies(wave);
    }
    requestAnimationFrame(updateGame);
}

// Fonction pour redémarrer la vague d'ennemis
function restartWave() {
    console.log("Restarting wave");
    enemies.forEach(enemy => enemy.resetPosition()); 
    player.reset(); // Réinitialise la position et l'état du joueur
    updateGame(); // Reprend la boucle du jeu
}
function createEnemies(wave) {
    let enemiesArray = [];
    let enemySpacingX = tileSize * 2;
    let enemySpacingY = tileSize;
    let enemyOffsetX = (boardWidth - (enemySpacingX * 5)) / 2;
    for (let row = 0; row < 3; row++) { // 3 rangées
        for (let col = 0; col < 5; col++) { // 5 ennemis par rangée
            let enemyPosX = enemyOffsetX + col * enemySpacingX;
            let enemyPosY = enemySpacingY * row + tileSize * 2 + tileSize * 2 * wave;
            let enemy = new Enemy(enemyPosX, enemyPosY);
            console.log(`Enemy created at (${enemyPosX}, ${enemyPosY})`);
            enemiesArray.push(enemy);
        }
    }
    return enemiesArray;
}

// Fonction pour vérifier les limites des ennemis
function limitDetected(enemies) {
    for (let enemy of enemies) {
        if (enemy.enemyPosX + enemyVelocityX < 0 || enemy.enemyPosX + enemy.enemyWidth > boardWidth) {
            return true;
        }
    }
    return false;
}

// Fonction pour formater le temps écoulé
function formatTime(milliseconds) {
    let totalSeconds = Math.floor(milliseconds / 1000);
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Fonction pour mettre à jour le timer
function updateTimer() {
    let elapsedTime = Date.now() - startTime;
    document.getElementById("timer").textContent = `Time: ${formatTime(elapsedTime)}`;
    if (!isPaused && !gameOver) {
        requestAnimationFrame(updateTimer);
    }
}

// Classe Player
class Player {
    constructor(boardWidth, boardHeight, playerWidth = tileSize * 2, playerHeight = tileSize, playerVelocityX = tileSize) {
        this.playerWidth = playerWidth;
        this.playerHeight = playerHeight;
        this.playerPosX = boardWidth / 2 - playerWidth / 2;
        this.playerPosY = boardHeight - tileSize * 2;
        this.playerVelocityX = playerVelocityX;
        this.projectiles = []; // Vérifiez bien que ceci est là
        this.lives = 3;
    }
    

    movePlayer(e) {
        if (gameOver || isPaused) return;
        if (e.code === "ArrowLeft" && this.playerPosX - this.playerVelocityX >= 0) {
            this.playerPosX -= this.playerVelocityX;
        } else if (e.code === "ArrowRight" && this.playerPosX + this.playerVelocityX + this.playerWidth <= boardWidth) {
            this.playerPosX += this.playerVelocityX;
        }
        this.updatePlayerPosition();
    }

    updatePlayerPosition() {
        const playerElement = document.getElementById('player');
        playerElement.style.left = `${this.playerPosX}px`;
    }

    shoot(e) {
        if (gameOver || isPaused) return;
        if (e.code === "Space") {
            const projectilePosX = this.playerPosX + this.playerWidth / 2 - tileSize / 16;
            const projectilePosY = this.playerPosY;
            const newProjectile = new Projectile(projectilePosX, projectilePosY);
            this.projectiles.push(newProjectile);  // Ajout du projectile au tableau
            this.moveProjectiles(enemies);
        }
    }
    

    moveProjectiles(enemies) {
        console.log("Projectiles:", this.projectiles);
        console.log("Enemies:", enemies);
        if (!Array.isArray(this.projectiles)) {
            console.error("projectiles is not an array");
            return;
        }
        this.projectiles.forEach((projectile, index) => {
            if (projectile.projectilePosY <= 0) {
                projectile.projectileElement.remove();
                this.projectiles.splice(index, 1);
            } else {
                enemies.forEach((enemy, enemyIndex) => {
                    if (projectile.checkCollisionWithEnemy(enemy)) {
                        projectile.projectileElement.remove();
                        this.projectiles.splice(index, 1);
                        enemy.destroy();
                        enemies.splice(enemyIndex, 1);
                        score += 10;
                        document.getElementById('score').textContent = `${score}`;
                    }
                });
                if (!projectile.projectileTouchEnemy) {
                    projectile.moveUpProjectile();
                }
            }
        });
    }

    loseLife() {
        this.lives -= 1;
        if (this.lives > 0) {
            document.getElementById("lives").textContent = `Lives: ${this.lives}`;
            setTimeout(restartWave, 1000);
        } else {
            gameOver = true;
            document.getElementById("gameOverMessage").classList.remove("hidden");
        }
    }

    reset() {
        this.playerPosX = boardWidth / 2 - this.playerWidth / 2;
        this.playerPosY = boardHeight - tileSize * 2;
        this.projectiles.forEach(projectile => projectile.projectileElement.remove());
        this.projectiles = [];
        this.updatePlayerPosition();
    }
}

// Classe Projectile
class Projectile {
    constructor(projectilePosX, projectilePosY, projectileVelocityY = tileSize / 2) {
        this.projectileWidth = tileSize / 8;
        this.projectileHeight = tileSize / 2;
        this.projectilePosX = projectilePosX;
        this.projectilePosY = projectilePosY;
        this.projectileVelocityY = projectileVelocityY;
        this.projectileTouchEnemy = false;
        this.createProjectileElement();
    }

    createProjectileElement() {
        this.projectileElement = document.createElement("div");
        this.projectileElement.className = 'projectile';
        this.projectileElement.style.width = `${this.projectileWidth}px`;
        this.projectileElement.style.height = `${this.projectileHeight}px`;
        this.projectileElement.style.left = `${this.projectilePosX}px`;
        this.projectileElement.style.top = `${this.projectilePosY}px`;
        const board = document.getElementById("board");
        board.appendChild(this.projectileElement);
    }

    moveUpProjectile() {
        this.projectilePosY -= this.projectileVelocityY;
        this.updateProjectilePosition();
    }

    updateProjectilePosition() {
        this.projectileElement.style.top = `${this.projectilePosY}px`;
    }

    checkCollisionWithEnemy(enemy) {
        const projectileRight = this.projectilePosX + this.projectileWidth;
        const projectileBottom = this.projectilePosY + this.projectileHeight;
        const enemyRight = enemy.enemyPosX + enemy.enemyWidth;
        const enemyBottom = enemy.enemyPosY + enemy.enemyHeight;
        const collisionX = this.projectilePosX < enemyRight && projectileRight > enemy.enemyPosX;
        const collisionY = this.projectilePosY < enemyBottom && projectileBottom > enemy.enemyPosY;
        if (collisionX && collisionY) {
            this.projectileTouchEnemy = true;
            return true;
        }
        return false;
    }
}

// Classe Enemy
class Enemy {
    constructor(enemyPosX = tileSize, enemyPosY = tileSize * 2, enemyVelocityX = 10, enemyVelocityY = 10) {
        this.initialPosX = enemyPosX; // Conservez la position initiale
        this.initialPosY = enemyPosY;
        this.enemyWidth = tileSize * 2;
        this.enemyHeight = tileSize;
        this.enemyPosX = enemyPosX;
        this.enemyPosY = enemyPosY;
        this.enemyVelocityX = enemyVelocityX;
        this.enemyVelocityY = enemyVelocityY;
        this.createEnemyElement();
        this.hasReachedALimit = false;
    }

    resetPosition() {
        this.enemyPosX = this.initialPosX; // Utilisez les positions initiales
        this.enemyPosY = this.initialPosY;
        this.updateEnemyElement(); // Met à jour la position de l'élément dans le DOM
    }

    createEnemyElement() {
        this.enemyElement = document.createElement("div");
        this.enemyElement.className = 'enemy';
        this.enemyElement.style.width = `${this.enemyWidth}px`;
        this.enemyElement.style.height = `${this.enemyHeight}px`;
        this.enemyElement.style.left = `${this.enemyPosX}px`;
        this.enemyElement.style.top = `${this.enemyPosY}px`;
        const board = document.getElementById("board");
        board.appendChild(this.enemyElement);
    }

    moveEnemy(collision, player) {
        if (collision) {
            console.log("Collision detected, changing direction");
            this.enemyPosY += this.enemyVelocityY;
            this.enemyVelocityX *= -1;
        }
        this.enemyPosX += this.enemyVelocityX;
        this.updateEnemyElement();
        if (this.enemyPosY + this.enemyHeight >= boardHeight) {
            this.enemyVelocityX = 0;
            this.enemyVelocityY = 0;
            if (!gameOver) {
                console.log("Enemy reached bottom, losing life");
                player.loseLife();
                if (player.lives > 0) {
                    restartWave(); // Réinitialise les ennemis à leur position de départ
                }
            }
        }
        this.stopEnemy(player);
        this.checkCollisionWithPlayer(player);
    }
    
    

    updateEnemyElement() {
        this.enemyElement.style.left = `${this.enemyPosX}px`;
        this.enemyElement.style.top = `${this.enemyPosY}px`;
    }

    stopEnemy(player) {
        const playerRight = player.playerPosX + player.playerWidth;
        const playerBottom = player.playerPosY + player.playerHeight;
        const enemyRight = this.enemyPosX + this.enemyWidth;
        const enemyBottom = this.enemyPosY + this.enemyHeight;
        const collisionX = player.playerPosX <= enemyRight && playerRight >= this.enemyPosX;
        const collisionY = player.playerPosY <= enemyBottom && playerBottom >= this.enemyPosY;
        if (collisionX && collisionY) {
            this.enemyVelocityX = 0;
            this.enemyVelocityY = 0;
        }
    }

    checkCollisionWithPlayer(player) {
        const playerRight = player.playerPosX + player.playerWidth;
        const playerBottom = player.playerPosY + player.playerHeight;
        const enemyRight = this.enemyPosX + this.enemyWidth;
        const enemyBottom = this.enemyPosY + this.enemyHeight;
        const collisionX = player.playerPosX < enemyRight && playerRight > this.enemyPosX;
        const collisionY = player.playerPosY < enemyBottom && playerBottom > this.enemyPosY;
        if (collisionX && collisionY) {
            player.loseLife();
            if (player.lives > 0) {
                restartWave();
            }
        }
    }

    destroy() {
        this.enemyElement.remove();
        this.isDestroyed = true;
    }
}


// Fonction d'initialisation
document.addEventListener('DOMContentLoaded', function () {
    player = new Player(boardWidth, boardHeight);
    enemies = createEnemies(wave); // Initialisation des ennemis
    const playerElement = document.getElementById('player');
    playerElement.style.left = `${player.playerPosX}px`;
    playerElement.style.top = `${player.playerPosY}px`;
    playerElement.style.width = `${player.playerWidth}px`;
    playerElement.style.height = `${player.playerHeight}px`;

   
 
  

    function restartGame() {
        if (player.lives > 0) {
            enemies.forEach(enemy => enemy.enemyElement.remove());
            enemies = [];
        }

        player.reset();
        document.getElementById("lives").textContent = `Lives: ${player.lives}`;

        gameOver = false;
        isPaused = false;
        score = 0;
        wave = 1;
        startTime = Date.now();

        document.getElementById('score').textContent = `${score}`;
        document.getElementById("victoryMessage").classList.add("hidden");
        document.getElementById("gameOverMessage").classList.add("hidden");
        document.getElementById("pauseMenu").classList.add("hidden");

        enemies = createEnemies(wave);
        updateGame();
        updateTimer();
    }


    document.addEventListener('keydown', (e) => player.movePlayer(e));
    document.addEventListener('keydown', (e) => player.shoot(e));

    document.getElementById('continueButton').addEventListener('click', function () {
        isPaused = false;
        document.getElementById("pauseMenu").classList.add("hidden");
        updateGame();
    });

    document.getElementById('restartButton').addEventListener('click', function () {
        restartGame();
    });

    document.addEventListener('keydown', (e) => {
        if (e.code === "Escape") {
            isPaused = !isPaused;
            document.getElementById("pauseMenu").classList.toggle("hidden", !isPaused);
        }
    });

    updateGame();
    updateTimer();
});
