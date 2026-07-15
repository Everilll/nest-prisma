const BaseGenerator = require('./base-generator');
const installDeps = require('../steps/installDeps');
const initSchema = require('../steps/initSchema');
const injectPrismaModule = require('../steps/injectPrismaModule');
const registerAppModule = require('../steps/registerAppModule');
const runPrismaGenerate = require('../steps/runPrismaGenerate');
const patchTsconfig = require('../steps/patchTsconfig');

class RustFreeGenerator extends BaseGenerator {
    constructor() {
        super('rust-free');
        this.addStep(installDeps);
        this.addStep(initSchema);
        this.addStep(injectPrismaModule);
        this.addStep(registerAppModule);
        this.addStep(runPrismaGenerate);
        this.addStep(patchTsconfig);
    }
}

module.exports = new RustFreeGenerator();
