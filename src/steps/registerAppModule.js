const fsHelpers = require('../utils/fsHelpers');
const { log, fail } = require('../utils/logger');

module.exports = async function registerAppModule(context) {
    const { appModulePath } = context;
    try {
        if (await fsHelpers.exists(appModulePath)) {
            log('cyan', '✍️ [4/5] Auto-registering PrismaModule into src/app.module.ts...');
            let appModuleContent = await fsHelpers.readFile(appModulePath);

            if (appModuleContent.includes('PrismaModule')) {
                log('yellow', '⚠️ [Skip] PrismaModule already referenced in app.module.ts — skipping auto-registration.');
            } else {
                const importsRegex = /(imports\s*:\s*\[)/;
                if (importsRegex.test(appModuleContent)) {
                    appModuleContent =
                        `import { PrismaModule } from './prisma/prisma.module';\n` + appModuleContent;
                    appModuleContent = appModuleContent.replace(importsRegex, `$1\n    PrismaModule,`);
                    await fsHelpers.writeFile(appModulePath, appModuleContent);
                    log('green', '✅ [Success] PrismaModule injected successfully into AppModule!');
                } else {
                    log('yellow', '⚠️ [Warning] Could not find an "imports: [" array in app.module.ts. Please add PrismaModule manually:');
                    console.log('    import { PrismaModule } from \'./prisma/prisma.module\';\n    // ...and add PrismaModule to the imports array.');
                }
            }
        } else {
            log('yellow', '⚠️ [Skip] src/app.module.ts not found — skipping auto-registration. Please import PrismaModule manually.');
        }
    } catch (err) {
        fail('Failed to update app.module.ts.', err);
    }
};
