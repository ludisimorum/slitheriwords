class Snake {
    constructor() {
        this.segments = [
            {x: 300, y: 200},
            {x: 280, y: 200}
        ];
        this.direction = {x: 0, y: 0};
        this.size = 30; // Larger size for mobile
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
            ctx.arc(head.x + this.size / 2, head.y + this.size / 2, 12, 0, Math.PI, false);
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
        this.width = 100; // Larger for mobile
        this.height = 50; // Larger for mobile
        this.isCollected = false;
    }

    draw(ctx) {
        if (!this.isCollected) {
            ctx.fillStyle = '#D2B48C';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = 'black';
            ctx.font = '20px Arial'; // Larger font for mobile
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
        this.gameStarted = false;

        // Initialize touch buttons with larger sizes
        this.touchButtons = {
            up: { x: 0, y: 0, width: 80, height: 80 },
            down: { x: 0, y: 0, width: 80, height: 80 },
            left: { x: 0, y: 0, width: 80, height: 80 },
            right: { x: 0, y: 0, width: 80, height: 80 }
        };

        this.boxes = this.createRandomBoxes();
        this.setupTouchControls();
        this.gameLoop();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Adjust control positions for better visibility and touch
        const bottomPadding = 200; // Increased from 150
        const buttonSize = 100; // Increased from 80
        
        this.touchButtons = {
            up: { 
                x: this.canvas.width / 2 - buttonSize/2, 
                y: this.canvas.height - bottomPadding, 
                width: buttonSize, 
                height: buttonSize 
            },
            down: { 
                x: this.canvas.width / 2 - buttonSize/2, 
                y: this.canvas.height - buttonSize, 
                width: buttonSize, 
                height: buttonSize 
            },
            left: { 
                x: this.canvas.width / 2 - buttonSize * 1.5, 
                y: this.canvas.height - bottomPadding + buttonSize/2, 
                width: buttonSize, 
                height: buttonSize 
            },
            right: { 
                x: this.canvas.width / 2 + buttonSize/2, 
                y: this.canvas.height - bottomPadding + buttonSize/2, 
                width: buttonSize, 
                height: buttonSize 
            }
        };
    }

    createRandomBoxes() {
        const boxes = [];
        const shuffledWords = [...this.words].sort(() => Math.random() - 0.5);
        const tryX = () => 50 + Math.random() * (this.canvas.width - 200);
        const minY = 50;
        const maxY = this.canvas.height - 250; // Account for touch controls
        const tryY = () => minY + Math.random() * (maxY - minY);
        const tryPosition = () => ({ x: tryX(), y: tryY() });
        
        const isTooClose = (pos, existingBoxes) => {
            const minDistance = 140;
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

    setupTouchControls() {
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;

            if (!this.gameActive) {
                this.gameActive = true;
            }

            if (!this.gameStarted || this.gameOver) {
                const buttonY = this.canvas.height / 2;
                if (y > buttonY - 30 && y < buttonY + 30 &&
                    x > this.canvas.width / 2 - 70 && x < this.canvas.width / 2 + 70) {
                    this.startGame();
                    return;
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
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.words.join(' '), this.canvas.width / 2, this.canvas.height / 3);
            this.drawButton("Let's go!", this.canvas.width / 2, this.canvas.height / 2, 140, 60, 'blue');
        } else {
            this.boxes.forEach(box => box.draw(this.ctx));
            this.snake.draw(this.ctx);
            this.drawTouchControls();
        }
        
        if (this.won) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = 'green';
            this.ctx.font = '32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('You Won!', this.canvas.width / 2, this.canvas.height / 2);
            const buttonText = this.currentSentenceIndex < this.sentences.length - 1 ? 'Next?' : 'Play Again';
            this.drawButton(buttonText, this.canvas.width / 2, this.canvas.height / 2 + 60, 140, 60, 'blue');
        }
    }

    drawButton(text, x, y, width, height, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x - width / 2, y - height / 2, width, height);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, x, y + 8);
    }

    drawTouchControls() {
        console.log('Drawing touch controls');
        // Make controls more visible
        this.ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
        
        // Draw buttons with borders
        Object.values(this.touchButtons).forEach(btn => {
            // Draw button background
            this.ctx.fillRect(btn.x, btn.y, btn.width, btn.height);
            
            // Add border
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(btn.x, btn.y, btn.width, btn.height);
        });

        // Draw arrow symbols in white
        this.ctx.fillStyle = 'white';
        
        // Up arrow
        let btn = this.touchButtons.up;
        this.ctx.beginPath();
        this.ctx.moveTo(btn.x + btn.width/2, btn.y + btn.height * 0.2);
        this.ctx.lineTo(btn.x + btn.width * 0.2, btn.y + btn.height * 0.8);
        this.ctx.lineTo(btn.x + btn.width * 0.8, btn.y + btn.height * 0.8);
        this.ctx.closePath();
        this.ctx.fill();

        // Down arrow
        btn = this.touchButtons.down;
        this.ctx.beginPath();
        this.ctx.moveTo(btn.x + btn.width/2, btn.y + btn.height * 0.8);
        this.ctx.lineTo(btn.x + btn.width * 0.2, btn.y + btn.height * 0.2);
        this.ctx.lineTo(btn.x + btn.width * 0.8, btn.y + btn.height * 0.2);
        this.ctx.closePath();
        this.ctx.fill();

        // Left arrow
        btn = this.touchButtons.left;
        this.ctx.beginPath();
        this.ctx.moveTo(btn.x + btn.width * 0.2, btn.y + btn.height/2);
        this.ctx.lineTo(btn.x + btn.width * 0.8, btn.y + btn.height * 0.2);
        this.ctx.lineTo(btn.x + btn.width * 0.8, btn.y + btn.height * 0.8);
        this.ctx.closePath();
        this.ctx.fill();

        // Right arrow
        btn = this.touchButtons.right;
        this.ctx.beginPath();
        this.ctx.moveTo(btn.x + btn.width * 0.8, btn.y + btn.height/2);
        this.ctx.lineTo(btn.x + btn.width * 0.2, btn.y + btn.height * 0.2);
        this.ctx.lineTo(btn.x + btn.width * 0.2, btn.y + btn.height * 0.8);
        this.ctx.closePath();
        this.ctx.fill();
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