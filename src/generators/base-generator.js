const { log, fail } = require('../utils/logger');
const path = require('path');
const fs = require('fs');

class BaseGenerator {
    constructor(name) {
        this.name = name;
        this.steps = [];
    }

    addStep(stepFn) {
        this.steps.push(stepFn);
    }

    async run(answers) {
        // 1. Initial check (fail fast if "src" folder not found)
        if (!fs.existsSync(path.join(process.cwd(), 'src'))) {
            fail('Error: "src" folder not found! Please run this command inside the root of your NestJS project.');
        }

        // 2. Prepare Context
        const context = this.prepareContext(answers);

        // 3. Validation templates (fail fast)
        const requiredTemplates = [
            path.join(context.sourceDir, 'shared', 'prisma.module.ts'),
            path.join(context.sourceDir, context.isRustFree ? 'rust-free' : 'legacy', 'prisma.service.ts'),
        ];
        for (const filePath of requiredTemplates) {
            if (!fs.existsSync(filePath)) {
                fail(`Missing template file: ${path.basename(filePath)}. Reinstall the package or check your installation.`);
            }
        }

        // 4. Execute Steps
        for (const step of this.steps) {
            await step(context);
        }

        // 5. Final Success Message
        log('green', `\n🎉 [Success] Nest-Prisma scaffolding for ${answers.database.toUpperCase()} completed successfully!`);
        log('cyan', '📖 Full documentation: https://github.com/Everilll/nest-prisma\n');
    }

    prepareContext(answers) {
        const prismaVersion = answers.version;
        const dbChoice = answers.database;
        const isRustFree = answers.generatorType === 'rust-free';
        
        const projectRoot = process.cwd();
        const sourceDir = path.join(__dirname, '..', '..', 'templates', 'prisma');
        const targetDir = path.join(projectRoot, 'src', 'prisma');
        const appModulePath = path.join(projectRoot, 'src', 'app.module.ts');
        const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma');
        const tsconfigPath = path.join(projectRoot, 'tsconfig.json');

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

        return {
            answers,
            projectRoot,
            sourceDir,
            targetDir,
            appModulePath,
            schemaPath,
            tsconfigPath,
            mainDeps,
            devDeps,
            adapterImports,
            isRustFree,
        };
    }
}

module.exports = BaseGenerator;
