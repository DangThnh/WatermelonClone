const config = {
    type: Phaser.AUTO,
    width: 540,
    height: 960,
    backgroundColor: '#ffe8a1', // Màu nền vàng nhạt cực kỳ thân thiện
    parent: 'game-container',
    physics: {
        default: 'matter', // BẮT BUỘC DÙNG MATTER.JS CHO GAME NÀY
        matter: {
            gravity: { y: 1.5 }, // Trọng lực khá mạnh để quả rơi nhanh
            debug: true // BẬT DEBUG ĐỂ NHÌN THẤY HITBOX VẬT LÝ (Tắt ở Giai đoạn cuối)
        }
    },
    scene: [BootScene, GameScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};
const game = new Phaser.Game(config);