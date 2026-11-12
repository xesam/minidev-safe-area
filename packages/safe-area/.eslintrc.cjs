module.exports = {
    parser: '@typescript-eslint/parser',
    extends: ['plugin:@typescript-eslint/recommended'],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    overrides: [
        {
            files: ['**/*.cjs', 'jest.config.js', 'jest.transform.js'],
            rules: {
                '@typescript-eslint/no-require-imports': 'off'
            }
        }
    ]
};
