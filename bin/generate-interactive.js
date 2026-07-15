#!/usr/bin/env node

const { askQuestions } = require('../src/prompts/askQuestions');
const { getGenerator } = require('../src/generators');
const { fail } = require('../src/utils/logger');

async function main() {
    try {
        const answers = await askQuestions();
        const generator = getGenerator(answers.generatorType);
        await generator.run(answers);
    } catch (err) {
        fail('Unexpected error during scaffolding.', err);
    }
}

main();
