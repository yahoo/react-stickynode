// jscs:disable maximumLineLength

'use strict';

var fs = require('fs');
var path = require('path');

module.exports = function (grunt) {
    // autoload installed tasks
    [
        'grunt-atomizer',
        'grunt-contrib-clean',
        'grunt-contrib-connect',
        'grunt-contrib-watch',
        'grunt-shell',
        'grunt-webpack'
    ].forEach(function (packageName) {
        var moduleTasks = path.resolve(__dirname, '..', 'node_modules', packageName, 'tasks');

        if (!fs.existsSync(moduleTasks)) {
            moduleTasks = path.resolve(process.cwd(), 'node_modules', packageName, 'tasks');
        }

        if (fs.existsSync(moduleTasks)) {
            grunt.loadTasks(moduleTasks);
        } else {
            grunt.log.error(moduleTasks + ' could not be found.');
        }
    });

    // configurable paths
    var env = process.env;
    var projectConfig = {
        src: 'src',
        dist: 'dist',
        tmp: 'tmp',
        unit: 'tests/unit',
        functional: 'tests/functional',
        coverage_dir: grunt.option('coverage_dir') || 'artifacts',
        test_results_dir: grunt.option('test_results_dir') || 'artifacts'
    };

    env.XUNIT_FILE = projectConfig.test_results_dir + '/xunit.xml';

    grunt.initConfig({
        project: projectConfig,
        clean: {
            dist: {
                files: [
                    {
                        dot: true,
                        src: ['<%= project.dist %>']
                    }
                ]
            },
            tmp: {
                files: [
                    {
                        dot: true,
                        src: ['<%= project.tmp %>']
                    }
                ]
            },
            functional: {
                files: [
                    {
                        dot: true,
                        src: [
                            '<%= project.functional %>/bundle.js',
                            '<%= project.functional %>/css/atomic.css',
                            '<%= project.functional %>/console.js',
                            '<%= project.functional %>/*-functional.js'
                        ]
                    }
                ]
            }
        },
        // atomizer
        atomizer: {
            // used by functional tests
            functional: {
                files: [{
                    src: ['<%= project.src %>/*.jsx', 'tests/**/*.jsx', 'tests/**/*.html'],
                    dest: 'tests/functional/css/atomic.css'
                }]
            }
        },
        // webpack
        // create js rollup with webpack module loader for functional tests
        webpack: {
            functional: {
                entry: './<%= project.functional %>/bootstrap.js',
                output: {
                    path: './<%= project.functional %>/'
                },
                module: {
                    loaders: [
                        { test: /\.css$/, loader: 'style!css' },
                        // { test: /\.jsx$/, loader: require.resolve('babel-loader') },
                        { test: /\.json$/, loader: 'json-loader'}
                    ]
                }
            }
        },
        // connect
        // setup server for functional tests
        connect: {
            functional: {
                options: {
                    port: 9999,
                    base: ['<%= project.functional %>', '.']
                }
            },
            functionalOpen: {
                options: {
                    port: 9999,
                    base: ['<%= project.functional %>', '.'],
                    open: {
                        target: 'http://127.0.0.1:9999/tests/functional/page.html'
                    }
                }
            }
        },
        watch: {
            functional: {
                files: [
                    '<%= project.src%>/*.jsx',
                    '<%= project.functional%>/*.jsx',
                    '<%= project.functional%>/*.html'
                ],
                tasks: ['dist', 'functional-debug']
            }
        },
        'saucelabs-mocha': {
            all: {
                options: {
                    testname: 'react-stickynode func test',
                    urls: [
                        'http://127.0.0.1:9999/tests/functional/page.html'
                    ],

                    build: process.env.TRAVIS_BUILD_NUMBER,
                    sauceConfig: {
                        'record-video': true,
                        'capture-html': false,
                        'record-screenshots': false
                    },
                    throttled: 3,
                    browsers: [
                        {
                            browserName: 'internet explorer',
                            platform: 'Windows 8',
                            version: '10'
                        },
                        {
                            browserName: 'internet explorer',
                            platform: 'Windows 8.1',
                            version: '11'
                        },
                        {
                            browserName: 'chrome',
                            platform: 'Windows 7',
                            version: '37'
                        },
                        {
                            browserName: 'firefox',
                            platform: 'Windows 7',
                            version: '32'
                        },
                        {
                            browserName: 'iphone',
                            platform: 'OS X 10.9',
                            version: '7.1'
                        },
                        {
                            browserName: 'android',
                            platform: 'Linux',
                            version: '4.4'
                        },
                        {
                            browserName: 'safari',
                            platform: 'OS X 10.9',
                            version: '7'
                        }
                    ]
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-saucelabs');

    // register custom tasks

    // functional
    // 2. run atomizer functional
    // 3. compile jsx to js in tests/functional/
    // 4. copy files to tests/functional/
    // 5. use webpack to create a js bundle to tests/functional/
    // 6. get local ip address and available port then store in grunt config
    // 7. set up local server to run functional tests
    // 9. run protractor
    grunt.registerTask('functional', [
        'atomizer:functional',
        'babel:functional',
        'webpack:functional',
        'connect:functional',
        'saucelabs-mocha',
        'clean:functional'
    ]);

    // similar to functional, but don't run protractor, just open the test page
    grunt.registerTask('functional-debug', [
        'atomizer:functional',
        'babel:functional',
        'webpack:functional',
        'connect:functionalOpen',
        'watch:functional'
    ]);

    // default
    grunt.registerTask('default', ['functional']);
};
