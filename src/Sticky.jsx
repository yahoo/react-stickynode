/**
 * Copyright 2015, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
/* global window, document */

'use strict';

import React, {Component, PropTypes} from 'react';

import {subscribe} from 'subscribe-ui-event';
import classNames from 'classnames';
import isEqual from 'is-equal-shallow';

// constants
const STATUS_ORIGINAL = 0; // The default status, locating at the original position.
const STATUS_RELEASED = 1; // The released status, locating at somewhere on document but not default one.
const STATUS_FIXED = 2; // The sticky status, locating fixed to the top or the bottom of screen.

var TRANSFORM_PROP = 'transform';

// global variable for all instances
var doc;
var docBody;
var docEl;
var canEnableTransforms = true; // Use transform by default, so no Sticky on lower-end browser when no Modernizr
var M;
var scrollDelta = 0;
var scrollTop = -1;
var win;
var winHeight = -1;

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    win = window;
    doc = document;
    docEl = doc.documentElement;
    docBody = doc.body;
    scrollTop = docBody.scrollTop + docEl.scrollTop;
    winHeight = win.innerHeight || docEl.clientHeight;
    M = window.Modernizr;
    // No Sticky on lower-end browser when no Modernizr
    if (M) {
        canEnableTransforms = M.csstransforms3d;
        TRANSFORM_PROP = M.prefixed('transform');
    }
}

class Sticky extends Component {
    constructor (props, context) {
        super(props, context);
        this.handleResize = this.handleResize.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.handleScrollStart = this.handleScrollStart.bind(this);
        this.delta = 0;
        this.stickyTop = 0;
        this.stickyBottom = 0;
        this.frozen = false;

        this.bottomBoundaryTarget;
        this.topTarget;
        this.subscribers;

        this.state = {
            top: 0, // A top offset from viewport top where Sticky sticks to when scrolling up
            bottom: 0, // A bottom offset from viewport top where Sticky sticks to when scrolling down
            width: 0, // Sticky width
            height: 0, // Sticky height
            x: 0, // The original x of Sticky
            y: 0, // The original y of Sticky
            topBoundary: 0, // The top boundary on document
            bottomBoundary: Infinity, // The bottom boundary on document
            status: STATUS_ORIGINAL, // The Sticky status
            pos: 0, // Real y-axis offset for rendering position-fixed and position-relative
            activated: false // once browser info is available after mounted, it becomes true to avoid checksum error
        };
    }

    getTargetHeight (target) {
        return target && target.offsetHeight || 0;
    }

    getTopPosition (top) {
        var self = this;
        // TODO, topTarget is for current layout, may remove
        // a top argument can be provided to override reading from the props
        top = top || self.props.top || self.props.topTarget || 0;
        if (typeof top === 'string') {
            if (!self.topTarget) {
                self.topTarget = doc.querySelector(top);
            }
            top = self.getTargetHeight(self.topTarget);
        }
        return top;
    }

    getTargetBottom (target) {
        if (!target) {
            return -1;
        }
        var rect = target.getBoundingClientRect();
        return scrollTop + rect.bottom;
    }

    getBottomBoundary (bottomBoundary) {
        var self = this;
        // a bottomBoundary can be provided to avoid reading from the props
        var boundary = bottomBoundary || self.props.bottomBoundary;

        // TODO, bottomBoundary was an object, depricate it later.
        if (typeof boundary === 'object') {
            boundary = boundary.value || boundary.target || 0;
        }

        if (typeof boundary === 'string') {
            if (!self.bottomBoundaryTarget) {
                self.bottomBoundaryTarget = doc.querySelector(boundary);
            }
            boundary = self.getTargetBottom(self.bottomBoundaryTarget);
        }
        return boundary && boundary > 0 ? boundary : Infinity;
    }

    reset () {
        this.setState({
            status: STATUS_ORIGINAL,
            pos: 0
        });
    }

    release (pos) {
        this.setState({
            status: STATUS_RELEASED,
            pos: pos - this.state.y
        });
    }

    fix (pos) {
        this.setState({
            status: STATUS_FIXED,
            pos: pos
        });
    }

    /**
     * Update the initial position, width, and height. It should update whenever children change.
     * @param {Object} options optional top and bottomBoundary new values
     */
    updateInitialDimension (options) {
        options = options || {}
        var self = this;

        var {outer, inner} = self.refs;

        var outerRect = outer.getBoundingClientRect();
        var innerRect = inner.getBoundingClientRect();

        var width = outerRect.width || outerRect.right - outerRect.left;
        var height = innerRect.height || innerRect.bottom - innerRect.top;;
        var outerY = outerRect.top + scrollTop;

        self.setState({
            top: self.getTopPosition(options.top),
            bottom: Math.min(self.state.top + height, winHeight),
            width: width,
            height: height,
            x: outerRect.left,
            y: outerY,
            bottomBoundary: self.getBottomBoundary(options.bottomBoundary),
            topBoundary: outerY
        });
    }

    handleResize (e, ae) {
        if (this.props.shouldFreeze()) {
            return;
        }

        winHeight = ae.resize.height;
        this.updateInitialDimension();
        this.update();
    }

    handleScrollStart (e, ae) {
        this.frozen = this.props.shouldFreeze();

        if (this.frozen) {
            return;
        }
        
        scrollTop = ae.scroll.top;
        this.updateInitialDimension();
    }

    handleScroll (e, ae) {
        if (this.frozen) { 
            return;
        }

        scrollDelta = ae.scroll.delta;
        scrollTop = ae.scroll.top;
        this.update();
    }

    /**
     * Update Sticky position.
     */
    update () {
        var self = this;
        var disabled = !self.props.enabled ||
            self.state.bottomBoundary - self.state.topBoundary <= self.state.height ||
            (self.state.width === 0 && self.state.height === 0);

        if (disabled) {
            if (self.state.status !== STATUS_ORIGINAL) {
                self.reset();
            }
            return;
        }

        var delta = scrollDelta;
        // "top" and "bottom" are the positions that self.state.top and self.state.bottom project
        // on document from viewport.
        var top = scrollTop + self.state.top;
        var bottom = scrollTop + self.state.bottom;

        // There are 2 principles to make sure Sticky won't get wrong so much:
        // 1. Reset Sticky to the original postion when "top" <= topBoundary
        // 2. Release Sticky to the bottom boundary when "bottom" >= bottomBoundary
        if (top <= self.state.topBoundary) { // #1
            self.reset();
        } else if (bottom >= self.state.bottomBoundary) { // #2
            self.stickyBottom = self.state.bottomBoundary;
            self.stickyTop = self.stickyBottom - self.state.height;
            self.release(self.stickyTop);
        } else {
            if (self.state.height > winHeight - self.state.top) {
                // In this case, Sticky is higher then viewport minus top offset
                switch (self.state.status) {
                    case STATUS_ORIGINAL:
                        self.release(self.state.y);
                        self.stickyTop = self.state.y;
                        self.stickyBottom = self.stickyTop + self.state.height;
                        // Commentting out "break" is on purpose, because there is a chance to transit to FIXED
                        // from ORIGINAL when calling window.scrollTo().
                        // break;
                    case STATUS_RELEASED:
                        // If "top" and "bottom" are inbetween stickyTop and stickyBottom, then Sticky is in
                        // RELEASE status. Otherwise, it changes to FIXED status, and its bottom sticks to
                        // viewport bottom when scrolling down, or its top sticks to viewport top when scrolling up.
                        self.stickyBottom = self.stickyTop + self.state.height;
                        if (delta > 0 && bottom > self.stickyBottom) {
                            self.fix(self.state.bottom - self.state.height);
                        } else if (delta < 0 && top < self.stickyTop) {
                            this.fix(self.state.top);
                        }
                        break;
                    case STATUS_FIXED:
                        var toRelease = true;
                        var pos = self.state.pos;
                        var height = self.state.height;
                        // In regular cases, when Sticky is in FIXED status,
                        // 1. it's top will stick to the screen top,
                        // 2. it's bottom will stick to the screen bottom,
                        // 3. if not the cases above, then it's height gets changed
                        if (delta > 0 && pos === self.state.top) { // case 1, and scrolling down
                            self.stickyTop = top - delta;
                            self.stickyBottom = self.stickyTop + height;
                        } else if (delta < 0 && pos === self.state.bottom - height) { // case 2, and scrolling up
                            self.stickyBottom = bottom - delta;
                            self.stickyTop = self.stickyBottom - height;
                        } else if (pos !== self.state.bottom - height && pos !== self.state.top) { // case 3
                            // This case only happens when Sticky's bottom sticks to the screen bottom and
                            // its height gets changed. Sticky should be in RELEASE status and update its
                            // sticky bottom by calculating how much height it changed.
                            var deltaHeight = (pos + height - self.state.bottom);
                            self.stickyBottom = bottom + deltaHeight;
                            self.stickyTop = self.stickyBottom - height;
                        } else {
                            toRelease = false;
                        }

                        if (toRelease) {
                            self.release(self.stickyTop);
                        }
                        break;
                }
            } else {
                // In this case, Sticky is shorter then viewport minus top offset
                // and will always fix to the top offset of viewport
                self.fix(self.state.top);
            }
        }
        self.delta = delta;
    }

    componentWillReceiveProps (nextProps) {
        this.updateInitialDimension(nextProps);
        this.update();
    }

    componentDidUpdate(prevProps, prevState) {
        var self = this;
        if (prevState.status !== self.state.status && self.props.onStateChange) {
            self.props.onStateChange({status: self.state.status});
        }
        // if the props for enabling are toggled, then trigger the update or reset depending on the current props
        if (prevProps.enabled !== self.props.enabled) {
            if (self.props.enabled) {
                this.setState({activated: true}, () => {
                    self.updateInitialDimension();
                    self.update();
                });
            } else {
                this.setState({activated: false}, () => {
                    self.reset();
                });
            }
        }
    }

    componentWillUnmount () {
        var subscribers = this.subscribers || [];
        for (var i = subscribers.length - 1; i >= 0; i--) {
            this.subscribers[i].unsubscribe();
        }
    }

    componentDidMount () {
        var self = this;
        // when mount, the scrollTop is not necessary on the top
        scrollTop = docBody.scrollTop + docEl.scrollTop;

        if (self.props.enabled) {
            self.setState({activated: true});
            self.updateInitialDimension();
            this.update();
        }
        // bind the listeners regardless if initially enabled - allows the component to toggle sticky functionality
        self.subscribers = [
            subscribe('scrollStart', self.handleScrollStart.bind(self), {useRAF: true}),
            subscribe('scroll', self.handleScroll.bind(self), {useRAF: true, enableScrollInfo: true}),
            subscribe('resize', self.handleResize.bind(self), {enableResizeInfo: true})
        ];
    }

    translate (style, pos) {
        var enableTransforms = canEnableTransforms && this.props.enableTransforms
        if (enableTransforms && this.state.activated) {
            style[TRANSFORM_PROP] = 'translate3d(0,' + pos + 'px,0)';
        } else {
            style.top = pos + 'px';
        }
    }

    shouldComponentUpdate (nextProps, nextState) {
        return !this.props.shouldFreeze() && (!isEqual(this.props, nextProps) || !isEqual(this.state, nextState));
    }

    render () {
        var self = this;
        // TODO, "overflow: auto" prevents collapse, need a good way to get children height
        var innerStyle = {
            position: self.state.status === STATUS_FIXED ? 'fixed' : 'relative',
            top: self.state.status === STATUS_FIXED ? '0px' : ''
        };
        var outerStyle = {};

        // always use translate3d to enhance the performance
        self.translate(innerStyle, self.state.pos);
        if (self.state.status !== STATUS_ORIGINAL) {
            innerStyle.width = self.state.width + 'px';
            outerStyle.height = self.state.height + 'px';
        }

        return (
            <div ref='outer' className={classNames('sticky-outer-wrapper', self.props.className, {[self.props.activeClass]: self.state.status === STATUS_FIXED})} style={outerStyle}>
                <div ref='inner' className='sticky-inner-wrapper' style={innerStyle}>
                    {self.props.children}
                </div>
            </div>
        );
    }
}

Sticky.displayName = 'Sticky';

Sticky.defaultProps = {
    shouldFreeze: function () { return false; },
    enabled: true,
    top: 0,
    bottomBoundary: 0,
    enableTransforms: true,
    activeClass: 'active',
    onStateChange: null
};

/**
 * @param {Bool} enabled A switch to enable or disable Sticky.
 * @param {String/Number} top A top offset px for Sticky. Could be a selector representing a node
 *        whose height should serve as the top offset.
 * @param {String/Number} bottomBoundary A bottom boundary px on document where Sticky will stop.
 *        Could be a selector representing a node whose bottom should serve as the bottom boudary.
 */
Sticky.propTypes = {
    enabled: PropTypes.bool,
    top: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
    ]),
    bottomBoundary: PropTypes.oneOfType([
        PropTypes.object,  // TODO, may remove
        PropTypes.string,
        PropTypes.number
    ]),
    enableTransforms: PropTypes.bool,
    activeClass: PropTypes.string,
    onStateChange: PropTypes.func,
    shouldFreeze: PropTypes.func
};

Sticky.STATUS_ORIGINAL = STATUS_ORIGINAL;
Sticky.STATUS_RELEASED = STATUS_RELEASED;
Sticky.STATUS_FIXED = STATUS_FIXED;

module.exports = Sticky;
