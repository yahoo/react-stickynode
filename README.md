# react-stickynode
[![npm version](https://badge.fury.io/js/react-stickynode.svg)](http://badge.fury.io/js/react-stickynode)
[![Build Status](https://travis-ci.org/yahoo/react-stickynode.svg?branch=master)](https://travis-ci.org/yahoo/react-stickynode)
[![Coverage Status](https://coveralls.io/repos/yahoo/react-stickynode/badge.svg)](https://coveralls.io/r/yahoo/react-stickynode)
[![Dependency Status](https://david-dm.org/yahoo/react-stickynode.svg)](https://david-dm.org/yahoo/react-stickynode)
[![devDependency Status](https://david-dm.org/yahoo/react-stickynode/dev-status.svg)](https://david-dm.org/yahoo/react-stickynode#info=devDependencies)

A performant and comprehensive React sticky component.

A sticky component wraps a sticky target and remains the target in viewport as an user scrolls the page. Most sticky components handle the case where the sticky target is shorter then viewport, but not the case where a sticky target taller then viewport. The reason is the behavior expectation and implementation is much more complicated.

`react-stickynode` handles not only regular case but the long sticky target case in a natural way. In regular case, when scrolling page down, `react-stickynode` will stick to the top of viewport. But in the case of taller sticky target, it will scroll along with the page until its bottom reaches the bottom of viewport. In other words, it looks like the bottom of viewport pull the bottom of a sticky target down when scrolling page down. On the other hand, when scrolling page up, the top of viewport pulls the top of a sticky target up.

This behavior gives the content in a tall sticky target more chance to be shown. This is especially good for the case where many ADs are in the right rail.

Another highlight is that `react-stickynode` can handle the case where a sticky target uses percentage as its width unit. For a responsive designed page, it is especially useful.

This is also inspired by [Steve Carlson](https://github.com/src-code).

## Features

- Retrieve scrollTop only once for all sticky components.
- Listen to throttled scrolling to have better performance.
- Use rAF to update sticky status to have better performance.
- Support top offset from the top of screen.
- Support bottom boundary to stop sticky status.
- Support any sticky target with various width units.

## Usage

The sticky uses Modernizr `csstransforms3d` and `prefixed` features to detect IE8/9, so it can downgrade not to use transform3d.

http://modernizr.com/download/?-csstransforms3d-prefixed

```js
var Sticky = require('react-stickynode');
<Sticky enabled={true} top={50} bottomBoundary={1200}>
    <YourComponent/>
</Sticky>
```

```js
var Sticky = require('react-stickynode');
<Sticky top='#header' bottomBoundary='#content'>
    <YourComponent/>
</Sticky>
```

### Props

- `enabled {Boolean}` - The switch to enable or disable Sticky (true by default).
- `top {Number/String}` - The offset from the top of window where the top of the element will be when sticky state is triggered (0 by default). If it is a selector to a target (via `querySelector()`), the offset will be the height of the target.
- `bottomBoundary {Number/String}` - The offset from the top of document which release state will be triggered when the bottom of the element reaches at. If it is a selector to a target (via `querySelector()`), the offset will be the bottom of the target.

## Install & Development

**Install**
```bash
npm install react-stickynode
```

**Unit Test**
```bash
grunt unit
```

## License

This software is free to use under the BSD license.
See the [LICENSE file](./LICENSE.md) for license text and copyright information.
