export function loadImages(sources, callback) {
    let loadedImages = 0;
    let numImages = sources.length;
    const images = [];

    sources.forEach((src, index) => {
        const img = new Image();
        img.onload = () => {
            loadedImages++;
            images[index] = img;
            if (loadedImages === numImages) {
                callback(images);
            }
        };
        img.onerror = () => {
            console.error(`Failed to load image: ${src}`);
            // Optionally handle the error, e.g. by providing a placeholder
            loadedImages++;
            images[index] = null; // or a placeholder image
            if (loadedImages === numImages) {
                callback(images);
            }
        };
        img.src = src;
    });
}

export function drawScene(ctx, metrics, gameState, player, obstacles, collectibles, poolSize, config, lastTime, sprites) {
    const { GAME_WIDTH, GAME_HEIGHT, LANE_HEIGHT } = metrics;
    const portrait = GAME_HEIGHT > GAME_WIDTH;

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    drawBackground(ctx, GAME_WIDTH, GAME_HEIGHT, LANE_HEIGHT, gameState.animTime, config.LANE_COUNT);

    obstacles.forEach(obs => {
        const centerY = obs.lane * LANE_HEIGHT + LANE_HEIGHT / 2;
        const s = obs.scale || 1;
        if (obs.type === 'bear') {
            drawPolarBear(ctx, obs.x, centerY, s, gameState.animTime, sprites);
        } else if (obs.type === 'iceberg') {
            drawIceberg(ctx, obs.x, centerY, s, gameState.animTime, sprites, obs.subtype || 0);
        } else if (obs.type === 'opening') {
            drawOpening(ctx, obs.x, centerY, obs.width, LANE_HEIGHT, gameState.animTime, sprites, obs.subtype || 0);
        }
    });

    collectibles.forEach(col => {
        const centerY = col.lane * LANE_HEIGHT + LANE_HEIGHT / 2;
        const s = col.scale || 1;
        if (col.type === 'seal') {
            drawSeal(ctx, col.x, centerY, s, gameState.animTime, sprites);
        } else if (col.type === 'fox') {
            drawFox(ctx, col.x, centerY, s, gameState.animTime, sprites);
        }
    });

    drawDogsled(ctx, player, gameState, metrics, config, portrait, sprites);
    drawHUD(ctx, metrics, gameState, player, obstacles, collectibles, poolSize, config, lastTime, portrait);

    if (!gameState.hasStarted) {
        drawStartScreen(ctx, metrics);
    } else if (gameState.isGameOver) {
        drawGameOver(ctx, metrics, gameState);
    }
}

function drawBackground(ctx, gameWidth, gameHeight, laneHeight, animTime, laneCount) {
    const gradient = ctx.createLinearGradient(0, 0, 0, gameHeight);
    gradient.addColorStop(0, '#2c5f8d');
    gradient.addColorStop(0.6, '#87ceeb');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, gameWidth, gameHeight);

    ctx.fillStyle = '#e0f2f7';
    ctx.fillRect(0, 0, gameWidth, gameHeight);

    ctx.strokeStyle = '#c8e6f0';
    ctx.lineWidth = 2;
    const offset = (animTime * 100) % 100;
    for (let x = -100 + offset; x < gameWidth; x += 100) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 50, gameHeight);
        ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(150, 200, 220, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 1; i < laneCount; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * laneHeight);
        ctx.lineTo(gameWidth, i * laneHeight);
        ctx.stroke();
    }
}

function drawDogsled(ctx, player, gameState, metrics, config, portrait, sprites) {
    const centerY = player.lane * metrics.LANE_HEIGHT + metrics.LANE_HEIGHT / 2;
    const bobAmount = Math.sin(gameState.animTime * 8) * 3;
    const ropeBob = Math.sin(gameState.animTime * 6) * 2;
    const dogsledScale = portrait ? config.PORTRAIT_DOG_SCALE : 1;

    // Crash shake effect
    let shakeX = 0;
    let shakeY = 0;
    if (gameState.isCrashing && gameState.crashShakeTimer > 0) {
        const shakeIntensity = 8;
        shakeX = (Math.random() - 0.5) * shakeIntensity;
        shakeY = (Math.random() - 0.5) * shakeIntensity;
    }

    if (gameState.isInvincible) {
        ctx.strokeStyle = '#ffeb3b';
        ctx.lineWidth = 4;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffeb3b';
        ctx.strokeRect(player.x - 10, centerY - player.height / 2 - 10,
            player.width + 20, player.height + 20);
        ctx.shadowBlur = 0;
    }

    const dogs = [
        { x: player.x + 180 * dogsledScale + shakeX, y: centerY + shakeY, size: 1.4 * dogsledScale, type: 'alpha' },
        { x: player.x + 115 * dogsledScale + shakeX, y: centerY + shakeY, size: 1.35 * dogsledScale, type: 'female' },
        { x: player.x + 75 * dogsledScale + shakeX, y: centerY + shakeY, size: 1.3 * dogsledScale, type: 'derpy' }
    ];

    // Remove rope drawing - dogs have harnesses in sprites
    /*
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 2;
    dogs.forEach((dog, i) => {
        ctx.beginPath();
        if (i === dogs.length - 1) {
            ctx.moveTo(dog.x - 15, dog.y + ropeBob);
            ctx.lineTo(player.x + 15, centerY);
        } else {
            ctx.moveTo(dog.x - 15, dog.y + ropeBob);
            ctx.lineTo(dogs[i + 1].x + 15, dogs[i + 1].y + ropeBob);
        }
        ctx.stroke();
    });
    */

    dogs.forEach(dog => drawDog(ctx, dog.x, dog.y, dog.size, bobAmount, dog.type, gameState, sprites));

    // Draw sled sprite if available
    const sledBob = Math.sin(gameState.animTime * 7) * 2;
    if (sprites && sprites.sled && sprites.sled.complete) {
        const aspectRatio = sprites.sled.width / sprites.sled.height;
        const sledHeight = 95 * dogsledScale; // Bigger sled to balance with dogs
        const sledWidth = sledHeight * aspectRatio; // Maintain aspect ratio
        ctx.drawImage(sprites.sled, player.x - 90 * dogsledScale + shakeX, centerY - sledHeight / 2 + sledBob + shakeY, sledWidth, sledHeight);
        
        // Draw hunter sprite if available - positioned on top of sled, leaning left
        if (sprites && sprites.hunter && sprites.hunter.length > 0) {
            const hunterSprite = sprites.hunter[gameState.hunterFrame];
            if (hunterSprite && hunterSprite.complete) {
                const hunterAspectRatio = hunterSprite.width / hunterSprite.height;
                const hunterHeight = 85 * dogsledScale; // Bigger hunter to balance with dogs
                const hunterWidth = hunterHeight * hunterAspectRatio; // Maintain aspect ratio
                // Position hunter on left side of sled, sitting on top
                const hunterX = player.x - 85 * dogsledScale + shakeX; // Further left
                const hunterY = centerY - sledHeight / 2 - hunterHeight * 0.1 + sledBob + shakeY; // Sit very slightly lower
                ctx.drawImage(hunterSprite, hunterX, hunterY, hunterWidth, hunterHeight);
            }
        }
    } else {
        // Fallback sled
        ctx.fillStyle = '#654321';
        ctx.fillRect(player.x - 10 * dogsledScale + shakeX, centerY - 8 + sledBob + shakeY, 50 * dogsledScale, 16 * dogsledScale);

        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(player.x - 10 * dogsledScale + shakeX, centerY + 8 + sledBob + shakeY);
        ctx.lineTo(player.x + 40 * dogsledScale + shakeX, centerY + 8 + sledBob + shakeY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(player.x - 10 * dogsledScale + shakeX, centerY - 8 + sledBob + shakeY);
        ctx.lineTo(player.x + 40 * dogsledScale + shakeX, centerY - 8 + sledBob + shakeY);
        ctx.stroke();
    }
}

function drawDog(ctx, x, y, size = 1, bobOffset = 0, dogType = 'female', gameState, sprites) {
    // Use sprite animation if available
    if (sprites && sprites.dogs && sprites.dogs[dogType] && sprites.dogs[dogType].length > 0) {
        const frames = sprites.dogs[dogType];
        const frameIndex = gameState.currentDogFrame % frames.length;
        const sprite = frames[frameIndex];
        
        if (sprite && sprite.complete) {
            ctx.save();
            ctx.translate(x, y + bobOffset);
            
            const spriteWidth = 70 * size; // Larger dogs
            const spriteHeight = 56 * size; // Larger dogs
            
            ctx.drawImage(
                sprite,
                -spriteWidth / 2,
                -spriteHeight / 2,
                spriteWidth,
                spriteHeight
            );
            
            ctx.restore();
            return;
        }
    }
    
    // Fallback to placeholder shape if sprites not loaded
    ctx.save();
    ctx.translate(x, y + bobOffset);

    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.ellipse(0, 0, 20 * size, 12 * size, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#666';
    ctx.beginPath();
    ctx.arc(18 * size, -2 * size, 10 * size, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.moveTo(14 * size, -10 * size);
    ctx.lineTo(12 * size, -16 * size);
    ctx.lineTo(18 * size, -12 * size);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(22 * size, -10 * size);
    ctx.lineTo(24 * size, -16 * size);
    ctx.lineTo(18 * size, -12 * size);
    ctx.fill();

    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(25 * size, -2 * size, 3 * size, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawPolarBear(ctx, x, y, s = 1, animTime, sprites) {
    // Use sprite animation if available
    if (sprites && sprites.obstacles && sprites.obstacles.bear && sprites.obstacles.bear.length > 0) {
        const frames = sprites.obstacles.bear;
        const frameIndex = Math.floor((animTime * 5) % frames.length); // ~5 fps for bear
        const sprite = frames[frameIndex];
        
        if (sprite && sprite.complete) {
            const spriteWidth = 90 * s; // Bigger bear to balance with dogsled team
            const spriteHeight = 78 * s; // Bigger bear to balance with dogsled team
            ctx.drawImage(sprite, x - spriteWidth / 2, y - spriteHeight / 2, spriteWidth, spriteHeight);
            return;
        }
    }
    
    // Fallback to placeholder
    const bob = Math.sin(animTime * 3 + x) * 4;
    const headNod = Math.sin(animTime * 4) * 2;

    ctx.fillStyle = '#f0f0f0';
    ctx.beginPath();
    ctx.ellipse(x, y + bob, 35 * s, 25 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(x + 30 * s, y - 5 + bob + headNod, 20 * s, 18 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x + 22 * s, y - 20 + bob + headNod, 6 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 38 * s, y - 20 + bob + headNod, 6 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(x + 42 * s, y - 3 + bob + headNod, 4 * s, 0, Math.PI * 2);
    ctx.fill();
}

function drawSeal(ctx, x, y, s = 1, animTime, sprites) {
    // Use sprite animation if available
    if (sprites && sprites.collectibles && sprites.collectibles.seal && sprites.collectibles.seal.length > 0) {
        const frames = sprites.collectibles.seal;
        // Slower animation with frame 3 staying longer
        const animCycle = (animTime * 2.5) % 4; // 4-beat cycle at 2.5 fps
        const frameIndex = animCycle < 3 ? Math.floor(animCycle) : 2; // frames 0,1,2,2 (frame 3 is index 2)
        const sprite = frames[frameIndex];
        
        if (sprite && sprite.complete) {
            const spriteWidth = 60 * s; // Bigger seal
            const spriteHeight = 50 * s; // Bigger seal
            ctx.drawImage(sprite, x - spriteWidth / 2, y - spriteHeight / 2, spriteWidth, spriteHeight);
            return;
        }
    }
    
    // Fallback to placeholder
    const bob = Math.sin(animTime * 4 + x) * 3;
    const tailWiggle = Math.sin(animTime * 6 + x) * 5;

    ctx.fillStyle = '#696969';
    ctx.beginPath();
    ctx.ellipse(x, y + bob, 22 * s, 15 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(x + 18 * s, y + bob, 12 * s, 11 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(x - 18 * s + tailWiggle, y + bob, 8 * s, 6 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(x + 22 * s, y - 3 + bob, 2 * s, 0, Math.PI * 2);
    ctx.fill();
}

function drawFox(ctx, x, y, s = 1, animTime, sprites) {
    // Use sprite animation if available
    if (sprites && sprites.collectibles && sprites.collectibles.fox && sprites.collectibles.fox.length > 0) {
        const frames = sprites.collectibles.fox;
        // Slower animation with frame 3 staying longer
        const animCycle = (animTime * 2.5) % 4; // 4-beat cycle at 2.5 fps
        const frameIndex = animCycle < 3 ? Math.floor(animCycle) : 2; // frames 0,1,2,2 (frame 3 is index 2)
        const sprite = frames[frameIndex];
        
        if (sprite && sprite.complete) {
            const spriteWidth = 55 * s; // Bigger fox
            const spriteHeight = 42 * s; // Bigger fox
            ctx.drawImage(sprite, x - spriteWidth / 2, y - spriteHeight / 2, spriteWidth, spriteHeight);
            return;
        }
    }
    
    // Fallback to placeholder
    const tailWag = Math.sin(animTime * 8 + x) * 8;
    const hop = Math.abs(Math.sin(animTime * 5 + x)) * 6;

    ctx.fillStyle = '#fff';
    ctx.fillRect(x - 10 * s, y - 8 - hop, 20 * s, 12 * s);

    ctx.beginPath();
    ctx.moveTo(x + 10 * s, y - 8 - hop);
    ctx.lineTo(x + 20 * s, y - 2 - hop);
    ctx.lineTo(x + 10 * s, y + 4 - hop);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + 12 * s, y - 8 - hop);
    ctx.lineTo(x + 14 * s, y - 14 - hop);
    ctx.lineTo(x + 16 * s, y - 8 - hop);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(x - 18 * s + tailWag, y - 2 - hop, 10 * s, 6 * s, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(x + 20 * s, y - 2 - hop, 2 * s, 0, Math.PI * 2);
    ctx.fill();
}

function drawIceberg(ctx, x, y, s = 1, animTime, sprites, subtype = 0) {
    // Use sprite variations if available
    if (sprites && sprites.obstacles && sprites.obstacles.iceberg && sprites.obstacles.iceberg.length > 0) {
        const types = sprites.obstacles.iceberg;
        const typeIndex = subtype % types.length; // Use assigned subtype
        const sprite = types[typeIndex];
        
        if (sprite && sprite.complete) {
            const spriteWidth = 80 * s; // Bigger icebergs
            const spriteHeight = 105 * s; // Bigger icebergs
            const drift = Math.sin(animTime * 2 + x * 0.1) * 2;
            ctx.drawImage(sprite, x - spriteWidth / 2 + drift, y - spriteHeight / 2, spriteWidth, spriteHeight);
            return;
        }
    }
    
    // Fallback to placeholder
    const drift = Math.sin(animTime * 2 + x * 0.1) * 2;

    ctx.fillStyle = '#e6f9ff';
    ctx.strokeStyle = '#b3e5fc';
    ctx.lineWidth = 2 * s;

    ctx.beginPath();
    ctx.moveTo(x + drift, y + 20 * s);
    ctx.lineTo(x + 15 * s + drift, y - 30 * s);
    ctx.lineTo(x + 25 * s + drift, y - 40 * s);
    ctx.lineTo(x + 35 * s + drift, y - 35 * s);
    ctx.lineTo(x + 45 * s + drift, y - 20 * s);
    ctx.lineTo(x + 60 * s + drift, y + 20 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

function drawOpening(ctx, x, y, width, laneHeight, animTime, sprites, subtype = 0) {
    // Use assigned subtype (keeps same polynya type throughout lifetime)
    if (sprites && sprites.obstacles && sprites.obstacles.polynya && sprites.obstacles.polynya.length > 0) {
        const types = sprites.obstacles.polynya;
        const typeIndex = subtype % types.length; // Use assigned subtype
        const sprite = types[typeIndex];
        
        if (sprite && sprite.complete) {
            ctx.drawImage(sprite, x, y - laneHeight / 2, width, laneHeight);
            return;
        }
    }
    
    // Fallback to placeholder
    const wave = Math.sin(animTime * 4 + x * 0.1) * 3;

    ctx.fillStyle = '#1e3a5f';
    ctx.fillRect(x, y - laneHeight / 2, width, laneHeight);

    ctx.strokeStyle = '#2c5f8d';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x, y - 10 + i * 10 + wave);
        ctx.lineTo(x + width, y - 10 + i * 10 + wave);
        ctx.stroke();
    }

    ctx.fillStyle = '#b3d9e6';
    ctx.fillRect(x, y - laneHeight / 2, 5, laneHeight);
    ctx.fillRect(x + width - 5, y - laneHeight / 2, 5, laneHeight);
}

function drawHUD(ctx, metrics, gameState, player, obstacles, collectibles, poolSize, config, lastTime, portrait) {
    const { GAME_WIDTH } = metrics;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    if (portrait) {
        ctx.textAlign = 'center';
        ctx.fillText(`Score: ${gameState.score}`, GAME_WIDTH / 2, 34);
        ctx.font = '16px Arial';
        ctx.fillText(`Best: ${gameState.bestScore}`, GAME_WIDTH / 2, 56);
        ctx.textAlign = 'left';
        ctx.font = 'bold 24px Arial';
    } else {
        ctx.fillText(`Score: ${gameState.score}`, 20, 35);
        ctx.fillText(`Best: ${gameState.bestScore}`, 20, 65);
    }

    if (gameState.isInvincible) {
        ctx.fillStyle = '#ffeb3b';
        ctx.font = 'bold 28px Arial';
        ctx.fillText(`INVINCIBLE: ${gameState.invincibleTimer.toFixed(1)}s`,
            GAME_WIDTH / 2 - 100, 40);
    }

    if (config.SHOW_DEBUG) {
        ctx.fillStyle = '#0f0';
        ctx.font = '14px Arial';
        const fps = lastTime ? (1000 / Math.max(1, performance.now() - lastTime)) : 0;
        ctx.fillText(`Speed: ${gameState.gameSpeed.toFixed(0)}`, GAME_WIDTH - 150, 30);
        ctx.fillText(`Spawn: ${gameState.spawnTimer.toFixed(2)}s`, GAME_WIDTH - 150, 50);
        ctx.fillText(`FPS: ${fps.toFixed(0)}`, GAME_WIDTH - 150, 70);
        ctx.fillText(`Obstacles: ${obstacles.length}`, GAME_WIDTH - 150, 90);
        ctx.fillText(`Collectibles: ${collectibles.length}`, GAME_WIDTH - 150, 110);
        ctx.fillText(`Pool size: ${poolSize}`, GAME_WIDTH - 150, 130);

        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 2;
        const playerY = player.lane * metrics.LANE_HEIGHT + metrics.LANE_HEIGHT / 2;
        ctx.strokeRect(player.x, playerY - player.height / 2, player.width, player.height);

        ctx.strokeStyle = '#f00';
        obstacles.forEach(obs => {
            const centerY = obs.lane * metrics.LANE_HEIGHT + metrics.LANE_HEIGHT / 2;
            ctx.strokeRect(obs.x, centerY - obs.height / 2, obs.width, obs.height);
        });

        ctx.strokeStyle = '#0ff';
        collectibles.forEach(col => {
            const centerY = col.lane * metrics.LANE_HEIGHT + metrics.LANE_HEIGHT / 2;
            ctx.strokeRect(col.x, centerY - col.height / 2, col.width, col.height);
        });
    }

    if (config.SHOW_HINTS && gameState.hasStarted && !gameState.isGameOver && gameState.tutorialTimer < config.HINT_DURATION) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - (gameState.tutorialTimer / config.HINT_DURATION));
        ctx.fillStyle = '#fff';
        ctx.font = '18px Arial';
        ctx.textAlign = 'center';

        if (!gameState.hasMovedUp) {
            ctx.fillText('⬆ Tap top half to move up ⬆', GAME_WIDTH / 2, metrics.GAME_HEIGHT / 4);
        }

        if (!gameState.hasMovedDown) {
            ctx.fillText('⬇ Tap bottom half to move down ⬇', GAME_WIDTH / 2, metrics.GAME_HEIGHT * 3 / 4);
        }

        ctx.textAlign = 'left';
        ctx.restore();
    }
}

function drawStartScreen(ctx, metrics) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, metrics.GAME_WIDTH, metrics.GAME_HEIGHT);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Dogsled Run', metrics.GAME_WIDTH / 2, metrics.GAME_HEIGHT / 2 - 40);

    ctx.font = '24px Arial';
    ctx.fillText('Tap or Press Any Key to Start', metrics.GAME_WIDTH / 2, metrics.GAME_HEIGHT / 2 + 20);

    ctx.font = '18px Arial';
    ctx.fillText('Avoid obstacles • Collect animals', metrics.GAME_WIDTH / 2, metrics.GAME_HEIGHT / 2 + 60);
    ctx.fillText('Invincibility every 10 points', metrics.GAME_WIDTH / 2, metrics.GAME_HEIGHT / 2 + 90);

    ctx.textAlign = 'left';
}

function drawGameOver(ctx, metrics, gameState) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, metrics.GAME_WIDTH, metrics.GAME_HEIGHT);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 56px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', metrics.GAME_WIDTH / 2, metrics.GAME_HEIGHT / 2 - 60);

    ctx.font = '32px Arial';
    ctx.fillText(`Score: ${gameState.score}`, metrics.GAME_WIDTH / 2, metrics.GAME_HEIGHT / 2);
    ctx.fillText(`Best: ${gameState.bestScore}`, metrics.GAME_WIDTH / 2, metrics.GAME_HEIGHT / 2 + 40);

    ctx.font = '24px Arial';
    ctx.fillText('Tap or Press Space to Restart', metrics.GAME_WIDTH / 2, metrics.GAME_HEIGHT / 2 + 100);

    ctx.textAlign = 'left';
}
