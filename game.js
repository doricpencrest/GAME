class PongGame extends Phaser.Scene {
    constructor() {
        super();
        this.playerScore = 0;
        this.aiScore = 0;
        this.gameStarted = false;
        this.currentPhraseIndex = 0;
        this.naomiTextStarted = false;
        this.emailPhraseActive = false;
        this.lastPong1Sound = null;
        this.lastPong2Sound = null;
    }

    preload() {
        // Load background loop
        this.load.audio('backgroundLoop', 'https://play.rosebud.ai/assets/PONG_LOOP.wav?zkkh');
        // Load PONG random 1 sounds (for 0-4s and 10-15s)
        this.load.audio('pong1_1', 'https://play.rosebud.ai/assets/PONG random 1-001.wav?V9Gw');
        this.load.audio('pong1_2', 'https://play.rosebud.ai/assets/PONG random 1-002.wav?eCwQ');
        this.load.audio('pong1_3', 'https://play.rosebud.ai/assets/PONG random 1-003.wav?Voos');
        this.load.audio('pong1_4', 'https://play.rosebud.ai/assets/PONG random 1-004.wav?Vscs');
        this.load.audio('pong1_5', 'https://play.rosebud.ai/assets/PONG random 1-005.wav?sKj4');
        this.load.audio('pong1_6', 'https://play.rosebud.ai/assets/PONG random 1-006.wav?qcWc');
        // Load PONG random 2 sounds (for other times)
        this.load.audio('pong2_1', 'https://play.rosebud.ai/assets/PONG random 2-001.wav?X03q');
        this.load.audio('pong2_2', 'https://play.rosebud.ai/assets/PONG random 2-002.wav?L90v');
        this.load.audio('pong2_3', 'https://play.rosebud.ai/assets/PONG random 2-003.wav?f2yu');
        this.load.audio('pong2_4', 'https://play.rosebud.ai/assets/PONG random 2-004.wav?wHk8');
        this.load.audio('pong2_5', 'https://play.rosebud.ai/assets/PONG random 2-005.wav?elac');
        this.load.audio('pong2_6', 'https://play.rosebud.ai/assets/PONG random 2-006.wav?G5mo');
        this.load.audio('pong2_7', 'https://play.rosebud.ai/assets/PONG random 2-007.wav?6e4l');
        // Load 'me' images
        this.load.image('me1', 'https://play.rosebud.ai/assets/me1.png?Gj2B');
        this.load.image('me2', 'https://play.rosebud.ai/assets/me2.png?6pJu');
        this.load.image('me3', 'https://play.rosebud.ai/assets/me3.png?enlP');
        this.load.image('me4', 'https://play.rosebud.ai/assets/me4.png?JfDJ');
        this.load.image('me5', 'https://play.rosebud.ai/assets/me5.png?PVJd');
    }

    create() {
        // Create quit button
        const quitButtonRadius = 60; // Doubled radius
        const quitButtonX = 1200;
        const quitButtonY = 48;
        this.quitButtonCircle = this.add.circle(quitButtonX, quitButtonY, quitButtonRadius, 0xFF6B8D); // Pink color
        this.quitButtonCircle.setStrokeStyle(2, 0xFF6B8D); // Pink stroke
        this.quitButton = this.add.text(quitButtonX, quitButtonY, 'Quit', {
            fontFamily: 'Arial',
            fontSize: '40px', // Doubled font size
            fontWeight: 'bold',
            color: '#000000', // Black color
            align: 'center'
        }).setOrigin(0.5); // Center text in the circle
        // Make both circle and text interactive
        this.quitButtonCircle.setInteractive({
            useHandCursor: true
        });
        this.quitButtonCircle.on('pointerdown', () => this.quitGame());
        this.quitButton.setInteractive({
            useHandCursor: true
        });
        this.quitButton.on('pointerdown', () => this.quitGame());
        // Set warm beige background
        this.cameras.main.setBackgroundColor('#F5E6D3');
        // Add a thin black outline for the play area
        const playAreaOutline = this.add.graphics();
        playAreaOutline.lineStyle(4, 0x000000, 1); // 4px thick, black, full alpha
        playAreaOutline.strokeRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        // Create custom paddles
        this.paddleWidth = 24; // 15 * 1.6
        this.paddleHeight = 192; // 160 * 1.2
        // Create player paddle
        this.playerPaddle = this.add.rectangle(80, 360, this.paddleWidth, this.paddleHeight, 0xFF6B8D);
        this.playerPaddle.setStrokeStyle(2, 0xFF6B8D);
        // Create AI paddle
        this.aiPaddle = this.add.rectangle(1200, 360, this.paddleWidth, this.paddleHeight, 0xFF8B53);
        this.aiPaddle.setStrokeStyle(2, 0xFF8B53);

        // Add physics to paddles
        this.physics.add.existing(this.playerPaddle, true);
        this.physics.add.existing(this.aiPaddle, true);

        // Create custom ball using 'me1' asset
        this.ball = this.physics.add.sprite(640, 360, 'me1');
        // Set the ball size to its original asset dimensions (143x157)
        // The physics body will automatically be sized to the frame, but we can adjust offset if needed
        // For simplicity, we'll let Phaser handle the body size based on the image.
        // If you need a circular body for a rectangular sprite, you might need to customize it.
        // this.ball.setCircle(Math.max(143, 157) / 2); // Example for a circular body
        this.ball.setScale(0.56); // Further decrease size by 20% (0.7 * 0.8 = 0.56)
        this.ball.body.setBounce(1, 1);
        this.ball.body.setCollideWorldBounds(true);
        this.ball.body.onWorldBounds = true;

        // Set up collision detection with sound effects
        this.physics.add.collider(this.ball, this.playerPaddle, this.handlePaddleHit, null, this);
        this.physics.add.collider(this.ball, this.aiPaddle, this.handleAiPaddleHit, null, this);
        // Setup background loop
        this.backgroundMusic = this.sound.add('backgroundLoop', {
            loop: true
        });

        // Initialize sound arrays
        this.pong1Sounds = ['pong1_1', 'pong1_2', 'pong1_3', 'pong1_4', 'pong1_5', 'pong1_6'];
        this.pong2Sounds = ['pong2_1', 'pong2_2', 'pong2_3', 'pong2_4', 'pong2_5', 'pong2_6', 'pong2_7'];
        this.meImageKeys = ['me1', 'me5', 'me3', 'me4'];
        // Create minimal style start text
        this.startText = this.add.text(640, 360 + (157 * 0.56 / 2) + (30 * 1.2), 'press space', {
            fontFamily: 'Arial',
            fontSize: '32px',
            fontWeight: '300',
            color: '#FF6B8D',
            padding: {
                x: 20,
                y: 10
            }
        });
        this.startText.setOrigin(0.5);

        // Handle ball going out of bounds
        this.physics.world.on('worldbounds', this.handleBallOut, this);

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();

        // Start game on space press
        this.input.keyboard.on('keydown-SPACE', () => {
            if (!this.gameStarted) {
                // If emailPhraseActive is true, it means we are on the "quit screen" with the large email
                // Hide it before starting a new game.
                if (this.emailPhraseActive && this.naomiText.text === "thenaomihart@gmail.com") {
                    this.naomiText.setVisible(false);
                    this.emailPhraseActive = false; // Reset this flag
                    // Reset naomiText to its default non-visible state for next game cycle
                    this.naomiText.setFontSize('61.2px');
                    this.naomiText.setColor('#4169E1');
                    this.naomiText.setPosition(640, 600);
                }
                this.startGame();
            }
        });

        // Add soft glow effect to paddles and ball
        this.addSoftGlowEffect(this.playerPaddle, 0xFF6B8D);
        this.addSoftGlowEffect(this.aiPaddle, 0xFF8B53);
        // For sprites, the glow effect using alpha is fine.
        // If you wanted a tint-based glow, you would use ball.setTint() and clearTint().
        this.addSoftGlowEffect(this.ball, 0xFF4D6B); // 0xFF4D6B will not be used for tint here, just for consistency
        // Define phrases for Naomi's text
        this.naomiPhrases = [
            "Hi!",
            "I call this 'Elevator Pong'",
            "thanks for playing",
            "you're doing great!",
            "as well as composing, I can implement music",
            "using all the usual suspects",
            "Fmod, Wwise, Unreal etc",
            "I love creating bespoke soundtracks",
            "that are interactive and playful",
            "have a project you'd like great music for?",
            "let's chat! emails are welcome",
            "thenaomihart@gmail.com"
        ];
        // Create Naomi's text object
        this.naomiText = this.add.text(640, 600, '', {
            fontFamily: 'Arial',
            fontSize: '61.2px',
            color: '#4169E1',
            align: 'center',
            wordWrap: {
                width: 1120, // 700 * 1.6
                useAdvancedWrap: true
            }
        }).setOrigin(0.5);
        this.naomiText.setVisible(false); // Initially hide Naomi's text
    }
    addSoftGlowEffect(object, color) {
        const intensity = 0.3;
        this.tweens.add({
            targets: object,
            alpha: {
                from: 1,
                to: 0.85
            },
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            duration: 1500
        });
    }

    startGame() {
        this.gameStarted = true;
        this.startText.setVisible(false);

        // Start the background music with fade-in effect
        if (!this.backgroundMusic.isPlaying) {
            this.backgroundMusic.setVolume(0);
            this.backgroundMusic.play();
            this.tweens.add({
                targets: this.backgroundMusic,
                volume: 0.8,
                duration: 3000,
                ease: 'Linear'
            });
        }

        const baseSpeedX = (300 * 2) * 0.8 * 0.8; // Effective reduction of 36% from doubled speed
        const baseSpeedY = (Phaser.Math.Between(150, 300) * 2) * 0.8 * 0.8; // Effective reduction of 36%
        const velocityX = -baseSpeedX; // Always move towards the player paddle (left)
        const velocityY = (Math.random() < 0.5 ? -1 : 1) * baseSpeedY; // Randomly up or down
        this.ball.body.setVelocity(velocityX, velocityY);
    }

    handleBallOut(body, up, down, left, right) {
        if (left || right) {
            if (left) {
                this.aiScore += 1;
                // Update AI score display
            } else if (right) {
                this.playerScore += 1;
                // Update player score display
            }

            this.ball.setPosition(640, 360);
            this.ball.body.setVelocity(0, 0);

            this.time.delayedCall(1000, () => {
                if (this.gameStarted) {
                    const baseSpeedX = (300 * 2) * 0.8 * 0.8; // Effective reduction of 36%
                    const baseSpeedY = (Phaser.Math.Between(150, 300) * 2) * 0.8 * 0.8; // Effective reduction of 36%
                    const velocityX = -baseSpeedX; // Always move towards the player paddle (left)
                    const velocityY = (Math.random() < 0.5 ? -1 : 1) * baseSpeedY; // Randomly up or down
                    this.ball.body.setVelocity(velocityX, velocityY);
                }
            });
        }
    }

    update() {
        // Player paddle movement
        if (this.cursors.up.isDown && this.playerPaddle.y > (60 + this.paddleHeight / 2)) { // Adjusted min Y considering paddle height
            this.playerPaddle.y -= 5 * 1.2; // Scale speed
            this.playerPaddle.body.y = this.playerPaddle.y - this.playerPaddle.height / 2;
        } else if (this.cursors.down.isDown && this.playerPaddle.y < (720 - 60 - this.paddleHeight / 2)) { // Adjusted max Y
            this.playerPaddle.y += 5 * 1.2; // Scale speed
            this.playerPaddle.body.y = this.playerPaddle.y - this.playerPaddle.height / 2;
        }
        // Simple AI for opponent paddle
        const aiSpeed = 4 * 1.2; // Scale AI speed
        if (this.ball.y < this.aiPaddle.y && this.aiPaddle.y > (60 + this.paddleHeight / 2)) { // Adjusted min Y
            this.aiPaddle.y -= aiSpeed;
            this.aiPaddle.body.y = this.aiPaddle.y - this.aiPaddle.height / 2;
        } else if (this.ball.y > this.aiPaddle.y && this.aiPaddle.y < (720 - 60 - this.paddleHeight / 2)) { // Adjusted max Y
            this.aiPaddle.y += aiSpeed;
            this.aiPaddle.body.y = this.aiPaddle.y - this.aiPaddle.height / 2;
        }
        if (this.emailPhraseActive) {
            this.naomiText.x = this.ball.x;
            this.naomiText.y = this.ball.y + (this.ball.displayHeight / 2) + 20; // Position below the ball
        }
    }
    handleAiPaddleHit(ball, paddle) {
        // Change ball image randomly
        const randomImageKey = Phaser.Math.RND.pick(this.meImageKeys);
        this.ball.setTexture(randomImageKey);
        // Randomly rotate ball by +90 or -90 degrees
        const rotationAmount = Phaser.Math.RND.pick([90, -90]);
        this.ball.angle += rotationAmount;
    }
    handlePaddleHit(ball, paddle) {
        // Play sounds only for the pink (player) paddle
        if (paddle === this.playerPaddle) {
            if (!this.emailPhraseActive) {
                const currentTime = this.backgroundMusic.seek;
                // Choose appropriate sound set based on timing
                let soundToPlay;
                if ((currentTime >= 0 && currentTime <= 4) || (currentTime >= 10 && currentTime <= 15)) {
                    // Play random PONG random 1 sound
                    let randomIndex;
                    do {
                        randomIndex = Math.floor(Math.random() * this.pong1Sounds.length);
                        soundToPlay = this.pong1Sounds[randomIndex];
                    } while (this.pong1Sounds.length > 1 && soundToPlay === this.lastPong1Sound);
                    this.lastPong1Sound = soundToPlay;
                } else {
                    // Play random PONG random 2 sound
                    let randomIndex;
                    do {
                        randomIndex = Math.floor(Math.random() * this.pong2Sounds.length);
                        soundToPlay = this.pong2Sounds[randomIndex];
                    } while (this.pong2Sounds.length > 1 && soundToPlay === this.lastPong2Sound);
                    this.lastPong2Sound = soundToPlay;
                }
                // Play the selected sound
                this.sound.play(soundToPlay);
                // Paddle glow effect - only for player paddle
                const originalColor = this.playerPaddle.fillColor; // Store original color
                const glowColor = 0xffffff; // White glow
                this.playerPaddle.setFillStyle(glowColor);
                this.time.delayedCall(100, () => {
                    this.playerPaddle.setFillStyle(originalColor); // Revert to original color
                });
            }
            // Change ball image randomly - this can still happen
            const randomImageKey = Phaser.Math.RND.pick(this.meImageKeys);
            this.ball.setTexture(randomImageKey);
            // Randomly rotate ball by +90 or -90 degrees - this can still happen
            const rotationAmount = Phaser.Math.RND.pick([90, -90]);
            this.ball.angle += rotationAmount;
            // Cycle through Naomi's phrases
            if (!this.emailPhraseActive) { // Only cycle if the email phrase isn't active
                if (!this.naomiTextStarted) {
                    this.naomiTextStarted = true;
                    this.naomiText.setVisible(true);
                } else {
                    this.currentPhraseIndex = (this.currentPhraseIndex + 1) % this.naomiPhrases.length;
                }
                const currentPhrase = this.naomiPhrases[this.currentPhraseIndex];
                this.naomiText.setText(currentPhrase);
                // Default positioning and style
                this.naomiText.setOrigin(0.5); // Ensure origin is center for random positioning
                this.naomiText.setColor('#4169E1'); // Default blue color
                this.naomiText.setFontSize('61.2px'); // Default font size
                if (currentPhrase === "(you're doing great btw!)") {
                    this.naomiText.setFontSize('28.8px'); // 14.4px * 2
                    // Random position for this specific phrase
                    const textWidth = this.naomiText.getBounds().width;
                    const textHeight = this.naomiText.getBounds().height;
                    const randomX = Phaser.Math.Between(0 + textWidth / 2 + 80, 1280 - textWidth / 2 - 80);
                    const randomY = Phaser.Math.Between(0 + textHeight / 2 + 60, 720 - textHeight / 2 - 60);
                    this.naomiText.setPosition(randomX, randomY);
                } else if (currentPhrase === "thenaomihart@gmail.com") {
                    this.naomiText.setFontSize('36px'); // Original 72px, reduced by 50%
                    this.naomiText.setColor('#FF0000'); // Bright red
                    this.emailPhraseActive = true;
                    // Slow down ball by 20%
                    const currentVelocityX = this.ball.body.velocity.x;
                    const currentVelocityY = this.ball.body.velocity.y;
                    this.ball.body.setVelocity(currentVelocityX * 0.8, currentVelocityY * 0.8);
                    // Ensure paddle color is reset if it was glowing
                    this.playerPaddle.setFillStyle(0xFF6B8D);
                    // Position will be handled in update for this specific phrase
                } else {
                    // Random position for all other blue phrases
                    const textWidth = this.naomiText.getBounds().width;
                    const textHeight = this.naomiText.getBounds().height;
                    const randomX = Phaser.Math.Between(0 + textWidth / 2 + 80, 1280 - textWidth / 2 - 80);
                    const randomY = Phaser.Math.Between(0 + textHeight / 2 + 60, 720 - textHeight / 2 - 60);
                    this.naomiText.setPosition(randomX, randomY);
                }
            }
        }
    }
    quitGame() {
        // Fade out music
        if (this.backgroundMusic && this.backgroundMusic.isPlaying) {
            this.tweens.add({
                targets: this.backgroundMusic,
                volume: 0,
                duration: 3000,
                onComplete: () => {
                    this.backgroundMusic.stop();
                }
            });
        }
        // Reset game state
        this.gameStarted = false;
        this.playerScore = 0;
        this.aiScore = 0;
        // Reset ball position and velocity
        this.ball.setPosition(640, 360);
        this.ball.body.setVelocity(0, 0);
        // Reset paddle positions
        this.playerPaddle.y = 360;
        this.aiPaddle.y = 360;
        this.playerPaddle.body.y = this.playerPaddle.y - this.playerPaddle.height / 2;
        this.aiPaddle.body.y = this.aiPaddle.y - this.aiPaddle.height / 2;
        // Show start text again
        this.startText.setVisible(true);
        // Reset Naomi's text state for normal phrases
        this.naomiTextStarted = false;
        this.emailPhraseActive = false; // This will be set true below for the quit screen
        this.currentPhraseIndex = 0;
        // Display the "thenaomihart@gmail.com" text, large and at lower third
        // this.naomiText.setText("thenaomihart@gmail.com"); // Removed
        // this.naomiText.setColor('#FF0000'); // Red color // Removed
        // this.naomiText.setFontSize('72px'); // 36px * 2 = 72px // Removed
        // this.naomiText.setPosition(this.cameras.main.width / 2, 700); // Position at Y = 700 // Removed
        // this.naomiText.setOrigin(0.5); // Removed
        this.naomiText.setVisible(false); // Ensure it's hidden
        // this.emailPhraseActive = true; // Set this so it's recognized as the special state // Removed
    }
}

const container = document.getElementById('renderDiv');
const config = {
    type: Phaser.AUTO,
    parent: container,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    width: 1280,
    height: 720,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: PongGame
};

window.phaserGame = new Phaser.Game(config);
