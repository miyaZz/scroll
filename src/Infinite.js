import React, {Component, PropTypes} from 'react';
import ReactDOM from 'react-dom';
const {findDOMNode} = ReactDOM;

class Infinite extends Component {
  static propTypes = {
    itemRenderer: PropTypes.func.isRequired, // 渲染list的方法
    tombstoneRender: PropTypes.func,
    async: PropTypes.bool, //同步或异步 true: 异步
    onScroll: PropTypes.func, // onScroll
    pageSize: PropTypes.number,
    dataSource: PropTypes.array.isRequired
  };

  static defaultProps = {
    async: false,
    pageSize: 20,
    tombstoneRender: o => {
      return(
        <div className={o.id%2 ? 'item' : 'item-trip'} key={o.id} id={o.id}>
          我就是个占地盘的
        </div>
      )
    }
  }

  constructor(props) {
    super(props);
    this.threshold = 200;
    this.state = {
      dataCache: this.props.dataSource,
      size: 0, //渲染dom节点数
      startIndex: 0, // 开始位置的Index
    };
    this.cache = {}; // 存储节点信息 => {id: offsetheight, ...}
  }

  componentDidMount() {
    const {async} = this.props;
    const {dataCache} = this.state;
    window.addEventListener('resize', this.updateFrame);
    this.updateScrollParentDOM();
    const {start, end} = this.getStartAndEnd();
    const {index, count} = this.getTopItemAndSize(start, end);
    const size = async ? dataCache.length : 30;
    this.setState({
      size: size
    })
  }

  // componentWillUpdate(nextProps, nextState) {
  //   const {dataSource, pageSize, async} = this.props;
  //   if(async) {
  //     this.replaceTombstones(nextProps.dataSource, dataSource);
  //     this.updateFrame();
  //   }
  // }

  componentWillReceiveProps(nextProps) {
    const {dataSource, pageSize, async} = this.props;
    const {dataCache} = this.state;
    console.log('componentWillReceiveProps', dataCache.length)
    if(async) {
      this.replaceTombstones(nextProps.dataSource, dataSource);
      this.updateFrame();
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
    return scrollTop;
  }

  // 获取滚动条高度
  getScrollHeight = () => {
    const {scrollParentDom, cache} = this;
    const {body, documentElement} = document;
    let scrollHeight = scrollParentDom === window ?
      Math.max(body.scrollHeight, documentElement.scrollHeight) :
      scrollParentDom.scrollHeight;
    return scrollHeight
  }

  // 获取滚动视口高度
  getViewportSize = () => {
    const {scrollParentDom} = this;
    let viewportSize = scrollParentDom === window ?
      window.innerHeight :
      scrollParentDom.clientHeight;
    return viewportSize;
  }

  updateFrame = cb => {
    const {dataSource, pageSize, async, onScroll} = this.props;
    const {dataCache} = this.state;
    this.updateScrollParentDOM();
    const {start, end} = this.getStartAndEnd();
    const {index, count} = this.getTopItemAndSize(start, end);   
    this.cacheSizes();
    // 可缓存数据数据比实际算出的最后一个元素的index
    if(async) {
      if(dataCache.length <= count + index) {
        this.createTombstones(count, index);
        onScroll();
      }
      this.shouldUpdateState({startIndex: index, size: count});
    }else{
      if(count + index < dataCache.length) {
        this.shouldUpdateState({startIndex: index, size: count});
      }
    }
  }

  createTombstones = (count, index) => {
    const {dataSource, pageSize} = this.props;
    const {dataCache} = this.state;
    console.log('createto',count, index, dataCache.length);
    let array = [];
    let tombstoneCount;
    if(dataCache.length + pageSize >= count + index) {
      tombstoneCount = dataCache.length + pageSize;
    }else{
      tombstoneCount = count + index;
    }
    // console.log('tombstoneCount', dataCache.length, tombstoneCount);
    for(let i = dataCache.length; i < tombstoneCount; i++) {
      array.push({id: i, tombstone: true});
    }
    this.shouldUpdateState({dataCache: dataCache.concat(array)})
  }

  replaceTombstones = (nextDataSouce, dataSouce) => {
    const {dataCache} = this.state;
    const {start, end} = this.getStartAndEnd();
    let {index, count} = this.getTopItemAndSize(start, end);
    let list = [];
    let detal = nextDataSouce.length - dataSouce.length;
    console.log('replace', dataSouce, nextDataSouce, 'nextDataSouce');
    let tombstoneStartIndex = _.findIndex(dataCache, {tombstone: true});
    let tombstoneEndIndex = _.findLastIndex(dataCache, {tombstone: true});
    // 新数据比原数据少(理论上该情况不存在)
    if(detal < 0) {
      Error('新数据比原数据少');
    }else if(detal === 0) {
      console.log(dataCache, tombstoneStartIndex, tombstoneEndIndex, '-=-=-=-', 'detal新数据与原数据相同');
      // 新数据与原数据相同（已达到底部）
      list = dataCache; // 清空墓碑，回滚，类似app中下拉刷新
      // for(let k = tombstoneStartIndex; k < tombstoneEndIndex + 1; k++) {
      //   delete this.cache[dataCache[k].id];
      // }
    }else{
      let headOfTomb = dataCache.slice(0, tombstoneStartIndex);
      let endOfTomb = dataCache.slice(tombstoneEndIndex + 1);
      // 差值比占位元素数量少
      console.log('replace index detal', tombstoneEndIndex - tombstoneStartIndex);
      if(detal < tombstoneEndIndex - tombstoneStartIndex + 1) {
        list = [
          ...headOfTomb,
          ...nextDataSouce.slice(tombstoneStartIndex, tombstoneStartIndex + detal),
          ...dataCache.slice(tombstoneStartIndex + detal)
        ];
        console.log('list', dataCache, list);
      }else{
        list = nextDataSouce;
        console.log('detail list', dataCache, list);
      }
    }
    this.shouldUpdateState({startIndex: index, size: count, dataCache: list});
  }

  // 获取上下位置
  getStartAndEnd() {
    const {threshold} = this;
    const scroll = this.getScrollTop();
    const start = Math.max(0, scroll - threshold);
    let end = scroll + this.getViewportSize() + threshold;
    return {start, end};
  }

  //获取视窗内第一条元素的index,及到底部锚点的元素数量
  getTopItemAndSize(start, end) {
    const {dataSource} = this.props;
    const {dataCache} = this.state;
    const length = dataCache.length;
    const {pageSize} = this.props;
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
        count = Math.min(count + pageSize, maxSize);
        break;
      }
      topHeight += itemSize;
      ++count;
    }
    return {index, count}
  }

  cacheSizes = () => {
    const {cache} = this;
    const itemEls = findDOMNode(this.doms).children;
    for (let i = 0; i < itemEls.length; ++i) {
      cache[itemEls[i].id] = itemEls[i].offsetHeight;
    }
  }

  getItemSize = index => {
    // state设置固定高度
    const {cache} = this;
    const {dataCache} = this.state;

    const {itemSize} = this.state;

    if(itemSize) return itemSize;

    if (dataCache[index]) return cache[dataCache[index].id];
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

  tombstoneRender = o => {
    return(
      <div className={o.id%2 ? 'item' : 'item-trip'} key={o.id} id={o.id}>
        <div>狂拽酷炫脑白金，我就是职业占地盘的</div>
        <div>收费标准：占一个位100块～</div>
        <div>你咋滴，不服，不服我就走😳</div>
      </div>
    )
  }

  itemsRenderer = (items, ref) => <div ref={ref}>{items}</div>;

  renderItems() {
    const {startIndex, size, dataCache} = this.state;

    console.log('renderItems dataCache', dataCache.length)
    const {itemRenderer, tombstoneRender} = this.props;
    const items = [];
    for (let i = startIndex; i < startIndex + size; ++i) {
      if(!dataCache[i]) {
        console.log('datacache', i)
        console.log('startIndex', startIndex)
        console.log('size', size)
        console.log('dataCache', dataCache.length)
        console.log('dataCache', dataCache)
        return null;
      }else if(dataCache[i].tombstone) {
        items.push(tombstoneRender(dataCache[i]));
      }else{
        items.push(itemRenderer(dataCache[i]));
      }
    };
    return this.itemsRenderer(items, c => this.doms = c);
  }

  render() {
    const {pageSize, dataSource, itemRenderer, tombstoneRender, scroll, ...props} = this.props;
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
