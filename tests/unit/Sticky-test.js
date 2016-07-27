/**
 * Copyright 2015, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
/* global window, document, describe, it, beforeEach, afterEach */

'use strict';

process.env.NODE_ENV = 'development';
var jsx = require('jsx-test').jsxTranspile(process.env.COVERAGE);

var ae;
var ee = require('subscribe-ui-event/dist/globalVars').EE;
var expect = require('expect.js');
var sinon = require('sinon');
var inner;
var outer;
var ReactDOM = require('react-dom');
var Sticky = require('../../../dist/Sticky');
var sticky;

var STICKY_WIDTH = 100;
var STICKY_HEIGHT = 300;
var STICKY_TOP = 0;
var SCROLL_POS = 0;

ae = {
    scroll: {
        top: SCROLL_POS,
        delta: 0
    },
    resize: {
        height: 0
    }
};

window.HTMLElement.prototype.getBoundingClientRect = function () {
    return {
        bottom: STICKY_TOP - SCROLL_POS + STICKY_HEIGHT,
        height: STICKY_HEIGHT,
        left: 0,
        right: STICKY_WIDTH,
        top: STICKY_TOP - SCROLL_POS,
        width: STICKY_WIDTH
    };
};

document.querySelector = function () {
    return {
        offsetHeight: 20,
        getBoundingClientRect: function () {
            return {
                bottom: 400 - SCROLL_POS
            };
        }
    };
};

Object.defineProperties(window.HTMLElement.prototype, {
    offsetHeight: {
        get: function () {
            return STICKY_HEIGHT;
        }
    },
    offsetWidth: {
        get: function () {
            return STICKY_WIDTH;
        }
    }
});

window.scrollTo = function (x, y) {
    SCROLL_POS = y;
    ae.scroll.delta = SCROLL_POS - ae.scroll.top;
    ae.scroll.top = SCROLL_POS;
    ee.emit('scrollStart:raf', {}, ae);
    ee.emit('scroll:raf', {}, ae);
};

window.resizeTo = function (x, y) {
    ae.resize.height = y;
    ee.emit('resize:50', {}, ae);
};

function shouldBeFixedAt (t, pos) {
    var style = t._style;
    expect(style.width).to.be('100px');
    expect(style.transform).to.be('translate3d(0,' + pos + 'px,0)');
    expect(style.position).to.be('fixed');
    expect(style.top).to.be('0px');
}

function shouldBeReleasedAt (t, pos) {
    var style = t._style;
    expect(style.width).to.be('100px');
    expect(style.transform).to.be('translate3d(0,' + pos + 'px,0)');
    expect(style.position).to.be('relative');
    expect(style.top).to.be('');
}

function shouldBeReset (t) {
    var style = t._style;
    expect(style.transform).to.be('translate3d(0,0px,0)');
    expect(style.position).to.be('relative');
    expect(style.top).to.be('');
}

function checkTransform3d (inner) {
    var style = inner._style;
    expect(style.transform).to.contain('translate3d');
}

describe('Sticky', function () {
    beforeEach(function () {
        STICKY_WIDTH = 100;
        STICKY_HEIGHT = 300;
        STICKY_TOP = 0;
        SCROLL_POS = 0;
        ae.scroll.top = 0;
        ae.scroll.delta = 0;
    });

    afterEach(function () {
        jsx.unmountComponent();
    });

    it('should work as expected (short Sticky)', function () {
        sticky = jsx.renderComponent(Sticky);
        outer = ReactDOM.findDOMNode(sticky);
        inner = outer.firstChild;

        // regular case
        expect(outer.className).to.contain('sticky-outer-wrapper');
        expect(inner.className).to.contain('sticky-inner-wrapper');
        // should always have translate3d
        checkTransform3d(inner);

        // Scroll down to 10px, and Sticky should fix
        window.scrollTo(0, 10);
        shouldBeFixedAt(inner, 0);
        expect(outer.className).to.contain('active');
        expect(outer.className).to.not.contain('released');

        // Scroll up to 0px, and Sticky should reset
        window.scrollTo(0, 0);
        shouldBeReset(inner);
        expect(outer.className).to.not.contain('active');
        expect(outer.className).to.not.contain('released');

        // Increase coverage
        sticky.componentWillReceiveProps();
    });

    it('should call the callback on state change', function () {
        var callback = sinon.spy();
        sticky = jsx.renderComponent(Sticky, {
            onStateChange: callback
        });
        outer = ReactDOM.findDOMNode(sticky);
        inner = outer.firstChild;

        sinon.assert.notCalled(callback);

        // Scroll down to 10px, and status should change to FIXED
        window.scrollTo(0, 10);
        sinon.assert.calledWith(callback, {status: Sticky.STATUS_FIXED});

        // Scroll up to 0px, and Sticky should reset
        window.scrollTo(0, 0);
        sinon.assert.calledTwice(callback);
        sinon.assert.calledWith(callback.secondCall, {status: Sticky.STATUS_ORIGINAL});
    });

    it('should work as expected (long Sticky)', function () {
        STICKY_HEIGHT = 1200;
        sticky = jsx.renderComponent(Sticky);
        outer = ReactDOM.findDOMNode(sticky);
        inner = outer.firstChild;

        // regular case
        expect(outer.className).to.contain('sticky-outer-wrapper');
        expect(inner.className).to.contain('sticky-inner-wrapper');
        // should always have translate3d
        checkTransform3d(inner);

        // Scroll down to 10px, and Sticky should stay as it was
        window.scrollTo(0, 10);
        shouldBeReleasedAt(inner, 0);
        expect(outer.className).to.not.contain('active');

        // Scroll down to 1500px, and Sticky should fix to the bottom
        window.scrollTo(0, 1500);
        shouldBeFixedAt(inner, -432);
        expect(outer.className).to.contain('active');
        expect(outer.className).to.not.contain('released');

        // Scroll up to 1300px, and Sticky should release
        window.scrollTo(0, 1300);
        shouldBeReleasedAt(inner, 1068);
        expect(outer.className).to.not.contain('active');
        expect(outer.className).to.contain('released');

        // Scroll down to 1350px, and Sticky should release as it was
        window.scrollTo(0, 1350);
        shouldBeReleasedAt(inner, 1068);
        expect(outer.className).to.not.contain('active');
        expect(outer.className).to.contain('released');

        // Scroll up to 10px, and Sticky should fix
        window.scrollTo(0, 10);
        shouldBeFixedAt(inner, 0);
        expect(outer.className).to.contain('active');
        expect(outer.className).not.to.contain('released');

        // Scroll down to 20px, and Sticky should release
        window.scrollTo(0, 20);
        shouldBeReleasedAt(inner, 10);
        expect(outer.className).to.not.contain('active');
        expect(outer.className).to.contain('released');
    });

    it('should work as expected with original postion 20px from top (short Sticky)', function () {
        STICKY_TOP = 20;
        sticky = jsx.renderComponent(Sticky);
        outer = ReactDOM.findDOMNode(sticky);
        inner = outer.firstChild;

        // regular case
        expect(outer.className).to.contain('sticky-outer-wrapper');
        expect(inner.className).to.contain('sticky-inner-wrapper');
        // should always have translate3d
        checkTransform3d(inner);

        // Scroll down to 10px, and Sticky should stay
        window.scrollTo(0, 10);
        shouldBeReset(inner);
        expect(outer.className).to.not.contain('active');
        expect(outer.className).to.not.contain('released');

        // Scroll down to 50px, and Sticky should fix
        window.scrollTo(0, 50);
        shouldBeFixedAt(inner, 0);
        expect(outer.className).to.contain('active');
        expect(outer.className).to.not.contain('released');
    });

    it('should work as expected with original top 20px and 400px bottom boundary (short Sticky)', function () {
        STICKY_TOP = 20;
        sticky = jsx.renderComponent(Sticky, {
            bottomBoundary: 400
        });
        outer = ReactDOM.findDOMNode(sticky);
        inner = outer.firstChild;

        // regular case
        expect(outer.className).to.contain('sticky-outer-wrapper');
        expect(inner.className).to.contain('sticky-inner-wrapper');
        // should always have translate3d
        checkTransform3d(inner);

        // Scroll down to 10px, and Sticky should stay
        window.scrollTo(0, 10);
        shouldBeReset(inner);
        expect(outer.className).to.not.contain('active');
        expect(outer.className).to.not.contain('released');

        // Scroll down to 50px, and Sticky should fix
        window.scrollTo(0, 50);
        shouldBeFixedAt(inner, 0);
        expect(outer.className).to.contain('active');
        expect(outer.className).to.not.contain('released');

        // Scroll down to 150px, and Sticky should release
        window.scrollTo(0, 150);
        shouldBeReleasedAt(inner, 80);
        expect(outer.className).to.not.contain('active');
        expect(outer.className).to.contain('released');
    });

    it('should not be sticky if bottom boundary is shorter then its height (short Sticky)', function () {
        sticky = jsx.renderComponent(Sticky, {
            bottomBoundary: 200
        });
        outer = ReactDOM.findDOMNode(sticky);
        inner = outer.firstChild;

        // regular case
        expect(outer.className).to.contain('sticky-outer-wrapper');
        expect(inner.className).to.contain('sticky-inner-wrapper');
        // should always have translate3d
        checkTransform3d(inner);

        // Scroll down to 10px, and Sticky should stay
        window.scrollTo(0, 10);
        shouldBeReset(inner);
        expect(outer.className).to.not.contain('active');
        expect(outer.className).to.not.contain('released');

        // Micic status was not 0 (STATUS_ORIGINAL), scroll down to 20px, and Sticky should stay
        sticky.state.status = 2; // STATUS_FIXED;
        window.scrollTo(0, 20);
        shouldBeReset(inner);
        expect(outer.className).to.not.contain('active');
        expect(outer.className).to.not.contain('released');
    });

    it('should work as expected with selector bottom boundary (short Sticky)', function () {
        sticky = jsx.renderComponent(Sticky, {
            top: '#test',
            bottomBoundary: '#test'
        });
        outer = ReactDOM.findDOMNode(sticky);
        inner = outer.firstChild;

        // regular case
        expect(outer.className).to.contain('sticky-outer-wrapper');
        expect(inner.className).to.contain('sticky-inner-wrapper');
        // should always have translate3d
        checkTransform3d(inner);

        // Scroll down to 10px, and Sticky should fix
        window.scrollTo(0, 10);
        shouldBeFixedAt(inner, 20);
        expect(outer.className).to.contain('active');
        expect(outer.className).to.not.contain('released');

        // Scroll down to 50px, and Sticky should fix
        window.scrollTo(0, 50);
        shouldBeFixedAt(inner, 20);
        expect(outer.className).to.contain('active');
        expect(outer.className).to.not.contain('released');

        // Scroll down to 150px, and Sticky should release
        window.scrollTo(0, 150);
        shouldBeReleasedAt(inner, 100);
        expect(outer.className).to.not.contain('active');
        expect(outer.className).to.contain('released');
    });

    it('should stick to the top when window resizes larger then Sticky (long Sticky)', function () {
        STICKY_HEIGHT = 800;
        sticky = jsx.renderComponent(Sticky);
        outer = ReactDOM.findDOMNode(sticky);
        inner = outer.firstChild;

        // regular case
        expect(outer.className).to.contain('sticky-outer-wrapper');
        expect(inner.className).to.contain('sticky-inner-wrapper');
        // should always have translate3d
        checkTransform3d(inner);

        // Scroll down to 10px, and Sticky should fix
        window.scrollTo(0, 10);
        shouldBeReleasedAt(inner, 0);
        expect(outer.className).to.not.contain('active');
        expect(outer.className).to.contain('released');

        window.resizeTo(0, 900);
        shouldBeFixedAt(inner, 0);
        expect(outer.className).to.contain('active');
        expect(outer.className).to.not.contain('released');

        // Resize back
        window.resizeTo(0, 768);
    });

    it('should release when height gets changed (long Sticky)', function () {
        STICKY_HEIGHT = 1200;
        sticky = jsx.renderComponent(Sticky);
        outer = ReactDOM.findDOMNode(sticky);
        inner = outer.firstChild;

        // regular case
        expect(outer.className).to.contain('sticky-outer-wrapper');
        expect(inner.className).to.contain('sticky-inner-wrapper');
        // should always have translate3d
        checkTransform3d(inner);

        // Scroll down to 10px, and Sticky should stay as it was
        window.scrollTo(0, 10);
        shouldBeReleasedAt(inner, 0);
        expect(outer.className).to.not.contain('active');
        expect(outer.className).to.contain('released');

        // Scroll down to 1500px, and Sticky should fix to the bottom
        window.scrollTo(0, 1500);
        shouldBeFixedAt(inner, -432);
        expect(outer.className).to.contain('active');
        expect(outer.className).to.not.contain('released');

        // Change Sticky's height
        STICKY_HEIGHT = 1300;

        // Scroll down to 1550px, and Sticky should release and stay where it was
        window.scrollTo(0, 1550);
        shouldBeReleasedAt(inner, 1068);
        expect(outer.className).to.not.contain('active');
        expect(outer.className).to.contain('released');

        // Scroll down to 1650px, and Sticky should become fixed again
        window.scrollTo(0, 1650);
        shouldBeFixedAt(inner, -532);
        expect(outer.className).to.contain('active');
        expect(outer.className).to.not.contain('released');
    });

    it('should allow the sticky functionality to be toggled off', function () {
        var ReactTestUtils = require('react-addons-test-utils');
        var React = require('react');
        // setup a wrapper to simulate the controlling of the sticky prop
        var ParentComponent = React.createFactory(React.createClass({
            getInitialState() {
                return { enabled: true };
            },
            render() {
                return <Sticky ref="sticky" enabled={this.state.enabled} />
            }
        }));

        var parent = ReactTestUtils.renderIntoDocument(ParentComponent());
        // toggle the enabled prop off
        parent.setState({enabled: false});
        // assert that the toggle of the props and state
        expect(parent.refs.sticky.props.enabled).to.eql(false);
        expect(parent.refs.sticky.state.activated).to.eql(false);
        // toggle the enabled prop on
        parent.setState({enabled: true});
        expect(parent.refs.sticky.props.enabled).to.eql(true);
        expect(parent.refs.sticky.state.activated).to.eql(true);
    });
});
