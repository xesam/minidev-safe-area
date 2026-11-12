import { computeNavBarMetrics, toSafeAreaInfo } from './metrics';
import { describeExpectedRuntimes, detectPlatform } from './platforms';
import type { NavBarMetrics, PlatformId, RawSafeAreaData, Rect, SafeAreaInfo } from './types';

export type { NavBarMetrics, PlatformId, Rect, RuntimePlatform, SafeAreaInfo } from './types';

function requireAdapter() {
    const adapter = detectPlatform();
    if (!adapter) {
        throw new Error(`[safe-area] no supported mini-program runtime detected: expected ${describeExpectedRuntimes()}`);
    }
    return adapter;
}

export function getPlatformId(): PlatformId {
    const adapter = detectPlatform();
    return adapter ? adapter.id : 'unknown';
}

export function getSafeAreaInfo(): SafeAreaInfo {
    const adapter = requireAdapter();
    return toSafeAreaInfo(adapter.getRawSafeAreaData());
}

export function getMenuButtonRect(): Rect | null {
    const adapter = requireAdapter();
    return adapter.getMenuButtonRect();
}

export function getNavBarMetrics(): NavBarMetrics {
    const adapter = requireAdapter();
    const raw: RawSafeAreaData = adapter.getRawSafeAreaData();
    return computeNavBarMetrics(adapter.id, raw, adapter.getMenuButtonRect());
}

const safeArea = {
    getPlatformId,
    getSafeAreaInfo,
    getMenuButtonRect,
    getNavBarMetrics
};

export default safeArea;
