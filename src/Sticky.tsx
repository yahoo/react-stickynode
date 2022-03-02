/**
 * Copyright 2015, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

'use strict';

import React, { useRef, useEffect } from 'react';
import type { FC } from 'react';
import { subscribe } from 'subscribe-ui-event';
import type { Subscription } from 'subscribe-ui-event';
import classNames from 'classnames';
import shallowEqual from 'shallowequal';
import PropTypes from 'prop-types';

interface Window {
    Modernizr: any;
}

enum LocatingStatus {
    /* The default status, locating at the original position. */
    STATUS_ORIGINAL,
    /* The released status, locating at somewhere on document but not default one.  */
    STATUS_RELEASED,
    /* The sticky status, locating fixed to the top or the bottom of screen. */
    STATUS_FIXED
}

let TRANSFORM_PROP = 'transform';

// global variable for all instances
let doc:Document;
let docBody:Document['body'];
let docEl:Document['documentElement'];
let canEnableTransforms = true; // Use transform by default, so no Sticky on lower-end browser when no Modernizr
let M:Window['Modernizr'];
let scrollDelta = 0;
let win:Window;
let winHeight = -1;

interface ComponentVariableProps {
    delta: number;
    stickyTop: number;
    stickyBottom: number;
    frozen: boolean;
    skipNextScrollEvent: boolean;
    scrollTop: number;
    bottomBoundaryTarget?: HTMLElement;
    topTarget?: HTMLElement;
    subscribers?: Subscription[];
}

/* useGlobalVariable to use global variable */
const useComponentVariable = () => {
    const varRef = useRef<ComponentVariableProps>({
        delta: 0,
        frozen: false,
        scrollTop: 0,
        skipNextScrollEvent: false,
        stickyBottom: 0,
        stickyTop: 0,
        bottomBoundaryTarget: undefined,
        topTarget: undefined,
        subscribers: undefined
    });

    useEffect(() => {
        const resetVarRef = () => {
            varRef.current = {
                delta: 0,
                frozen: false,
                scrollTop: 0,
                skipNextScrollEvent: false,
                stickyBottom: 0,
                stickyTop: 0,
                bottomBoundaryTarget: undefined,
                topTarget: undefined,
                subscribers: undefined
            };
        };
        return () => {
            resetVarRef();
        }
    }, []);

    return varRef;
}

type StickyProps = {
    enabled?: boolean;
    top?: string | number;
    bottomBoundary?: string | number;
    enableTransforms?: boolean;
    activeClass?: string;
    releasedClass?: string;
    innerClass?: string;
    innerActiveClass?: string;
    className?: string;
    onStateChange?(p: { status: typeof LocatingStatus}): void;
    shouldFreeze?(): boolean;
    innerZ: string | number;
}

type InternalSticky = (props: StickyProps & {
    children?: React.ReactNode;
} & {
    ref?: React.Ref<any> | undefined;
}) => React.ReactElement;

type OriginReactFCProps = 'propTypes' | 'defaultProps' | 'displayName' | 'contextTypes';

interface StickyInterface extends InternalSticky, Pick<FC, OriginReactFCProps>{
    STATUS_ORIGINAL: LocatingStatus.STATUS_ORIGINAL;
    STATUS_RELEASED: LocatingStatus.STATUS_RELEASED;
    STATUS_FIXED: LocatingStatus.STATUS_FIXED;
}

const Sticky: StickyInterface = ({ children }) => {
    return <div></div>;
};

Sticky.displayName = 'Sticky';

Sticky.defaultProps = {
    shouldFreeze: function () {
        return false;
    },
    enabled: true,
    top: 0,
    bottomBoundary: 0,
    enableTransforms: true,
    activeClass: 'active',
    releasedClass: 'released',
    onStateChange: null,
    innerClass: '',
    innerActiveClass: '',
};

Sticky.STATUS_ORIGINAL = LocatingStatus.STATUS_ORIGINAL;
Sticky.STATUS_RELEASED = LocatingStatus.STATUS_RELEASED;
Sticky.STATUS_FIXED = LocatingStatus.STATUS_FIXED;

export default Sticky;
