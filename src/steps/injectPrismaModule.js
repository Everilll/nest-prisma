const path = require('path');
const fsHelpers = require('../utils/fsHelpers');
const { log, fail } = require('../utils/logger');

module.exports = async function injectPrismaModule(context) {
    const { targetDir, sourceDir, isRustFree, adapterImports } = context;
    try {
        log('cyan', '📂 [3/5] Injecting customized PrismaModule and PrismaService into src/prisma...');
        await fsHelpers.ensureDir(targetDir);

        const serviceTargetPath = path.join(targetDir, 'prisma.service.ts');
        const moduleTargetPath = path.join(targetDir, 'prisma.module.ts');

        if ((await fsHelpers.exists(serviceTargetPath)) || (await fsHelpers.exists(moduleTargetPath))) {
            log('yellow', '⚠️ [Skip] src/prisma already contains prisma.service.ts or prisma.module.ts — not overwriting existing files.');
        } else {
            const templateSubdir = isRustFree ? 'rust-free' : 'legacy';
            let serviceContent = await fsHelpers.readFile(path.join(sourceDir, templateSubdir, 'prisma.service.ts'));
            serviceContent = serviceContent
                .replaceAll('__ADAPTER_IMPORT__', adapterImports.import)
                .replaceAll('__ADAPTER_CLASS__', adapterImports.class)
                .replaceAll('__POOL_IMPORT__', adapterImports.poolImport)
                .replaceAll('__POOL_CLASS__', adapterImports.poolClass);

            await fsHelpers.writeFile(serviceTargetPath, serviceContent);
            await fsHelpers.copy(path.join(sourceDir, 'shared', 'prisma.module.ts'), moduleTargetPath);
            log('green', '✅ [Success] PrismaModule and PrismaService created in src/prisma.');
        }
    } catch (err) {
        fail('Failed to inject PrismaModule/PrismaService files.', err);
    }
};
