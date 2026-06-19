class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    preload() {
        this.load.setPath('assets/images/');
        
        // Bắt buộc phải có 1 tấm ảnh này làm phôi để Matter.js bám vào
        this.load.image('fruit_placeholder', 'fruit_placeholder.png');
        
        // Tải 11 quả bằng vòng lặp cho gọn
        for (let i = 1; i <= 11; i++) {
            this.load.image(`fruit_${i}`, `fruit_${i}.png`);
        }

        this.load.setPath('assets/audio/');
        this.load.audio('pop_sound', 'pop_sound.mp3');         // Tiếng bọp khi gộp quả
        this.load.audio('gameover_sound', 'gameover_sound.mp3'); // Tiếng báo thua cuộc

         this.load.audio('bgm_theme', 'bgm_theme.mp3');
    }

    create() {
        this.scene.start('GameScene');
    }
}