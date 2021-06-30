"use strict";

require("core-js/modules/es.array.concat.js");

require("core-js/modules/es.object.to-string.js");

require("core-js/modules/es.promise.js");

require("regenerator-runtime/runtime.js");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var util = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(selector) {
    var node, rect;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return $(selector);

          case 2:
            node = _context.sent;
            rect = node.getBoundingClientRect();
            return _context.abrupt("return", {
              getRect: function getRect() {
                return rect;
              },
              getTop: function getTop() {
                return rect.top;
              },
              getBottom: function getBottom() {
                return rect.bottom;
              }
            });

          case 5:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function util(_x) {
    return _ref.apply(this, arguments);
  };
}();

var scrollTo = function scrollTo(x, y) {
  browser.execute("window.scrollTo(".concat(x, ", ").concat(y, ");"));
};

describe('Sticky', function () {
  it('Sticky 1 should stick to the top', function (done) {
    scrollTo(0, 500);
    setTimeout(function () {
      expect(util('#sticky-1').getTop()).toEqual(0, 'sticky-1');
      done();
    }, 200);
  });
  it('Sticky 2 should not stick to the top', function (done) {
    scrollTo(0, 500);
    setTimeout(function () {
      expect(util('#sticky-2').getTop()).to.below(0, 'sticky-2');
      scrollTo(0, 1200);
      setTimeout(function () {
        expect(util('#sticky-2').getBottom()).to.below(window.innerHeight, 'sticky-2');
        done();
      }, 200);
    }, 200);
  });
});