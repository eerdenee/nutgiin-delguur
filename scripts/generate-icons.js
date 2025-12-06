const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const sourceIcon = path.join(publicDir, 'icon-512.png');

async function generateIcons() {
    if (!fs.existsSync(sourceIcon)) {
        console.error('Source icon not found:', sourceIcon);
        return;
    }

    // Read file to buffer first to avoid file lock issues
    const inputBuffer = await fs.promises.readFile(sourceIcon);

    console.log('Generating optimized icons from icon-512.png...');

    const sizes = [
        { name: 'favicon-16x16.png', size: 16 },
        { name: 'favicon-32x32.png', size: 32 },
        { name: 'icon-192.png', size: 192 },
        { name: 'icon-512.png', size: 512 },
        { name: 'apple-touch-icon.png', size: 180 }
    ];

    for (const icon of sizes) {
        const outputPath = path.join(publicDir, icon.name);
        await sharp(inputBuffer)
            .resize(icon.size, icon.size)
            .toFile(outputPath);
        console.log(`Generated ${icon.name} (${icon.size}x${icon.size})`);
    }
}

generateIcons().catch(console.error);
