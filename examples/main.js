import React, {Component} from 'react';
import ReactDom from 'react-dom';
import Scroll from '../src/Scroll';
import Infinite from '../src/Infinite';
import './style.less';

// 生成0～1000的随机数
function randomFn() {
  return _.random(0, 1000);
}

// 模拟异步加载函数 每次默认加载20条数据
function fetch(count, size) {
  let number = 20;
  let list = [];
  let _has = 0;
  if(size) number = size;
  if(count) _has = count;
  for (let i = _has; i < _has + size; i++) {
    list.push({id: i, content: `第${i}条`});
  }
  return list;
}

class Main extends Component {

  constructor(props) {
    super(props);
    this.pageSize = 20;
    this.state = {
      length: 30,
      dataSource: fetch(null, 30)
    }
  }

  scroll = () => {
    const {length, dataSource} = this.state;
    const _self = this;
    setTimeout(() => {
      _self.setState({
        length: length + 20,
        dataSource: dataSource.concat(fetch(length, this.pageSize))
      });
    }, 3000);
  }

  renderItem = o => {
    return (
      <div  className={o.id%2 ? 'item' : 'item-trip'} key={o.id} id={o.id}>
      <div>我是第{o.id}个元素～</div>
      {o.id%2 !== 0 && <div>奇数我就变白了😊</div>}
      {o.id%2 === 0 && <div>我是沙漠中的第{o.id}片绿洲🙃️</div>}
    </div>
    )
  };

  tombstoneRender = o => {
    return(
      <div className='item' key={o.id} id={o.id}>
        <div>狂拽酷炫脑白金，我就是职业占地盘的</div>
        <div>收费标准：占一个位100块～</div>
        <div>你咋滴，不服，不服我就走😳</div>
      </div>
    )
  }

  render() {
    return( 
    <div>
      {/* <Infinite
        className='left'
        itemRenderer={this.renderItem}
        dataSource={fetch(null, 2000)}
        async={false}
      /> */}
      <Infinite
        className='right'
        itemRenderer={this.renderItem}
        tombstoneRender={this.tombstoneRender}
        async={true}
        dataSource={this.state.dataSource}
        pageSize={this.pageSize}
        onScroll={this.scroll}
      />    
    </div>
    );
  }
}

ReactDom.render(
  <Main/>,
  document.getElementById('app')
);
