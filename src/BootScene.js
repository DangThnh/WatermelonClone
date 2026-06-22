class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        let width = this.cameras.main.width;
        let height = this.cameras.main.height;

        // Đổi màu nền tối huyền bí lúc loading
        this.cameras.main.setBackgroundColor('#1a1a1a');

        // 1. Chữ "ĐANG TẢI..." ở giữa màn hình
        let loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'ĐANG TẢI...',
            style: { font: 'bold 20px Arial', fill: '#ffffff' }
        }).setOrigin(0.5, 0.5);

        // 2. Chữ hiển thị phần trăm (Ví dụ: 50%)
        let percentText = this.make.text({
            x: width / 2,
            y: height / 2,
            text: '0%',
            style: { font: 'bold 18px Arial', fill: '#f1c40f' }
        }).setOrigin(0.5, 0.5);

        // 3. Khung viền ngoài của thanh Loading (Màu vàng đồng)
        let progressBox = this.add.graphics();
        progressBox.lineStyle(4, 0x8b5a2b, 1); 
        progressBox.strokeRect(width / 2 - 160, height / 2 - 20, 320, 40);

        // 4. Thanh chạy bên trong màu xanh lá
        let progressBar = this.add.graphics();

        // ==========================================
        // CÁC SỰ KIỆN CO GIÃN THEO TIẾN TRÌNH TẢI
        // ==========================================
        this.load.on('progress', (value) => {
            percentText.setText(parseInt(value * 100) + '%');
            
            progressBar.clear();
            progressBar.fillStyle(0x2ecc71, 1); // Màu xanh lá rực rỡ
            progressBar.fillRect(width / 2 - 156, height / 2 - 16, 312 * value, 32);
        });

        // Khi tải xong toàn bộ thì tự động dọn dẹp các đối tượng loading
        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });


        // ==========================================
        // BẮT ĐẦU TẢI TÀI NGUYÊN GAME
        // ==========================================
        this.load.setPath('assets/images/');
        
        // Tải 11 quả bằng vòng lặp dã chiến
        for (let i = 1; i <= 11; i++) {
            this.load.image(`fruit_${i}`, `fruit_${i}.png`);
        }

        // Tải âm thanh
        this.load.setPath('assets/audio/');
        this.load.audio('pop_sound', 'pop_sound.mp3');         
        this.load.audio('gameover_sound', 'gameover_sound.mp3');       
        this.load.audio('bgm_theme', 'bgm_theme.mp3'); 

        // Reset path để tránh lỗi
        this.load.setPath(''); 
    }

    create() {
        // Tải xong thì tự động nhảy sang màn hình chơi game
        this.scene.start('GameScene');
    }
}