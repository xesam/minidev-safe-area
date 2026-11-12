import { computeNavBarMetrics, toSafeAreaInfo } from '../src/metrics';
import type { RawSafeAreaData, Rect } from '../src/types';

const iosSafeArea: Rect = { left: 0, top: 47, right: 390, bottom: 810, width: 390, height: 763 };

const iosRaw: RawSafeAreaData = {
    runtimePlatform: 'ios',
    windowWidth: 390,
    windowHeight: 844,
    safeArea: iosSafeArea,
    statusBarHeight: 47
};

const androidRaw: RawSafeAreaData = {
    runtimePlatform: 'android',
    windowWidth: 393,
    windowHeight: 851,
    safeArea: { left: 0, top: 35, right: 393, bottom: 818, width: 393, height: 783 },
    statusBarHeight: 35
};

const devtoolsRaw: RawSafeAreaData = {
    runtimePlatform: 'devtools',
    windowWidth: 375,
    windowHeight: 667,
    safeArea: { left: 0, top: 20, right: 375, bottom: 667, width: 375, height: 647 },
    statusBarHeight: 20
};

const harmonyRaw: RawSafeAreaData = {
    runtimePlatform: 'harmony',
    windowWidth: 384,
    windowHeight: 816,
    safeArea: { left: 0, top: 38, right: 384, bottom: 782, width: 384, height: 744 },
    statusBarHeight: 38
};

const capsuleAt = (top: number): Rect => ({ left: 281, top, right: 368, bottom: top + 32, width: 87, height: 32 });

describe('toSafeAreaInfo', () => {
    test('computes bottomInset from windowHeight and safeArea.bottom', () => {
        expect(toSafeAreaInfo(iosRaw).bottomInset).toBe(844 - 810);
        expect(toSafeAreaInfo(devtoolsRaw).bottomInset).toBe(0);
    });

    test('promotes safeAreaTop from safeArea.top', () => {
        expect(toSafeAreaInfo(iosRaw).safeAreaTop).toBe(47);
        expect(toSafeAreaInfo(androidRaw).safeAreaTop).toBe(35);
    });

    test('keeps raw fields unchanged', () => {
        const info = toSafeAreaInfo(androidRaw);
        expect(info.windowWidth).toBe(393);
        expect(info.safeArea.top).toBe(35);
        expect(info.statusBarHeight).toBe(35);
        expect(info.runtimePlatform).toBe('android');
    });

    test('keeps safeAreaTop and statusBarHeight independent when the two diverge', () => {
        const divergentRaw: RawSafeAreaData = {
            ...iosRaw,
            safeArea: { ...iosSafeArea, top: 44, height: 766 },
            statusBarHeight: 47
        };
        const info = toSafeAreaInfo(divergentRaw);
        expect(info.safeAreaTop).toBe(44);
        expect(info.statusBarHeight).toBe(47);
    });

    test('derives useCSSSafeAreaEnv per runtime platform', () => {
        expect(toSafeAreaInfo(iosRaw).useCSSSafeAreaEnv).toBe(true);
        expect(toSafeAreaInfo(androidRaw).useCSSSafeAreaEnv).toBe(false);
        expect(toSafeAreaInfo(devtoolsRaw).useCSSSafeAreaEnv).toBe(false);
        expect(toSafeAreaInfo(harmonyRaw).useCSSSafeAreaEnv).toBe(false);
        expect(toSafeAreaInfo({ ...iosRaw, runtimePlatform: 'windows' }).useCSSSafeAreaEnv).toBe(true);
        expect(toSafeAreaInfo({ ...iosRaw, runtimePlatform: 'mac' }).useCSSSafeAreaEnv).toBe(true);
        expect(toSafeAreaInfo({ ...iosRaw, runtimePlatform: 'unknown' }).useCSSSafeAreaEnv).toBe(false);
    });
});

describe('raw data normalization', () => {
    test('synthesizes a fallback safe area rect when the adapter reports null', () => {
        const info = toSafeAreaInfo({ ...iosRaw, safeArea: null });
        expect(info.safeArea).toEqual({ left: 0, top: 47, right: 390, bottom: 844, width: 390, height: 797 });
        expect(info.safeAreaTop).toBe(47);
        expect(info.bottomInset).toBe(0);
    });

    test('synthesizes a fallback rect when safe area fields are non-finite or zero-sized', () => {
        const nonFiniteTop = toSafeAreaInfo({ ...iosRaw, safeArea: { ...iosSafeArea, top: Number.NaN } });
        expect(nonFiniteTop.safeArea.top).toBe(47);
        const zeroSize = toSafeAreaInfo({
            ...iosRaw,
            safeArea: { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }
        });
        expect(zeroSize.safeArea.top).toBe(47);
        expect(zeroSize.bottomInset).toBe(0);
    });

    test('coerces a non-finite statusBarHeight to zero', () => {
        const info = toSafeAreaInfo({ ...iosRaw, safeArea: null, statusBarHeight: Number.NaN });
        expect(info.statusBarHeight).toBe(0);
        expect(info.safeArea.top).toBe(0);
        expect(toSafeAreaInfo({ ...iosRaw, statusBarHeight: Number.NaN }).statusBarHeight).toBe(0);
    });

    test('throws a contextual error on invalid window dimensions', () => {
        expect(() => toSafeAreaInfo({ ...iosRaw, windowWidth: Number.NaN })).toThrow('[safe-area] invalid window dimensions');
        expect(() => toSafeAreaInfo({ ...iosRaw, windowHeight: Number.NaN })).toThrow('[safe-area] invalid window dimensions');
        expect(() => computeNavBarMetrics('wechat', { ...iosRaw, windowWidth: Number.NaN }, capsuleAt(53))).toThrow('[safe-area] invalid window dimensions');
    });

    test('computeNavBarMetrics normalizes raw data as well', () => {
        const metrics = computeNavBarMetrics('wechat', { ...iosRaw, safeArea: null }, capsuleAt(53));
        expect(metrics.statusBarHeight).toBe(47);
        expect(metrics.barHeight).toBe((53 - 47) * 2 + 32);
        expect(metrics.capsuleRightGap).toBe(390 - 281);
        expect(computeNavBarMetrics('wechat', { ...iosRaw, statusBarHeight: Number.NaN }, capsuleAt(53)).statusBarHeight).toBe(0);
    });
});

describe('computeNavBarMetrics', () => {
    test('ios derives capsule-centered barHeight on the CSS env track', () => {
        const capsule = capsuleAt(53);
        const metrics = computeNavBarMetrics('wechat', iosRaw, capsule);
        expect(metrics.runtimePlatform).toBe('ios');
        expect(metrics.platformId).toBe('wechat');
        expect(metrics.barHeight).toBe((53 - 47) * 2 + 32);
        expect(metrics.capsuleRightGap).toBe(390 - 281);
        expect(metrics.capsule).toEqual(capsule);
    });

    test('barHeight anchors on statusBarHeight to keep the capsule vertically centered', () => {
        const metrics = computeNavBarMetrics('wechat', iosRaw, capsuleAt(53));
        const capsuleCenter = 53 + 32 / 2;
        const rowCenter = iosRaw.statusBarHeight + metrics.barHeight / 2;
        expect(capsuleCenter).toBe(rowCenter);
    });

    test('anchors barHeight on statusBarHeight rather than safeArea.top when the two diverge', () => {
        const divergentRaw: RawSafeAreaData = {
            ...iosRaw,
            safeArea: { ...iosSafeArea, top: 44, height: 766 },
            statusBarHeight: 47
        };
        const metrics = computeNavBarMetrics('wechat', divergentRaw, capsuleAt(53));
        expect(metrics.statusBarHeight).toBe(47);
        expect(metrics.barHeight).toBe((53 - 47) * 2 + 32);
    });

    test('android derives capsule-centered barHeight on the JS inline track', () => {
        const metrics = computeNavBarMetrics('wechat', androidRaw, capsuleAt(44));
        expect(metrics.runtimePlatform).toBe('android');
        expect(metrics.barHeight).toBe((44 - 35) * 2 + 32);
        expect(metrics.capsuleRightGap).toBe(393 - 281);
    });

    test('devtools derives capsule-centered barHeight on the JS inline track', () => {
        const metrics = computeNavBarMetrics('wechat', devtoolsRaw, capsuleAt(26));
        expect(metrics.runtimePlatform).toBe('devtools');
        expect(metrics.barHeight).toBe((26 - 20) * 2 + 32);
    });

    test('harmony derives capsule-centered barHeight on the JS inline track', () => {
        const metrics = computeNavBarMetrics('wechat', harmonyRaw, capsuleAt(44));
        expect(metrics.runtimePlatform).toBe('harmony');
        expect(metrics.barHeight).toBe((44 - 38) * 2 + 32);
    });

    test('missing capsule yields null capsule, zero right gap and platform default barHeight', () => {
        const metrics = computeNavBarMetrics('wechat', iosRaw, null);
        expect(metrics.capsule).toBeNull();
        expect(metrics.capsuleRightGap).toBe(0);
        expect(metrics.barHeight).toBe(44);
        expect(computeNavBarMetrics('wechat', androidRaw, null).barHeight).toBe(48);
    });

    test('falls back to platform defaults when the capsule rect is unusable', () => {
        const aboveStatusBar = capsuleAt(26);
        expect(computeNavBarMetrics('wechat', iosRaw, aboveStatusBar).barHeight).toBe(44);
        expect(computeNavBarMetrics('wechat', androidRaw, aboveStatusBar).barHeight).toBe(48);
        expect(computeNavBarMetrics('wechat', iosRaw, aboveStatusBar).capsuleRightGap).toBe(0);
        const zeroHeight = { ...capsuleAt(53), bottom: 53, height: 0 };
        expect(computeNavBarMetrics('wechat', iosRaw, zeroHeight).barHeight).toBe(44);
        const nonFiniteTop = capsuleAt(Number.NaN);
        expect(computeNavBarMetrics('wechat', iosRaw, nonFiniteTop).barHeight).toBe(44);
    });

    test('treats a capsule with non-finite coordinates as unusable for every derived value', () => {
        const nonFiniteLeft = { ...capsuleAt(60), left: Number.NaN };
        expect(computeNavBarMetrics('wechat', iosRaw, nonFiniteLeft).barHeight).toBe(44);
        expect(computeNavBarMetrics('wechat', iosRaw, nonFiniteLeft).capsuleRightGap).toBe(0);
        const nonFiniteWidth = { ...capsuleAt(60), width: Number.NaN };
        expect(computeNavBarMetrics('wechat', iosRaw, nonFiniteWidth).barHeight).toBe(44);
        expect(computeNavBarMetrics('wechat', iosRaw, nonFiniteWidth).capsuleRightGap).toBe(0);
    });
});
