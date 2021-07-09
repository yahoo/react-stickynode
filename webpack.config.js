const path = require('path');
const funcDir = path.join(__dirname, 'tests', 'functional', 'dist');

module.exports = {
    mode: 'development',
    entry: path.join(funcDir, 'bootstrap.js'),
    output: {
        path: funcDir,
    },
    module: {
        rules: [
            { test: /\.css$/, use: [{ loader: 'style' }, { loader: 'css' }] },
            { test: /\.json$/, loader: 'json-loader' },
        ],
    },
};
