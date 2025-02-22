class Snake {
    constructor() {
        this.segments = [
            {x: 300, y: 200},
            {x: 280, y: 200}
        ];
        this.direction = {x: 0, y: 0};
        this.size = 20;
        this.baseSpeed = 0.75;
        this.speed = this.baseSpeed;
        this.isSmiling = false;
    }

    move() {
        const head = {
            x: this.segments[0].x + this.direction.x * this.speed,
            y: this.segments[0].y + this.direction.y * this.speed
        };
        this.segments.unshift(head);
        this.segments.pop();
    }

    draw(ctx) {
        ctx.fillStyle = 'green';
        this.segments.forEach(segment => {
            ctx.fillRect(segment.x, segment.y, this.size, this.size);
        });
        const head = this.segments[0];
        if (this.isSmiling) {
            ctx.beginPath();
            ctx.arc(head.x + this.size / 2, head.y + this.size / 2, 8, 0, Math.PI, false);
            ctx.strokeStyle = 'black';
            ctx.stroke();
        }
    }
}

class WordBox {
    constructor(word, x, y) {
        this.word = word;
        this.x = x;
        this.y = y;
        this.width = 320;
        this.height = 160;
        this.isCollected = false;
    }

    draw(ctx) {
        if (!this.isCollected) {
            ctx.fillStyle = '#D2B48C';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = 'black';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.word, this.x + this.width / 2, this.y + this.height / 2 + 8);
        }
    }

    checkCollision(snake) {
        const head = snake.segments[0];
        return !this.isCollected &&
            head.x < this.x + this.width &&
            head.x + snake.size > this.x &&
            head.y < this.y + this.height &&
            head.y + snake.size > this.y;
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.snake = new Snake();
        this.sentences = [
            ['I', 'can', 'ride', 'a', 'horse.'],
            ['Have', 'you', 'ever', 'seen', 'a', 'volcano?'],
            ['I', 'am', 'in', 'the', 'second', 'grade.'],
            ['Do', 'you', 'want', 'to', 'climb', 'a', 'mountain?']
        ];
        this.currentSentenceIndex = 0;
        this.words = this.sentences[this.currentSentenceIndex];
        this.gameOver = false;
        this.won = false;
        this.gameActive = false;
        this.boxes = this.createRandomBoxes();
        this.gameStarted = false;

        this.setupControls();
        this.gameLoop();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createRandomBoxes() {
        const boxes = [];
        const shuffledWords = [...this.words].sort(() => Math.random() - 0.5);
        const tryX = () => 50 + Math.random() * (this.canvas.width - 370);
        const minY = 50;
        const maxY = this.canvas.height - 210;
        const tryY = () => minY + Math.random() * (maxY - minY);
        const tryPosition = () => ({ x: tryX(), y: tryY() });
        
        const isTooClose = (pos, existingBoxes) => {
            const minDistance = 400;
            return existingBoxes.some(box => {
                const distance = Math.sqrt(
                    Math.pow(pos.x - box.x, 2) + Math.pow(pos.y - box.y, 2)
                );
                return distance < minDistance;
            });
        };

        shuffledWords.forEach(word => {
            let position;
            let attempts = 0;
            do {
                position = tryPosition();
                attempts++;
            } while (isTooClose(position, boxes) && attempts < 100);
            boxes.push(new WordBox(word, position.x, position.y));
        });
        return boxes;
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameActive && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                this.gameActive = true;
            }
            switch (e.key) {
                case 'ArrowUp':
                    this.snake.direction = { x: 0, y: -1 };
                    this.snake.speed = this.snake.baseSpeed * 20;
                    break;
                case 'ArrowDown':
                    this.snake.direction = { x: 0, y: 1 };
                    this.snake.speed = this.snake.baseSpeed * 20;
                    break;
                case 'ArrowLeft':
                    this.snake.direction = { x: -1, y: 0 };
                    this.snake.speed = this.snake.baseSpeed * 20;
                    break;
                case 'ArrowRight':
                    this.snake.direction = { x: 1, y: 0 };
                    this.snake.speed = this.snake.baseSpeed * 20;
                    break;
                case 'Enter':
                    if (!this.gameStarted || this.gameOver) {
                        this.startGame();
                    } else if (this.won) {
                        if (this.currentSentenceIndex < this.sentences.length - 1) {
                            this.currentSentenceIndex++;
                            this.words = this.sentences[this.currentSentenceIndex];
                            this.reset();
                        } else {
                            this.currentSentenceIndex = 0;
                            this.words = this.sentences[this.currentSentenceIndex];
                            this.reset();
                        }
                    }
                    break;
            }
        });

        document.addEventListener('keyup', (e) => {
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                this.snake.speed = this.snake.baseSpeed;
            }
        });

        if (!this.hasClickListener) {
            this.canvas.addEventListener('click', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                if (!this.gameStarted || this.gameOver) {
                    if (y > 180 && y < 220 &&
                        x > this.canvas.width / 2 - 60 && x < this.canvas.width / 2 + 60) {
                        this.startGame();
                    }
                }
                
                if (this.won) {
                    if (y > this.canvas.height / 2 + 40 && y < this.canvas.height / 2 + 80 &&
                        x > this.canvas.width / 2 - 60 && x < this.canvas.width / 2 + 60) {
                        if (this.currentSentenceIndex < this.sentences.length - 1) {
                            this.currentSentenceIndex++;
                            this.words = this.sentences[this.currentSentenceIndex];
                            this.reset();
                        } else {
                            this.currentSentenceIndex = 0;
                            this.words = this.sentences[this.currentSentenceIndex];
                            this.reset();
                        }
                    }
                }
            });
            this.hasClickListener = true;
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!this.gameStarted || this.gameOver) {
            this.ctx.fillStyle = 'black';
            this.ctx.font = 'bold 28px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.words.join(' '), this.canvas.width / 2, 100);
            this.drawButton("Let's go!", this.canvas.width / 2, 200, 120, 40, 'blue');
        } else {
            this.boxes.forEach(box => box.draw(this.ctx));
            this.snake.draw(this.ctx);
        }
        
        if (this.won) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = 'green';
            this.ctx.font = '38px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('You Won!', this.canvas.width / 2, this.canvas.height / 2);
            const buttonText = this.currentSentenceIndex < this.sentences.length - 1 ? 'Next?' : 'Play Again';
            this.drawButton(buttonText, this.canvas.width / 2, this.canvas.height / 2 + 60, 120, 40, 'blue');
        }
    }

    drawButton(text, x, y, width, height, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x - width / 2, y - height / 2, width, height);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '22px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, x, y + 8);
    }

    startGame() {
        this.gameStarted = true;
        this.gameActive = false;
        this.gameOver = false;
        this.currentWordIndex = 0;
        this.snake = new Snake();
        this.snake.direction = { x: 0, y: 0 };
        this.boxes = this.createRandomBoxes();
    }

    reset() {
        this.gameStarted = false;
        this.gameActive = false;
        this.currentWordIndex = 0;
        this.gameOver = false;
        this.won = false;
        this.snake = new Snake();
        this.snake.direction = { x: 0, y: 0 };
        this.boxes = this.createRandomBoxes();
    }

    checkCollisions() {
        if (!this.gameStarted) return;
        
        this.boxes.forEach(box => {
            if (box.checkCollision(this.snake)) {
                if (box.word === this.words[this.currentWordIndex]) {
                    box.isCollected = true;
                    this.currentWordIndex++;
                    const currentSegments = [...this.snake.segments];
                    currentSegments.forEach(segment => {
                        this.snake.segments.push({ ...segment });
                    });
                    if (this.currentWordIndex >= this.words.length) {
                        this.won = true;
                        this.snake.isSmiling = true;
                    }
                } else {
                    this.gameOver = true;
                    this.gameStarted = false;
                }
            }
        });

        const head = this.snake.segments[0];
        if (head.x < 0 || head.x > this.canvas.width - this.snake.size ||
            head.y < 0 || head.y > this.canvas.height - this.snake.size) {
            this.gameOver = true;
            this.gameStarted = false;
        }
    }

    gameLoop() {
        if (this.gameStarted && this.gameActive && !this.gameOver && !this.won) {
            this.snake.move();
            this.checkCollisions();
        }
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game
new Game(); 