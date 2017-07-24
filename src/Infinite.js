import React, {Component, PropTypes} from 'react';
import ReactDOM from 'react-dom';
const {findDOMNode} = ReactDOM;

// 生成0～1000的随机数
function randomFn() {
  return _.random(0, 1000);
}

// 模拟异步加载函数 每次默认加载20条数据
function fetch(size) {
  let number = 20;
  let list = [];
  if(size) number = size;
  for (let i = 0; i < number; i++) {
    let item = randomFn();
    list.push(item);
  }
  return list;
}

class Infinite extends Component {

  constructor(props) {
    super(props);
    this.threshold = 100; // 阀值
    this.determinateSize = 2000; //展示数据的最大值
    this.initialIndex = 0; // 滚动开始的位置
    this.state = {
      size: 15,
      view: 0
    };
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateFrame);
    this.updateFrame();
  }

  componentDidUpdate() {
    this.constrain();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateFrame);
    this.scrollParent.removeEventListener('scroll', this.updateFrame);
    this.scrollParent.removeEventListener('mousewheel', () => {});
  }

  getScrollParentDOM = () => {
    let el = findDOMNode(this);
    let scollParentDOM = window;
    while (el === el.parentElement) {
      // 获取当前元素的CSS属性
      switch (window.getComputedStyle(el).overflowY) {
        case 'auto': case 'scroll': case 'overlay': return scollParentDOM = el;
      }
    }
    return scollParentDOM;
  }

  updateScrollParentDOM = () => {
    const prev = this.scrollParentDom;
    this.scrollParentDom = this.getScrollParentDOM();
    if (prev === this.scrollParentDom) return;
    if (prev) {
      prev.removeEventListener('scroll', this.updateFrame);
      prev.removeEventListener('mousewheel', () => {});
    }
    this.scrollParentDom.addEventListener('scroll', this.updateFrame);
    this.scrollParentDom.addEventListener('mousewheel', () => {});
  }

  // componentWillReceiveProps(next) {
  //   let {view, size} = this.state;
  //   this.constrain();
  // }

  // 是否与前一个状态相等
  isEqualPrev = (prevState, nextState) => {
    for (let key in nextState) if (prevState[key] !== nextState[key]) return false;
    return true;
  };

  // setState的封装,判断是否更新state
  shouldUpdateState = (nextState, cb) => {
    if(this.isEqualPrev(this.state, nextState)) return cb();
    
    this.setState(nextState, cb);
  }

  constrain() {
    let {view, size} = this.state;
    let length = 15;
    let minSize = 15;
    let nextSize = Math.max(size, minSize);
    if (size > length) size = length;
    let nextView = Math.max(Math.min(view, length - size), 0);
    console.log(nextView, nextSize, view, size, 'nextView, nextSize, view, size');
    this.shouldUpdateState({view: nextView, size: nextSize}, () => {})
  }

  // 获取滚动条
  getScrollTop = () => {
    const {scrollParentDom} = this;
    const scollTop = scrollParentDom === window ?
      document.body.scollTop || document.documentElement.scollTop :
      scrollParentDom.scollTop;
    return scollTop;
  }

  // 获取滚动条高度
  getScrollHeight = () => {
    const {scrollParentDom} = this;
    const {body, documentElement} = document;
    let scrollHeight = scrollParentDom === window ?
      Math.max(body.scrollHeight, documentElement.scrollHeight) :
      scrollParentDom.scrollHeight;
    console.log(scrollHeight, '滚动条总高度');
    return scrollHeight;
  }

  getStartAndEnd() {
    const threshold = this.threshold;
    const scrollTop = this.getScrollTop();
    const start = Math.max(0, scrollTop - threshold);
    let end = scrollTop + this.getViewportSize() + threshold;
    console.log(start, end, 'start, end');
    return {start, end};
  }

  // 获取滚动视口高度
  getViewportSize = () => {
    const {scrollParentDom} = this;
    let viewportSize = scrollParentDom === window ?
      window.innerHeight :
      scrollParentDom.clientHeight;
    console.log(viewportSize, '滚动条所在视口高度');
    return viewportSize;
  }

  updateFrame = cb => {
    const {size} = this.state;
    this.updateScrollParentDOM();
    this.setState({
      size: size + 15
    });
    console.log('-=-=-=-=-=-=-=-=');
  }

  itemRenderer = (index, key) => <div key={key} className={key%2 ? 'item' : 'item-trip'}>--{index}--</div>;

  itemsRenderer = (items, ref) => <div ref={ref}>{items}</div>;

  renderItems() {
    const {view, size} = this.state;
    const items = [];
    for (let i = 0; i < size; ++i) items.push(this.itemRenderer(view + i, i));
    return this.itemsRenderer(items, c => this.doms = c);
  }

  render() {
    const {...props} = this.props;
    const items = this.renderItems();
    return (
      <div {...props}>
        {items}
      </div>
    );
  }
}

export default Infinite;
