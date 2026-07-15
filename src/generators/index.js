const rustFreeGenerator = require('./rust-free.generator');
const legacyGenerator = require('./legacy.generator');
const { fail } = require('../utils/logger');

function getGenerator(type) {
    if (type === 'rust-free') {
        return rustFreeGenerator;
    } else if (type === 'legacy') {
        return legacyGenerator;
    } else {
        fail(`Unknown generator type: ${type}`);
    }
}

module.exports = { getGenerator };
