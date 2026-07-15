const { execSync } = require('child_process');
const path = require('path');
const fsHelpers = require('../utils/fsHelpers');
const { log, fail } = require('../utils/logger');

module.exports = async function initSchema(context) {
    const { schemaPath, isRustFree, answers } = context;
    const dbChoice = answers.database;
    const prismaDir = path.dirname(schemaPath);

    try {
        log('cyan', '⚙️ [2/5] Running native Prisma initialization...');

        if (!(await fsHelpers.exists(prismaDir))) {
            const providerFlag = dbChoice === 'postgres' ? 'postgresql' : 'mysql';
            execSync(`npx prisma init --datasource-provider ${providerFlag}`, { stdio: 'inherit' });

            if (await fsHelpers.exists(schemaPath)) {
                let schemaContent = await fsHelpers.readFile(schemaPath);
                const original = schemaContent;

                if (isRustFree) {
                    schemaContent = schemaContent.replace(
                        /generator\s+client\s*\{[^}]*\}/,
                        `generator client {\n  provider     = "prisma-client"\n  output       = "../generated/prisma"\n  moduleFormat = "cjs"\n}`,
                    );

                    schemaContent = schemaContent.replace(
                        /url\s*=\s*env\("DATABASE_URL"\)/g,
                        '// URL connection is managed natively via Driver Adapter in prisma.service.ts',
                    );
                } else {
                    schemaContent = schemaContent.replace(
                        /provider\s*=\s*"prisma-client"/,
                        'provider = "prisma-client-js"',
                    );

                    schemaContent = schemaContent.replace(
                        /output\s*=\s*".*?"/g,
                        '// Output is set to default node_modules location for NestJS global access',
                    );

                    schemaContent = schemaContent.replace(
                        /url\s*=\s*env\("DATABASE_URL"\)/g,
                        '// URL connection is managed natively via Driver Adapter in prisma.service.ts',
                    );
                }

                if (schemaContent === original) {
                    log('yellow', '⚠️ [Warning] schema.prisma pattern not found — file left unmodified. Please review it manually.');
                } else {
                    await fsHelpers.writeFile(schemaPath, schemaContent);
                    log('green', `✅ [Success] schema.prisma automatically optimized for ${isRustFree ? 'Prisma 7 rust-free' : 'Prisma 7 legacy'} architecture!`);
                }
            } else {
                log('yellow', '⚠️ [Warning] schema.prisma not found after "prisma init" — skipping schema patch.');
            }
        } else {
            log('yellow', '⚠️ [Skip] "prisma" folder already exists — skipping "prisma init" to avoid overwriting your schema.');
        }
    } catch (err) {
        fail('Prisma initialization failed.', err);
    }
};
