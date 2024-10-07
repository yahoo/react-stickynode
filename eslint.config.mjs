import js from '@eslint/js';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';

export default [
    js.configs.recommended,
    reactPlugin.configs.flat.recommended,
    {
        ignores: [
            '.idea/',
            '*-debug.log',
            'artifacts/',
            'build/',
            'components-dist/',
            'configs/atomizer.json',
            'dist/',
            'node_modules/',
            'npm-*.log',
            'protractor-batch-artifacts/',
            'results/',
            'tests/functional/bootstrap.js',
        ],
    },
    {
        files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
        languageOptions: {
            ...reactPlugin.configs.flat.recommended.languageOptions,
            ecmaVersion: 2024,
            globals: {
                ...globals.browser,
                ...globals.jest,
                ...globals.mocha,
                ...globals.node,
                ...globals.protractor,
            },
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
                sourceType: 'module',
            },
        },
        plugins: {
            react: reactPlugin,
        },
        rules: {
            indent: [2, 4, { SwitchCase: 1 }],
            quotes: [0, 'single'],
            'dot-notation': [2, { allowKeywords: false }],
            'no-console': 0,
            'no-prototype-builtins': 0,
            'no-unexpected-multiline': 0,
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
];
