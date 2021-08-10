"use strict";

require("core-js/modules/es.object.to-string.js");

require("core-js/modules/es.promise.js");

require("regenerator-runtime/runtime.js");

require("core-js/modules/es.array.concat.js");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var FUNC_PATH = process.env.FUNC_PATH; // utils

var innerHeight = function innerHeight() {
  return browser.execute(function () {
    return window.innerHeight;
  });
};

var scrollTo = function scrollTo(x, y) {
  return browser.execute("window.scrollTo(".concat(x, ", ").concat(y, ");"));
}; // wdio workaround https://github.com/webdriverio/webdriverio/issues/3608


var getRect = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(selector) {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.t0 = browser;

            _context.t1 = function (el) {
              return el.getBoundingClientRect();
            };

            _context.next = 4;
            return $(selector);

          case 4:
            _context.t2 = _context.sent;
            return _context.abrupt("return", _context.t0.execute.call(_context.t0, _context.t1, _context.t2));

          case 6:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function getRect(_x) {
    return _ref.apply(this, arguments);
  };
}();

describe('Sticky', function () {
  beforeEach( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
    var url;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            // FUNC_PATH set by CI to test github pages
            url = FUNC_PATH ? "/react-stickynode/".concat(FUNC_PATH) : '/';
            _context2.next = 3;
            return browser.url(url);

          case 3:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  })));
  it('Sticky 1 should stick to the top', /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return scrollTo(0, 500);

          case 2:
            _context3.t0 = expect;
            _context3.next = 5;
            return getRect('#sticky-1');

          case 5:
            _context3.t1 = _context3.sent.top;
            (0, _context3.t0)(_context3.t1).toEqual(0, 'sticky-1');

          case 7:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  })));
  it('Sticky 2 should not stick to the top', /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return scrollTo(0, 500);

          case 2:
            _context4.t0 = expect;
            _context4.next = 5;
            return getRect('#sticky-2');

          case 5:
            _context4.t1 = _context4.sent.top;
            (0, _context4.t0)(_context4.t1).toBeLessThan(0, 'sticky-2');
            _context4.next = 9;
            return scrollTo(0, 1200);

          case 9:
            _context4.t3 = expect;
            _context4.next = 12;
            return getRect('#sticky-2');

          case 12:
            _context4.t4 = _context4.sent.bottom;
            _context4.t2 = (0, _context4.t3)(_context4.t4);
            _context4.next = 16;
            return innerHeight();

          case 16:
            _context4.t5 = _context4.sent;

            _context4.t2.toBeLessThan.call(_context4.t2, _context4.t5, 'sticky-2');

          case 18:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  })));
});