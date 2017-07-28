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
    list.push({index: i, name: `第${i}条`});
  }
  return list;
}

class Infinite extends Component {

  constructor(props) {
    super(props);
    this.threshold = 100; // 阀值
    this.determinateSize = 20000; //展示数据的最大值
    this.initialIndex = 0; // 滚动开始的位置
    this.preLength = 40; // 预加载数量
    this.pageSize = 20; // 每页加载数量
    this.state = {
      length: this.preLength, // 已加载的数据长度
      size: this.preLength, //渲染dom节点数
      startIndex: 0, // 开始位置的Index,
      display: [] //实际渲染的dom数
    };
    this.data = [];
    this.cache = {};
  }

  componentDidMount() {
    window.addEventListener('resize', this.updateFrame);
    this.data = fetch(this.preLength);
    this.updateScrollParentDOM();
    const {start, end} = this.getStartAndEnd();
    const {index, count} = this.getTopItemAndSize(start, end);
    const {size} = this.state;
    this.setState({
      display: this.data.slice(index, index+size)
    })
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.length !== this.state.length) {
      this.data = fetch(nextState.length);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateFrame);
    this.scrollParent.removeEventListener('scroll', this.updateFrame);
    this.scrollParent.removeEventListener('mousewheel', () => {});
  }

  getScrollParentDOM = () => {
    let el = findDOMNode(this);
    while (el) {
      // 获取当前元素的CSS属性
      switch (window.getComputedStyle(el).overflowY) {
        case 'auto': case 'scroll': case 'overlay': return el;
      }
      el = el.parentElement;
    }
    return window;
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

  // 是否与前一个状态相等
  isEqualPrev = (prevState, nextState) => {
    for (let key in nextState) if (prevState[key] !== nextState[key]) return false;
    return true;
  };

  // setState的封装,判断是否更新state
  shouldUpdateState = (nextState) => {
    if(this.isEqualPrev(this.state, nextState)) return;
    
    this.setState(nextState);
  }

  // 获取滚动条
  getScrollTop = () => {
    const {scrollParentDom} = this;
    const scrollTop = scrollParentDom === window ?
      document.body.scrollTop || document.documentElement.scrollTop :
      scrollParentDom.scrollTop;
    // console.log(scrollTop, '已滚动高度');
    return scrollTop;
  }

  // 获取滚动条高度
  getScrollHeight = () => {
    const {scrollParentDom, cache} = this;
    const {body, documentElement} = document;
    let scrollHeight = scrollParentDom === window ?
      Math.max(body.scrollHeight, documentElement.scrollHeight) :
      scrollParentDom.scrollHeight;
    let height = 0;
    for(let k in this.cache) {
      height +=  this.cache[k];
    }
    return scrollHeight
  }

  // 获取滚动视口高度
  getViewportSize = () => {
    const {scrollParentDom} = this;
    let viewportSize = scrollParentDom === window ?
      window.innerHeight :
      scrollParentDom.clientHeight;
    // console.log(viewportSize, '滚动条所在视口高度');
    return viewportSize;
  }

  updateFrame = cb => {
    const {length} = this.state;
    this.updateScrollParentDOM();
    const {start, end} = this.getStartAndEnd();
    const {index, count} = this.getTopItemAndSize(start, end);    
    this.asyncLoad(end);
    this.cacheSizes();
    let display = this.data.slice(index, index+count)
    this.shouldUpdateState({startIndex: index, size: count, display});
  }

  asyncLoad = end => {
    const {length} = this.state;
    console.log(length, 'length');
    const {determinateSize, threshold, pageSize} = this;
    const scrollHeight = this.getScrollHeight();
    if(determinateSize) {
      if(length < determinateSize && scrollHeight < end) {
        this.setState({
          length: length + pageSize > determinateSize ? determinateSize : length + pageSize
        })
      }else if(length > determinateSize) {
        this.setState({
          length: determinateSize
        })
      }
    }else{
      this.setState({
        length: length + pageSize
      })
    }
    
  }

  // 获取上下位置
  getStartAndEnd() {
    const {threshold} = this;
    const scroll = this.getScrollTop();
    const start = scroll;
    let end = scroll + this.getViewportSize() + threshold;
    console.log(start, end, 'start, end');
    return {start, end};
  }

  //获取视窗内第一条元素的index,及到底部锚点的元素数量
  getTopItemAndSize(start, end) {
    const {length} = this.state;
    const {pageSize} = this;
    const maxIndex = length - 1;
    let index = 0;
    let count = 0;
    let topHeight = 0;

    while (index < maxIndex) {
      const itemSize = this.getItemSize(index);
      if (!itemSize || topHeight + itemSize > start) break;
      topHeight += itemSize;
      ++index;
    }

    let maxSize = length - index; 
    while (count < maxSize && topHeight < end) {
      const itemSize = this.getItemSize(index + count);
      if (!itemSize) {
        count = Math.min(count + this.pageSize, maxSize);
        break;
      }
      topHeight += itemSize;
      ++count;
    }
    console.log(index, count, 'index, count')
    return {index, count}
  }

  cacheSizes = () => {
    const {cache} = this;
    const {startIndex} = this.state;
    const itemEls = findDOMNode(this.doms).children;
    for (let i = 0; i < itemEls.length; ++i) {
      cache[itemEls[i].id] = itemEls[i].offsetHeight;
    }
  }

  getItemSize = index => {
    // state设置固定高度
    const {cache} = this;

    const {itemSize} = this.state;

    if(itemSize) return itemSize;

    if (index in cache) return cache[index];
  }

  getOffSet = () => {
    const {startIndex} = this.state;
    let top = 0;
    for(let i = 0; i < startIndex; i++) {
      if(this.cache[i]) {
        top += this.cache[i];
      }
    }
    return top;
  }
 
  itemRenderer = (content, key) => <div id={key} key={key} className={key%2 ? 'item' : 'item-trip'}>--{content}--</div>;

  itemsRenderer = (items, ref) => <div ref={ref}>{items}</div>;

  renderItems() {
    const {startIndex, size, display} = this.state;
    const items = [];
    const {data} = this;
    for (let i = 0; i < display.length; ++i) {
      items.push(this.itemRenderer(display[i].name, display[i].index))
    };
    return this.itemsRenderer(items, c => this.doms = c);
  }

  render() {
    const {...props} = this.props;
    const items = this.renderItems();
    let y = this.getOffSet();
    const transform = `translate(0px, ${y}px)`;
    const listStyle = {
      msTransform: transform,
      WebkitTransform: transform,
      transform
    };
    return (
      <div {...props}>
        <div style={listStyle}>
          {items}
        </div>
      </div>
    );
  }
}

export default Infinite;
