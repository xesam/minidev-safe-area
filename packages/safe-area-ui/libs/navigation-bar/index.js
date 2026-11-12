const { getNavBarMetrics } = require('@mini-dev/safe-area');

Component({
    options: {
        multipleSlots: true // 在组件定义时的选项中启用多slot支持
    },
    /**
     * 组件的属性列表
     */
    properties: {
        extClass: {
            type: String,
            value: ''
        },
        title: {
            type: String,
            value: ''
        },
        background: {
            type: String,
            value: ''
        },
        color: {
            type: String,
            value: ''
        },
        back: {
            type: Boolean,
            value: true
        },
        loading: {
            type: Boolean,
            value: false
        },
        homeButton: {
            type: Boolean,
            value: false
        },
        animated: {
            // 显示隐藏的时候opacity动画效果
            type: Boolean,
            value: true
        },
        show: {
            // 显示隐藏导航，隐藏的时候navigation-bar的高度占位还在
            type: Boolean,
            value: true,
            observer: '_showChange'
        },
        // back为true的时候，返回的页面深度
        delta: {
            type: Number,
            value: 1
        },
        autoNavIcon: {
            type: Boolean,
            value: false
        },
        backIcon: {
            type: String,
            value: ''
        },
        homeIcon: {
            type: String,
            value: ''
        }
    },
    /**
     * 组件的初始数据
     */
    data: {
        displayStyle: '',
        androidBar: false,
        heightVar: '',
        innerPaddingRight: '',
        leftWidth: '',
        statusBarTop: ''
    },
    lifetimes: {
        attached() {
            if (this.data.autoNavIcon) {
                if (getCurrentPages().length === 1) {
                    this.setData({
                        back: false,
                        homeButton: true
                    });
                } else {
                    this.setData({
                        back: true,
                        homeButton: false
                    });
                }
            }

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
    /**
     * 组件的方法列表
     */
    methods: {
        _updateLayout() {
            try {
                const metrics = getNavBarMetrics();
                this.setData({
                    androidBar: metrics.runtimePlatform === 'android',
                    heightVar: `--height: ${metrics.barHeight}px;`,
                    innerPaddingRight: `padding-right: ${metrics.capsuleRightGap}px;`,
                    leftWidth: `min-width: ${metrics.capsuleRightGap}px;`,
                    statusBarTop: `height: calc(var(--height) + ${metrics.statusBarHeight}px); padding-top: ${metrics.statusBarHeight}px;`
                });
            } catch (error) {
                console.error('[safe-area-ui] navigation-bar metrics unavailable, falling back to static wxss:', error);
            }
        },
        _showChange(show) {
            const animated = this.data.animated;
            let displayStyle = '';
            if (animated) {
                displayStyle = `opacity: ${show ? '1' : '0'};transition:opacity 0.5s;pointer-events: ${show ? 'auto' : 'none'};`;
            } else {
                displayStyle = `visibility: ${show ? 'visible' : 'hidden'};`;
            }
            this.setData({
                displayStyle
            });
        },
        onTapBack() {
            const data = this.data;
            if (data.delta > 0) {
                wx.navigateBack({
                    delta: data.delta,
                    fail: (error) => {
                        console.error('[safe-area-ui] navigation-bar navigateBack failed:', error);
                    }
                });
            }
            this.triggerEvent('back', { delta: data.delta }, {});
        },
        onTapHome() {
            this.triggerEvent('home', {}, {});
        }
    }
});
