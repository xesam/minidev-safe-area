function _Component(opts = {}) {
    opts.externalClasses = ['mini-class', 'ui-class', 'ext-class'].concat(opts.externalClasses || []);
    opts.behaviors = [].concat(opts.behaviors || []);
    opts.options = Object.assign(
        {
            virtualHost: true,
            styleIsolation: 'isolated',
            multipleSlots: true,
            pureDataPattern: /^\$_/
        },
        opts.options || {}
    );
    return Component(opts);
}

module.exports = { _Component };
