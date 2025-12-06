const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log(`
╔══════════════════════════════════════════╗
║           🐍 THE OUROBOROS 🐍            ║
║    The Cycle of Death and Rebirth Begins  ║
╚══════════════════════════════════════════╝
`);

const steps = [
    { name: 'Self-Reflection (Lint)', command: 'npm', args: ['run', 'lint'] },
    { name: 'The Trial (Test)', command: 'npm', args: ['test'] },
    { name: 'Rebirth (Build)', command: 'npm', args: ['run', 'build'] }
];

async function runStep(step) {
    return new Promise((resolve, reject) => {
        console.log(`\n⏳ Validating: ${step.name}...`);
        const startTime = Date.now();

        // Use shell: true for Windows compatibility
        const proc = spawn(step.command, step.args, { stdio: 'inherit', shell: true });

        proc.on('close', (code) => {
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            if (code === 0) {
                console.log(`✅ ${step.name} PASSED in ${duration}s`);
                resolve();
            } else {
                console.error(`❌ ${step.name} FAILED (Exit Code: ${code})`);
                reject(new Error(`${step.name} failed`));
            }
        });
    });
}

async function startCycle() {
    try {
        for (const step of steps) {
            await runStep(step);
        }

        console.log(`
╔══════════════════════════════════════════╗
║       ✨ CYCLE COMPLETE & PERFECT ✨      ║
║         System is ready for Eternity     ║
╚══════════════════════════════════════════╝
`);
    } catch (error) {
        console.error('\n💀 THE CYCLE BROKEN. FIX THE SYSTEM.');
        process.exit(1);
    }
}

startCycle();
