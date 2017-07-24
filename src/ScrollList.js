import React, {Component, PropTypes} from 'react';
import ReactDOM from 'react-dom';
const {findDOMNode} = ReactDOM;

const NOOP = () => {};

const PASSIVE = (() => {
  if (typeof window === 'undefined') return false;
  let hasSupport = false;
  try {
    document.createElement('div').addEventListener('test', NOOP, {
      get passive() {
        hasSupport = true;
        return false;
      }
    });
  } catch (e) {}
  return hasSupport;
})() ? {passive: true} : false;

const UNSTABLE_MESSAGE = 'ReactList failed to reach a stable state.';

const MAX_SYNC_UPDATES = 100;

const isEqualSubset = (a, b) => {
  for (let key in b) if (a[key] !== b[key]) return false;

  return true;
};

class ScollList extends Component {
  static displayName = 'ScollList';

  static propTypes = {
    initialIndex: PropTypes.number,
    itemRenderer: PropTypes.func,
    itemSizeEstimator: PropTypes.func,
    itemSizeGetter: PropTypes.func,
    itemsRenderer: PropTypes.func,
    length: PropTypes.number,
    minSize: PropTypes.number,
    pageSize: PropTypes.number,
    scrollParentGetter: PropTypes.func,
    threshold: PropTypes.number,
    type: PropTypes.oneOf(['simple', 'variable', 'uniform']),
    useStaticSize: PropTypes.bool,
    useTranslate3d: PropTypes.bool
  };

  static defaultProps = {
    itemRenderer: (index, key) => <div key={key}>{index}</div>,
    itemsRenderer: (items, ref) => <div ref={ref}>{items}</div>,
    length: 0,
    minSize: 1,
    pageSize: 10,
    threshold: 100,
    type: 'simple',
    useStaticSize: false,
    useTranslate3d: false
  };

  constructor(props) {
    super(props);
    const {initialIndex} = props;
    const itemsPerRow = 1;
    const {view, size} = this.constrain(initialIndex, 0, itemsPerRow, props);
    this.state = {view, size, itemsPerRow};
    this.cache = {};
    this.prevPrevState = {};
    this.unstable = false;
    this.updateCounter = 0;
  }

  componentWillReceiveProps(next) {
    let {view, size, itemsPerRow} = this.state;
    this.maybeSetState(this.constrain(view, size, itemsPerRow, next), NOOP);
  }

  componentDidMount() {
    this.updateFrame = this.updateFrame.bind(this);
    window.addEventListener('resize', this.updateFrame);
    this.updateFrame(this.scrollTo.bind(this, this.props.initialIndex));
  }

  componentDidUpdate() {

    // If the list has reached an unstable state, prevent an infinite loop.
    if (this.unstable) return;

    if (++this.updateCounter > MAX_SYNC_UPDATES) {
      this.unstable = true;
      return console.error(UNSTABLE_MESSAGE);
    }

    if (!this.updateCounterTimeoutId) {
      this.updateCounterTimeoutId = setTimeout(() => {
        this.updateCounter = 0;
        delete this.updateCounterTimeoutId;
      }, 0);
    }

    this.updateFrame();
  }

  maybeSetState(b, cb) {
    if (isEqualSubset(this.state, b)) return cb();

    this.setState(b, cb);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateFrame);
    this.scrollParent.removeEventListener('scroll', this.updateFrame, PASSIVE);
    this.scrollParent.removeEventListener('mousewheel', NOOP, PASSIVE);
  }

  getOffset(el) {
    let offset = el.clientLeft || 0;
    const offsetKey = 'offsetTop';
    do offset += el[offsetKey] || 0; while (el = el.offsetParent);
    return offset;
  }

  getScrollParent() {
    const {scrollParentGetter} = this.props;
    if (scrollParentGetter) return scrollParentGetter();
    let el = findDOMNode(this);
    const overflowKey = 'overflowY';
    while (el = el.parentElement) {
      switch (window.getComputedStyle(el)[overflowKey]) {
      case 'auto': case 'scroll': case 'overlay': return el;
      }
    }
    return window;
  }

  getScroll() {
    const {scrollParent} = this;
    const scrollKey = 'scrollTop';
    const actual = scrollParent === window ?
      document.body[scrollKey] || document.documentElement[scrollKey] :
      scrollParent[scrollKey];
    const max = this.getScrollSize() - this.getViewportSize();
    const scroll = Math.max(0, Math.min(actual, max));
    const el = findDOMNode(this);
    return this.getOffset(scrollParent) + scroll - this.getOffset(el);
  }

  setScroll(offset) {
    const {scrollParent} = this;
    offset += this.getOffset(findDOMNode(this));
    if (scrollParent === window) return window.scrollTo(0, offset);

    offset -= this.getOffset(this.scrollParent);
    scrollParent.scrollTop = offset;
  }

  getViewportSize() {
    const {scrollParent} = this;
    return scrollParent === window ?
      window.innerHeight :
      scrollParent.clientHeight;
  }

  getScrollSize() {
    const {scrollParent} = this;
    const {body, documentElement} = document;
    const key = 'scrollHeight';
    return scrollParent === window ?
      Math.max(body.scrollHeight, documentElement.scrollHeight) :
      scrollParent.scrollHeight;
  }

  hasDeterminateSize() {
    const {itemSizeGetter, type} = this.props;
    return type === 'uniform' || itemSizeGetter;
  }

  getStartAndEnd(threshold = this.props.threshold) {
    const scroll = this.getScroll();
    const start = Math.max(0, scroll - threshold);
    let end = scroll + this.getViewportSize() + threshold;
    if (this.hasDeterminateSize()) {
      end = Math.min(end, this.getSpaceBefore(this.props.length));
    }
    return {start, end};
  }

  getItemSizeAndItemsPerRow() {
    const {useStaticSize} = this.props;
    let {itemSize, itemsPerRow} = this.state;
    if (useStaticSize && itemSize && itemsPerRow) {
      return {itemSize, itemsPerRow};
    }

    const itemEls = findDOMNode(this.items).children;
    if (!itemEls.length) return {};

    const firstEl = itemEls[0];

    const firstElSize = firstEl.offsetHeight;
    const delta = Math.abs(firstElSize - itemSize);
    if (isNaN(delta) || delta >= 1) itemSize = firstElSize;

    if (!itemSize) return {};

    const startKey = 'offsetTop';
    const firstStart = firstEl[startKey];
    itemsPerRow = 1;
    for (
      let item = itemEls[itemsPerRow];
      item && item[startKey] === firstStart;
      item = itemEls[itemsPerRow]
    ) ++itemsPerRow;

    return {itemSize, itemsPerRow};
  }

  updateFrame(cb) {
    this.updateScrollParent();
    if (typeof cb != 'function') cb = NOOP;
    switch (this.props.type) {
    case 'simple': return this.updateSimpleFrame(cb);
    case 'variable': return this.updateVariableFrame(cb);
    case 'uniform': return this.updateUniformFrame(cb);
    }
  }

  updateScrollParent() {
    const prev = this.scrollParent;
    this.scrollParent = this.getScrollParent();
    if (prev === this.scrollParent) return;
    if (prev) {
      prev.removeEventListener('scroll', this.updateFrame);
      prev.removeEventListener('mousewheel', NOOP);
    }
    this.scrollParent.addEventListener('scroll', this.updateFrame, PASSIVE);
    this.scrollParent.addEventListener('mousewheel', NOOP, PASSIVE);
  }

  updateSimpleFrame(cb) {
    const {end} = this.getStartAndEnd();
    const itemEls = findDOMNode(this.items).children;
    let elEnd = 0;

    if (itemEls.length) {
      const firstItemEl = itemEls[0];
      const lastItemEl = itemEls[itemEls.length - 1];
      elEnd = this.getOffset(lastItemEl) + lastItemEl.offsetHeight -
        this.getOffset(firstItemEl);
    }

    if (elEnd > end) return cb();

    const {pageSize, length} = this.props;
    const size = Math.min(this.state.size + pageSize, length);
    this.maybeSetState({size}, cb);
  }

  updateVariableFrame(cb) {
    if (!this.props.itemSizeGetter) this.cacheSizes();

    const {start, end} = this.getStartAndEnd();
    const {length, pageSize} = this.props;
    let space = 0;
    let view = 0;
    let size = 0;
    const maxFrom = length - 1;

    while (view < maxFrom) {
      const itemSize = this.getSizeOf(view);
      if (itemSize == null || space + itemSize > start) break;
      space += itemSize;
      ++view;
    }

    const maxSize = length - view;

    while (size < maxSize && space < end) {
      const itemSize = this.getSizeOf(view + size);
      if (itemSize == null) {
        size = Math.min(size + pageSize, maxSize);
        break;
      }
      space += itemSize;
      ++size;
    }

    this.maybeSetState({view, size}, cb);
  }

  updateUniformFrame(cb) {
    let {itemSize, itemsPerRow} = this.getItemSizeAndItemsPerRow();

    if (!itemSize || !itemsPerRow) return cb();

    const {start, end} = this.getStartAndEnd();

    const {view, size} = this.constrain(
      Math.floor(start / itemSize) * itemsPerRow,
      (Math.ceil((end - start) / itemSize) + 1) * itemsPerRow,
      itemsPerRow,
      this.props
    );

    return this.maybeSetState({itemsPerRow, view, itemSize, size}, cb);
  }

  getSpaceBefore(index, cache = {}) {
    if (cache[index] != null) return cache[index];

    // Try the static itemSize.
    const {itemSize, itemsPerRow} = this.state;
    if (itemSize) {
      return cache[index] = Math.floor(index / itemsPerRow) * itemSize;
    }

    // Find the closest space to index there is a cached value for.
    let view = index;
    while (view > 0 && cache[--view] == null);

    // Finally, accumulate sizes of items view - index.
    let space = cache[view] || 0;
    for (let i = view; i < index; ++i) {
      cache[i] = space;
      const itemSize = this.getSizeOf(i);
      if (itemSize == null) break;
      space += itemSize;
    }

    return cache[index] = space;
  }

  cacheSizes() {
    const {cache} = this;
    const {view} = this.state;
    const itemEls = findDOMNode(this.items).children;
    const sizeKey = offsetHeight;
    for (let i = 0, l = itemEls.length; i < l; ++i) {
      cache[view + i] = itemEls[i][sizeKey];
    }
  }

  getSizeOf(index) {
    const {cache, items} = this;
    const {itemSizeGetter, itemSizeEstimator, type} = this.props;
    const {view, itemSize, size} = this.state;

    // Try the static itemSize.
    if (itemSize) return itemSize;

    // Try the itemSizeGetter.
    if (itemSizeGetter) return itemSizeGetter(index);

    // Try the cache.
    if (index in cache) return cache[index];

    // Try the DOM.
    if (type === 'simple' && index >= view && index < view + size && items) {
      const itemEl = findDOMNode(items).children[index - view];
      if (itemEl) return itemEl.offsetHeight;
    }

    // Try the itemSizeEstimator.
    if (itemSizeEstimator) return itemSizeEstimator(index, cache);
  }

  constrain(view, size, itemsPerRow, {length, minSize, type}) {
    size = Math.max(size, minSize);
    let mod = size % itemsPerRow;
    if (mod) size += itemsPerRow - mod;
    if (size > length) size = length;
    view =
      type === 'simple' || !view ? 0 :
      Math.max(Math.min(view, length - size), 0);

    if (mod = view % itemsPerRow) {
      view -= mod;
      size += mod;
    }

    return {view, size};
  }

  scrollTo(index) {
    if (index != null) this.setScroll(this.getSpaceBefore(index));
  }

  scrollAround(index) {
    const current = this.getScroll();
    const bottom = this.getSpaceBefore(index);
    const top = bottom - this.getViewportSize() + this.getSizeOf(index);
    const min = Math.min(top, bottom);
    const max = Math.max(top, bottom);
    if (current <= min) return this.setScroll(min);
    if (current > max) return this.setScroll(max);
  }

  getVisibleRange() {
    const {view, size} = this.state;
    const {start, end} = this.getStartAndEnd(0);
    const cache = {};
    let first, last;
    for (let i = view; i < view + size; ++i) {
      const itemStart = this.getSpaceBefore(i, cache);
      const itemEnd = itemStart + this.getSizeOf(i);
      if (first == null && itemEnd > start) first = i;
      if (first != null && itemStart < end) last = i;
    }
    return [first, last];
  }

  renderItems() {
    const {itemRenderer, itemsRenderer} = this.props;
    const {view, size} = this.state;
    const items = [];
    for (let i = 0; i < size; ++i) items.push(itemRenderer(view + i, i));
    return itemsRenderer(items, c => this.items = c);
  }

  render() {
    const {length, type, useTranslate3d} = this.props;
    const {view, itemsPerRow} = this.state;

    const items = this.renderItems();
    if (type === 'simple') return items;

    const style = {position: 'relative'};
    const cache = {};
    const bottom = Math.ceil(length / itemsPerRow) * itemsPerRow;
    const size = this.getSpaceBefore(bottom, cache);
    if (size) {
      style.height = size;
    }
    const offset = this.getSpaceBefore(view, cache);
    const y = offset;
    const transform =
      useTranslate3d ?
      `translate3d(0px, ${y}px, 0)` :
      `translate(0px, ${y}px)`;
    const listStyle = {
      msTransform: transform,
      WebkitTransform: transform,
      transform
    };
    return <div {...{style}}><div style={listStyle}>{items}</div></div>;
  }
};

export default ScollList;


