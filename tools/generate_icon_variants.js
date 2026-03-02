/**
 * 生成多个不同颜色的图标变体用于动态图标功能
 * 每个图标使用不同的颜色主题
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

// 不同图标的颜色主题
const ICON_THEMES = {
    'default': {
        flaskColor: 'rgb(100,150,255)',
        flaskStroke: 'rgb(60,100,200)',
        bgColor: 'rgb(30,40,60)',
        bgStroke: 'rgb(50,70,100)',
        starColor: 'rgb(255,220,100)',
        starStroke: 'rgb(255,200,50)',
        bgGradStart: 'rgb(50,60,80)',
        bgGradEnd: 'rgb(30,40,60)',
        glowColor: 'rgba(100,150,200,'
    },
    'icon1': {
        flaskColor: 'rgb(150,100,255)',
        flaskStroke: 'rgb(120,60,200)',
        bgColor: 'rgb(40,30,60)',
        bgStroke: 'rgb(70,50,100)',
        starColor: 'rgb(255,150,100)',
        starStroke: 'rgb(255,120,50)',
        bgGradStart: 'rgb(60,50,80)',
        bgGradEnd: 'rgb(40,30,60)',
        glowColor: 'rgba(150,100,200,'
    },
    'icon2': {
        flaskColor: 'rgb(100,255,150)',
        flaskStroke: 'rgb(60,200,120)',
        bgColor: 'rgb(30,60,40)',
        bgStroke: 'rgb(50,100,70)',
        starColor: 'rgb(255,220,100)',
        starStroke: 'rgb(255,200,50)',
        bgGradStart: 'rgb(50,80,60)',
        bgGradEnd: 'rgb(30,60,40)',
        glowColor: 'rgba(100,200,150,'
    },
    'icon3': {
        flaskColor: 'rgb(255,150,100)',
        flaskStroke: 'rgb(200,120,60)',
        bgColor: 'rgb(60,40,30)',
        bgStroke: 'rgb(100,70,50)',
        starColor: 'rgb(255,255,150)',
        starStroke: 'rgb(255,255,100)',
        bgGradStart: 'rgb(80,60,50)',
        bgGradEnd: 'rgb(60,40,30)',
        glowColor: 'rgba(200,150,100,'
    }
};

function createIconSVG(size, theme, isForeground = false) {
    const centerX = size / 2;
    const centerY = size / 2;
    const colors = ICON_THEMES[theme] || ICON_THEMES.default;
    
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
        svg += `<ellipse cx="${centerX}" cy="${flaskBottomY}" rx="${flaskBottomRadius}" ry="${flaskBottomRadius}" fill="${colors.flaskColor}" stroke="${colors.flaskStroke}" stroke-width="${Math.max(2, size/48)}"/>`;
        
        // 瓶颈
        svg += `<rect x="${centerX - neckWidth/2}" y="${flaskY}" width="${neckWidth}" height="${neckHeight}" fill="${colors.flaskColor}" stroke="${colors.flaskStroke}" stroke-width="${Math.max(2, size/48)}"/>`;
        
        // 瓶口
        svg += `<ellipse cx="${centerX}" cy="${flaskY - mouthRadius}" rx="${mouthRadius}" ry="${mouthRadius}" fill="${colors.flaskColor}" stroke="${colors.flaskStroke}" stroke-width="${Math.max(2, size/48)}"/>`;
        
        // 高光
        svg += `<ellipse cx="${centerX}" cy="${flaskBottomY - flaskBottomRadius * 0.3}" rx="${flaskBottomRadius * 0.25}" ry="${flaskBottomRadius * 0.25}" fill="rgba(255,255,255,0.3)"/>`;
        
        // 气泡
        const bubbleSize = Math.max(2, size / 32);
        for (let i = 0; i < 3; i++) {
            const bx = flaskX + flaskWidth * (0.2 + i * 0.3);
            const by = flaskBottomY - flaskBottomRadius * (0.5 + i * 0.2);
            svg += `<ellipse cx="${bx}" cy="${by}" rx="${bubbleSize}" ry="${bubbleSize}" fill="rgba(255,255,255,0.6)"/>`;
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
        svg += `<polygon points="${starPoints.join(' ')}" fill="${colors.starColor}" stroke="${colors.starStroke}" stroke-width="${Math.max(1, size/96)}"/>`;
    } else {
        // 普通图标：带背景
        const bgRadius = size * 0.48;
        svg += `<ellipse cx="${centerX}" cy="${centerY}" rx="${bgRadius}" ry="${bgRadius}" fill="${colors.bgColor}" stroke="${colors.bgStroke}" stroke-width="${Math.max(2, size/48)}"/>`;
        
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
        
        svg += `<ellipse cx="${centerX}" cy="${flaskBottomY}" rx="${flaskBottomRadius}" ry="${flaskBottomRadius}" fill="${colors.flaskColor}" stroke="${colors.flaskStroke}" stroke-width="${Math.max(2, size/48)}"/>`;
        svg += `<rect x="${centerX - neckWidth/2}" y="${flaskY}" width="${neckWidth}" height="${neckHeight}" fill="${colors.flaskColor}" stroke="${colors.flaskStroke}" stroke-width="${Math.max(2, size/48)}"/>`;
        svg += `<ellipse cx="${centerX}" cy="${flaskY - mouthRadius}" rx="${mouthRadius}" ry="${mouthRadius}" fill="${colors.flaskColor}" stroke="${colors.flaskStroke}" stroke-width="${Math.max(2, size/48)}"/>`;
        
        svg += `<ellipse cx="${centerX}" cy="${flaskBottomY - flaskBottomRadius * 0.3}" rx="${flaskBottomRadius * 0.25}" ry="${flaskBottomRadius * 0.25}" fill="rgba(255,255,255,0.3)"/>`;
        
        const bubbleSize = Math.max(2, size / 32);
        for (let i = 0; i < 3; i++) {
            const bx = flaskX + flaskWidth * (0.2 + i * 0.3);
            const by = flaskBottomY - flaskBottomRadius * (0.5 + i * 0.2);
            svg += `<ellipse cx="${bx}" cy="${by}" rx="${bubbleSize}" ry="${bubbleSize}" fill="rgba(255,255,255,0.6)"/>`;
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
        svg += `<polygon points="${starPoints.join(' ')}" fill="${colors.starColor}" stroke="${colors.starStroke}" stroke-width="${Math.max(1, size/96)}"/>`;
    }
    
    svg += '</svg>';
    return Buffer.from(svg);
}

function createAdaptiveBackgroundSVG(size, theme) {
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.5;
    const colors = ICON_THEMES[theme] || ICON_THEMES.default;
    
    // 创建渐变（使用多个同心圆模拟）
    let svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<defs><radialGradient id="bgGrad${theme}" cx="50%" cy="50%"><stop offset="0%" stop-color="${colors.bgGradStart}"/><stop offset="100%" stop-color="${colors.bgGradEnd}"/></radialGradient></defs>`;
    svg += `<ellipse cx="${centerX}" cy="${centerY}" rx="${radius}" ry="${radius}" fill="url(#bgGrad${theme})"/>`;
    
    // 光晕
    for (let i = 0; i < 3; i++) {
        const glowRadius = radius * (0.3 + i * 0.2);
        const alpha = (30 - i * 10) / 255;
        svg += `<ellipse cx="${centerX}" cy="${centerY}" rx="${glowRadius}" ry="${glowRadius}" fill="${colors.glowColor}${alpha})"/>`;
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

async function generateIconVariant(theme) {
    const baseDir = path.dirname(path.dirname(__filename));
    const androidResDir = path.join(baseDir, 'android', 'app', 'src', 'main', 'res');
    
    console.log(`\n生成 ${theme} 图标变体...`);
    
    // 生成标准图标
    for (const [density, size] of Object.entries(ICON_SIZES)) {
        const mipmapDir = path.join(androidResDir, `mipmap-${density}`);
        if (!fs.existsSync(mipmapDir)) {
            fs.mkdirSync(mipmapDir, { recursive: true });
        }
        
        const svgBuffer = createIconSVG(size, theme, false);
        const iconName = theme === 'default' ? 'ic_launcher' : `ic_launcher_${theme}`;
        const iconPath = path.join(mipmapDir, `${iconName}.png`);
        await convertSVGtoPNG(svgBuffer, iconPath, size);
        console.log(`  ✓ 生成 ${density}/${iconName}.png (${size}x${size})`);
        
        // 圆形图标
        const roundIconName = theme === 'default' ? 'ic_launcher_round' : `ic_launcher_${theme}_round`;
        const roundIconPath = path.join(mipmapDir, `${roundIconName}.png`);
        await createRoundIcon(iconPath, roundIconPath);
        console.log(`  ✓ 生成 ${density}/${roundIconName}.png (${size}x${size})`);
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
    const fgSvg = createIconSVG(ADAPTIVE_FG_SIZE, theme, true);
    const fgIconName = theme === 'default' ? 'ic_launcher_foreground' : `ic_launcher_${theme}_foreground`;
    const fgIconPath = path.join(fgDir, `${fgIconName}.png`);
    await convertSVGtoPNG(fgSvg, fgIconPath, ADAPTIVE_FG_SIZE);
    console.log(`  ✓ 生成 xxxhdpi/${fgIconName}.png (${ADAPTIVE_FG_SIZE}x${ADAPTIVE_FG_SIZE})`);
    
    // 背景图标
    const bgSvg = createAdaptiveBackgroundSVG(ADAPTIVE_BG_SIZE, theme);
    const bgIconName = theme === 'default' ? 'ic_launcher_background' : `ic_launcher_${theme}_background`;
    const bgIconPath = path.join(fgDir, `${bgIconName}.png`);
    await convertSVGtoPNG(bgSvg, bgIconPath, ADAPTIVE_BG_SIZE);
    console.log(`  ✓ 生成 xxxhdpi/${bgIconName}.png (${ADAPTIVE_BG_SIZE}x${ADAPTIVE_BG_SIZE})`);
    
    // 更新 XML 文件（仅对非默认图标）
    if (theme !== 'default') {
        const iconXmlName = `ic_launcher_${theme}.xml`;
        const iconXmlPath = path.join(anydpiDir, iconXmlName);
        fs.writeFileSync(iconXmlPath, `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_${theme}_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_${theme}_foreground"/>
</adaptive-icon>
`, 'utf-8');
        console.log(`  ✓ 更新 ${iconXmlName}`);
        
        const roundIconXmlName = `ic_launcher_${theme}_round.xml`;
        const roundIconXmlPath = path.join(anydpiDir, roundIconXmlName);
        fs.writeFileSync(roundIconXmlPath, `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_${theme}_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_${theme}_foreground"/>
</adaptive-icon>
`, 'utf-8');
        console.log(`  ✓ 更新 ${roundIconXmlName}`);
    }
}

async function main() {
    console.log('生成动态图标变体...\n');
    
    // 生成所有图标变体
    for (const theme of Object.keys(ICON_THEMES)) {
        await generateIconVariant(theme);
    }
    
    console.log('\n✅ 所有图标变体生成完成！');
    console.log('\n提示：现在需要更新 AndroidManifest.xml 让每个 activity-alias 使用对应的图标资源。');
}

if (require.main === module) {
    main().catch(err => {
        console.error('错误:', err);
        process.exit(1);
    });
}

module.exports = { generateIconVariant, ICON_THEMES };
