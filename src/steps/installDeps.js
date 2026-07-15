const { execSync } = require('child_process');
const { log, fail } = require('../utils/logger');

module.exports = async function installDeps(context) {
    try {
        log('cyan', `\n📦 [1/5] Installing core libraries and driver adapters for ${context.answers.database}...`);
        execSync(`npm install ${context.mainDeps}`, { stdio: 'inherit' });
        execSync(`npm install --save-dev ${context.devDeps}`, { stdio: 'inherit' });
    } catch (err) {
        fail('npm install failed. Check your network connection or package.json.', err);
    }
};
