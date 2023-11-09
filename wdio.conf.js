const config = {
    bail: 0,
    connectionRetryCount: 3,
    connectionRetryTimeout: 30000,
    framework: 'mocha',
    logLevel: 'error',
    maxInstances: 10,
    mochaOpts: {
        ui: 'bdd',
        timeout: 30000,
    },
    reporters: ['spec'],
    specs: ['./tests/functional/*.spec.js'],
    waitforTimeout: 10000,
};

if (process.env.CI) {
    // Saucelabs configuration
    (config.capabilities = [
        {
            acceptInsecureCerts: true,
            browserName: 'chrome',
            browserVersion: 'latest',
            maxInstances: 5,
            platformName: 'Windows 10',
        },
    ]),
        (config.key = process.env.SAUCE_ACCESS_KEY);
    config.services = [
        [
            'sauce',
            {
                sauceConnect: true,
            },
        ],
    ];
    config.user = process.env.SAUCE_USERNAME;
} else {
    // Local webdriver runner
    config.baseUrl = 'http://localhost:5000';
    config.capabilities = [
        {
            maxInstances: 5,
            browserName: 'chrome',
            acceptInsecureCerts: true,
        },
    ];
    config.headless = true;
    config.runner = 'local';
    config.services = [
        ['chromedriver'],
        [
            'static-server',
            {
                folders: [{ mount: '/', path: './tests/functional/dist' }],
                port: 5000,
            },
        ],
    ];
}

exports.config = config;
