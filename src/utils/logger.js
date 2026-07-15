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

module.exports = {
    COLORS,
    log,
    fail,
};
