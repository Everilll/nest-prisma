#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const COLORS = {
    red: '\x1b[31m%s\x1b[0m',
    green: '\x1b[32m%s\x1b[0m',
    yellow: '\x1b[33m%s\x1b[0m',
    cyan: '\x1b[36m%s\x1b[0m',
    magenta: '\x1b[35m%s\x1b[0m',
};

function log(color, msg) {
    console.log(COLORS[color] || '%s', msg);
}

function fail(msg, err) {
    log('red', `❌ ${msg}`);
    if (err) console.error(err);
    process.exit(1);
}

async function generatePrismaInteractive() {
    const sourceDir = path.join(__dirname, 'templates', 'prisma');
    const targetDir = path.join(process.cwd(), 'src', 'prisma');
    const appModulePath = path.join(process.cwd(), 'src', 'app.module.ts');

    if (!fs.existsSync(path.join(process.cwd(), 'src'))) {
        fail('Error: "src" folder not found! Please run this command inside the root of your NestJS project.');
    }

    // Validation template (fail fast)
    const requiredTemplates = ['prisma.service.ts', 'prisma.module.ts'];
    for (const file of requiredTemplates) {
        if (!fs.existsSync(path.join(sourceDir, file))) {
            fail(`Missing template file: ${file}. Reinstall the package or check your installation.`);
        }
    }

    log('magenta', 'Welcome to @averildwi/nest-prisma Scaffolder\n');

    const { default: inquirer } = await import('inquirer');

    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'version',
            message: 'Select the Prisma ORM version to install:',
            choices: [
                { name: '✅ Stable (7.8.0) - Production Ready with Driver Adapter', value: '7.8.0' },
            ],
        },
        {
            type: 'list',
            name: 'generatorType',
            message: 'Select the Prisma Client generator:',
            choices: [
                { name: '⚡ prisma-client (Rust-free, TS+WASM engine, recommended)', value: 'rust-free' },
                { name: '📦 prisma-client-js (Legacy, node_modules output)', value: 'legacy' },
            ],
        },
        {
            type: 'list',
            name: 'database',
            message: 'Choose your database provider:',
            choices: [
                { name: '🐘 PostgreSQL', value: 'postgres' },
                { name: '🐬 MySQL / Percona / MariaDB', value: 'mysql' },
            ],
        },
        {
            type: 'confirm',
            name: 'runGenerate',
            message: 'Do you want to automatically trigger "npx prisma generate" after setup?',
            default: true,
        },
    ]);

    const prismaVersion = answers.version;
    const dbChoice = answers.database;
    const isRustFree = answers.generatorType === 'rust-free';

    // src/prisma/prisma.service.ts -> ../../generated/prisma/client
    const generatedClientImportPath = '../../generated/prisma/client';

    let mainDeps = `@prisma/client@${prismaVersion}`;
    let devDeps = `prisma@${prismaVersion}`;
    let adapterImports = {};

    if (dbChoice === 'postgres') {
        mainDeps += ' @prisma/adapter-pg pg';
        devDeps += ' @types/pg';
        adapterImports = {
            import: '@prisma/adapter-pg',
            class: 'PrismaPg',
            poolImport: 'pg',
            poolClass: 'Pool',
        };
    } else {
        mainDeps += ' @prisma/adapter-mysql2 mysql2';
        devDeps += ' @types/mysql2';
        adapterImports = {
            import: '@prisma/adapter-mysql2',
            class: 'PrismaMysql',
            poolImport: 'mysql2/promise',
            poolClass: 'createPool',
        };
    }

    // ── [1/5] Install dependencies ─────────────────────────────
    try {
        log('cyan', `\n📦 [1/5] Installing core libraries and driver adapters for ${dbChoice}...`);
        execSync(`npm install ${mainDeps}`, { stdio: 'inherit' });
        execSync(`npm install --save-dev ${devDeps}`, { stdio: 'inherit' });
    } catch (err) {
        fail('npm install failed. Check your network connection or package.json.', err);
    }

    // ── [2/5] Prisma init + schema patch ───────────────────────
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    try {
        log('cyan', '⚙️ [2/5] Running native Prisma initialization...');

        if (!fs.existsSync(path.join(process.cwd(), 'prisma'))) {
            const providerFlag = dbChoice === 'postgres' ? 'postgresql' : 'mysql';
            execSync(`npx prisma init --datasource-provider ${providerFlag}`, { stdio: 'inherit' });

            if (fs.existsSync(schemaPath)) {
                let schemaContent = await fs.readFile(schemaPath, 'utf8');
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
                    await fs.writeFile(schemaPath, schemaContent, 'utf8');
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

    // ── [3/5] Inject PrismaModule + PrismaService ──────────────
    try {
        log('cyan', '📂 [3/5] Injecting customized PrismaModule and PrismaService into src/prisma...');
        await fs.ensureDir(targetDir);

        const serviceTargetPath = path.join(targetDir, 'prisma.service.ts');
        const moduleTargetPath = path.join(targetDir, 'prisma.module.ts');

        if (fs.existsSync(serviceTargetPath) || fs.existsSync(moduleTargetPath)) {
            log('yellow', '⚠️ [Skip] src/prisma already contains prisma.service.ts or prisma.module.ts — not overwriting existing files.');
        } else {
            let serviceContent = await fs.readFile(path.join(sourceDir, 'prisma.service.ts'), 'utf8');
            serviceContent = serviceContent
                .replaceAll('__ADAPTER_IMPORT__', adapterImports.import)
                .replaceAll('__ADAPTER_CLASS__', adapterImports.class)
                .replaceAll('__POOL_IMPORT__', adapterImports.poolImport)
                .replaceAll('__POOL_CLASS__', adapterImports.poolClass)
                // __CLIENT_IMPORT_PATH__ -> '@prisma/client' (legacy) atau relative path (rust-free)
                .replaceAll('__CLIENT_IMPORT_PATH__', isRustFree ? generatedClientImportPath : '@prisma/client');

            await fs.writeFile(serviceTargetPath, serviceContent, 'utf8');
            await fs.copy(path.join(sourceDir, 'prisma.module.ts'), moduleTargetPath);
            log('green', '✅ [Success] PrismaModule and PrismaService created in src/prisma.');
        }
    } catch (err) {
        fail('Failed to inject PrismaModule/PrismaService files.', err);
    }

    // ── [4/5] Register PrismaModule into AppModule ─────────────
    try {
        if (fs.existsSync(appModulePath)) {
            log('cyan', '✍️ [4/5] Auto-registering PrismaModule into src/app.module.ts...');
            let appModuleContent = await fs.readFile(appModulePath, 'utf8');

            if (appModuleContent.includes('PrismaModule')) {
                log('yellow', '⚠️ [Skip] PrismaModule already referenced in app.module.ts — skipping auto-registration.');
            } else {
                const importsRegex = /(imports\s*:\s*\[)/;
                if (importsRegex.test(appModuleContent)) {
                    appModuleContent =
                        `import { PrismaModule } from './prisma/prisma.module';\n` + appModuleContent;
                    appModuleContent = appModuleContent.replace(importsRegex, `$1\n    PrismaModule,`);
                    await fs.writeFile(appModulePath, appModuleContent, 'utf8');
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

    // ── [5/5] Optional prisma generate ─────────────────────────
    if (answers.runGenerate) {
        log('cyan', '🔄 [5/5] Executing initial Prisma Client generation...');
        try {
            execSync('npx prisma generate', { stdio: 'inherit' });
        } catch (err) {
            log('yellow', '⚠️ "prisma generate" post-hook delayed. Please configure your .env DATABASE_URL string first, then run "npx prisma generate" manually.');
        }
    }

    // ── [6/6] Patch tsconfig.json paths (rust-free only) ───────
    if (isRustFree) {
        const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
        try {
            log('cyan', '🧩 [6/6] Patching tsconfig.json to support bare-path import for generated client...');

            if (fs.existsSync(tsconfigPath)) {
                const raw = await fs.readFile(tsconfigPath, 'utf8');
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

                    await fs.writeFile(tsconfigPath, JSON.stringify(tsconfig, null, 2), 'utf8');
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
    }

    log('green', `\n🎉 [Success] Nest-Prisma scaffolding for ${dbChoice.toUpperCase()} completed successfully!`);
    log('cyan', '📖 Full documentation: https://github.com/Everilll/nest-prisma\n');
}

generatePrismaInteractive().catch((err) => {
    fail('Unexpected error during scaffolding.', err);
});