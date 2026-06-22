class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        // Nền màu vàng nhạt thân thiện
        this.add.rectangle(270, 480, 540, 960, 0xffe8a1).setDepth(-10);

        // =======================================================
        // CẤU HÌNH THÔNG SỐ GAME & TÔNG MÀU HOÀN CHỈNH
        // =======================================================

            if (this.cache.audio.exists('bgm_theme')) {
            let currentBgm = this.sound.get('bgm_theme');
            if (!currentBgm) {
                this.sound.play('bgm_theme', { loop: true, volume: 0.4 }); // Volume 0.4 vừa phải thư giãn
            }
        }

        this.score = 0;
        this.canDrop = true; 
        
        this.isGameOver = false;      
        this.dangerTimer = 0;         
        this.isDangerZone = false;    

        this.fruitRadii = [
            0,  
            26, 39, 54, 59, 76, 91, 116, 130, 160, 155, 204 
        ];

        // Mảng màu sắc đại diện cho 11 loại quả (Dùng cho cả Placeholder và khói khói bụi)
        this.fruitColors = [
            0xffffff, // 0
            0xff9999, // 1: Măng cụt
            0xff4d4d, // 2: Dâu tây
            0x9933cc, // 3: Nho
            0xf1c40f, // 4: Chanh
            0x8b4513, // 5: Kiwi
            0xe74c3c, // 6: Cà chua
            0xff85a2, // 7: Đào
            0xffeb3b, // 8: Dứa
            0x34495e, // 9: Dừa
            0x2ecc71, // 10: Nửa dưa hấu
            0x27ae60  // 11: Dưa hấu
        ];

        this.scoreText = this.add.text(30, 30, '0', { 
            font: 'bold 48px Arial', fill: '#ffcc00', stroke: '#8b5a2b', strokeThickness: 8 
        }).setDepth(100);

        // --- KHỞI TẠO BỘ ÂM THANH AN TOÀN ---
        this.soundPop = this.cache.audio.exists('pop_sound') ? this.sound.add('pop_sound') : null;
        this.soundGameOver = this.cache.audio.exists('gameover_sound') ? this.sound.add('gameover_sound') : null;

        // =======================================================
        // MA THUẬT: TỰ TẠO ẢNH PHÔI QUẢ & HẠT SÁNG (ZERO ASSETS CRASH)
        // =======================================================
        if (!this.textures.exists('fruit_placeholder')) {
            let g = this.make.graphics({x: 0, y: 0, add: false});
            g.fillStyle(0xffffff, 1);
            g.fillCircle(100, 100, 100);
            g.generateTexture('fruit_placeholder', 200, 200);
        }

        if (!this.textures.exists('particle_spark')) {
            let pg = this.make.graphics({x: 0, y: 0, add: false});
            pg.fillStyle(0xffffff, 1);
            pg.fillCircle(4, 4, 4);
            pg.generateTexture('particle_spark', 8, 8);
        }

        // =======================================================
        // 1. CHIẾC XÔ VẬT LÝ AN TOÀN
        // =======================================================
        this.matter.world.setBounds(-100, -100, 740, 1160); 

        let wallThick = 60;
        let groundRect = this.add.rectangle(270, 990, 540, wallThick, 0x8b5a2b);
        let leftWallRect = this.add.rectangle(-30, 480, wallThick, 960, 0x8b5a2b);
        let rightWallRect = this.add.rectangle(570, 480, wallThick, 960, 0x8b5a2b);

        this.matter.add.gameObject(groundRect, { isStatic: true, friction: 0.5, restitution: 0.2, label: "wall" });
        this.matter.add.gameObject(leftWallRect, { isStatic: true, friction: 0.1, label: "wall" });
        this.matter.add.gameObject(rightWallRect, { isStatic: true, friction: 0.1, label: "wall" });

        // =======================================================
        // 2. VẠCH ĐỎ CẢNH BÁO
        // =======================================================
        this.dangerLineY = 200; 

        let graphics = this.add.graphics();
        graphics.lineStyle(4, 0xff3333, 1);
        for (let x = 0; x < 540; x += 20) {
            graphics.moveTo(x, this.dangerLineY);
            graphics.lineTo(x + 10, this.dangerLineY);
        }
        graphics.strokePath();

        this.add.text(270, this.dangerLineY - 15, "VƯỢT VẠCH NÀY TRONG 3S SẼ THUA", { font: 'bold 16px Arial', fill: '#ff3333' }).setOrigin(0.5);

        // =======================================================
        // 3. LOGIC DI CHUYỂN VÀ THẢ QUẢ
        // =======================================================
        // =======================================================
        // 3. LOGIC DI CHUYỂN VÀ THẢ QUẢ (ĐÃ NÂNG CẤP ĐƯỜNG CHỜ NEXT FRUIT)
        // =======================================================
        
        // Sinh trước 2 mốc quả ngẫu nhiên ban đầu
        this.currentLevel = Phaser.Math.Between(1, 5);
        this.nextLevel = Phaser.Math.Between(1, 5);

        // Vẽ Khung Xem Trước "TIẾP THEO" ở góc trên cùng bên phải
        this.add.text(460, 40, "TIẾP THEO", { font: 'bold 14px Arial', fill: '#8b5a2b' }).setOrigin(0.5);
        this.nextFruitPreview = this.add.image(460, 95, 'fruit_placeholder').setDepth(10);
        
        // Cập nhật hình ảnh của quả chờ trên bệ
        this.updatePreviewVisual();

        // Sinh quả hiện tại lên đỉnh đầu để chờ thả
        this.spawnCurrentFruit();

        // =======================================================
        // 4. HỆ THỐNG INPUT NÂNG CẤP ĐIỆN THOẠI (RELEASE TO DROP)
        // =======================================================
        
        // A. KHI DI CHUYỂN (Quẹt ngón tay / Di chuột): Quả dưa trượt theo X
        this.input.on('pointermove', (pointer) => {
            if (this.canDrop && this.dummyFruit) {
                let radius = this.fruitRadii[this.currentLevel];
                let clampX = Phaser.Math.Clamp(pointer.x, 20 + radius, 520 - radius);
                this.dummyFruit.setPosition(clampX, 100);
            }
        });

        // B. KHI CHẠM NGÓN TAY XUỐNG: Chỉ hút quả dưa về tọa độ chạm, KHÔNG THẢ!
        this.input.on('pointerdown', (pointer) => {
            if (this.canDrop && this.dummyFruit) {
                let radius = this.fruitRadii[this.currentLevel];
                let clampX = Phaser.Math.Clamp(pointer.x, 20 + radius, 520 - radius);
                this.dummyFruit.setPosition(clampX, 100);
            }
        });

        // C. KHI NHẤC NGÓN TAY LÊN (RELEASE): Chính thức thả rơi tự do!
        this.input.on('pointerup', (pointer) => {
            if (this.canDrop && this.dummyFruit) {
                this.canDrop = false; // Khóa thả tiếp

                // Lấy tọa độ x ngay tại thời điểm nhấc ngón tay ra
                let dropX = this.dummyFruit.x;
                let dropLevel = this.currentLevel; 

                // Xóa cái bóng đi
                this.dummyFruit.destroy();
                this.dummyFruit = null;

                // Sinh quả thật rơi tự do xuống dưới
                this.createRealFruit(dropX, 100, dropLevel);
                
                // Đảo quả chờ thành quả thả tiếp theo
                this.currentLevel = this.nextLevel;
                this.nextLevel = Phaser.Math.Between(1, 5);

                // Chờ 1 giây để mọc quả mới
                this.time.delayedCall(1000, () => {
                    this.updatePreviewVisual(); 
                    this.spawnCurrentFruit();   
                });
            }
        });

        // KÍCH HOẠT RADAR VA CHẠM TOÀN CẦU
        this.matter.world.on('collisionstart', this.handleCollision, this);
    }

    spawnCurrentFruit() {
        //this.currentLevel = Phaser.Math.Between(1, 5); 
        let radius = this.fruitRadii[this.currentLevel];
        let key = `fruit_${this.currentLevel}`;
        
        if (!this.textures.exists(key)) {
            key = 'fruit_placeholder'; 
        }

        this.dummyFruit = this.add.image(270, 100, key);
        this.dummyFruit.setDisplaySize(radius * 2, radius * 2);

        if (key === 'fruit_placeholder') {
            this.dummyFruit.setTint(this.fruitColors[this.currentLevel]);
        }

        this.canDrop = true; 
    }

    createRealFruit(x, y, level) {
        let radius = this.fruitRadii[level];
        let key = `fruit_${level}`;
        
        if (!this.textures.exists(key)) {
            key = 'fruit_placeholder'; 
        }

        let realFruit = this.matter.add.sprite(x, y, key);
        realFruit.setDisplaySize(radius * 2, radius * 2);

        realFruit.setCircle(radius, {
            restitution: 0.2,
            friction: 0.1,
            label: `${level}` 
        });

        if (key === 'fruit_placeholder') {
            realFruit.setTint(this.fruitColors[level]);
        }
    }

    // =======================================================
    // 5. THUẬT TOÁN GỘP QUẢ & SIÊU VỤ NỔ LEVEL 11 (MATTER COMBINE)
    // =======================================================
    handleCollision(event) {
        event.pairs.forEach(pair => {
            let bodyA = pair.bodyA;
            let bodyB = pair.bodyB;

            if (bodyA.label === 'wall' || bodyB.label === 'wall') return;
            if (bodyA.isDestroyed || bodyB.isDestroyed) return;

            if (bodyA.label === bodyB.label) {
                let currentLevel = parseInt(bodyA.label);
                if (currentLevel >= 11) return; // Đã là dưa hấu bự nhất

                let mixX = (bodyA.position.x + bodyB.position.x) / 2;
                let mixY = (bodyA.position.y + bodyB.position.y) / 2;

                bodyA.isDestroyed = true;
                bodyB.isDestroyed = true;

                let spriteA = bodyA.gameObject;
                let spriteB = bodyB.gameObject;

                if (spriteA) spriteA.destroy();
                if (spriteB) spriteB.destroy();

                // Phát tiếng Pop
                if (this.soundPop) this.soundPop.play();

                let nextLevel = currentLevel + 1;

                // --- HIỆU ỨNG HẠT BỤI NỔ ĐA SẮC THEO MÀU QUẢ ---
                this.createMergeParticles(mixX, mixY, this.fruitColors[nextLevel], 15);

                // --- SIÊU VỤ NỔ LEVEL 11 (HỢP THÀNH ĐẠI TÂY QUA!) ---
                if (nextLevel === 11) {
                    this.cameras.main.shake(300, 0.03); // Rung màn hình cực mạnh
                    this.createMergeParticles(mixX, mixY, 0x27ae60, 50); // Bắn 50 hạt khói xanh lá

                    // SÓNG XUNG KÍCH: Tiêu hủy toàn bộ trái cây trong bán kính 220px
                    let allBodies = this.matter.world.getAllBodies();
                    allBodies.forEach(b => {
                        if (b.label !== 'wall' && !b.isStatic && b.gameObject) {
                            let dist = Phaser.Math.Distance.Between(mixX, mixY, b.position.x, b.position.y);
                            if (dist < 220) {
                                b.gameObject.destroy();
                            }
                        }
                    });

                    // Thưởng nóng 200 điểm
                    this.score += 200;
                    this.scoreText.setText(this.score);
                    this.showFloatingText(mixX, mixY - 50, "BIG WATERMELON! 🍉 +200", "#27ae60");
                } else {
                    // Sinh quả mới level tiếp theo như bình thường
                    this.time.delayedCall(10, () => {
                        this.createRealFruit(mixX, mixY, nextLevel);
                    });

                    // Cộng điểm tăng tiến
                    let pointsEarned = currentLevel * 2; 
                    this.score += pointsEarned;
                    this.scoreText.setText(this.score);
                    this.showFloatingText(mixX, mixY - 30, `+${pointsEarned}`, this.fruitColors[nextLevel]);
                }
            }
        });
    }

    // HIỆU ỨNG PHUN TRÀO HẠT
    createMergeParticles(x, y, color, amount) {
        if (!this.textures.exists('particle_spark')) return;

        this.add.particles(x, y, 'particle_spark', {
            speed: { min: 80, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 1.5, end: 0 },
            alpha: { start: 0.8, end: 0 },
            lifespan: 500,
            tint: color,
            gravityY: 100, // Rơi nhẹ theo trọng lực
            maxParticles: amount
        });
    }

    showFloatingText(x, y, text, color) {
        let fText = this.add.text(x, y, text, { 
            font: 'bold 24px Arial', fill: color, stroke: '#ffffff', strokeThickness: 3 
        }).setOrigin(0.5).setDepth(50);
        
        this.tweens.add({
            targets: fText,
            y: y - 50,
            alpha: 0,
            duration: 800,
            onComplete: () => fText.destroy()
        });
    }

    // =======================================================
    // VÒNG LẶP KIỂM TRA VẠCH ĐỎ (60 FPS)
    // =======================================================
    update(time, delta) {
        if (this.isGameOver) return; 

        let anyFruitInDanger = false;
        let allBodies = this.matter.world.getAllBodies();
        
        for (let i = 0; i < allBodies.length; i++) {
            let body = allBodies[i];
            if (body.label === 'wall' || body.isStatic) continue;

            let topY = body.position.y - body.circleRadius;

            if (topY < this.dangerLineY) {
                if (Math.abs(body.velocity.y) < 0.5 && Math.abs(body.velocity.x) < 0.5) {
                    anyFruitInDanger = true;
                    if (body.gameObject) body.gameObject.setTint(0xff5555);
                }
            } else {
                if (body.gameObject && body.gameObject.isTinted) {
                    body.gameObject.clearTint();
                }
            }
        }

        if (anyFruitInDanger) {
            this.isDangerZone = true;
            this.dangerTimer += delta; 

            if (this.dangerTimer >= 3000) {
                this.triggerGameOver();
            }
        } else {
            if (this.isDangerZone) {
                this.isDangerZone = false;
                this.dangerTimer = 0;
            }
        }
    }

    triggerGameOver() {
        this.isGameOver = true;
        this.canDrop = false; 

        if (this.soundGameOver) this.soundGameOver.play();

        let highScore = localStorage.getItem('watermelonHighScore') || 0;
        if (this.score > highScore) {
            highScore = this.score;
            localStorage.setItem('watermelonHighScore', highScore);
        }

        this.add.rectangle(270, 480, 540, 960, 0x000000, 0.8).setDepth(200);

        let board = this.add.rectangle(270, 480, 400, 300, 0xffffff).setDepth(201).setStrokeStyle(4, 0x333333);
        this.add.text(270, 380, "GAME OVER", { font: 'bold 40px Arial', fill: '#ff3333' }).setOrigin(0.5).setDepth(202);
        this.add.text(270, 440, `Điểm của bạn: ${this.score}`, { font: '24px Arial', fill: '#333' }).setOrigin(0.5).setDepth(202);
        this.add.text(270, 480, `Kỷ lục cao nhất: ${highScore}`, { font: 'bold 20px Arial', fill: '#f1c40f' }).setOrigin(0.5).setDepth(202);

        let restartBtn = this.add.rectangle(270, 560, 200, 50, 0x4caf50).setInteractive({ useHandCursor: true }).setDepth(202);
        this.add.text(270, 560, "CHƠI LẠI", { font: 'bold 24px Arial', fill: '#fff' }).setOrigin(0.5).setDepth(203);

        restartBtn.on('pointerdown', () => {
            this.scene.restart(); 
        });
    }

    // --- THÊM HÀM MỚI: Vẽ quả chờ ở góc phải ---
    updatePreviewVisual() {
        let key = `fruit_${this.nextLevel}`;
        let radius = this.fruitRadii[this.nextLevel];

        if (!this.textures.exists(key)) {
            key = 'fruit_placeholder';
        }

        this.nextFruitPreview.setTexture(key);
        
        // Co dãn ảnh trên bệ chờ nhỏ gọn cho đẹp (bán kính nhân 1.2 thay vì nhân 2)
        this.nextFruitPreview.setDisplaySize(radius * 1.2, radius * 1.2); 

        if (key === 'fruit_placeholder') {
            this.nextFruitPreview.setTint(this.fruitColors[this.nextLevel]);
            this.nextFruitPreview.clearTint(); // Reset nhuộm màu
            this.nextFruitPreview.setTint(this.fruitColors[this.nextLevel]);
        } else {
            this.nextFruitPreview.clearTint();
        }
    }

}