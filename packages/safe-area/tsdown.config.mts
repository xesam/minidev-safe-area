import { writeFileSync } from 'node:fs';
import { defineConfig } from 'tsdown';

export default defineConfig([
    {
        entry: ['src/index.ts'],
        format: 'cjs',
        outDir: 'dist/cjs',
        target: 'es2015',
        platform: 'neutral',
        sourcemap: true,
        dts: { sourcemap: true },
        outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
        onSuccess() {
            writeFileSync('dist/cjs/package.json', JSON.stringify({ type: 'commonjs' }, null, 2));
        }
    },
    {
        entry: ['src/index.ts'],
        format: 'esm',
        outDir: 'dist/esm',
        target: 'es2015',
        platform: 'neutral',
        sourcemap: true,
        dts: { sourcemap: true },
        outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
        onSuccess() {
            writeFileSync('dist/esm/package.json', JSON.stringify({ type: 'module' }, null, 2));
        }
    }
]);
