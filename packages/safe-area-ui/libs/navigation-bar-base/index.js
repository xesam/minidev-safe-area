const { getNavBarMetrics } = require('@mini-dev/safe-area');

Component({
    /**
     * 组件的属性列表
     */
    properties: {
        extClass: {
            type: String,
            value: ''
        }
    },

    /**
     * 组件的初始数据
     */
    data: {
        androidBar: false,
        heightVar: '',
        innerPaddingRight: '',
        statusBarTop: ''
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
                const metrics = getNavBarMetrics();
                this.setData({
                    androidBar: metrics.runtimePlatform === 'android',
                    heightVar: `--height: ${metrics.barHeight}px;`,
                    innerPaddingRight: `padding-right: ${metrics.capsuleRightGap}px;`,
                    statusBarTop: `height: calc(var(--height) + ${metrics.statusBarHeight}px); padding-top: ${metrics.statusBarHeight}px;`
                });
            } catch (error) {
                console.error('[safe-area-ui] navigation-bar-base metrics unavailable, falling back to static wxss:', error);
            }
        }
    }
});
