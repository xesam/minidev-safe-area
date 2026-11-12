export type PlatformId = 'wechat' | 'alipay' | 'douyin' | 'unknown';

export type RuntimePlatform = 'ios' | 'android' | 'harmony' | 'devtools' | 'windows' | 'mac' | 'unknown';

export interface Rect {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
}

export interface RawSafeAreaData {
    runtimePlatform: RuntimePlatform;
    windowWidth: number;
    windowHeight: number;
    safeArea: Rect | null;
    statusBarHeight: number;
}

export interface NormalizedSafeAreaData {
    runtimePlatform: RuntimePlatform;
    windowWidth: number;
    windowHeight: number;
    safeArea: Rect;
    statusBarHeight: number;
}

export interface SafeAreaInfo extends NormalizedSafeAreaData {
    safeAreaTop: number;
    bottomInset: number;
    useCSSSafeAreaEnv: boolean;
}

export interface NavBarMetrics {
    platformId: PlatformId;
    runtimePlatform: RuntimePlatform;
    statusBarHeight: number;
    barHeight: number;
    capsule: Rect | null;
    capsuleRightGap: number;
}
