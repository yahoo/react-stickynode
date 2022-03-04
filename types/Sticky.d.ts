/**
 * Copyright 2015, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
import React from 'react';
import type { FC } from 'react';
declare enum LocatingStatus {
    STATUS_ORIGINAL = 0,
    STATUS_RELEASED = 1,
    STATUS_FIXED = 2
}
declare type StickyProps = {
    enabled?: boolean;
    top?: string | number;
    bottomBoundary?: string | number | Record<string, any>;
    enableTransforms?: boolean;
    activeClass?: string;
    releasedClass?: string;
    innerClass?: string;
    innerActiveClass?: string;
    className?: string;
    onStateChange?(p: {
        status: LocatingStatus;
    }): void;
    shouldFreeze?(): boolean;
    innerZ: string | number;
};
declare type InternalSticky = (props: StickyProps & {
    children?: React.ReactNode;
} & {
    ref?: React.Ref<any> | undefined;
}) => React.ReactElement;
declare type OriginReactFCProps = 'propTypes' | 'defaultProps' | 'displayName' | 'contextTypes';
interface StickyInterface extends InternalSticky, Pick<FC, OriginReactFCProps> {
    STATUS_ORIGINAL: LocatingStatus.STATUS_ORIGINAL;
    STATUS_RELEASED: LocatingStatus.STATUS_RELEASED;
    STATUS_FIXED: LocatingStatus.STATUS_FIXED;
}
declare const _default: React.MemoExoticComponent<StickyInterface>;
export default _default;
//# sourceMappingURL=Sticky.d.ts.map