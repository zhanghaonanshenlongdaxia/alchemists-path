/**
 * 生成 Alchemist's Path 游戏的应用图标
 * 创建一个炼金术主题的图标，包含烧瓶和药水元素
 */

const fs = require('fs');
const path = require('path');

// 检查是否安装了 canvas
let createCanvas, loadImage;
try {
    const canvas = require('canvas');
    createCanvas = canvas.createCanvas;
    loadImage = canvas.loadImage;
} catch (e) {
    console.error('错误: 需要安装 canvas 库');
    console.error('请运行: npm install canvas');
    process.exit(1);
}

// 图标尺寸配置（Android 标准）
const ICON_SIZES = {
    'mdpi': 48,
    'hdpi': 72,
    'xhdpi': 96,
    'xxhdpi': 144,
    'xxxhdpi': 192,
};

// 自适应图标尺寸
const ADAPTIVE_FG_SIZE = 432; // 108dp * 4 for xxxhdpi
const ADAPTIVE_BG_SIZE = 432;

function createIcon(size, isForeground = false) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // 透明背景
    ctx.clearRect(0, 0, size, size);
    
    const centerX = size / 2;
    const centerY = size / 2;
    
    if (isForeground) {
        // 前景图标：烧瓶和药水
        const flaskWidth = size * 0.4;
        const flaskHeight = size * 0.6;
        const flaskX = centerX - flaskWidth / 2;
        const flaskY = centerY - flaskHeight / 2 + size * 0.05;
        
        // 烧瓶底部（圆形）
        const flaskBottomRadius = flaskWidth / 2;
        const flaskBottomY = flaskY + flaskHeight - flaskBottomRadius;
        
        ctx.fillStyle = 'rgba(100, 150, 255, 1)'; // 蓝色药水
        ctx.strokeStyle = 'rgba(60, 100, 200, 1)';
        ctx.lineWidth = Math.max(2, size / 48);
        
        ctx.beginPath();
        ctx.ellipse(centerX, flaskBottomY, flaskBottomRadius, flaskBottomRadius, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // 烧瓶颈部
        const neckWidth = flaskWidth * 0.35;
        const neckHeight = flaskHeight * 0.25;
        const neckX = centerX - neckWidth / 2;
        const neckY = flaskY;
        
        ctx.fillRect(neckX, neckY, neckWidth, neckHeight);
        ctx.strokeRect(neckX, neckY, neckWidth, neckHeight);
        
        // 烧瓶口
        const mouthRadius = neckWidth * 0.4;
        const mouthY = neckY - mouthRadius;
        
        ctx.beginPath();
        ctx.ellipse(centerX, mouthY, mouthRadius, mouthRadius, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // 高光
        const highlightY = flaskBottomY - flaskBottomRadius * 0.3;
        const highlightRadius = flaskBottomRadius * 0.25;
        ctx.fillStyle = 'rgba(150, 200, 255, 0.7)';
        ctx.beginPath();
        ctx.ellipse(centerX, highlightY, highlightRadius, highlightRadius, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 气泡
        ctx.fillStyle = 'rgba(200, 230, 255, 0.8)';
        const bubbleSize = Math.max(2, size / 32);
        for (let i = 0; i < 3; i++) {
            const bubbleX = flaskX + flaskWidth * (0.2 + i * 0.3);
            const bubbleY = flaskBottomY - flaskBottomRadius * (0.5 + i * 0.2);
            ctx.beginPath();
            ctx.ellipse(bubbleX, bubbleY, bubbleSize, bubbleSize, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 炼金符号（星星）
        const starSize = size * 0.15;
        const starPoints = 5;
        ctx.fillStyle = 'rgba(255, 220, 100, 1)';
        ctx.strokeStyle = 'rgba(255, 200, 50, 1)';
        ctx.lineWidth = Math.max(1, size / 96);
        
        ctx.beginPath();
        for (let i = 0; i < starPoints * 2; i++) {
            const angle = (i * Math.PI) / starPoints - Math.PI / 2;
            const radius = (i % 2 === 0) ? starSize * 0.6 : starSize * 0.3;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY - size * 0.35 + radius * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    } else {
        // 普通图标：完整的烧瓶设计
        // 背景圆形
        const bgRadius = size * 0.48;
        ctx.fillStyle = 'rgba(30, 40, 60, 1)'; // 深蓝灰色背景
        ctx.strokeStyle = 'rgba(50, 70, 100, 1)';
        ctx.lineWidth = Math.max(2, size / 48);
        
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, bgRadius, bgRadius, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // 烧瓶主体
        const flaskWidth = size * 0.35;
        const flaskHeight = size * 0.5;
        const flaskX = centerX - flaskWidth / 2;
        const flaskY = centerY - flaskHeight / 2 + size * 0.05;
        
        // 烧瓶底部
        const flaskBottomRadius = flaskWidth / 2;
        const flaskBottomY = flaskY + flaskHeight - flaskBottomRadius;
        
        ctx.fillStyle = 'rgba(100, 150, 255, 1)';
        ctx.strokeStyle = 'rgba(60, 100, 200, 1)';
        
        ctx.beginPath();
        ctx.ellipse(centerX, flaskBottomY, flaskBottomRadius, flaskBottomRadius, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // 烧瓶颈部
        const neckWidth = flaskWidth * 0.35;
        const neckHeight = flaskHeight * 0.25;
        const neckX = centerX - neckWidth / 2;
        const neckY = flaskY;
        
        ctx.fillRect(neckX, neckY, neckWidth, neckHeight);
        ctx.strokeRect(neckX, neckY, neckWidth, neckHeight);
        
        // 烧瓶口
        const mouthRadius = neckWidth * 0.4;
        const mouthY = neckY - mouthRadius;
        
        ctx.beginPath();
        ctx.ellipse(centerX, mouthY, mouthRadius, mouthRadius, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // 高光
        const highlightY = flaskBottomY - flaskBottomRadius * 0.3;
        const highlightRadius = flaskBottomRadius * 0.25;
        ctx.fillStyle = 'rgba(150, 200, 255, 0.7)';
        ctx.beginPath();
        ctx.ellipse(centerX, highlightY, highlightRadius, highlightRadius, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 气泡
        ctx.fillStyle = 'rgba(200, 230, 255, 0.8)';
        const bubbleSize = Math.max(2, size / 32);
        for (let i = 0; i < 3; i++) {
            const bubbleX = flaskX + flaskWidth * (0.2 + i * 0.3);
            const bubbleY = flaskBottomY - flaskBottomRadius * (0.5 + i * 0.2);
            ctx.beginPath();
            ctx.ellipse(bubbleX, bubbleY, bubbleSize, bubbleSize, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 炼金符号（星星）
        const starSize = size * 0.12;
        ctx.fillStyle = 'rgba(255, 220, 100, 1)';
        ctx.strokeStyle = 'rgba(255, 200, 50, 1)';
        ctx.lineWidth = Math.max(1, size / 96);
        
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const angle = (i * Math.PI) / 5 - Math.PI / 2;
            const radius = (i % 2 === 0) ? starSize * 0.6 : starSize * 0.3;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY - size * 0.35 + radius * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    
    return canvas;
}

function createAdaptiveBackground(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, size, size);
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.5;
    
    // 渐变背景（从深蓝到深紫）
    for (let i = 0; i < radius; i++) {
        const alpha = 1 - i / radius;
        const r = Math.floor(30 + (50 - 30) * (i / radius));
        const g = Math.floor(40 + (60 - 40) * (i / radius));
        const b = Math.floor(60 + (80 - 60) * (i / radius));
        
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radius - i, radius - i, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 添加装饰性光晕
    for (let i = 0; i < 3; i++) {
        const glowRadius = radius * (0.3 + i * 0.2);
        const glowAlpha = (30 - i * 10) / 255;
        ctx.fillStyle = `rgba(100, 150, 200, ${glowAlpha})`;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, glowRadius, glowRadius, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    return canvas;
}

function saveCanvas(canvas, filePath) {
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filePath, buffer);
}

function main() {
    const baseDir = path.dirname(path.dirname(__filename));
    const androidResDir = path.join(baseDir, 'android', 'app', 'src', 'main', 'res');
    
    console.log('生成 Alchemist\'s Path 应用图标...\n');
    
    // 生成标准图标
    for (const [density, size] of Object.entries(ICON_SIZES)) {
        const mipmapDir = path.join(androidResDir, `mipmap-${density}`);
        if (!fs.existsSync(mipmapDir)) {
            fs.mkdirSync(mipmapDir, { recursive: true });
        }
        
        // 普通图标
        const icon = createIcon(size, false);
        const iconPath = path.join(mipmapDir, 'ic_launcher.png');
        saveCanvas(icon, iconPath);
        console.log(`  ✓ 生成 ${density}/ic_launcher.png (${size}x${size})`);
        
        // 圆形图标（使用相同的设计，但应用圆形遮罩）
        const roundIcon = createIcon(size, false);
        const roundCtx = roundIcon.getContext('2d');
        
        // 创建圆形遮罩
        const mask = createCanvas(size, size);
        const maskCtx = mask.getContext('2d');
        maskCtx.fillStyle = 'black';
        maskCtx.fillRect(0, 0, size, size);
        maskCtx.globalCompositeOperation = 'destination-out';
        maskCtx.fillStyle = 'white';
        maskCtx.beginPath();
        maskCtx.ellipse(size / 2, size / 2, size / 2, size / 2, 0, 0, Math.PI * 2);
        maskCtx.fill();
        
        // 应用遮罩
        roundCtx.globalCompositeOperation = 'destination-in';
        roundCtx.drawImage(mask, 0, 0);
        
        const roundIconPath = path.join(mipmapDir, 'ic_launcher_round.png');
        saveCanvas(roundIcon, roundIconPath);
        console.log(`  ✓ 生成 ${density}/ic_launcher_round.png (${size}x${size})`);
    }
    
    // 生成自适应图标
    const anydpiDir = path.join(androidResDir, 'mipmap-anydpi-v26');
    if (!fs.existsSync(anydpiDir)) {
        fs.mkdirSync(anydpiDir, { recursive: true });
    }
    
    // 前景图标（xxxhdpi 尺寸）
    const fgDir = path.join(androidResDir, 'mipmap-xxxhdpi');
    if (!fs.existsSync(fgDir)) {
        fs.mkdirSync(fgDir, { recursive: true });
    }
    
    const fgIcon = createIcon(ADAPTIVE_FG_SIZE, true);
    const fgIconPath = path.join(fgDir, 'ic_launcher_foreground.png');
    saveCanvas(fgIcon, fgIconPath);
    console.log(`  ✓ 生成 xxxhdpi/ic_launcher_foreground.png (${ADAPTIVE_FG_SIZE}x${ADAPTIVE_FG_SIZE})`);
    
    // 背景图标
    const bgIcon = createAdaptiveBackground(ADAPTIVE_BG_SIZE);
    const bgIconPath = path.join(fgDir, 'ic_launcher_background.png');
    saveCanvas(bgIcon, bgIconPath);
    console.log(`  ✓ 生成 xxxhdpi/ic_launcher_background.png (${ADAPTIVE_BG_SIZE}x${ADAPTIVE_BG_SIZE})`);
    
    // 更新 XML 文件
    const icLauncherXml = path.join(anydpiDir, 'ic_launcher.xml');
    fs.writeFileSync(icLauncherXml, `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`, 'utf-8');
    console.log(`  ✓ 更新 ic_launcher.xml`);
    
    const icLauncherRoundXml = path.join(anydpiDir, 'ic_launcher_round.xml');
    fs.writeFileSync(icLauncherRoundXml, `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`, 'utf-8');
    console.log(`  ✓ 更新 ic_launcher_round.xml`);
    
    console.log('\n✅ 图标生成完成！');
}

if (require.main === module) {
    main();
}

module.exports = { createIcon, createAdaptiveBackground };
