import type { NavBarMetrics, NormalizedSafeAreaData, PlatformId, RawSafeAreaData, Rect, SafeAreaInfo } from './types';

function isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

function isValidSafeArea(rect: Rect | null): rect is Rect {
    if (rect === null) {
        return false;
    }
    return (
        isFiniteNumber(rect.left) &&
        isFiniteNumber(rect.top) &&
        isFiniteNumber(rect.right) &&
        isFiniteNumber(rect.bottom) &&
        isFiniteNumber(rect.width) &&
        isFiniteNumber(rect.height) &&
        rect.width > 0 &&
        rect.height > 0
    );
}

export function normalizeRawSafeAreaData(raw: RawSafeAreaData): NormalizedSafeAreaData {
    const { windowWidth, windowHeight } = raw;
    if (!isFiniteNumber(windowWidth) || !isFiniteNumber(windowHeight)) {
        throw new Error(`[safe-area] invalid window dimensions: windowWidth=${windowWidth}, windowHeight=${windowHeight}`);
    }
    const statusBarHeight = isFiniteNumber(raw.statusBarHeight) ? raw.statusBarHeight : 0;
    const safeArea = isValidSafeArea(raw.safeArea)
        ? raw.safeArea
        : {
              left: 0,
              top: statusBarHeight,
              right: windowWidth,
              bottom: windowHeight,
              width: windowWidth,
              height: windowHeight - statusBarHeight
          };
    return {
        runtimePlatform: raw.runtimePlatform,
        windowWidth,
        windowHeight,
        safeArea,
        statusBarHeight
    };
}

function deriveUseCSSSafeAreaEnv(runtimePlatform: NormalizedSafeAreaData['runtimePlatform']): boolean {
    return runtimePlatform === 'ios' || runtimePlatform === 'windows' || runtimePlatform === 'mac';
}

export function toSafeAreaInfo(raw: RawSafeAreaData): SafeAreaInfo {
    const data = normalizeRawSafeAreaData(raw);
    const { runtimePlatform, windowWidth, windowHeight, safeArea, statusBarHeight } = data;
    return {
        runtimePlatform,
        windowWidth,
        windowHeight,
        safeArea,
        statusBarHeight,
        safeAreaTop: safeArea.top,
        bottomInset: windowHeight - safeArea.bottom,
        useCSSSafeAreaEnv: deriveUseCSSSafeAreaEnv(runtimePlatform)
    };
}

function isValidCapsule(capsule: Rect | null, statusBarHeight: number): capsule is Rect {
    if (capsule === null) {
        return false;
    }
    return (
        [capsule.left, capsule.top, capsule.right, capsule.bottom, capsule.width, capsule.height].every((value) => Number.isFinite(value)) &&
        capsule.top - statusBarHeight >= 0 &&
        capsule.height > 0
    );
}

function deriveBarHeight(data: NormalizedSafeAreaData, capsule: Rect | null): number {
    if (capsule === null) {
        return data.runtimePlatform === 'android' ? 48 : 44;
    }
    return (capsule.top - data.statusBarHeight) * 2 + capsule.height;
}

export function computeNavBarMetrics(platformId: PlatformId, raw: RawSafeAreaData, capsule: Rect | null): NavBarMetrics {
    const data = normalizeRawSafeAreaData(raw);
    const usableCapsule = isValidCapsule(capsule, data.statusBarHeight) ? capsule : null;
    return {
        platformId,
        runtimePlatform: data.runtimePlatform,
        statusBarHeight: data.statusBarHeight,
        barHeight: deriveBarHeight(data, usableCapsule),
        capsule,
        capsuleRightGap: usableCapsule ? data.windowWidth - usableCapsule.left : 0
    };
}
