const BaseGenerator = require('./base-generator');
const installDeps = require('../steps/installDeps');
const initSchema = require('../steps/initSchema');
const injectPrismaModule = require('../steps/injectPrismaModule');
const registerAppModule = require('../steps/registerAppModule');
const runPrismaGenerate = require('../steps/runPrismaGenerate');

class LegacyGenerator extends BaseGenerator {
    constructor() {
        super('legacy');
        this.addStep(installDeps);
        this.addStep(initSchema);
        this.addStep(injectPrismaModule);
        this.addStep(registerAppModule);
        this.addStep(runPrismaGenerate);
    }
}

module.exports = new LegacyGenerator();
