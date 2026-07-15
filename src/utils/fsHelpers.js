const fs = require('fs-extra');

async function exists(filePath) {
    return fs.pathExists(filePath);
}

async function readFile(filePath) {
    return fs.readFile(filePath, 'utf8');
}

async function writeFile(filePath, content) {
    return fs.writeFile(filePath, content, 'utf8');
}

async function ensureDir(dirPath) {
    return fs.ensureDir(dirPath);
}

async function copy(src, dest) {
    return fs.copy(src, dest);
}

module.exports = {
    exists,
    readFile,
    writeFile,
    ensureDir,
    copy,
};
