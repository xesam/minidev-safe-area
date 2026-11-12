module.exports = {
    env: {
        es2022: true,
        browser: true
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
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'commonjs'
    },
    rules: {
        'no-unused-vars': ['warn', { args: 'none' }],
        'no-empty': 'off'
    }
};
