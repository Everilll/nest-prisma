const fsHelpers = require('../utils/fsHelpers');
const { log } = require('../utils/logger');

module.exports = async function patchTsconfig(context) {
    const { tsconfigPath } = context;
    try {
        log('cyan', '🧩 [6/6] Patching tsconfig.json to support bare-path import for generated client...');

        if (await fsHelpers.exists(tsconfigPath)) {
            const raw = await fsHelpers.readFile(tsconfigPath);
            let tsconfig;
            try {
                tsconfig = JSON.parse(raw);
            } catch (parseErr) {
                log('yellow', '⚠️ [Skip] tsconfig.json could not be parsed (likely has comments) — skipping auto-patch. Add paths manually:');
                console.log(`    "baseUrl": "./",\n    "paths": {\n      "generated/prisma/client": ["generated/prisma/client.ts"],\n      "generated/prisma/*": ["generated/prisma/*"]\n    }`);
                tsconfig = null;
            }

            if (tsconfig) {
                tsconfig.compilerOptions = tsconfig.compilerOptions || {};
                tsconfig.compilerOptions.baseUrl = tsconfig.compilerOptions.baseUrl || './';
                tsconfig.compilerOptions.paths = {
                    ...(tsconfig.compilerOptions.paths || {}),
                    'generated/prisma/client': ['generated/prisma/client.ts'],
                    'generated/prisma/*': ['generated/prisma/*'],
                };

                await fsHelpers.writeFile(tsconfigPath, JSON.stringify(tsconfig, null, 2));
                log('green', '✅ [Success] tsconfig.json patched with baseUrl + paths mapping.');
                log('yellow', '⚠️ [Reminder] If "moduleResolution" is "nodenext"/"node16", "paths" only affects type-checking, not runtime.');
                log('yellow', '⚠️ Make sure "tsconfig-paths" is registered at runtime, or prefer relative imports if issues persist.');
            }
        } else {
            log('yellow', '⚠️ [Skip] tsconfig.json not found — skipping paths patch.');
        }
    } catch (err) {
        log('yellow', '⚠️ [Warning] Failed to patch tsconfig.json paths. Please add manually.');
    }

    log('yellow', '\n📌 [Note] Rust-free mode active: generated client lives at "generated/prisma".');
    log('yellow', '📌 Add "generated/" to your .gitignore, and import types via:');
    console.log(`    import { Prisma } from 'generated/prisma/client';`);
};
