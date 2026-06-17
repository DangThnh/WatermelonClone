class BootScene extends Phaser.Scene {
    constructor() { super('BootScene'); }

    preload() {
        this.load.setPath('assets/images/');
        
        // Tải 11 quả bằng vòng lặp cho gọn
        for (let i = 1; i <= 11; i++) {
            this.load.image(`fruit_${i}`, `fruit_${i}.png`);
        }
    }

    create() {
        this.scene.start('GameScene');
    }
}