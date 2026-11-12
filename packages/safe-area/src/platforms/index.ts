import type { PlatformId, RawSafeAreaData, Rect } from '../types';
import { adapter as wechatAdapter } from './wechat';

export interface PlatformAdapter {
    id: PlatformId;
    globalName: string;
    isAvailable(): boolean;
    getRawSafeAreaData(): RawSafeAreaData;
    getMenuButtonRect(): Rect | null;
}

const adapters: PlatformAdapter[] = [wechatAdapter];

export function detectPlatform(): PlatformAdapter | null {
    for (const adapter of adapters) {
        if (adapter.isAvailable()) {
            return adapter;
        }
    }
    return null;
}

export function describeExpectedRuntimes(): string {
    return adapters.map((adapter) => `${adapter.globalName} (${adapter.id})`).join(' or ');
}
