interface WxStub {
    getWindowInfo?: () => {
        windowWidth: number;
        windowHeight: number;
        safeArea: { left: number; top: number; right: number; bottom: number; width: number; height: number } | null;
        statusBarHeight: number;
    };
    getDeviceInfo?: () => { platform?: string };
    getSystemInfoSync?: () => {
        windowWidth: number;
        windowHeight: number;
        safeArea: { left: number; top: number; right: number; bottom: number; width: number; height: number } | null;
        statusBarHeight: number;
        platform?: string;
    };
    getMenuButtonBoundingClientRect?: () => { left: number; top: number; right: number; bottom: number; width: number; height: number };
}

import * as lib from '../src/index';

function setWx(stub?: WxStub) {
    if (stub === undefined) {
        delete (globalThis as { wx?: WxStub }).wx;
    } else {
        (globalThis as { wx?: WxStub }).wx = stub;
    }
}

function makeWx(platform: string, menuButton?: WxStub['getMenuButtonBoundingClientRect']): WxStub {
    return {
        getWindowInfo: () => ({
            windowWidth: 390,
            windowHeight: 844,
            safeArea: { left: 0, top: 47, right: 390, bottom: 810, width: 390, height: 763 },
            statusBarHeight: 47
        }),
        getDeviceInfo: () => ({ platform }),
        getMenuButtonBoundingClientRect: menuButton
    };
}

const validCapsule = () => ({ left: 281, top: 50, right: 368, bottom: 82, width: 87, height: 32 });

afterEach(() => {
    setWx(undefined);
});

describe('platform dispatch', () => {
    test('returns unknown platform id when no runtime detected', () => {
        expect(lib.getPlatformId()).toBe('unknown');
    });

    test('returns wechat platform id when wx is available', () => {
        setWx(makeWx('ios'));
        expect(lib.getPlatformId()).toBe('wechat');
    });

    test('throws a clear error listing every registered runtime when none detected', () => {
        expect(() => lib.getSafeAreaInfo()).toThrow('no supported mini-program runtime detected: expected wx (wechat)');
    });
});

describe('getSafeAreaInfo', () => {
    test('returns normalized safe area info with safeAreaTop and bottomInset', () => {
        setWx(makeWx('ios'));
        const info = lib.getSafeAreaInfo();
        expect(info.runtimePlatform).toBe('ios');
        expect(info.windowWidth).toBe(390);
        expect(info.statusBarHeight).toBe(47);
        expect(info.safeArea.top).toBe(47);
        expect(info.safeAreaTop).toBe(47);
        expect(info.bottomInset).toBe(844 - 810);
        expect(info.useCSSSafeAreaEnv).toBe(true);
    });

    test('normalizes ios / android / devtools platforms', () => {
        setWx(makeWx('ios'));
        expect(lib.getSafeAreaInfo().runtimePlatform).toBe('ios');
        setWx(makeWx('android'));
        expect(lib.getSafeAreaInfo().runtimePlatform).toBe('android');
        setWx(makeWx('devtools'));
        expect(lib.getSafeAreaInfo().runtimePlatform).toBe('devtools');
    });

    test('maps unrecognized platform values to unknown instead of guessing', () => {
        setWx(makeWx('quickapp'));
        const info = lib.getSafeAreaInfo();
        expect(info.runtimePlatform).toBe('unknown');
        expect(info.useCSSSafeAreaEnv).toBe(false);
    });

    test('treats a missing platform value as unknown instead of throwing', () => {
        setWx({
            getWindowInfo: () => ({
                windowWidth: 390,
                windowHeight: 844,
                safeArea: null,
                statusBarHeight: 47
            }),
            getDeviceInfo: () => ({})
        });
        const info = lib.getSafeAreaInfo();
        expect(info.runtimePlatform).toBe('unknown');
        expect(info.safeAreaTop).toBe(47);
        expect(info.useCSSSafeAreaEnv).toBe(false);
    });

    test('treats a missing platform in the legacy getSystemInfoSync fallback as unknown', () => {
        setWx({
            getSystemInfoSync: () => ({
                windowWidth: 390,
                windowHeight: 844,
                safeArea: null,
                statusBarHeight: 47
            })
        });
        const info = lib.getSafeAreaInfo();
        expect(info.runtimePlatform).toBe('unknown');
        expect(info.useCSSSafeAreaEnv).toBe(false);
    });

    test('normalizes harmony platform values', () => {
        setWx(makeWx('harmony'));
        expect(lib.getSafeAreaInfo().runtimePlatform).toBe('harmony');
        setWx(makeWx('harmonyos'));
        expect(lib.getSafeAreaInfo().runtimePlatform).toBe('harmony');
        setWx(makeWx('ohos'));
        expect(lib.getSafeAreaInfo().runtimePlatform).toBe('harmony');
    });

    test('synthesizes a fallback rect when the runtime reports a null safe area', () => {
        setWx({
            getWindowInfo: () => ({
                windowWidth: 390,
                windowHeight: 844,
                safeArea: null,
                statusBarHeight: 47
            }),
            getDeviceInfo: () => ({ platform: 'ios' }),
            getMenuButtonBoundingClientRect: validCapsule
        });
        const info = lib.getSafeAreaInfo();
        expect(info.safeArea).toEqual({ left: 0, top: 47, right: 390, bottom: 844, width: 390, height: 797 });
        expect(info.safeAreaTop).toBe(47);
        expect(info.bottomInset).toBe(0);
        const metrics = lib.getNavBarMetrics();
        expect(metrics.barHeight).toBe((50 - 47) * 2 + 32);
    });
});

describe('getMenuButtonRect', () => {
    test('returns capsule rect when available', () => {
        setWx(makeWx('ios', validCapsule));
        expect(lib.getMenuButtonRect()).toEqual(validCapsule());
    });

    test('returns null when the API is missing', () => {
        setWx(makeWx('ios'));
        expect(lib.getMenuButtonRect()).toBeNull();
    });

    test('returns null for a zero-size rect', () => {
        setWx(makeWx('windows', () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 })));
        expect(lib.getMenuButtonRect()).toBeNull();
    });
});

describe('legacy api fallback', () => {
    test('falls back to getSystemInfoSync when split APIs are unavailable', () => {
        setWx({
            getSystemInfoSync: () => ({
                windowWidth: 390,
                windowHeight: 844,
                safeArea: { left: 0, top: 47, right: 390, bottom: 810, width: 390, height: 763 },
                statusBarHeight: 47,
                platform: 'android'
            })
        });
        const info = lib.getSafeAreaInfo();
        expect(info.runtimePlatform).toBe('android');
        expect(info.statusBarHeight).toBe(47);
        expect(info.bottomInset).toBe(34);
    });

    test('throws a clear error when no window API is available at all', () => {
        setWx({ getMenuButtonBoundingClientRect: validCapsule });
        expect(() => lib.getSafeAreaInfo()).toThrow('no available wechat API for window info');
    });
});

describe('getNavBarMetrics', () => {
    test('wires adapter data through the metric derivations', () => {
        setWx(makeWx('android', validCapsule));
        const metrics = lib.getNavBarMetrics();
        expect(metrics.platformId).toBe('wechat');
        expect(metrics.runtimePlatform).toBe('android');
        expect(metrics.barHeight).toBe((50 - 47) * 2 + 32);
        expect(metrics.capsuleRightGap).toBe(390 - 281);
    });

    test('routes harmony to the JS inline track with capsule-derived barHeight', () => {
        setWx(makeWx('harmonyos', validCapsule));
        const metrics = lib.getNavBarMetrics();
        expect(metrics.runtimePlatform).toBe('harmony');
        expect(metrics.barHeight).toBe((50 - 47) * 2 + 32);
        expect(metrics.capsuleRightGap).toBe(390 - 281);
        expect(lib.getSafeAreaInfo().useCSSSafeAreaEnv).toBe(false);
    });

    test('falls back to platform default barHeight when the capsule is unavailable', () => {
        setWx(makeWx('android'));
        expect(lib.getNavBarMetrics().barHeight).toBe(48);
        setWx(makeWx('ios'));
        expect(lib.getNavBarMetrics().barHeight).toBe(44);
    });

    test('anchors barHeight on statusBarHeight when it diverges from safeArea.top', () => {
        setWx({
            getWindowInfo: () => ({
                windowWidth: 390,
                windowHeight: 844,
                safeArea: { left: 0, top: 44, right: 390, bottom: 810, width: 390, height: 766 },
                statusBarHeight: 47
            }),
            getDeviceInfo: () => ({ platform: 'ios' }),
            getMenuButtonBoundingClientRect: validCapsule
        });
        const info = lib.getSafeAreaInfo();
        expect(info.safeAreaTop).toBe(44);
        expect(info.statusBarHeight).toBe(47);
        const metrics = lib.getNavBarMetrics();
        expect(metrics.statusBarHeight).toBe(47);
        expect(metrics.barHeight).toBe((50 - 47) * 2 + 32);
    });
});
