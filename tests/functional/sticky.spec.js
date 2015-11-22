/* global describe, it, beforeEach, expect, window, document */

function $ (selector) {
    var node = document.querySelector(selector);
    var rect = node.getBoundingClientRect();
    return {
        getRect: function () {
            return rect;
        },
        getTop: function () {
            return rect.top;
        },
        getBottom: function () {
            return rect.bottom;
        }
    };
}

describe('Sticky', function () {
    beforeEach(function (done) {
        window.scrollTo(0, 0);
        setTimeout(function test () {
            done();
        }, 100);
    });

    it('Sticky 1 should stick to the top', function (done) {
        window.scrollTo(0, 500);

        setTimeout(function test () {
            // console.log($('#sticky-1').getRect());
            expect($('#sticky-1').getTop()).to.equal(0, 'sticky-1');
            done();
        }, 200);
    });

    it('Sticky 2 should not stick to the top', function (done) {
        window.scrollTo(0, 500);
        setTimeout(function test () {
            // console.log($('#sticky-2').getRect());
            expect($('#sticky-2').getTop()).to.below(0, 'sticky-2');

            window.scrollTo(0, 1200);
            setTimeout(function test () {
                // console.log($('#sticky-2').getRect());
                expect($('#sticky-2').getBottom()).to.below(window.innerHeight, 'sticky-2');
                done();
            }, 200);
        }, 200);
    });
});
