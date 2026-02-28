/**
 * 生成 Alchemist's Path 游戏的应用图标
 * 使用 SVG + sharp 生成，无需原生依赖
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 图标尺寸配置
const ICON_SIZES = {
    'mdpi': 48,
    'hdpi': 72,
    'xhdpi': 96,
    'xxhdpi': 144,
    'xxxhdpi': 192,
};

const ADAPTIVE_FG_SIZE = 432;
const ADAPTIVE_BG_SIZE = 432;

function createIconSVG(size, isForeground = false) {
    const centerX = size / 2;
    const centerY = size / 2;
    
    let svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">`;
    
    if (isForeground) {
        // 前景：烧瓶
        const flaskWidth = size * 0.4;
        const flaskHeight = size * 0.6;
        const flaskX = centerX - flaskWidth / 2;
        const flaskY = centerY - flaskHeight / 2 + size * 0.05;
        const flaskBottomRadius = flaskWidth / 2;
        const flaskBottomY = flaskY + flaskHeight - flaskBottomRadius;
        const neckWidth = flaskWidth * 0.35;
        const neckHeight = flaskHeight * 0.25;
        const mouthRadius = neckWidth * 0.4;
        
        // 烧瓶底部
        svg += `<ellipse cx="${centerX}" cy="${flaskBottomY}" rx="${flaskBottomRadius}" ry="${flaskBottomRadius}" fill="rgb(100,150,255)" stroke="rgb(60,100,200)" stroke-width="${Math.max(2, size/48)}"/>`;
        
        // 瓶颈
        svg += `<rect x="${centerX - neckWidth/2}" y="${flaskY}" width="${neckWidth}" height="${neckHeight}" fill="rgb(100,150,255)" stroke="rgb(60,100,200)" stroke-width="${Math.max(2, size/48)}"/>`;
        
        // 瓶口
        svg += `<ellipse cx="${centerX}" cy="${flaskY - mouthRadius}" rx="${mouthRadius}" ry="${mouthRadius}" fill="rgb(100,150,255)" stroke="rgb(60,100,200)" stroke-width="${Math.max(2, size/48)}"/>`;
        
        // 高光
        svg += `<ellipse cx="${centerX}" cy="${flaskBottomY - flaskBottomRadius * 0.3}" rx="${flaskBottomRadius * 0.25}" ry="${flaskBottomRadius * 0.25}" fill="rgba(150,200,255,0.7)"/>`;
        
        // 气泡
        const bubbleSize = Math.max(2, size / 32);
        for (let i = 0; i < 3; i++) {
            const bx = flaskX + flaskWidth * (0.2 + i * 0.3);
            const by = flaskBottomY - flaskBottomRadius * (0.5 + i * 0.2);
            svg += `<ellipse cx="${bx}" cy="${by}" rx="${bubbleSize}" ry="${bubbleSize}" fill="rgba(200,230,255,0.8)"/>`;
        }
        
        // 星星符号
        const starSize = size * 0.15;
        const starPoints = [];
        for (let i = 0; i < 10; i++) {
            const angle = (i * Math.PI) / 5 - Math.PI / 2;
            const radius = (i % 2 === 0) ? starSize * 0.6 : starSize * 0.3;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY - size * 0.35 + radius * Math.sin(angle);
            starPoints.push(`${x},${y}`);
        }
        svg += `<polygon points="${starPoints.join(' ')}" fill="rgb(255,220,100)" stroke="rgb(255,200,50)" stroke-width="${Math.max(1, size/96)}"/>`;
    } else {
        // 普通图标：带背景
        const bgRadius = size * 0.48;
        svg += `<ellipse cx="${centerX}" cy="${centerY}" rx="${bgRadius}" ry="${bgRadius}" fill="rgb(30,40,60)" stroke="rgb(50,70,100)" stroke-width="${Math.max(2, size/48)}"/>`;
        
        // 烧瓶
        const flaskWidth = size * 0.35;
        const flaskHeight = size * 0.5;
        const flaskX = centerX - flaskWidth / 2;
        const flaskY = centerY - flaskHeight / 2 + size * 0.05;
        const flaskBottomRadius = flaskWidth / 2;
        const flaskBottomY = flaskY + flaskHeight - flaskBottomRadius;
        const neckWidth = flaskWidth * 0.35;
        const neckHeight = flaskHeight * 0.25;
        const mouthRadius = neckWidth * 0.4;
        
        svg += `<ellipse cx="${centerX}" cy="${flaskBottomY}" rx="${flaskBottomRadius}" ry="${flaskBottomRadius}" fill="rgb(100,150,255)" stroke="rgb(60,100,200)" stroke-width="${Math.max(2, size/48)}"/>`;
        svg += `<rect x="${centerX - neckWidth/2}" y="${flaskY}" width="${neckWidth}" height="${neckHeight}" fill="rgb(100,150,255)" stroke="rgb(60,100,200)" stroke-width="${Math.max(2, size/48)}"/>`;
        svg += `<ellipse cx="${centerX}" cy="${flaskY - mouthRadius}" rx="${mouthRadius}" ry="${mouthRadius}" fill="rgb(100,150,255)" stroke="rgb(60,100,200)" stroke-width="${Math.max(2, size/48)}"/>`;
        
        svg += `<ellipse cx="${centerX}" cy="${flaskBottomY - flaskBottomRadius * 0.3}" rx="${flaskBottomRadius * 0.25}" ry="${flaskBottomRadius * 0.25}" fill="rgba(150,200,255,0.7)"/>`;
        
        const bubbleSize = Math.max(2, size / 32);
        for (let i = 0; i < 3; i++) {
            const bx = flaskX + flaskWidth * (0.2 + i * 0.3);
            const by = flaskBottomY - flaskBottomRadius * (0.5 + i * 0.2);
            svg += `<ellipse cx="${bx}" cy="${by}" rx="${bubbleSize}" ry="${bubbleSize}" fill="rgba(200,230,255,0.8)"/>`;
        }
        
        const starSize = size * 0.12;
        const starPoints = [];
        for (let i = 0; i < 10; i++) {
            const angle = (i * Math.PI) / 5 - Math.PI / 2;
            const radius = (i % 2 === 0) ? starSize * 0.6 : starSize * 0.3;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY - size * 0.35 + radius * Math.sin(angle);
            starPoints.push(`${x},${y}`);
        }
        svg += `<polygon points="${starPoints.join(' ')}" fill="rgb(255,220,100)" stroke="rgb(255,200,50)" stroke-width="${Math.max(1, size/96)}"/>`;
    }
    
    svg += '</svg>';
    return Buffer.from(svg);
}

function createAdaptiveBackgroundSVG(size) {
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.5;
    
    // 创建渐变（使用多个同心圆模拟）
    let svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<defs><radialGradient id="bgGrad" cx="50%" cy="50%"><stop offset="0%" stop-color="rgb(50,60,80)"/><stop offset="100%" stop-color="rgb(30,40,60)"/></radialGradient></defs>`;
    svg += `<ellipse cx="${centerX}" cy="${centerY}" rx="${radius}" ry="${radius}" fill="url(#bgGrad)"/>`;
    
    // 光晕
    for (let i = 0; i < 3; i++) {
        const glowRadius = radius * (0.3 + i * 0.2);
        const alpha = (30 - i * 10) / 255;
        svg += `<ellipse cx="${centerX}" cy="${centerY}" rx="${glowRadius}" ry="${glowRadius}" fill="rgba(100,150,200,${alpha})"/>`;
    }
    
    svg += '</svg>';
    return Buffer.from(svg);
}

async function convertSVGtoPNG(svgBuffer, outputPath, size) {
    await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
}

async function createRoundIcon(inputPath, outputPath) {
    const size = await sharp(inputPath).metadata().then(m => m.width);
    
    // 创建圆形遮罩
    const mask = sharp({
        create: {
            width: size,
            height: size,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
    })
    .composite([{
        input: Buffer.from(`<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
            <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/>
        </svg>`),
        blend: 'dest-in'
    }]);
    
    await sharp(inputPath)
        .composite([{
            input: await mask.png().toBuffer(),
            blend: 'dest-in'
        }])
        .png()
        .toFile(outputPath);
}

async function main() {
    const baseDir = path.dirname(path.dirname(__filename));
    const androidResDir = path.join(baseDir, 'android', 'app', 'src', 'main', 'res');
    
    console.log('生成 Alchemist\'s Path 应用图标...\n');
    
    // 生成标准图标
    for (const [density, size] of Object.entries(ICON_SIZES)) {
        const mipmapDir = path.join(androidResDir, `mipmap-${density}`);
        if (!fs.existsSync(mipmapDir)) {
            fs.mkdirSync(mipmapDir, { recursive: true });
        }
        
        const svgBuffer = createIconSVG(size, false);
        const iconPath = path.join(mipmapDir, 'ic_launcher.png');
        await convertSVGtoPNG(svgBuffer, iconPath, size);
        console.log(`  ✓ 生成 ${density}/ic_launcher.png (${size}x${size})`);
        
        // 圆形图标
        const roundIconPath = path.join(mipmapDir, 'ic_launcher_round.png');
        await createRoundIcon(iconPath, roundIconPath);
        console.log(`  ✓ 生成 ${density}/ic_launcher_round.png (${size}x${size})`);
    }
    
    // 生成自适应图标
    const anydpiDir = path.join(androidResDir, 'mipmap-anydpi-v26');
    if (!fs.existsSync(anydpiDir)) {
        fs.mkdirSync(anydpiDir, { recursive: true });
    }
    
    const fgDir = path.join(androidResDir, 'mipmap-xxxhdpi');
    if (!fs.existsSync(fgDir)) {
        fs.mkdirSync(fgDir, { recursive: true });
    }
    
    // 前景图标
    const fgSvg = createIconSVG(ADAPTIVE_FG_SIZE, true);
    const fgIconPath = path.join(fgDir, 'ic_launcher_foreground.png');
    await convertSVGtoPNG(fgSvg, fgIconPath, ADAPTIVE_FG_SIZE);
    console.log(`  ✓ 生成 xxxhdpi/ic_launcher_foreground.png (${ADAPTIVE_FG_SIZE}x${ADAPTIVE_FG_SIZE})`);
    
    // 背景图标
    const bgSvg = createAdaptiveBackgroundSVG(ADAPTIVE_BG_SIZE);
    const bgIconPath = path.join(fgDir, 'ic_launcher_background.png');
    await convertSVGtoPNG(bgSvg, bgIconPath, ADAPTIVE_BG_SIZE);
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
    main().catch(err => {
        console.error('错误:', err);
        process.exit(1);
    });
}

module.exports = { createIconSVG, createAdaptiveBackgroundSVG };
