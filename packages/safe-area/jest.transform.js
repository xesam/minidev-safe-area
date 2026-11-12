const { transformSync } = require('esbuild');

module.exports = {
    process(sourceText, sourcePath) {
        const { code, map } = transformSync(sourceText, {
            loader: sourcePath.endsWith('.ts') ? 'ts' : 'js',
            format: 'cjs',
            target: 'node16',
            sourcefile: sourcePath,
            sourcemap: true
        });
        return { code, map };
    }
};
