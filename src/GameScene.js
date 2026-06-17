class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        // Màu nền phụ (Giả làm màu của cái tường xô)
        this.add.rectangle(270, 580, 520, 800, 0xffd166).setDepth(-1);

        // =======================================================
        // 1. XÂY DỰNG "CHIẾC XÔ" VẬT LÝ (STATIC WALLS)
        // Matter.js cần các vật thể tĩnh (isStatic: true) để đỡ các vật rơi xuống
        // =======================================================
        
        // Thông số độ dày tường
        let wallThick = 60;

        // Đáy xô (Nằm tuốt dưới cùng)
        this.matter.add.rectangle(270, 960 + (wallThick/2) - 10, 540, wallThick, { 
            isStatic: true, 
            friction: 0.5,
            restitution: 0.2 // Độ nảy nhẹ
        });

        // Tường trái
        this.matter.add.rectangle(0 - (wallThick/2) + 10, 480, wallThick, 960, { 
            isStatic: true,
            friction: 0.1 // Trơn một chút để quả dễ trượt xuống
        });

        // Tường phải
        this.matter.add.rectangle(540 + (wallThick/2) - 10, 480, wallThick, 960, { 
            isStatic: true,
            friction: 0.1
        });

        // =======================================================
        // 2. VẼ VẠCH ĐỎ CẢNH BÁO GAME OVER
        // =======================================================
        this.dangerLineY = 200; // Tọa độ vạch chết

        let graphics = this.add.graphics();
        graphics.lineStyle(4, 0xff3333, 1);
        
        // Vẽ nét đứt
        for (let x = 0; x < 540; x += 20) {
            graphics.moveTo(x, this.dangerLineY);
            graphics.lineTo(x + 10, this.dangerLineY);
        }
        graphics.strokePath();

        this.add.text(270, this.dangerLineY - 15, "VƯỢT VẠCH NÀY TRONG 3S SẼ THUA", { font: 'bold 16px Arial', fill: '#ff3333' }).setOrigin(0.5);
        
        // Sinh thử 1 quả dưa hấu rơi lóp ngóp để test vật lý
        this.spawnTestFruit();
    }

    spawnTestFruit() {
        // Đẻ 1 quả ở cấp độ 5 (Kiwi) rơi từ giữa màn hình xuống
        // Chú ý: Sang Giai đoạn 2 ta sẽ xóa hàm này và làm cơ chế trượt chuột
        let testFruit = this.matter.add.image(270, 50, 'fruit_5');
        
        // Cấu hình vật lý cho hình tròn (Circle)
        testFruit.setCircle(52); // Bán kính 52px theo GDD của cậu
        testFruit.setBounce(0.3); // Độ nảy
        testFruit.setFriction(0.05); // Ma sát trượt
    }
}