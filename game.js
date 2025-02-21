class Snake {
    constructor() {
        this.segments = [
            {x: 300, y: 200},
            {x: 280, y: 200}
        ];
        // Start with no movement
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
        this.width = 80;
        this.height = 40;
        this.isCollected = false;
    }

    draw(ctx) {
        if (!this.isCollected) {
            ctx.fillStyle = '#D2B48C'; // Light brown color
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = 'black';
            // Reduced font size for smartphone
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            // Adjust vertical alignment for the font size
            ctx.fillText(this.word, this.x + this.width / 2, this.y + this.height / 2 + 6);
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
        // Flag to indicate if snake has begun moving
        this.gameActive = false;
        this.boxes = this.createRandomBoxes();
        // Game started but not yet active (snake remains stationary)
        this.gameStarted = false;  

        // Initialize touchButtons; these update on mobile.
        this.touchButtons = {
            up: { x: 0, y: 0, width: 40, height: 40 },
            down: { x: 0, y: 0, width: 40, height: 40 },
            left: { x: 0, y: 0, width: 40, height: 40 },
            right: { x: 0, y: 0, width: 40, height: 40 }
        };

        this.setupTouchControls();
        this.setupControls();
        this.gameLoop();
    }

    // Detect mobile devices
    isMobileDevice() {
        return /Mobi|Android/i.test(navigator.userAgent);
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        // Update touch buttons positions if on mobile; reserve bottom 150px for controls.
        if (this.isMobileDevice()) {
            this.touchButtons = {
                up: { x: this.canvas.width / 2 - 30, y: this.canvas.height - 120, width: 60, height: 60 },
                down: { x: this.canvas.width / 2 - 30, y: this.canvas.height - 60, width: 60, height: 60 },
                left: { x: this.canvas.width / 2 - 90, y: this.canvas.height - 90, width: 60, height: 60 },
                right: { x: this.canvas.width / 2 + 30, y: this.canvas.height - 90, width: 60, height: 60 }
            };
        }
    }

    createRandomBoxes() {
        const boxes = [];
        const shuffledWords = [...this.words].sort(() => Math.random() - 0.5);
        const tryX = () => 50 + Math.random() * (this.canvas.width - 180);
        let minY = 50;
        let maxY;
        if (this.isMobileDevice()) {
            // Reserve bottom 150 pixels for controls, plus box height
            maxY = this.canvas.height - 150 - 40;
        } else {
            maxY = this.canvas.height - 40;
        }
        const tryY = () => minY + Math.random() * (maxY - minY);
        const tryPosition = () => ({ x: tryX(), y: tryY() });
        const isTooClose = (pos, existingBoxes) => {
            const minDistance = 120;
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
            // If an arrow key is pressed, start the snake moving if not already active
            if (!this.gameActive && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                this.gameActive = true;
            }
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
                // Ensure text elements (like start button) are above the control panel area.
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
        if (!this.isMobileDevice()) return;
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            // If game isn't active, any tap on a control will start movement.
            if (!this.gameActive) {
                this.gameActive = true;
            }
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
            // Reduced starting message font size for smartphones
            this.ctx.font = 'bold 20px Arial';
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
            // Reduced win message font size
            this.ctx.font = '28px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('You Won!', this.canvas.width / 2, this.canvas.height / 2);
            const buttonText = this.currentSentenceIndex < this.sentences.length - 1 ? 'Next?' : 'Play Again';
            this.drawButton(buttonText, this.canvas.width / 2, this.canvas.height / 2 + 60, 120, 40, 'blue');
        }
        if (this.gameStarted && !this.gameOver && !this.won && this.isMobileDevice()) {
            this.drawTouchControls();
        }
    }

    drawButton(text, x, y, width, height, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x - width / 2, y - height / 2, width, height);
        this.ctx.fillStyle = 'white';
        // Reduced button font size
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, x, y + 6);
    }

    drawTouchControls() {
        this.ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
        // Draw large control buttons at the bottom of the screen
        // Up arrow
        let btn = this.touchButtons.up;
        this.ctx.beginPath();
        this.ctx.moveTo(btn.x + btn.width * 0.25, btn.y + btn.height * 0.65);
        this.ctx.lineTo(btn.x + btn.width * 0.75, btn.y + btn.height * 0.65);
        this.ctx.lineTo(btn.x + btn.width / 2, btn.y + btn.height * 0.35);
        this.ctx.closePath();
        this.ctx.fill();
        // Down arrow
        btn = this.touchButtons.down;
        this.ctx.beginPath();
        this.ctx.moveTo(btn.x + btn.width * 0.25, btn.y + btn.height * 0.35);
        this.ctx.lineTo(btn.x + btn.width * 0.75, btn.y + btn.height * 0.35);
        this.ctx.lineTo(btn.x + btn.width / 2, btn.y + btn.height * 0.65);
        this.ctx.closePath();
        this.ctx.fill();
        // Left arrow
        btn = this.touchButtons.left;
        this.ctx.beginPath();
        this.ctx.moveTo(btn.x + btn.width * 0.65, btn.y + btn.height * 0.25);
        this.ctx.lineTo(btn.x + btn.width * 0.65, btn.y + btn.height * 0.75);
        this.ctx.lineTo(btn.x + btn.width * 0.35, btn.y + btn.height / 2);
        this.ctx.closePath();
        this.ctx.fill();
        // Right arrow
        btn = this.touchButtons.right;
        this.ctx.beginPath();
        this.ctx.moveTo(btn.x + btn.width * 0.35, btn.y + btn.height * 0.25);
        this.ctx.lineTo(btn.x + btn.width * 0.35, btn.y + btn.height * 0.75);
        this.ctx.lineTo(btn.x + btn.width * 0.65, btn.y + btn.height / 2);
        this.ctx.closePath();
        this.ctx.fill();
    }

    startGame() {
        this.gameStarted = true;
        // Keep snake stationary until a control is tapped.
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
