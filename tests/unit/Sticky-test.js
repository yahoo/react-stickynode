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
    ee.emit('scrollStart:15:raf', {}, ae);
    ee.emit('scroll:15:raf', {}, ae);
};

window.resizeTo = function (x, y) {
    ae.resize.height = y;
    ee.emit('resize:50', {}, ae);
};

function shouldBeFixedAt (t, pos) {
    var style = t._reactInternalComponent._currentElement.props.style;
    expect(style.width).to.be(100);
    expect(style.transform).to.be('translate3d(0,' + pos + 'px,0)');
    expect(style.position).to.be('fixed');
    expect(style.top).to.be('0');
}

function shouldBeReleasedAt (t, pos) {
    var style = t._reactInternalComponent._currentElement.props.style;
    expect(style.width).to.be(100);
    expect(style.transform).to.be('translate3d(0,' + pos + 'px,0)');
    expect(style.position).to.be('relative');
    expect(style.top).to.be('');
}

function shouldBeReset (t) {
    var style = t._reactInternalComponent._currentElement.props.style;
    expect(style.transform).to.be('translate3d(0,0px,0)');
    expect(style.position).to.be('relative');
    expect(style.top).to.be('');
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
        expect(inner.getAttribute('style')).to.contain('transform:translate3d');

        // Scroll down to 10px, and Sticky should fix
        window.scrollTo(0, 10);
        shouldBeFixedAt(inner, 0);

        // Scroll up to 0px, and Sticky should reset
        window.scrollTo(0, 0);
        shouldBeReset(inner);
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
        expect(inner.getAttribute('style')).to.contain('transform:translate3d');

        // Scroll down to 10px, and Sticky should stay as it was
        window.scrollTo(0, 10);
        shouldBeReleasedAt(inner, 0);

        // Scroll down to 1500px, and Sticky should fix to the bottom
        window.scrollTo(0, 1500);
        shouldBeFixedAt(inner, -432);

        // Scroll up to 1300px, and Sticky should release
        window.scrollTo(0, 1300);
        shouldBeReleasedAt(inner, 1068);

        // Scroll down to 1350px, and Sticky should release as it was
        window.scrollTo(0, 1350);
        shouldBeReleasedAt(inner, 1068);

        // Scroll up to 10px, and Sticky should fix
        window.scrollTo(0, 10);
        shouldBeFixedAt(inner, 0);

        // Scroll down to 20px, and Sticky should release
        window.scrollTo(0, 20);
        shouldBeReleasedAt(inner, 10);
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
        expect(inner.getAttribute('style')).to.contain('transform:translate3d');

        // Scroll down to 10px, and Sticky should stay
        window.scrollTo(0, 10);
        shouldBeReset(inner);

        // Scroll down to 50px, and Sticky should fix
        window.scrollTo(0, 50);
        shouldBeFixedAt(inner, 0);
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
        expect(inner.getAttribute('style')).to.contain('transform:translate3d');

        // Scroll down to 10px, and Sticky should stay
        window.scrollTo(0, 10);
        shouldBeReset(inner);

        // Scroll down to 50px, and Sticky should fix
        window.scrollTo(0, 50);
        shouldBeFixedAt(inner, 0);

        // Scroll down to 150px, and Sticky should release
        window.scrollTo(0, 150);
        shouldBeReleasedAt(inner, 80);
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
        expect(inner.getAttribute('style')).to.contain('transform:translate3d');

        // Scroll down to 10px, and Sticky should stay
        window.scrollTo(0, 10);
        shouldBeReset(inner);

        // Micic status was not 0 (STATUS_ORIGINAL), scroll down to 20px, and Sticky should stay
        sticky.state.status = 2; // STATUS_FIXED;
        window.scrollTo(0, 20);
        shouldBeReset(inner);
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
        expect(inner.getAttribute('style')).to.contain('transform:translate3d');

        // Scroll down to 10px, and Sticky should fix
        window.scrollTo(0, 10);
        shouldBeFixedAt(inner, 20);

        // Scroll down to 50px, and Sticky should fix
        window.scrollTo(0, 50);
        shouldBeFixedAt(inner, 20);

        // Scroll down to 150px, and Sticky should release
        window.scrollTo(0, 150);
        shouldBeReleasedAt(inner, 100);
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
        expect(inner.getAttribute('style')).to.contain('transform:translate3d');

        // Scroll down to 10px, and Sticky should fix
        window.scrollTo(0, 10);
        shouldBeReleasedAt(inner, 0);

        window.resizeTo(0, 900);
        shouldBeFixedAt(inner, 0);
    });
});
