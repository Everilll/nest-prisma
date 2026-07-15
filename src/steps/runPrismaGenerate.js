const { execSync } = require('child_process');
const { log } = require('../utils/logger');

module.exports = async function runPrismaGenerate(context) {
    if (context.answers.runGenerate) {
        log('cyan', '🔄 [5/5] Executing initial Prisma Client generation...');
        try {
            execSync('npx prisma generate', { stdio: 'inherit' });
        } catch (err) {
            log('yellow', '⚠️ "prisma generate" post-hook delayed. Please configure your .env DATABASE_URL string first, then run "npx prisma generate" manually.');
        }
    }
};
