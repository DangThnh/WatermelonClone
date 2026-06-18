class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        this.add.rectangle(270, 480, 540, 960, 0xffe8a1).setDepth(-10);

        this.score = 0;
        this.canDrop = true; 

         
        // --- CÁC BIẾN QUẢN LÝ VẠCH ĐỎ TỬ THẦN ---
        this.isGameOver = false;      // Cờ kết thúc game
        this.dangerTimer = 0;         // Đồng hồ đếm giờ ở vùng nguy hiểm
        this.isDangerZone = false;    // Có quả nào đang vượt vạch đỏ không?
        
        this.fruitRadii = [
            0,  
            26, 39, 54, 59, 76, 91, 116, 130, 160, 155, 204 
        ];

        this.scoreText = this.add.text(30, 30, '0', { 
            font: 'bold 48px Arial', fill: '#ffcc00', stroke: '#8b5a2b', strokeThickness: 8 
        }).setDepth(100);

        // =======================================================
        // MA THUẬT: TỰ TẠO ẢNH PHÔI (CHỐNG LỖI TEXTURE MATTER.JS)
        // =======================================================
        let g = this.make.graphics({x: 0, y: 0, add: false});
        g.fillStyle(0xffffff, 1);
        g.fillCircle(100, 100, 100);
        g.generateTexture('fruit_placeholder', 200, 200);

        // =======================================================
        // 1. CHIẾC XÔ VẬT LÝ AN TOÀN
        // =======================================================
        this.matter.world.setBounds(-100, -100, 740, 1160); 

        let wallThick = 60;
        
        // Vẽ tường (Visual)
        let groundRect = this.add.rectangle(270, 990, 540, wallThick, 0x8b5a2b);
        let leftWallRect = this.add.rectangle(-30, 480, wallThick, 960, 0x8b5a2b);
        let rightWallRect = this.add.rectangle(570, 480, wallThick, 960, 0x8b5a2b);

        // Áp dụng vật lý
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
        // 3. LOGIC DI CHUYỂN VÀ THẢ QUẢ (SỬA DỨT ĐIỂM BẰNG CÁCH SINH QUẢ MỚI)
        // =======================================================
        this.spawnNextFruit();

        this.input.on('pointermove', (pointer) => {
            if (this.canDrop && this.dummyFruit) {
                // Di chuyển cái ảnh "bóng ma" (không có vật lý) lướt theo tay
                let radius = this.fruitRadii[this.currentLevel];
                let clampX = Phaser.Math.Clamp(pointer.x, 20 + radius, 520 - radius);
                this.dummyFruit.setPosition(clampX, 100);
            }
        });

        this.input.on('pointerdown', (pointer) => {
            if (this.canDrop && this.dummyFruit) {
                this.canDrop = false; 

                // Lấy tọa độ cuối cùng của cái bóng
                let dropX = this.dummyFruit.x;
                let dropLevel = this.currentLevel;

                // Xóa cái bóng đi
                this.dummyFruit.destroy();
                this.dummyFruit = null;

                // --- MA THUẬT NẰM Ở ĐÂY ---
                // Sinh ra một quả THẬT mang vật lý động (Dynamic) rớt ngay tại tọa độ đó!
                this.createRealFruit(dropX, 100, dropLevel);
                
                // Gọi quả mới chờ trên đầu sau 1 giây
                this.time.delayedCall(1000, () => {
                    this.spawnNextFruit();
                });
            }
        });

         this.matter.world.on('collisionstart', this.handleCollision, this);
    }

    // =======================================================
    // 4. HÀM TẠO ẢNH BÓNG MA (CHỈ NHÌN ĐƯỢC, KHÔNG CÓ VẬT LÝ)
    // =======================================================
    spawnNextFruit() {
        this.currentLevel = Phaser.Math.Between(1, 5); 
        let radius = this.fruitRadii[this.currentLevel];
        let key = `fruit_${this.currentLevel}`;
        
        if (!this.textures.exists(key)) {
            key = 'fruit_placeholder'; 
        }

        // Tạo ảnh (Image) bình thường, KHÔNG CÓ MATTER VẬT LÝ để không bao giờ bị lỗi
        this.dummyFruit = this.add.image(270, 100, key);
        this.dummyFruit.setDisplaySize(radius * 2, radius * 2);

        if (key === 'fruit_placeholder') {
            let colors = [0xffffff, 0xff9999, 0xff4d4d, 0x9933cc, 0xf1c40f, 0x8b4513];
            this.dummyFruit.setTint(colors[this.currentLevel]);
        }

        this.canDrop = true; 
    }

    // =======================================================
    // 5. HÀM TẠO QUẢ VẬT LÝ ĐỘNG (KHI THẢ RƠI)
    // =======================================================
    createRealFruit(x, y, level) {
        let radius = this.fruitRadii[level];
        let key = `fruit_${level}`;
        
        if (!this.textures.exists(key)) {
            key = 'fruit_placeholder'; 
        }

        // Tạo thẳng bằng Vật lý ĐỘNG (isStatic: false mặc định)
        let realFruit = this.matter.add.sprite(x, y, key);
        realFruit.setDisplaySize(radius * 2, radius * 2);

        realFruit.setCircle(radius, {
            restitution: 0.2,
            friction: 0.1,
            label: `${level}` // Giữ label để gộp
        });

        if (key === 'fruit_placeholder') {
            let colors = [0xffffff, 0xff9999, 0xff4d4d, 0x9933cc, 0xf1c40f, 0x8b4513];
            realFruit.setTint(colors[level]);
        }
    }

    // =======================================================
    // 6. THUẬT TOÁN GỘP QUẢ BẤT TỬ (MERGE COLLISION)
    // =======================================================
    handleCollision(event) {
        // Quét qua tất cả các cặp va chạm diễn ra trong khung hình này
        event.pairs.forEach(pair => {
            let bodyA = pair.bodyA;
            let bodyB = pair.bodyB;

            // Bỏ qua nếu một trong hai vật thể là Tường (có label là 'wall')
            if (bodyA.label === 'wall' || bodyB.label === 'wall') return;

            // Bỏ qua nếu vật thể đã bị đánh dấu xóa (tránh lỗi gộp đúp)
            if (bodyA.isDestroyed || bodyB.isDestroyed) return;

            // Nếu 2 quả có cùng Level (cùng label)
            if (bodyA.label === bodyB.label) {
                
                let currentLevel = parseInt(bodyA.label);
                
                // Nếu đã là Dưa Hấu bự nhất (Cấp 11) thì không gộp nữa
                if (currentLevel >= 11) return;

                // --- 1. TÍNH TỌA ĐỘ TRUNG BÌNH CỦA ĐIỂM GỘP ---
                let mixX = (bodyA.position.x + bodyB.position.x) / 2;
                let mixY = (bodyA.position.y + bodyB.position.y) / 2;

                // --- 2. ĐÁNH DẤU XÓA ĐỂ CHỐNG LỖI GỘP CHỒNG CHÉO ---
                bodyA.isDestroyed = true;
                bodyB.isDestroyed = true;

                // Lấy đối tượng Game Object (Sprite) để hủy
                let spriteA = bodyA.gameObject;
                let spriteB = bodyB.gameObject;

                // Xóa vật lý và hình ảnh
                if (spriteA) spriteA.destroy();
                if (spriteB) spriteB.destroy();

                // --- 3. ĐẺ QUẢ MỚI TO HƠN (LEVEL + 1) TẠI TÂM GỘP ---
                let nextLevel = currentLevel + 1;
                
                // Trì hoãn 1 tẹo để hiệu ứng mượt hơn, tránh Matter.js bị quá tải
                this.time.delayedCall(10, () => {
                    this.createRealFruit(mixX, mixY, nextLevel);
                });

                // --- 4. CỘNG ĐIỂM ---
                // Công thức điểm tiến cấp: Cấp 1=2đ, Cấp 2=4đ, Cấp 3=6đ...
                let pointsEarned = currentLevel * 2; 
                this.score += pointsEarned;
                this.scoreText.setText(this.score);

                // --- 5. HIỆU ỨNG POP UP ĐIỂM (TÙY CHỌN) ---
                let scorePopup = this.add.text(mixX, mixY - 30, `+${pointsEarned}`, { 
                    font: 'bold 24px Arial', fill: '#ff5722', stroke: '#ffffff', strokeThickness: 3 
                }).setDepth(50);
                
                this.tweens.add({
                    targets: scorePopup,
                    y: mixY - 80,
                    alpha: 0,
                    duration: 800,
                    onComplete: () => scorePopup.destroy()
                });
            }
        });
    }

    // =======================================================
    // 7. VÒNG LẶP KIỂM TRA VẠCH ĐỎ (60 FPS)
    // =======================================================
    update(time, delta) {
        if (this.isGameOver) return; // Nếu chết rồi thì ngừng quét

        let anyFruitInDanger = false;

        // Quét toàn bộ các vật thể động (Dynamic Bodies) trong thế giới Matter.js
        let allBodies = this.matter.world.getAllBodies();
        
        for (let i = 0; i < allBodies.length; i++) {
            let body = allBodies[i];

            // Bỏ qua tường (wall) và các quả lơ lửng chờ thả (isStatic = true)
            if (body.label === 'wall' || body.isStatic) continue;

            // Tính toán Điểm Cao Nhất (Top-most point) của quả đó: Tâm Y - Bán kính
            let topY = body.position.y - body.circleRadius;

            // Nếu Điểm cao nhất vượt qua vạch đỏ (Tọa độ Y < 200)
            if (topY < this.dangerLineY) {
                // Kiểm tra xem quả đó đã đứng yên (tốc độ gần như bằng 0) chưa
                // Tránh việc quả mới thả rớt xuyên qua vạch đỏ cũng bị tính là thua
                if (Math.abs(body.velocity.y) < 0.5 && Math.abs(body.velocity.x) < 0.5) {
                    anyFruitInDanger = true;
                    
                    // Nhuộm đỏ quả đó để báo động
                    if (body.gameObject) body.gameObject.setTint(0xff5555);
                }
            } else {
                // Nếu an toàn, trả lại màu gốc
                if (body.gameObject && body.gameObject.isTinted) {
                    body.gameObject.clearTint();
                }
            }
        }

        // --- XỬ LÝ ĐẾM NGƯỢC 3 GIÂY ---
        if (anyFruitInDanger) {
            this.isDangerZone = true;
            this.dangerTimer += delta; // Cộng dồn thời gian bằng mili-giây (delta)

            // Nếu kẹt trên vạch đỏ liên tục quá 3000ms (3 giây) -> TOANG!
            if (this.dangerTimer >= 3000) {
                this.triggerGameOver();
            }
        } else {
            // Nếu quả rơi xuống lại hoặc gộp nổ biến mất -> Xóa báo động!
            if (this.isDangerZone) {
                this.isDangerZone = false;
                this.dangerTimer = 0;
            }
        }
    }

    // =======================================================
    // 8. KẾT THÚC TRÒ CHƠI & LƯU KỶ LỤC
    // =======================================================
    triggerGameOver() {
        this.isGameOver = true;
        this.canDrop = false; // Khóa thả quả

        // Đọc kỷ lục cũ từ Local Storage
        let highScore = localStorage.getItem('watermelonHighScore') || 0;
        
        // Nếu điểm ván này cao hơn kỷ lục -> Lưu mới!
        if (this.score > highScore) {
            highScore = this.score;
            localStorage.setItem('watermelonHighScore', highScore);
        }

        // Làm mờ màn hình
        this.add.rectangle(270, 480, 540, 960, 0x000000, 0.8).setDepth(200);

        // Hiện bảng kết quả
        let board = this.add.rectangle(270, 480, 400, 300, 0xffffff).setDepth(201).setStrokeStyle(4, 0x333333);
        
        this.add.text(270, 380, "GAME OVER", { font: 'bold 40px Arial', fill: '#ff3333' }).setOrigin(0.5).setDepth(202);
        
        this.add.text(270, 440, `Điểm của bạn: ${this.score}`, { font: '24px Arial', fill: '#333' }).setOrigin(0.5).setDepth(202);
        this.add.text(270, 480, `Kỷ lục cao nhất: ${highScore}`, { font: 'bold 20px Arial', fill: '#f1c40f' }).setOrigin(0.5).setDepth(202);

        // Nút chơi lại
        let restartBtn = this.add.rectangle(270, 560, 200, 50, 0x4caf50).setInteractive({ useHandCursor: true }).setDepth(202);
        this.add.text(270, 560, "CHƠI LẠI", { font: 'bold 24px Arial', fill: '#fff' }).setOrigin(0.5).setDepth(203);

        restartBtn.on('pointerdown', () => {
            this.scene.restart(); // Reset toàn bộ game
        });
    }

}