/**
 * Copyright 2015, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
/* global window, document */

'use strict';

var React = require('react');

var classNames = require('classnames');
var shallowCompare = require('react-addons-shallow-compare');
var subscribe = require('subscribe-ui-event').subscribe;

// constants
var STATUS_ORIGINAL = 0; // The default status, locating at the original position.
var STATUS_RELEASED = 1; // The released status, locating at somewhere on document but not default one.
var STATUS_FIXED = 2; // The sticky status, locating fixed to the top or the bottom of screen.
var TRANSFORM_PROP = 'transform';

// global variable for all instances
var doc;
var docBody;
var docEl;
var enableTransforms = true; // Use transform by default, so no Sticky on lower-end browser when no Modernizr
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
        enableTransforms = M.csstransforms3d;
        TRANSFORM_PROP = M.prefixed('transform');
    }
}

var Sticky = React.createClass({
    /**
     * @param {Bool} enabled A switch to enable or disable Sticky.
     * @param {String/Number} top A top offset px for Sticky. Could be a selector representing a node
     *        whose height should serve as the top offset.
     * @param {String/Number} bottomBoundary A bottom boundary px on document where Sticky will stop.
     *        Could be a selector representing a node whose bottom should serve as the bottom boudary.
     */
    propTpes: {
        enabled: React.PropTypes.bool,
        top: React.PropTypes.oneOfType([
            React.PropTypes.string,
            React.PropTypes.number
        ]),
        bottomBoundary: React.PropTypes.oneOfType([
            React.PropTypes.object,  // TODO, may remove
            React.PropTypes.string,
            React.PropTypes.number
        ])
    },

    getDefaultProps: function () {
        return {
            enabled: true,
            top: 0,
            bottomBoundary: 0
        };
    },

    getInitialState: function () {
        this.delta = 0;
        this.stickyTop = 0;
        this.stickyBottom = 0;

        this.bottomBoundaryTarget;
        this.topTarget;
        this.subscribers;

        return {
            top: 0, // A top offset px from screen top for Sticky when scrolling down
            bottom: 0, // A bottom offset px from screen top for Sticky when scrolling up *1*
            width: 0, // Sticky width
            height: 0, // Sticky height
            x: 0, // The original x of Sticky
            y: 0, // The original y of Sticky
            topBoundary: 0, // The top boundary on document
            bottomBoundary: Infinity, // The bottom boundary on document
            status: STATUS_ORIGINAL, // The Sticky status
            pos: 0 // Real y-axis offset for rendering position-fixed and position-relative
        };
        // *1* When Sticky is higher then screen, it will be screen bottom.
        //     When Sticky is shorter, it will be the difference of Sticky bottom and screen top.
    },

    getTargetHeight: function (target) {
        return target && target.offsetHeight || 0;
    },

    getTopPosition: function () {
        // TODO, topTarget is for current layout, may remove
        var top = this.props.top || this.props.topTarget || 0;
        if (typeof top === 'string') {
            if (!this.topTarget) {
                this.topTarget = doc.querySelector(top);
            }
            top = this.getTargetHeight(this.topTarget);
        }
        return top;
    },

    getTargetBottom: function (target) {
        if (!target) {
            return -1;
        }
        var rect = target.getBoundingClientRect();
        return scrollTop + rect.bottom;
    },

    getBottomBoundary: function () {
        var boundary = this.props.bottomBoundary;

        // TODO, bottomBoundary was an object, depricate it later.
        if (typeof boundary === 'object') {
            boundary = boundary.value || boundary.target || 0;
        }

        if (typeof boundary === 'string') {
            if (!this.bottomBoundaryTarget) {
                this.bottomBoundaryTarget = doc.querySelector(boundary);
            }
            boundary = this.getTargetBottom(this.bottomBoundaryTarget);
        }
        return boundary && boundary > 0 ? boundary : Infinity;
    },

    changeDirection: function (d1, d2) {
        d2 = d2 || this.delta;
        return (d1 !== 0 && d2 !== 0) && (d1 > 0 ^ d2 > 0);
    },

    reset: function () {
        this.setState({
            status: STATUS_ORIGINAL,
            pos: 0
        });
    },

    release: function (pos) {
        this.setState({
            status: STATUS_RELEASED,
            pos: pos - this.state.y
        });
    },

    fix: function (pos) {
        this.setState({
            status: STATUS_FIXED,
            pos: pos
        });
    },

    /**
     * Update the initial position, width, and height. It should update whenever children change.
     */
    updateInitialDimension: function () {
        this.timer = +new Date;
        var outer = this.refs.outer;
        var inner = this.refs.inner;
        var outerRect = outer.getBoundingClientRect();

        var width = outer.offsetWidth;
        var height = inner.offsetHeight;
        var outerY = outerRect.top + scrollTop;

        this.setState({
            top: this.getTopPosition(),
            bottom: Math.min(this.state.top + height, winHeight),
            width: width,
            height: height,
            x: outerRect.left,
            y: outerY,
            bottomBoundary: this.getBottomBoundary(),
            topBoundary: outerY
        });
    },

    handleResize: function (e, ae) {
        winHeight = ae.resize.height;
        this.updateInitialDimension();
        this.update();
    },

    handleScrollStart: function (e, ae) {
        scrollTop = ae.scroll.top;
        this.updateInitialDimension();
    },

    handleScroll: function (e, ae) {
        scrollDelta = ae.scroll.delta;
        scrollTop = ae.scroll.top;
        this.update();
    },

    /**
     * Update Sticky position.
     * In this function, all coordinates of Sticky and scren are projected to document, so the local variables
     * "top"/"bottom" mean the expected top/bottom of Sticky on document. They will move when scrolling.
     *
     * There are 2 principles to make sure Sticky won't get wrong so much:
     * 1. Reset Sticky to the original postion when "top" <= topBoundary
     * 2. Release Sticky to the bottom boundary when "bottom" >= bottomBoundary
     *
     * If "top" and "bottom" are between the boundaries, Sticky will always fix to the top of screen
     * when it is shorter then screen. If Sticky is taller then screen, then it will
     * 1. Fix to the bottom of screen when scrolling down and "bottom" > Sticky current bottom
     * 2. Fix to the top of screen when scrolling up and "top" < Sticky current top
     * (The above 2 points act kind of "bottom" dragging Sticky down or "top" dragging it up.)
     * 3. Release Sticky when "top" and "bottom" are between Sticky current top and bottom.
     */
    update: function () {
        if (this.state.bottomBoundary - this.state.topBoundary <= this.state.height || !this.props.enabled) {
            if (this.state.status !== STATUS_ORIGINAL) {
                this.reset();
            }
            return;
        }

        var delta = scrollDelta;
        var top = scrollTop + this.state.top;
        var bottom = scrollTop + this.state.bottom;

        if (top <= this.state.topBoundary) {
            this.reset();
        } else if (bottom >= this.state.bottomBoundary) {
            this.stickyBottom = this.state.bottomBoundary;
            this.stickyTop = this.stickyBottom - this.state.height;
            this.release(this.stickyTop);
        } else {
            if (this.state.height > winHeight) {
                // In this case, Sticky is larger then screen
                switch (this.state.status) {
                    case STATUS_ORIGINAL:
                        this.release(this.state.y);
                        this.stickyTop = this.state.y;
                        this.stickyBottom = this.stickyTop + this.state.height;
                        break;
                    case STATUS_RELEASED:
                        if (delta > 0 && bottom > this.stickyBottom) { // scroll down
                            this.fix(this.state.bottom - this.state.height);
                        } else if (delta < 0 && top < this.stickyTop) { // scroll up
                            this.fix(this.state.top);
                        }
                        break;
                    case STATUS_FIXED:
                        var isChanged = true;
                        if (delta > 0 && this.state.pos === this.state.top) { // scroll down
                            this.stickyTop = top - delta;
                            this.stickyBottom = this.stickyTop + this.state.height;
                        } else if (delta < 0 && this.state.pos === this.state.bottom - this.state.height) { // up
                            this.stickyBottom = bottom - delta;
                            this.stickyTop = this.stickyBottom - this.state.height;
                        } else {
                            isChanged = false;
                        }

                        if (isChanged) {
                            this.release(this.stickyTop);
                        }
                        break;
                }
            } else {
                this.fix(this.state.top);
            }
        }
        this.delta = delta;
    },

    componentWillReceiveProps: function () {
        this.forceUpdate();
    },

    componentWillUnmount: function componentWillUnmount() {
        var subscribers = this.subscribers || [];
        for (var i = subscribers.length - 1; i >= 0; i--) {
            this.subscribers[i].unsubscribe();
        }
    },

    componentDidMount: function () {
        if (this.props.enabled) {
            this.updateInitialDimension();
            this.subscribers = [
                subscribe('scrollStart', this.handleScrollStart, {useRAF: true}),
                subscribe('scroll', this.handleScroll, {useRAF: true, enableScrollInfo: true}),
                subscribe('resize', this.handleResize, {enableResizeInfo: true})
            ];
        }
    },

    translate: function (style, pos) {
        if (enableTransforms) {
            style[TRANSFORM_PROP] = 'translate3d(0,' + pos + 'px,0)';
        } else {
            style.top = pos;
        }
    },

    shouldComponentUpdate: function(nextProps, nextState) {
        return shallowCompare(this, nextProps, nextState);
    },

    render: function () {
        // TODO, "overflow: auto" prevents collapse, need a good way to get children height
        var style = {
            overflow: 'hidden',
            position: this.state.status === STATUS_FIXED ? 'fixed' : 'relative',
            top: this.state.status === STATUS_FIXED ? '0' : ''
        };

        // always use translate3d to enhance the performance
        this.translate(style, this.state.pos);
        if (this.state.status !== STATUS_ORIGINAL) {
            style.width = this.state.width;
        }

        return (
            <div ref='outer' className={classNames('sticky-outer-wrapper', this.props.className)}>
                <div ref='inner' className='sticky-inner-wrapper' style={style}>
                    {this.props.children}
                </div>
            </div>
        );
    },
});

module.exports = Sticky;
