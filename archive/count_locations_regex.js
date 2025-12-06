const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'src/lib/data.ts');
const content = fs.readFileSync(dataPath, 'utf8');

// Extract locations block
const locationsMatch = content.match(/export const locations = \[([\s\S]*?)\];/);
if (!locationsMatch) {
    console.log("Could not find locations block");
    process.exit(1);
}

const locationsBlock = locationsMatch[1];

// Count Aimags (objects with 'soums' property)
const aimagCount = (locationsBlock.match(/soums:/g) || []).length;

// Count Total IDs in the block
// Each aimag has an id, each soum has an id.
const idCount = (locationsBlock.match(/id:/g) || []).length;

const soumCount = idCount - aimagCount;

console.log(`Aimags: ${aimagCount}`);
console.log(`Soums: ${soumCount}`);
