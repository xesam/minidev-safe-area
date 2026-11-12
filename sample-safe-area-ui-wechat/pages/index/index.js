const { getSafeAreaInfo, getNavBarMetrics } = require('@mini-dev/safe-area');

const FOOTER_CONTENT_HEIGHT = 85;
const BODY_EXTRA_BOTTOM = 15;

function getRawPlatform() {
    try {
        if (wx.getDeviceInfo) {
            return wx.getDeviceInfo().platform;
        }
        return wx.getSystemInfoSync().platform;
    } catch {
        return 'unknown';
    }
}

Page({
    data: {
        metricsRows: [],
        safeAreaText: '',
        metricsText: '',
        statusBarHeight: 0,
        safeAreaTop: 0,
        trackLabel: '',
        topDiffText: '',
        bottomPadValue: 0,
        bodyPadBottom: ''
    },
    onLoad() {
        this.refreshMetrics();
    },
    onResize() {
        this.refreshMetrics();
    },
    refreshMetrics() {
        const info = getSafeAreaInfo();
        const metrics = getNavBarMetrics();
        const topDiff = Math.abs(info.statusBarHeight - info.safeAreaTop);
        this.setData({
            metricsRows: [
                {
                    name: 'statusBarHeight',
                    value: `${info.statusBarHeight}px`,
                    note: 'statusbar-safe-top 与 navigation-bar 内容栏的锚点'
                },
                {
                    name: 'safeArea.top',
                    value: `${info.safeArea.top}px`,
                    note: 'safe-area-top 的锚点（视口遮挡）'
                },
                {
                    name: 'bottomInset',
                    value: `${info.bottomInset}px`,
                    note: 'safe-area-bottom 的锚点（本页吸底条）'
                },
                {
                    name: 'capsule.top / height',
                    value: metrics.capsule ? `${metrics.capsule.top} / ${metrics.capsule.height}px` : 'null（回退）',
                    note: '胶囊实测矩形，barHeight 公式输入'
                },
                {
                    name: 'barHeight',
                    value: `${metrics.barHeight}px`,
                    note: 'navigation-bar 内容行高度'
                },
                {
                    name: 'capsuleRightGap',
                    value: `${metrics.capsuleRightGap}px`,
                    note: 'navigation-bar 右侧避让宽度'
                },
                {
                    name: 'useCSSSafeAreaEnv',
                    value: info.useCSSSafeAreaEnv ? 'true（CSS env() 轨）' : 'false（JS 内联轨）',
                    note: 'safe-area-top 的提供轨道'
                },
                {
                    name: 'platform 原始值',
                    value: getRawPlatform(),
                    note: 'wx.getDeviceInfo().platform'
                }
            ],
            safeAreaText: JSON.stringify(info),
            metricsText: JSON.stringify(metrics),
            statusBarHeight: info.statusBarHeight,
            safeAreaTop: info.safeAreaTop,
            trackLabel: info.useCSSSafeAreaEnv ? 'CSS env() 轨' : 'JS 内联轨',
            topDiffText:
                topDiff === 0
                    ? '此机型上 statusBarHeight 与 safeArea.top 相等（主流情况），两条彩色带同高。'
                    : `此机型上 statusBarHeight 与 safeArea.top 相差 ${topDiff}px（实测分离场景），两条彩色带高度不同。`,
            bottomPadValue: info.bottomInset,
            bodyPadBottom: `padding-bottom: ${info.bottomInset + FOOTER_CONTENT_HEIGHT + BODY_EXTRA_BOTTOM}px;`
        });
    },
    onRecompute() {
        this.refreshMetrics();
        const demoTop = this.selectComponent('#demo-safe-area-top');
        const demoCompareTop = this.selectComponent('#demo-compare-safe-area-top');
        const demoStatusBarTop = this.selectComponent('#demo-statusbar-safe-top');
        const demoBottom = this.selectComponent('#demo-safe-area-bottom');
        if (demoTop) {
            demoTop._updateLayout();
        }
        if (demoCompareTop) {
            demoCompareTop._updateLayout();
        }
        if (demoStatusBarTop) {
            demoStatusBarTop._updateLayout();
        }
        if (demoBottom) {
            demoBottom._updateLayout();
        }
    },
    onTapNavBar() {
        wx.navigateTo({
            url: '/pages/nav-bar/index'
        });
    },
    onTapNavBarBase() {
        wx.navigateTo({
            url: '/pages/nav-bar-base/index'
        });
    },
    onTapNotHome() {
        wx.navigateTo({
            url: '/pages/not-home/index'
        });
    }
});
