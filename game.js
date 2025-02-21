class Snake {
    constructor() {
        this.segments = [
            {x: 300, y: 200},
            {x: 280, y: 200}
        ];
        this.direction = {x: 1, y: 0};
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
        // Draw body
        ctx.fillStyle = 'green';
        this.segments.forEach(segment => {
            ctx.fillRect(segment.x, segment.y, this.size, this.size);
        });

        // Draw face
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
        this.width = 80;
        this.height = 40;
        this.isCollected = false;
    }

    draw(ctx) {
        if (!this.isCollected) {
            ctx.fillStyle = '#D2B48C'; // Light brown color
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = 'black';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.word, this.x + this.width / 2, this.y + this.height / 2 + 7);
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
        this.boxes = this.createRandomBoxes();
        this.gameStarted = false;  // New flag to track if game has started
        
        this.touchButtons = {
            up: { x: this.canvas.width / 2 - 20, y: this.canvas.height - 100, width: 40, height: 40 },
            down: { x: this.canvas.width / 2 - 20, y: this.canvas.height - 40, width: 40, height: 40 },
            left: { x: this.canvas.width / 2 - 80, y: this.canvas.height - 70, width: 40, height: 40 },
            right: { x: this.canvas.width / 2 + 40, y: this.canvas.height - 70, width: 40, height: 40 }
        };
        this.setupTouchControls();
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
        const minDistance = 120; // Minimum distance between boxes
        
        const tryPosition = () => {
            return {
                x: 50 + Math.random() * (this.canvas.width - 180),
                y: 50 + Math.random() * (this.canvas.height - 140)
            };
        };

        const isTooClose = (pos, existingBoxes) => {
            return existingBoxes.some(box => {
                const distance = Math.sqrt(
                    Math.pow(pos.x - box.x, 2) + 
                    Math.pow(pos.y - box.y, 2)
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
            switch (e.key) {
                case 'ArrowUp':
                    this.snake.direction = { x: 0, y: -1 };
                    this.snake.speed = this.snake.baseSpeed * 3;
                    break;
                case 'ArrowDown':
                    this.snake.direction = { x: 0, y: 1 };
                    this.snake.speed = this.snake.baseSpeed * 3;
                    break;
                case 'ArrowLeft':
                    this.snake.direction = { x: -1, y: 0 };
                    this.snake.speed = this.snake.baseSpeed * 3;
                    break;
                case 'ArrowRight':
                    this.snake.direction = { x: 1, y: 0 };
                    this.snake.speed = this.snake.baseSpeed * 3;
                    break;
                case 'Enter':
                    // Handle Let's go! button
                    if (!this.gameStarted || this.gameOver) {
                        this.startGame();
                    }
                    // Handle Next/Play Again button
                    else if (this.won) {
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
                
                if ((!this.gameStarted || this.gameOver) && 
                    y > 180 && y < 220 && 
                    x > this.canvas.width / 2 - 60 && x < this.canvas.width / 2 + 60) {
                    this.startGame();
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

    setupTouchControls() {
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent scrolling when touching the canvas
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            // Check Let's go! and Next buttons
            if (!this.gameStarted || this.gameOver) {
                if (y > 180 && y < 220 && x > this.canvas.width / 2 - 60 && x < this.canvas.width / 2 + 60) {
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

            // Check direction buttons
            if (this.gameStarted && !this.gameOver && !this.won) {
                if (this.isPointInButton(x, y, this.touchButtons.up)) {
                    this.snake.direction = { x: 0, y: -1 };
                    this.snake.speed = this.snake.baseSpeed * 3;
                }
                if (this.isPointInButton(x, y, this.touchButtons.down)) {
                    this.snake.direction = { x: 0, y: 1 };
                    this.snake.speed = this.snake.baseSpeed * 3;
                }
                if (this.isPointInButton(x, y, this.touchButtons.left)) {
                    this.snake.direction = { x: -1, y: 0 };
                    this.snake.speed = this.snake.baseSpeed * 3;
                }
                if (this.isPointInButton(x, y, this.touchButtons.right)) {
                    this.snake.direction = { x: 1, y: 0 };
                    this.snake.speed = this.snake.baseSpeed * 3;
                }
            }
        });

        this.canvas.addEventListener('touchend', () => {
            if (this.gameStarted && !this.gameOver && !this.won) {
                this.snake.speed = this.snake.baseSpeed;
            }
        });
    }

    isPointInButton(x, y, button) {
        return x >= button.x && x <= button.x + button.width &&
               y >= button.y && y <= button.y + button.height;
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
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('You Won!', this.canvas.width / 2, this.canvas.height / 2);
            
            const buttonText = this.currentSentenceIndex < this.sentences.length - 1 ? 'Next?' : 'Play Again';
            this.drawButton(buttonText, this.canvas.width / 2, this.canvas.height / 2 + 60, 120, 40, 'blue');
        }

        // Draw touch controls if game is active and on a touch device
        if (this.gameStarted && !this.gameOver && !this.won && 'ontouchstart' in window) {
            this.drawTouchControls();
        }
    }

    drawButton(text, x, y, width, height, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x - width / 2, y - height / 2, width, height);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(text, x, y + 7);
    }

    drawTouchControls() {
        // Draw direction buttons
        this.ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
        
        // Up arrow
        this.ctx.beginPath();
        this.ctx.moveTo(this.touchButtons.up.x + 20, this.touchButtons.up.y + 30);
        this.ctx.lineTo(this.touchButtons.up.x + 40, this.touchButtons.up.y + 30);
        this.ctx.lineTo(this.touchButtons.up.x + 20, this.touchButtons.up.y + 10);
        this.ctx.lineTo(this.touchButtons.up.x, this.touchButtons.up.y + 30);
        this.ctx.fill();

        // Down arrow
        this.ctx.beginPath();
        this.ctx.moveTo(this.touchButtons.down.x + 20, this.touchButtons.down.y + 10);
        this.ctx.lineTo(this.touchButtons.down.x + 40, this.touchButtons.down.y + 10);
        this.ctx.lineTo(this.touchButtons.down.x + 20, this.touchButtons.down.y + 30);
        this.ctx.lineTo(this.touchButtons.down.x, this.touchButtons.down.y + 10);
        this.ctx.fill();

        // Left arrow
        this.ctx.beginPath();
        this.ctx.moveTo(this.touchButtons.left.x + 30, this.touchButtons.left.y + 20);
        this.ctx.lineTo(this.touchButtons.left.x + 30, this.touchButtons.left.y + 40);
        this.ctx.lineTo(this.touchButtons.left.x + 10, this.touchButtons.left.y + 20);
        this.ctx.lineTo(this.touchButtons.left.x + 30, this.touchButtons.left.y);
        this.ctx.fill();

        // Right arrow
        this.ctx.beginPath();
        this.ctx.moveTo(this.touchButtons.right.x + 10, this.touchButtons.right.y + 20);
        this.ctx.lineTo(this.touchButtons.right.x + 10, this.touchButtons.right.y + 40);
        this.ctx.lineTo(this.touchButtons.right.x + 30, this.touchButtons.right.y + 20);
        this.ctx.lineTo(this.touchButtons.right.x + 10, this.touchButtons.right.y);
        this.ctx.fill();
    }

    startGame() {
        this.gameStarted = true;
        this.gameOver = false;
        this.currentWordIndex = 0;
        this.snake = new Snake();
        this.boxes = this.createRandomBoxes();
    }

    reset() {
        this.gameStarted = false;
        this.currentWordIndex = 0;
        this.gameOver = false;
        this.won = false;
        this.snake = new Snake();
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
                        this.snake.segments.push({...segment});
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
        if (this.gameStarted && !this.gameOver && !this.won) {
            this.snake.move();
            this.checkCollisions();
        }
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game
new Game();
