const assert = require('node:assert');

async function main() {
    const cjs = require('../dist/cjs/index.js');
    const esm = await import('../dist/esm/index.js');

    const required = ['getPlatformId', 'getSafeAreaInfo', 'getMenuButtonRect', 'getNavBarMetrics'];
    for (const name of required) {
        assert.strictEqual(typeof cjs[name], 'function', `cjs export missing: ${name}`);
        assert.strictEqual(typeof esm[name], 'function', `esm export missing: ${name}`);
    }
    assert.strictEqual(typeof cjs.default, 'object', 'cjs default export missing');
    assert.strictEqual(typeof esm.default, 'object', 'esm default export missing');

    assert.strictEqual(cjs.getPlatformId(), 'unknown', 'cjs getPlatformId should degrade to unknown without a runtime');
    assert.strictEqual(esm.getPlatformId(), 'unknown', 'esm getPlatformId should degrade to unknown without a runtime');
    assert.throws(() => cjs.getSafeAreaInfo(), /expected wx \(wechat\)/, 'cjs error message should list registered runtimes');
    assert.throws(() => esm.getSafeAreaInfo(), /expected wx \(wechat\)/, 'esm error message should list registered runtimes');

    console.log('dist smoke ok: cjs + esm exports consistent');
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
