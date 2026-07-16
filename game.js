const config = {
    width: 800,
    height: 600,
    initialLives: 1,
    maxLives: 3,
    fatcatSpeed: 4,
    waimaiWidth: 100,
    waimaiHeight: 100,
    fatcatWidth: 80,
    fatcatHeight: 80,
    hanbaoWidth: 60,
    hanbaoHeight: 60,
    spawnInterval: 2000,
    hanbaoSpawnChance: 0.05,
    baseSpawnInterval: 2000
};

// 游戏状态
let gameState = {
    lives: config.initialLives,
    score: 0,
    gameOver: false,
    gameOverType: 'normal',
    countdown: 3,
    lastSpawnTime: 0,
    fatcats: [],
    hanbaos: [],
    waimai: { x: config.width / 2 - config.waimaiWidth / 2, y: config.height - config.waimaiHeight - 10 },
    keys: { left: false, right: false },
    difficultyLevel: 0,
    difficultyMessage: { text: '', time: 0 }
};

// 图片资源
const images = {
    river: new Image(),
    fatcat: new Image(),
    fatcatsmile: new Image(),
    waimai: new Image(),
    hanbao: new Image(),
    heart: new Image()
};

// 加载图片
function loadImage(image, src) {
    image.src = src;
    image.onerror = () => {
        console.log(`图片加载失败: ${src}`);
        image.error = true; // 标记图片加载失败
    };
}

loadImage(images.river, 'river.png');
loadImage(images.fatcat, 'fatcat.png');
loadImage(images.fatcatsmile, 'fatcatsmile.png');
loadImage(images.waimai, 'waimai.png');
loadImage(images.hanbao, 'hanbao.png');
loadImage(images.heart, 'heart.png');

// 画布和上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 键盘监听
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') gameState.keys.left = true;
    if (e.key === 'ArrowRight') gameState.keys.right = true;
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') gameState.keys.left = false;
    if (e.key === 'ArrowRight') gameState.keys.right = false;
});

// 胖猫
function spawnFatcat() {
    const baseSpeed = config.fatcatSpeed;
    let speedMultiplier = 1;
    
    // 调整速度
    if (gameState.difficultyLevel >= 1) speedMultiplier = 1.3; // 250分后速度增加30%
    if (gameState.difficultyLevel >= 3) speedMultiplier = 1.6; // 750分后速度增加60%
    
    const speed = baseSpeed * speedMultiplier;
    
    const x = Math.random() * (config.width - config.fatcatWidth);
    gameState.fatcats.push({ x, y: -config.fatcatHeight, speed: speed, rotation: 0 });
}

// 汉堡
function spawnHanbao() {
    const x = Math.random() * (config.width - config.hanbaoWidth);
    gameState.hanbaos.push({ x, y: -config.hanbaoHeight, speed: config.fatcatSpeed * 0.8 });
}

// 更新状态
function update() {
    if (gameState.gameOver) return;

    // 更新难度提示信息
    if (gameState.difficultyMessage.time > 0) {
        gameState.difficultyMessage.time -= 1 / 60;
        if (gameState.difficultyMessage.time <= 0) {
            gameState.difficultyMessage.text = '';
        }
    }



    // 检查难度提升
    if (gameState.score >= 250 && gameState.difficultyLevel === 0) {
        gameState.difficultyLevel = 1;
        gameState.difficultyMessage = { text: '难度增加了', time: 3 };
    } else if (gameState.score >= 500 && gameState.difficultyLevel === 1) {
        gameState.difficultyLevel = 2;
        gameState.difficultyMessage = { text: '难度增加了', time: 3 };
    } else if (gameState.score >= 750 && gameState.difficultyLevel === 2) {
        gameState.difficultyLevel = 3;
        gameState.difficultyMessage = { text: '难度增加了', time: 3 };
    } else if (gameState.score >= 1000 && gameState.difficultyLevel === 3) {
        gameState.gameOver = true;
        gameState.gameOverType = 'victory';
    }

    // 倒计时
    if (gameState.countdown > 0) {
        gameState.countdown -= 1 / 60;
        if (gameState.countdown <= 0) {
            spawnFatcat();
        }
        return;
    }

    // 移动外卖袋子
    if (gameState.keys.left && gameState.waimai.x > 0) {
        gameState.waimai.x -= 8;
    }
    if (gameState.keys.right && gameState.waimai.x < config.width - config.waimaiWidth) {
        gameState.waimai.x += 8;
    }

    // 更新胖猫位置
    gameState.fatcats.forEach((fatcat, index) => {
        fatcat.y += fatcat.speed;
        fatcat.rotation += 0.1;

        // 碰撞检测
        if (fatcat.y + config.fatcatHeight >= gameState.waimai.y &&
            fatcat.x < gameState.waimai.x + config.waimaiWidth &&
            fatcat.x + config.fatcatWidth > gameState.waimai.x) {
            // 反弹
            fatcat.speed = -fatcat.speed * 1.1;
            gameState.score += 10;
        }

        // 超出屏幕
        if (fatcat.y > config.height) {
            gameState.fatcats.splice(index, 1);
            gameState.lives--;
            if (gameState.lives <= 0) {
                gameState.gameOver = true;
            }
        }
    });

    // 更新汉堡位置
    gameState.hanbaos.forEach((hanbao, index) => {
        hanbao.y += hanbao.speed;

        // 碰撞检测
        if (hanbao.y + config.hanbaoHeight >= gameState.waimai.y &&
            hanbao.x < gameState.waimai.x + config.waimaiWidth &&
            hanbao.x + config.hanbaoWidth > gameState.waimai.x) {
            gameState.hanbaos.splice(index, 1);
            if (gameState.lives < config.maxLives) {
                gameState.lives++;
            }
            gameState.score += 100;
        }

        // 超出屏幕
        if (hanbao.y > config.height) {
            gameState.hanbaos.splice(index, 1);
        }
    });

    // 生成新胖猫
    const now = Date.now();
    
    // 根据难度级别调整生成间隔
    let spawnInterval = config.baseSpawnInterval;
    if (gameState.difficultyLevel >= 2) spawnInterval = 1500; // 500分后间隔缩短到1.5秒
    
    if (now - gameState.lastSpawnTime > spawnInterval) {
        spawnFatcat();
        gameState.lastSpawnTime = now;
        // 随机生成汉堡
        if (Math.random() < config.hanbaoSpawnChance) {
            spawnHanbao();
        }
    }
}

// 渲染游戏
function render() {
    // 绘制背景
    if (images.river.complete && !images.river.error) {
        ctx.drawImage(images.river, 0, 0, config.width, config.height);
    } else {
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, config.width, config.height);
    }

    // 绘制生命值
    for (let i = 0; i < gameState.lives; i++) {
        if (images.heart.complete && !images.heart.error) {
            ctx.drawImage(images.heart, 10 + i * 40, 10, 30, 30);
        } else {
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.moveTo(10 + i * 40 + 15, 10 + 5);
            ctx.bezierCurveTo(10 + i * 40 + 15, 10 + 2, 10 + i * 40 + 12, 10, 10 + i * 40 + 10, 10);
            ctx.bezierCurveTo(10 + i * 40 + 5, 10, 10 + i * 40, 10 + 5, 10 + i * 40, 10 + 15);
            ctx.bezierCurveTo(10 + i * 40, 10 + 25, 10 + i * 40 + 10, 10 + 35, 10 + i * 40 + 15, 10 + 30);
            ctx.bezierCurveTo(10 + i * 40 + 20, 10 + 35, 10 + i * 40 + 30, 10 + 25, 10 + i * 40 + 30, 10 + 15);
            ctx.bezierCurveTo(10 + i * 40 + 30, 10 + 5, 10 + i * 40 + 25, 10, 10 + i * 40 + 20, 10);
            ctx.bezierCurveTo(10 + i * 40 + 18, 10, 10 + i * 40 + 15, 10 + 2, 10 + i * 40 + 15, 10 + 5);
            ctx.fill();
        }
    }

    // 绘制分数
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText(`分数: ${gameState.score}`, config.width - 120, 30);

    // 绘制难度提示
    if (gameState.difficultyMessage.text && gameState.difficultyMessage.time > 0) {
        ctx.fillStyle = '#FFD700';
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(gameState.difficultyMessage.text, config.width / 2, config.height / 3);
        ctx.textAlign = 'left';
    }

    // 绘制倒计时
    if (gameState.countdown > 0) {
        ctx.fillStyle = '#fff';
        ctx.font = '100px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(Math.ceil(gameState.countdown), config.width / 2, config.height / 2);
        ctx.textAlign = 'left';
    }

    // 绘制外卖袋子
    if (images.waimai.complete && !images.waimai.error) {
        ctx.drawImage(images.waimai, gameState.waimai.x, gameState.waimai.y, config.waimaiWidth, config.waimaiHeight);
    } else {
        ctx.fillStyle = '#FFA500';
        ctx.fillRect(gameState.waimai.x, gameState.waimai.y, config.waimaiWidth, config.waimaiHeight);
    }

    // 绘制胖猫
    gameState.fatcats.forEach(fatcat => {
        ctx.save();
        ctx.translate(fatcat.x + config.fatcatWidth / 2, fatcat.y + config.fatcatHeight / 2);
        ctx.rotate(fatcat.rotation);
        if (images.fatcat.complete && !images.fatcat.error) {
            ctx.drawImage(images.fatcat, -config.fatcatWidth / 2, -config.fatcatHeight / 2, config.fatcatWidth, config.fatcatHeight);
        } else {
            ctx.fillStyle = '#0000FF';
            ctx.fillRect(-config.fatcatWidth / 2, -config.fatcatHeight / 2, config.fatcatWidth, config.fatcatHeight);
        }
        ctx.restore();
    });

    // 绘制汉堡
    gameState.hanbaos.forEach(hanbao => {
        if (images.hanbao.complete && !images.hanbao.error) {
            ctx.drawImage(images.hanbao, hanbao.x, hanbao.y, config.hanbaoWidth, config.hanbaoHeight);
        } else {
            ctx.fillStyle = '#FFFF00';
            ctx.fillRect(hanbao.x, hanbao.y, config.hanbaoWidth, config.hanbaoHeight);
        }
    });

    // 游戏结束
    if (gameState.gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, config.width, config.height);
        
        const centerX = config.width / 2;
        const fatcatSize = 200;
        
        // 绘制文字
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        
        if (gameState.gameOverType === 'victory') {
            ctx.font = '40px Arial';
            ctx.fillText('谢谢你，我爱吃麦当劳', centerX, config.height / 2 - 150);
            
            // 绘制胖猫大笑图片
            if (images.fatcatsmile.complete && !images.fatcatsmile.error) {
                ctx.drawImage(images.fatcatsmile, centerX - fatcatSize/2, config.height / 2 - fatcatSize/2, fatcatSize, fatcatSize);
            } else {
                ctx.fillStyle = '#0000FF';
                ctx.fillRect(centerX - fatcatSize/2, config.height / 2 - fatcatSize/2, fatcatSize, fatcatSize);
            }
        } else {
            ctx.font = '40px Arial';
            ctx.fillText('游戏结束，可惜胖猫再也吃不了麦当劳了！', centerX, config.height / 2 - 150);
            
            // 绘制普通胖猫图片
            if (images.fatcat.complete && !images.fatcat.error) {
                ctx.drawImage(images.fatcat, centerX - fatcatSize/2, config.height / 2 - fatcatSize/2, fatcatSize, fatcatSize);
            } else {
                ctx.fillStyle = '#0000FF';
                ctx.fillRect(centerX - fatcatSize/2, config.height / 2 - fatcatSize/2, fatcatSize, fatcatSize);
            }
        }
        
        ctx.font = '30px Arial';
        ctx.fillText(`最终分数: ${gameState.score}`, centerX, config.height / 2 + fatcatSize/2 + 50);
        ctx.font = '20px Arial';
        ctx.fillText('按空格键重新开始', centerX, config.height / 2 + fatcatSize/2 + 90);
        ctx.textAlign = 'left';
    }
}

// 游戏循环
function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// 重新开始游戏
function restartGame() {
    gameState = {
        lives: config.initialLives,
        score: 0,
        gameOver: false,
        countdown: 3,
        lastSpawnTime: 0,
        fatcats: [],
        hanbaos: [],
        waimai: { x: config.width / 2 - config.waimaiWidth / 2, y: config.height - config.waimaiHeight - 10 },
        keys: { left: false, right: false },
        difficultyLevel: 0,
        difficultyMessage: { text: '', time: 0 }
    };
}

// 监听空格键重新开始
document.addEventListener('keydown', (e) => {
    if (e.key === ' ' && gameState.gameOver) {
        restartGame();
    }
});

// 启动游戏
function startGame() {
    // 等待所有图片加载完成
    let loadedImages = 0;
    const totalImages = Object.keys(images).length;
    
    Object.values(images).forEach(image => {
        image.onload = () => {
            loadedImages++;
            if (loadedImages === totalImages) {
                gameLoop();
            }
        };
        
        // 如果图片加载失败，继续游戏
        image.onerror = () => {
            loadedImages++;
            if (loadedImages === totalImages) {
                gameLoop();
            }
        };
    });
    
    // 防止图片加载超时
    setTimeout(() => {
        gameLoop();
    }, 2000);
}

window.onload = startGame;