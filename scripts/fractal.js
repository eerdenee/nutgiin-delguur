const fs = require('fs');
const path = require('path');
const readline = require('readline');

console.log(`
╔══════════════════════════════════════════╗
║          🌀 THE FRACTAL SEED 🌀          ║
║      Self-Replicating Project Engine     ║
╚══════════════════════════════════════════╝
`);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const rootDir = path.join(__dirname, '..');

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function replicate() {
    console.log('🌱 Initiating replication process...');

    // 1. Get New Identity
    const newName = await question('What is the name of the Child Project? (e.g., my-awesome-shop): ');

    if (!newName) {
        console.log('⛔ Replication aborted.');
        rl.close();
        return;
    }

    console.log(`\n🧬 Cloning DNA into new identity: ${newName}...`);

    // 2. Modify package.json (DNA Mutation)
    const packageJsonPath = path.join(rootDir, 'package.json');
    const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Create a deep clone to avoid mutating current
    const newPackage = { ...packageData };
    newPackage.name = newName;
    newPackage.version = "0.1.0"; // Reset age
    newPackage.description = "Born from Nutgiin Delguur Recursion";
    delete newPackage.scripts.ouroboros; // Remove the cycle script for fresh start? No, keep it.

    console.log('✅ DNA (package.json) prepared.');

    // 3. Instruction
    console.log(`
📋 TO COMPLETE REPLICATION:

1. Copy this entire folder to \`../${newName}\`
2. Update \`package.json\` with the new DNA.
3. Delete \`SUPABASE_URL\` and secrets (Tabula Rasa).
4. Run \`npm install\`.

This script is non-destructive to the Parent.
Use 'cp -r' to spawn the child.
`);

    rl.close();
}

replicate();
