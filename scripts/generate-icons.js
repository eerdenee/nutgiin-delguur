const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [192, 512];
const sourceIcon = path.join(__dirname, '../public/icon-512.png');
const outputDir = path.join(__dirname, '../public');

async function generateIcons() {
    console.log('Generating PWA icons...');

    for (const size of sizes) {
        const outputPath = path.join(outputDir, `icon-${size}.png`);

        await sharp(sourceIcon)
            .resize(size, size)
            .png()
            .toFile(outputPath);

        console.log(`✓ Generated icon-${size}.png`);
    }

    // Also create apple-touch-icon
    await sharp(sourceIcon)
        .resize(180, 180)
        .png()
        .toFile(path.join(outputDir, 'apple-touch-icon.png'));
    console.log('✓ Generated apple-touch-icon.png');

    console.log('Done!');
}

generateIcons().catch(console.error);
