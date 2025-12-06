const { locations } = require('./src/lib/data');

console.log(`Total Aimags: ${locations.length}`);
const totalSoums = locations.reduce((acc, aimag) => acc + aimag.soums.length, 0);
console.log(`Total Soums: ${totalSoums}`);
