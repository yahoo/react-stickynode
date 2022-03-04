/**
 * Copyright 2015, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

'use strict';

import React, { useRef, useEffect, useState, useMemo, memo, useCallback } from 'react';
import type { FC, CSSProperties } from 'react';
import { subscribe } from 'subscribe-ui-event';
import type { Subscription, ArgmentedEvent } from 'subscribe-ui-event';
import classNames from 'classnames';
import shallowEqual from 'shallowequal';

declare interface Window {
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
    bottomBoundaryTarget: HTMLElement | null;
    topTarget: HTMLElement | null;
    subscribers?: Subscription[];
    hasMounted?: boolean;
}

type StickyProps = {
    enabled?: boolean;
    top?: string | number;
    bottomBoundary?: string | number | Record<string, any>;
    enableTransforms?: boolean;
    activeClass?: string;
    releasedClass?: string;
    innerClass?: string;
    innerActiveClass?: string;
    className?: string;
    onStateChange?(p: { status: LocatingStatus}): void;
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

type StickyStateProps = {
    /* A top offset from viewport top where Sticky sticks to when scrolling up */
    top: number;
    /* A bottom offset from viewport top where Sticky sticks to when scrolling down */
    bottom: number;
    /* Sticky width */
    width: number;
    /* Sticky height */
    height: number;
    /* The original x of Sticky */
    x: number;
    /* The original y of Sticky */
    y: number;
    /* The top boundary on document */
    topBoundary: number;
    /* The bottom boundary on document */
    bottomBoundary: number;
    /* The Sticky status */
    status: LocatingStatus;
    /* Real y-axis offset for rendering position-fixed and position-relative */
    pos: number;
    /* once browser info is available after mounted, it becomes true to avoid checksum error */
    activated: boolean;
};

/* useGlobalVariable to use global variable */
const useComponentVariable = () => {
    const varRef = useRef<ComponentVariableProps>({
        delta: 0,
        frozen: false,
        scrollTop: -1,
        skipNextScrollEvent: false,
        stickyBottom: 0,
        stickyTop: 0,
        bottomBoundaryTarget: null,
        topTarget: null,
        subscribers: undefined,
        hasMounted: false
    });

    useEffect(() => {
        const resetVarRef = () => {
            varRef.current = {
                delta: 0,
                frozen: false,
                scrollTop: -1,
                skipNextScrollEvent: false,
                stickyBottom: 0,
                stickyTop: 0,
                bottomBoundaryTarget: null,
                topTarget: null,
                subscribers: undefined,
                hasMounted: false
            };
        };
        return () => {
            const subscribers = varRef.current.subscribers || [];
            for (let i = subscribers.length - 1; i >= 0; i--) {
                varRef.current.subscribers?.[i]?.unsubscribe?.();
            }
            resetVarRef();
        }
    }, []);

    return varRef;
}

/**
 * @desc get dom offsetHeight
 * @param {HTMLElement} target dom
 * @return {number} dom offsetHeight
 */
const getTargetHeight = (target: HTMLElement) => (target && target.offsetHeight) || 0;

const Sticky: StickyInterface = ({ children, ...props }) => {
    const [state, setState] = useState<StickyStateProps>({
        top: 0,
        bottom: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        topBoundary: 0,
        bottomBoundary: Infinity,
        status: LocatingStatus.STATUS_ORIGINAL,
        pos: 0,
        activated: false,
    });
    const variable = useComponentVariable();
    const outerDom = useRef<HTMLDivElement>(null);
    const innerDom = useRef<HTMLDivElement>(null);

    const getTopPosition = useCallback((top?: string | number) => {
        // a top argument can be provided to override reading from the props
        top = top || props.top || 0;
        if (typeof top === 'string') {
            if (!variable.current.topTarget) {
                variable.current.topTarget = doc.querySelector(top) as HTMLElement;
            }
            top = getTargetHeight(variable.current.topTarget);
        }
        return top;
    }, [props.top, variable]);
    const getTargetBottom = useCallback((target: HTMLElement | null) => {
        if (!target) {
            return -1;
        }
        const rect = target.getBoundingClientRect();
        return variable.current.scrollTop + rect.bottom;
    }, []);
    const getBottomBoundary = useCallback((bottomBoundary?: string | number) => {
        // a bottomBoundary can be provided to avoid reading from the props
        let boundary = bottomBoundary || props.bottomBoundary;

        // TODO, bottomBoundary was an object, depricate it later.
        if (typeof boundary === 'object') {
            boundary = boundary.value || boundary.target || 0;
        }

        if (typeof boundary === 'string') {
            if (!variable.current.bottomBoundaryTarget) {
                variable.current.bottomBoundaryTarget = doc.querySelector(boundary);
            }
            boundary = getTargetBottom(variable.current.bottomBoundaryTarget);
        }
        return boundary && boundary > 0 ? boundary : Infinity;
    }, [getTargetBottom, props.bottomBoundary, variable])

    const reset = () => {
        setState((pre) => ({
            ...pre,
            status: LocatingStatus.STATUS_ORIGINAL,
            pos: 0,
        }));
    }
    const release = (pos: number) => {
        setState(pre => (
            {
                ...pre,
                status: LocatingStatus.STATUS_RELEASED,
                pos: pos - pre.y,
            }
        ));
    }
    const fix = (pos: number) => {
            setState(pre => ({
                ...pre,
                status: LocatingStatus.STATUS_FIXED,
                pos: pos,
            }));
    }
    /**
     * Update the initial position, width, and height. It should update whenever children change.
     * @param {Object} options optional top and bottomBoundary new values
     */
    const updateInitialDimension = useCallback((options?: Partial<Record<'top' | 'bottomBoundary', number>>) => {
        options = options || {};

        if (!outerDom.current || !innerDom.current) { return; }

        const outerRect = outerDom.current.getBoundingClientRect();
        const innerRect = innerDom.current.getBoundingClientRect();

        const width = outerRect.width || outerRect.right - outerRect.left;
        const height = innerRect.height || innerRect.bottom - innerRect.top;
        const outerY = outerRect.top + variable.current.scrollTop;

        setState(pre => ({
            ...pre,
            top: getTopPosition(options?.top),
            bottom: Math.min(state.top + height, winHeight),
            width,
            height,
            x: outerRect.left,
            y: outerY,
            bottomBoundary: getBottomBoundary(options?.bottomBoundary) as number,
            topBoundary: outerY,
        }));
    }, [getBottomBoundary, getTopPosition, state.top, variable]);

    const update = useCallback(() => {
        const disabled =
            !props.enabled ||
            state.bottomBoundary - state.topBoundary <=
            state.height ||
            (state.width === 0 && state.height === 0);

        if (disabled) {
            if (state.status !== LocatingStatus.STATUS_ORIGINAL) {
                reset();
            }
            return;
        }

        const delta = scrollDelta;
        // "top" and "bottom" are the positions that this.state.top and this.state.bottom project
        // on document from viewport.
        const top = variable.current.scrollTop + state.top;
        const bottom = variable.current.scrollTop + state.bottom;

        // There are 2 principles to make sure Sticky won't get wrong so much:
        // 1. Reset Sticky to the original postion when "top" <= topBoundary
        // 2. Release Sticky to the bottom boundary when "bottom" >= bottomBoundary
        if (top <= state.topBoundary) {
            // #1
            reset();
        } else if (bottom >= state.bottomBoundary) {
            // #2
            variable.current.stickyBottom = state.bottomBoundary;
            variable.current.stickyTop = variable.current.stickyBottom - state.height;
            release(variable.current.stickyTop);
        } else {
            if (state.height > winHeight - state.top) {
                // In this case, Sticky is higher then viewport minus top offset
                switch (state.status) {
                    case LocatingStatus.STATUS_ORIGINAL:
                        release(state.y);
                        variable.current.stickyTop = state.y;
                        variable.current.stickyBottom = variable.current.stickyTop + state.height;
                    // Commentting out "break" is on purpose, because there is a chance to transit to FIXED
                    // from ORIGINAL when calling window.scrollTo().
                    // break;
                    case LocatingStatus.STATUS_RELEASED:
                        // If "top" and "bottom" are inbetween stickyTop and stickyBottom, then Sticky is in
                        // RELEASE status. Otherwise, it changes to FIXED status, and its bottom sticks to
                        // viewport bottom when scrolling down, or its top sticks to viewport top when scrolling up.
                        variable.current.stickyBottom = variable.current.stickyTop + state.height;
                        if (delta > 0 && bottom > variable.current.stickyBottom) {
                            fix(state.bottom - state.height);
                        } else if (delta < 0 && top < variable.current.stickyTop) {
                            fix(state.top);
                        }
                        break;
                    case LocatingStatus.STATUS_FIXED:
                        // eslint-disable-next-line no-case-declarations
                        let toRelease = true;
                        // eslint-disable-next-line no-case-declarations
                        const pos = state.pos;
                        // eslint-disable-next-line no-case-declarations
                        const height = state.height;
                        // In regular cases, when Sticky is in FIXED status,
                        // 1. it's top will stick to the screen top,
                        // 2. it's bottom will stick to the screen bottom,
                        // 3. if not the cases above, then it's height gets changed
                        if (delta > 0 && pos === state.top) {
                            // case 1, and scrolling down
                            variable.current.stickyTop = top - delta;
                            variable.current.stickyBottom = variable.current.stickyTop + height;
                        } else if (
                            delta < 0 &&
                            pos === state.bottom - height
                        ) {
                            // case 2, and scrolling up
                            variable.current.stickyBottom = bottom - delta;
                            variable.current.stickyTop = variable.current.stickyBottom - height;
                        } else if (
                            pos !== state.bottom - height &&
                            pos !== state.top
                        ) {
                            // case 3
                            // This case only happens when Sticky's bottom sticks to the screen bottom and
                            // its height gets changed. Sticky should be in RELEASE status and update its
                            // sticky bottom by calculating how much height it changed.
                            const deltaHeight =
                                pos + height - state.bottom;
                            variable.current.stickyBottom = bottom - delta + deltaHeight;
                            variable.current.stickyTop = variable.current.stickyBottom - height;
                        } else {
                            toRelease = false;
                        }

                        if (toRelease) {
                            release(variable.current.stickyTop);
                        }
                        break;
                }
            } else {
                // In this case, Sticky is shorter then viewport minus top offset
                // and will always fix to the top offset of viewport
                fix(state.top);
            }
        }
        variable.current.delta = delta;
    }, [props.enabled, state.bottom, state.bottomBoundary, state.height, state.pos, state.status, state.top, state.topBoundary, state.width, state.y, variable]);

    const handleResize = useCallback((e: Event, ae: ArgmentedEvent<'resize'>) => {
        if (props.shouldFreeze?.()) { return; }

        winHeight = ae.resize.height;
        updateInitialDimension();
        update();
    }, []);

    const handleScrollStart = useCallback((e: Event, ae: ArgmentedEvent<'scrollStart'>) => {
        const frozen = variable.current.frozen = !!props.shouldFreeze?.();

        if (frozen) { return; }

        if (variable.current.scrollTop === ae.scroll.top) {
            // Scroll position hasn't changed,
            // do nothing
            variable.current.skipNextScrollEvent = true;
        } else {
            variable.current.scrollTop = ae.scroll.top;
            updateInitialDimension();
        }
    }, []);

    const handleScroll = useCallback((e: Event, ae: ArgmentedEvent<'scroll'>) => {
        // Scroll doesn't need to be handled
        if (variable.current.skipNextScrollEvent) {
            variable.current.skipNextScrollEvent = false;
            return;
        }

        scrollDelta = ae.scroll.delta;
        variable.current.scrollTop = ae.scroll.top;
        update();
    }, []);

    useEffect(() => {
        props.onStateChange?.({ status: state.status });
    }, [state.status, props.onStateChange]);

    useEffect(() => {
        updateInitialDimension();
        update();
    }, [props.top, props.bottomBoundary, updateInitialDimension, update]);

    useEffect(() => {
        if (props.enabled) {
            setTimeout(() => {
                setState(pre => ({ ...pre, activated: true }));
                updateInitialDimension();
                update();
            });
        } else {
            setTimeout(() => {
                setState(pre => ({ ...pre, activated: false }));
                reset()
            });
        }
    }, [props.enabled, update, updateInitialDimension]);

    useEffect(() => {
        if(variable.current.hasMounted) {
           return;
        }
        // Only initialize the globals if this is the first
        // time this component type has been mounted
        if (!win) {
            win = window as unknown as Window;
            doc = document;
            docEl = doc.documentElement;
            docBody = doc.body;
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            winHeight = win?.innerHeight || docEl.clientHeight;
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            M = window.Modernizr;
            // No Sticky on lower-end browser when no Modernizr
            if (M && M.prefixed) {
                canEnableTransforms = M.csstransforms3d;
                TRANSFORM_PROP = M.prefixed('transform');
            }
        }

        // when mount, the scrollTop is not necessary on the top
        variable.current.scrollTop = docBody.scrollTop + docEl.scrollTop;

        if (props.enabled) {
            setState(pre => ({ ...pre, activated: true }));
            updateInitialDimension();
            update();
        }
        // bind the listeners regardless if initially enabled - allows the component to toggle sticky functionality
        variable.current.subscribers = [
            subscribe('scrollStart', handleScrollStart.bind(this), {
                useRAF: true,
            }),
            subscribe('scroll', handleScroll.bind(this), {
                useRAF: true,
                enableScrollInfo: true,
            }),
            subscribe('resize', handleResize.bind(this), {
                enableResizeInfo: true,
            }),
        ];
        variable.current.hasMounted = true;
    }, [handleResize, handleScroll, handleScrollStart, props.enabled, update, updateInitialDimension, variable]);

    const _style = () => {
        const innerStyle: CSSProperties = {
            position: state.status === LocatingStatus.STATUS_FIXED ? 'fixed' : 'relative',
            top: state.status === LocatingStatus.STATUS_FIXED ? '0px' : '',
            zIndex: props.innerZ,
        };

        const outerStyle: CSSProperties = {};

        if (state.status !== LocatingStatus.STATUS_ORIGINAL) {
            innerStyle.width = state.width + 'px';
            outerStyle.height = state.height + 'px';
        }

        return {
            innerStyle,
            outerStyle
        };
    };
    const translate = (style: CSSProperties, pos: number) => {
        const enableTransforms =
            canEnableTransforms && props.enableTransforms;
        if (enableTransforms && state.activated) {
            style[TRANSFORM_PROP as 'transform'] =
                'translate3d(0,' + Math.round(pos) + 'px,0)';
        } else {
            style.top = pos + 'px';
        }
    }

    useEffect(() => {
        // always use translate3d to enhance the performance
        translate(_style().innerStyle, state.pos);
    });

    const outerClasses = classNames(
        'sticky-outer-wrapper',
        props.className,
        {
            [props.activeClass as string]: state.status === LocatingStatus.STATUS_FIXED,
            [props.releasedClass as string]:
            state.status === LocatingStatus.STATUS_RELEASED,
        }
    );

    const innerClasses = classNames(
        'sticky-inner-wrapper',
        props.innerClass,
        {
            [props.innerActiveClass as string]:
            state.status === LocatingStatus.STATUS_FIXED,
        }
    );

    console.log(_style(), "ceshi")


    return (
        <div
            ref={outerDom}
            className={outerClasses}
            style={_style().outerStyle}
        >
            <div
                ref={innerDom}
                className={innerClasses}
                style={_style().innerStyle}
            >
                {typeof children === 'function'
                    ? children({ status: state.status })
                    : children}
            </div>
        </div>
    );
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

export default memo(Sticky, (prevProps, nextProps) => {
    return (
        !prevProps?.shouldFreeze?.() &&
        !(
            shallowEqual(prevProps, nextProps)
        )
    );
});
