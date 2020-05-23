/**
 * Copyright 2015, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
/* global window, document, describe, it, beforeEach, afterEach */

'use strict';

process.env.NODE_ENV = 'development';

const ee = require('subscribe-ui-event/dist/globalVars').EE;
const { cleanup, fireEvent, render } = require('@testing-library/react');
const React = require('react');
const ReactDOM = require('react-dom');
const Sticky = require('../../dist/Sticky');

const STICKY_CLASS_OUTER = 'sticky-outer-wrapper';
const STICKY_CLASS_INNER = 'sticky-inner-wrapper';

let ae;
let sticky;
let inner;
let outer;

let STICKY_WIDTH = 100;
let STICKY_HEIGHT = 300;
let STICKY_TOP = 0;
let SCROLL_POS = 0;

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
    const style = t._style || t.style;
    expect(style.width).toBe('100px');
    expect(style.transform).toBe('translate3d(0,' + pos + 'px,0)');
    expect(style.position).toBe('fixed');
    expect(style.top).toBe('0px');
}

function shouldBeReleasedAt (t, pos) {
    const style = t._style || t.style;
    expect(style.width).toBe('100px');
    expect(style.transform).toBe('translate3d(0,' + pos + 'px,0)');
    expect(style.position).toBe('relative');
    expect(style.top).toBe('');
}

function shouldBeReset (t) {
    const style = t._style || t.style;
    expect(style.transform).toBe('translate3d(0,0px,0)');
    expect(style.position).toBe('relative');
    expect(style.top).toBe('');
}

function checkTransform3d (inner) {
    const style = inner._style || inner.style;
    expect(style.transform).toContain('translate3d');
}

describe('Sticky', () => {
    beforeEach(() => {
        STICKY_WIDTH = 100;
        STICKY_HEIGHT = 300;
        STICKY_TOP = 0;
        SCROLL_POS = 0;
        ae.scroll.top = 0;
        ae.scroll.delta = 0;
    });

    afterEach(() => {
        // jsx.unmountComponent();
    });

    test('should work as expected (short Sticky)', () => {
        const { container } = render(<Sticky />);

        outer = container.querySelector(`.${STICKY_CLASS_OUTER}`);
        inner = container.querySelector(`.${STICKY_CLASS_INNER}`);
        
        expect(outer.className).toContain(STICKY_CLASS_OUTER);
        expect(inner.className).toContain(STICKY_CLASS_INNER);
        
        // should always have translate3d
        checkTransform3d(inner);

        // Scroll down to 10px, and Sticky should fix
        window.scrollTo(0, 10);
        shouldBeFixedAt(inner, 0);
        expect(outer.className).toContain('active');
        expect(outer.className).not.toContain('released');
        
        // Scroll up to 0px, and Sticky should reset
        window.scrollTo(0, 0);
        shouldBeReset(inner);
        expect(outer.className).not.toContain('active');
        expect(outer.className).not.toContain('released');
    });

    test('should call the callback on state change', () => {
        const callback = jest.fn();
        const { container } = render(
          <Sticky onStateChange={callback} />
        );

        expect(callback).not.toHaveBeenCalled();

        // Scroll down to 10px, and status should change to FIXED
        window.scrollTo(0, 10);
        expect(callback).toHaveBeenCalledWith({status: Sticky.STATUS_FIXED});

        // Scroll up to 0px, and Sticky should reset
        window.scrollTo(0, 0);
        expect(callback).toHaveBeenCalledTimes(2);
        expect(callback).toHaveBeenCalledWith({status: Sticky.STATUS_FIXED});
    });

    test('should call the children function on state change', () => {
        const childrenStub = jest.fn().mockReturnValue(null);
        expect(childrenStub).not.toHaveBeenCalled();

        const { container } = render(
          <Sticky>
            {childrenStub}
          </Sticky>
        );
        
        // Scroll down to 10px, and status should change to FIXED
        window.scrollTo(0, 10);
        expect(childrenStub).toHaveBeenCalledWith({status: Sticky.STATUS_FIXED});
        
        // Scroll up to 0px, and Sticky should reset
        window.scrollTo(0, 0);
        expect(childrenStub).toHaveBeenCalledWith({status: Sticky.STATUS_FIXED});
    });

    test('should work as expected (long Sticky)', () => {
        STICKY_HEIGHT = 1200;
        const { container } = render(
          <Sticky />
        );

        outer = container.querySelector(`.${STICKY_CLASS_OUTER}`);
        inner = container.querySelector(`.${STICKY_CLASS_INNER}`);
        
        expect(outer.className).toContain(STICKY_CLASS_OUTER);
        expect(inner.className).toContain(STICKY_CLASS_INNER);
        
        // should always have translate3d
        checkTransform3d(inner);

        // Scroll down to 10px, and Sticky should stay as it was
        window.scrollTo(0, 10);
        shouldBeReleasedAt(inner, 0);
        expect(outer.className).not.toContain('active');
        
        // Scroll down to 1500px, and Sticky should fix to the bottom
        window.scrollTo(0, 1500);
        shouldBeFixedAt(inner, -432);
        expect(outer.className).toContain('active');
        expect(outer.className).not.toContain('released');
        
        // Scroll up to 1300px, and Sticky should release
        window.scrollTo(0, 1300);
        shouldBeReleasedAt(inner, 1068);
        expect(outer.className).not.toContain('active');
        expect(outer.className).toContain('released');
        
        // Scroll down to 1350px, and Sticky should release as it was
        window.scrollTo(0, 1350);
        shouldBeReleasedAt(inner, 1068);
        expect(outer.className).not.toContain('active');
        expect(outer.className).toContain('released');
        
        // Scroll up to 10px, and Sticky should fix
        window.scrollTo(0, 10);
        shouldBeFixedAt(inner, 0);
        expect(outer.className).toContain('active');
        expect(outer.className).not.toContain('released');
        
        // Scroll down to 20px, and Sticky should release
        window.scrollTo(0, 20);
        shouldBeReleasedAt(inner, 10);
        expect(outer.className).not.toContain('active');
        expect(outer.className).toContain('released');
    });

    test(
        'should work as expected with original postion 20px from top (short Sticky)',
        () => {
            STICKY_TOP = 20;
            const { container } = render(
              <Sticky />
            );

            outer = container.querySelector(`.${STICKY_CLASS_OUTER}`);
            inner = container.querySelector(`.${STICKY_CLASS_INNER}`);
            
            expect(outer.className).toContain(STICKY_CLASS_OUTER);
            expect(inner.className).toContain(STICKY_CLASS_INNER);
            
            // should always have translate3d
            checkTransform3d(inner);

            // Scroll down to 10px, and Sticky should stay
            window.scrollTo(0, 10);
            shouldBeReset(inner);
            expect(outer.className).not.toContain('active');
            expect(outer.className).not.toContain('released');

            // Scroll down to 50px, and Sticky should fix
            window.scrollTo(0, 50);
            shouldBeFixedAt(inner, 0);
            expect(outer.className).toContain('active');
            expect(outer.className).not.toContain('released');
        }
    );

    test(
        'should work as expected with original top 20px and 400px bottom boundary (short Sticky)',
        () => {
            STICKY_TOP = 20;
            const { container } = render(
              <Sticky bottomBoundary={400} />
            );

            outer = container.querySelector(`.${STICKY_CLASS_OUTER}`);
            inner = container.querySelector(`.${STICKY_CLASS_INNER}`);
            
            expect(outer.className).toContain(STICKY_CLASS_OUTER);
            expect(inner.className).toContain(STICKY_CLASS_INNER);
            
            // should always have translate3d
            checkTransform3d(inner);

            // Scroll down to 10px, and Sticky should stay
            window.scrollTo(0, 10);
            shouldBeReset(inner);
            expect(outer.className).not.toContain('active');
            expect(outer.className).not.toContain('released');

            // Scroll down to 50px, and Sticky should fix
            window.scrollTo(0, 50);
            shouldBeFixedAt(inner, 0);
            expect(outer.className).toContain('active');
            expect(outer.className).not.toContain('released');

            // Scroll down to 150px, and Sticky should release
            window.scrollTo(0, 150);
            shouldBeReleasedAt(inner, 80);
            expect(outer.className).not.toContain('active');
            expect(outer.className).toContain('released');
        }
    );

    test(
        'should not be sticky if bottom boundary is shorter then its height (short Sticky)',
        () => {
            const { container } = render(
              <Sticky bottomBoundary={200} />
            );

            outer = container.querySelector(`.${STICKY_CLASS_OUTER}`);
            inner = container.querySelector(`.${STICKY_CLASS_INNER}`);
            
            expect(outer.className).toContain(STICKY_CLASS_OUTER);
            expect(inner.className).toContain(STICKY_CLASS_INNER);
            
            // should always have translate3d
            checkTransform3d(inner);

            // Scroll down to 10px, and Sticky should stay
            window.scrollTo(0, 10);
            shouldBeReset(inner);
            expect(outer.className).not.toContain('active');
            expect(outer.className).not.toContain('released');

            // Micic status was not 0 (STATUS_ORIGINAL), scroll down to 20px, and Sticky should stay
            // container.state.status = 2; // STATUS_FIXED;
            window.scrollTo(0, 20);
            shouldBeReset(inner);
            expect(outer.className).not.toContain('active');
            expect(outer.className).not.toContain('released');
        }
    );
    
    test(
        'should work as expected with selector bottom boundary (short Sticky)',
        () => {
            const { container } = render(
              <Sticky top='#test' bottomBoundary='#test' />
            );

            outer = container.querySelector(`.${STICKY_CLASS_OUTER}`);
            inner = container.querySelector(`.${STICKY_CLASS_INNER}`);
            
            expect(outer.className).toContain(STICKY_CLASS_OUTER);
            expect(inner.className).toContain(STICKY_CLASS_INNER);
            
            // should always have translate3d
            checkTransform3d(inner);

            // Scroll down to 10px, and Sticky should fix
            window.scrollTo(0, 10);
            shouldBeFixedAt(inner, 20);
            expect(outer.className).toContain('active');
            expect(outer.className).not.toContain('released');

            // Scroll down to 50px, and Sticky should fix
            window.scrollTo(0, 50);
            shouldBeFixedAt(inner, 20);
            expect(outer.className).toContain('active');
            expect(outer.className).not.toContain('released');

            // Scroll down to 150px, and Sticky should release
            window.scrollTo(0, 150);
            shouldBeReleasedAt(inner, 100);
            expect(outer.className).not.toContain('active');
            expect(outer.className).toContain('released');
        }
    );

    test(
        'should stick to the top when window resizes larger then Sticky (long Sticky)',
        () => {
            STICKY_HEIGHT = 800;            
            const { container } = render(
              <Sticky />
            );

            outer = container.querySelector(`.${STICKY_CLASS_OUTER}`);
            inner = container.querySelector(`.${STICKY_CLASS_INNER}`);
            
            expect(outer.className).toContain(STICKY_CLASS_OUTER);
            expect(inner.className).toContain(STICKY_CLASS_INNER);
            
            // should always have translate3d
            checkTransform3d(inner);

            // Scroll down to 10px, and Sticky should fix
            window.scrollTo(0, 10);
            shouldBeReleasedAt(inner, 0);
            expect(outer.className).not.toContain('active');
            expect(outer.className).toContain('released');

            window.resizeTo(0, 900);
            shouldBeFixedAt(inner, 0);
            expect(outer.className).toContain('active');
            expect(outer.className).not.toContain('released');

            // Resize back
            window.resizeTo(0, 768);
        }
    );

    test('should release when height gets changed (long Sticky)', () => {
        STICKY_HEIGHT = 1200;
        const { container } = render(
          <Sticky />
        );

        outer = container.querySelector(`.${STICKY_CLASS_OUTER}`);
        inner = container.querySelector(`.${STICKY_CLASS_INNER}`);
        
        expect(outer.className).toContain(STICKY_CLASS_OUTER);
        expect(inner.className).toContain(STICKY_CLASS_INNER);
        
        // should always have translate3d
        checkTransform3d(inner);

        // Scroll down to 10px, and Sticky should stay as it was
        window.scrollTo(0, 10);
        shouldBeReleasedAt(inner, 0);
        expect(outer.className).not.toContain('active');
        expect(outer.className).toContain('released');

        // Scroll down to 1500px, and Sticky should fix to the bottom
        window.scrollTo(0, 1500);
        shouldBeFixedAt(inner, -432);
        expect(outer.className).toContain('active');
        expect(outer.className).not.toContain('released');

        // Change Sticky's height
        STICKY_HEIGHT = 1300;

        // Scroll down to 1550px, and Sticky should release and stay where it was
        window.scrollTo(0, 1550);
        shouldBeReleasedAt(inner, 1068);
        expect(outer.className).not.toContain('active');
        expect(outer.className).toContain('released');

        // Scroll down to 1650px, and Sticky should become fixed again
        window.scrollTo(0, 1650);
        shouldBeFixedAt(inner, -532);
        expect(outer.className).toContain('active');
        expect(outer.className).not.toContain('released');
    });

    test('should allow the sticky functionality to be toggled off', () => {
        var ReactTestUtils = require('react-dom/test-utils');
        var React = require('react');

        // setup a wrapper to simulate the controlling of the sticky prop
        class TestComponent extends React.Component {
            constructor(props) {
                super(props);

                this.sticky = null;
                this.setTextInputRef = element => {
                    this.sticky = element;
                };

                this.state = { boundary: '', enabled: true, name: 'JOE' }; 
            }

            render() {
                return (
                    <Sticky
                        ref="sticky"
                        bottomBoundary={`#boundary{this.state.boundary}`}
                        enabled={this.state.enabled}
                    >
                        {this.state.name}
                        {this.state.enabled && <div id="boundary"/>}
                    </Sticky>
                )
            }
        }

        var parent = ReactTestUtils.renderIntoDocument(React.createElement(TestComponent, {}));

        // toggle the enabled prop off
        parent.setState({enabled: false});
        expect(parent.refs.sticky.props.enabled).toEqual(false);
        expect(parent.refs.sticky.state.activated).toEqual(false);
        expect(parent.refs.sticky.props.children).toContain('JOE');

        // should not error while not enabled & other props changed
        parent.setState({name: 'JENKINS'});
        expect(parent.refs.sticky.props.enabled).toEqual(false);
        expect(parent.refs.sticky.props.children).toContain('JENKINS');

        // should not error while not enabled & boundary changes
        parent.setState({boundary: '-not-present'});
        expect(parent.refs.sticky.props.enabled).toEqual(false);
        expect(parent.refs.sticky.props.children).toContain('JENKINS');
        parent.setState({boundary: ''});

        // toggle the enabled prop on
        parent.setState({enabled: true});
        expect(parent.refs.sticky.props.enabled).toEqual(true);
        expect(parent.refs.sticky.state.activated).toEqual(true);
    });
});
