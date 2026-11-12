/// <reference types="miniprogram-api-typings" />

export declare function _Component(opts?: WechatMiniprogram.Component.TrivialOption): string;

export interface SafeAreaTopProperties {
    extClass: string;
}

export interface SafeAreaBottomProperties {
    extClass: string;
}

export interface StatusbarSafeTopProperties {
    extClass: string;
}

export interface NavigationBarProperties {
    extClass: string;
    title: string;
    background: string;
    color: string;
    back: boolean;
    loading: boolean;
    homeButton: boolean;
    animated: boolean;
    show: boolean;
    delta: number;
    autoNavIcon: boolean;
    backIcon: string;
    homeIcon: string;
}

export interface NavigationBarBackEvent extends WechatMiniprogram.CustomEvent {
    detail: {
        delta: number;
    };
}

export interface NavigationBarHomeEvent extends WechatMiniprogram.CustomEvent {
    detail: Record<string, never>;
}

export interface NavBarBaseProperties {
    extClass: string;
}
