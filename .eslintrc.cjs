module.exports = {
    root: true,
    env: {
        node: true,
        browser: true,
        es2022: true
    },
    globals: {
        wx: true,
        App: true,
        Page: true,
        Component: true,
        Behavior: true,
        getCurrentPages: true,
        getApp: true,
        requirePlugin: true,
        requireMiniProgram: true
    },
    extends: ['eslint:recommended'],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    ignorePatterns: ['node_modules/', '**/miniprogram_npm/', 'sample-*/node_modules/', '**/*.d.ts']
};
