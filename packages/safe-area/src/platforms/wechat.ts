import type { RawSafeAreaData, Rect, RuntimePlatform } from '../types';
import type { PlatformAdapter } from './index';

interface WxRect {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
}

interface WxWindowInfo {
    windowWidth: number;
    windowHeight: number;
    safeArea: WxRect | null;
    statusBarHeight: number;
}

interface WxDeviceInfo {
    platform: string;
}

interface WxSystemInfo {
    windowWidth: number;
    windowHeight: number;
    safeArea: WxRect | null;
    statusBarHeight: number;
    platform: string;
}

interface WxApi {
    getWindowInfo?: () => WxWindowInfo;
    getDeviceInfo?: () => WxDeviceInfo;
    getSystemInfoSync?: () => WxSystemInfo;
    getMenuButtonBoundingClientRect?: () => WxRect;
}

declare const wx: WxApi | undefined;

export function isAvailable(): boolean {
    return typeof wx !== 'undefined';
}

function getWx(): WxApi {
    if (typeof wx === 'undefined') {
        throw new Error('[safe-area] wechat runtime (wx) is not available');
    }
    return wx;
}

function normalizeRuntimePlatform(platform: unknown): RuntimePlatform {
    if (typeof platform !== 'string') {
        return 'unknown';
    }
    const value = platform.toLowerCase();
    if (value === 'ios' || value === 'android' || value === 'devtools' || value === 'windows' || value === 'mac') {
        return value;
    }
    if (value === 'harmony' || value === 'harmonyos' || value === 'ohos') {
        return 'harmony';
    }
    return 'unknown';
}

function toRect(rect: WxRect): Rect {
    return {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height
    };
}

function isValidRect(rect: Rect): boolean {
    return [rect.left, rect.top, rect.right, rect.bottom, rect.width, rect.height].every((value) => Number.isFinite(value));
}

function readSystemInfo(api: WxApi): WxSystemInfo {
    if (typeof api.getWindowInfo === 'function' && typeof api.getDeviceInfo === 'function') {
        const { windowWidth, windowHeight, safeArea, statusBarHeight } = api.getWindowInfo();
        return { windowWidth, windowHeight, safeArea, statusBarHeight, platform: api.getDeviceInfo().platform };
    }
    if (typeof api.getSystemInfoSync === 'function') {
        return api.getSystemInfoSync();
    }
    throw new Error('[safe-area] no available wechat API for window info (expected getWindowInfo/getDeviceInfo or getSystemInfoSync)');
}

export function getRawSafeAreaData(): RawSafeAreaData {
    const systemInfo = readSystemInfo(getWx());
    return {
        runtimePlatform: normalizeRuntimePlatform(systemInfo.platform),
        windowWidth: systemInfo.windowWidth,
        windowHeight: systemInfo.windowHeight,
        safeArea: systemInfo.safeArea ? toRect(systemInfo.safeArea) : null,
        statusBarHeight: systemInfo.statusBarHeight
    };
}

export function getMenuButtonRect(): Rect | null {
    const api = getWx();
    if (typeof api.getMenuButtonBoundingClientRect !== 'function') {
        return null;
    }
    const rect = toRect(api.getMenuButtonBoundingClientRect());
    if (!isValidRect(rect) || rect.width <= 0 || rect.height <= 0) {
        return null;
    }
    return rect;
}

export const adapter: PlatformAdapter = {
    id: 'wechat',
    globalName: 'wx',
    isAvailable,
    getRawSafeAreaData,
    getMenuButtonRect
};
