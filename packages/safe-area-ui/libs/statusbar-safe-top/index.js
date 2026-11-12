const { _Component } = require('../_Component');
const { getSafeAreaInfo } = require('@mini-dev/safe-area');

_Component({
    data: {
        inlineStyle: ''
    },
    lifetimes: {
        attached() {
            this._onWindowResize = () => {
                this._updateLayout();
            };
            if (typeof wx.onWindowResize === 'function') {
                wx.onWindowResize(this._onWindowResize);
            }
            this._updateLayout();
        },
        detached() {
            if (this._onWindowResize && typeof wx.offWindowResize === 'function') {
                wx.offWindowResize(this._onWindowResize);
            }
        }
    },
    pageLifetimes: {
        resize() {
            this._updateLayout();
        }
    },
    methods: {
        _updateLayout() {
            try {
                const info = getSafeAreaInfo();
                this.setData({
                    inlineStyle: `padding-top: ${info.statusBarHeight}px;`
                });
            } catch (error) {
                console.error('[safe-area-ui] statusbar-safe-top metrics unavailable, falling back to static wxss:', error);
            }
        }
    }
});
