class Game {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.context = this.canvas.getContext('2d');
        this.canvasColor = 'rgb(150,100,40)';
        this.canvasUnderAttackColor = 'rgb(150,0,40)';
        this.fillBackground();
        this.ENEMIES_DEFAULT_SPEED = 3;
        this.ENEMIES_FAST_SPEED = 10;
        this.ENEMIES_ON_SCREEN = 8;
        this.enemiesSpeed = this.ENEMIES_DEFAULT_SPEED;
        this.underAttack = false;
        this.pauseGame = false;

        this.healthLbl = document.getElementById('health-lbl');
        this.health = 100;
        this.scoreLbl = document.getElementById('score-lbl');
        this.score = 0;

        this.ship = new Ship(this);

        this.enemies = [];
        this.bullet = null;
        this.playerShoot = false;

        this.animation = requestAnimationFrame(() => this.startGame());

        this.addControllers();
    }


    startGame () {

        this.detectCollision();
        this.generateEnemies();
        this.generateBullet();
        this.moveEnemies();
        this.drawGame();
        this.updateStats();
        this.checkIfShoot();
        this.animation = requestAnimationFrame(() => {
            this.startGame();
        });
    }

    updateStats() {
        this.healthLbl.innerText = this.health;
        this.scoreLbl.innerText = this.score;
    }

    addControllers () {
        window.addEventListener('keydown', (e) => {
            switch (e.keyCode) {
                case 37:
                    this.ship.moveShip("LEFT");
                    break;
                case 39:
                    this.ship.moveShip("RIGHT");
                    break;
                case 38:
                    if (!this.playerShoot) {
                        this.bullet = new Bullet(this.ship.x + 20, this.ship.y + 4, this);
                        this.playerShoot = true;
                    }
                    break;
                case 13:
                    if (!this.pauseGame) {
                        cancelAnimationFrame(this.animation)
                        this.pauseGame = true;
                    } else {
                        this.animation = requestAnimationFrame(() => this.startGame());
                        this.pauseGame = false;
                    }
                    break;
            }
        });

        window.addEventListener('keypress', (e) => {
            if (e.keyCode == 32) {
                this.enemiesSpeed = this.ENEMIES_FAST_SPEED;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.keyCode == 32) {
                this.enemiesSpeed = this.ENEMIES_DEFAULT_SPEED;
            }
        });
    }


    checkIfShoot() {
        if (this.playerShoot) {
            this.bullet.move();
            this.detectIfBulletHitTarget();
        }
    }


    moveEnemies() {
        for (let i = 0; i < this.enemies.length; i++) {
            this.enemies[i].move(this.enemiesSpeed);
        }
    }

    detectIfBulletHitTarget() {
        const bullet = this.bullet;
        const enemies = this.enemies;
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            if (((bullet.x < (enemy.x + enemy.width) && bullet.x >= enemy.x)
                && (bullet.y < (enemy.y + enemy.height) && bullet.y >= enemy.y)) ||
                (((bullet.x + bullet.width) < (enemy.x + enemy.width) && (bullet.x + bullet.width) > enemy.x)
                    && (bullet.y < (enemy.y + enemy.height) && bullet.y >= enemy.y))
            )  {
                enemies.splice(i, 1);
                this.playerShoot = false;
                this.bullet = null;
                this.score += 1;
            }
        }
        this.enemies = enemies;
    }

    increaseSpeed () {
        if (this.score == 1000 || this.score == 2000 || this.score == 3000 || this.score == 4000 || this.score == 5000) {
            this.ENEMIES_DEFAULT_SPEED++;
        }
    }

    generateEnemies () {
        const enemies = this.enemies;
        for (let i = 0; i < enemies.length; i++) {
            if (enemies[i].y > 500) {
                enemies.splice(i, 1);
            }
        }

        while (enemies.length < this.ENEMIES_ON_SCREEN) {
            enemies.push(new Enemy(this));
        }

        this.enemies = enemies;
    }

    generateBullet() {
        if (this.bullet != null) {
            if (this.bullet.y < 0) {
                this.bullet = null;
                this.playerShoot = false;
            }
        }
    }

    detectCollision() {
        this.underAttack = false;
        const ship = this.ship;
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            if (((enemy.x < (ship.x + ship.width) && enemy.x >= ship.x)
                && (enemy.y < (ship.y + ship.height) && enemy.y >= ship.y)) ||
               (((enemy.x + enemy.width) < (ship.x + ship.width) && (enemy.x + enemy.width) > ship.x)
                   && (enemy.y < (ship.y + ship.height) && enemy.y >= ship.y))
            )  {
                this.health -= 10;
                this.underAttack = true;
            }
        }
        this.score++;
        this.increaseSpeed();
        this.checkIfGameOver();
    }

    checkIfGameOver() {
        if (this.health <= 0) {
            //restart game
            this.health = 100;
            this.enemies = [];
            this.ship = new Ship(this);
            this.bullet = null;
            this.playerShoot = false;
            this.ENEMIES_DEFAULT_SPEED = 3;
            this.score = 0;
        }
    }


    drawGame() {
        this.clearScreen();
        for (let i = 0; i < this.enemies.length; i++) {
            this.enemies[i].draw();
        }
        this.ship.draw();
        if (this.playerShoot) {
            this.bullet.draw();
        }
    }

    clearScreen() {
        this.context.clearRect(0,0,200,500);
        this.fillBackground();
    }

    fillBackground() {
        this.context.fillStyle = this.underAttack ? this.canvasUnderAttackColor : this.canvasColor;
        this.context.fillRect(0,0,200,500);
    }
}

class Figure {
    constructor(x, y, width, height, game, color)
    {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.game = game;
        this.color = color;
    }

    draw() {
        const context = this.game.context;
        context.fillStyle = this.color;
        context.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Ship extends Figure{
    constructor(game) {
        super(80, 460,40,20, game, 'rgb(0,200,200)');
    }

    moveShip(direction) {
        if (this.game.pauseGame) {
            return;
        }

        if (direction == "LEFT") {
            if (!this.x > 0) return;
            this.x -= 20;
        } else if (direction == "RIGHT") {
            if (!(this.x + this.width < 200)) return;
            this.x += 20;
        }
        this.game.drawGame();
    }
}

class Enemy extends Figure{
    constructor (game) {
        let randomX = Math.random() * 180;
        const x = randomX - (randomX % 40);
        let randomY = (Math.random() * 200) * -1;
        const y = randomY - (randomY % 1);
        super(x, y,40 , 20, game, 'rgb(100,0,220)');
    }

    move (speed) {
        this.y += speed;
    }
}

class Bullet extends Figure{

    constructor (x, y, game) {
        super(x, y,4,4, game, 'rgb(198,200,0)');
    }

    move() {
        this.y-=2;
    }
}


(new Game());
