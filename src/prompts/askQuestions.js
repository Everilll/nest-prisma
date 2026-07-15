const { log } = require('../utils/logger');

async function askQuestions() {
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

    return answers;
}

module.exports = { askQuestions };
