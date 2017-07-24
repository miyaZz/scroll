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

class Scoll extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // 实际数据量
      size: 0,
      data: []
    };
  }

  componentDidMount() {
    let array = fetch();
    this.setState({
      size: array.length,
      data: array
    })
  }

  renderItem = () => {
    const {size, data} = this.state;
    let dom = [];
    // console.log(data.length, 'renderItem, 数据长度');
    for(let i = 0; i <= data.length; i++) {
      dom.push(<div className='item' style={{lineHeight: 2}} key={i}>{data[i]}</div>)
    }
    return dom;
  }

  handelScroll = () => {
    const {length} = this.props;
    const {data, size} = this.state;
    let element = findDOMNode(this);
    // 阀值为50
    let number = size;
    if(element.scrollHeight - element.scrollTop - element.clientHeight < 50 && number <= length) {
      this.setState({
        size: number += 10,
        data: data.concat(this.scollCb(10))
      });
    }else{
      this.setState({
        size: data.length
      });
    }
  }

  // async data
  scollCb = () => {
    return fetch();
  }

  render() {
    const {length, ...props} = this.props;
    const {start} = this.state;
    return(
      <div
        {...props}
        onScroll={this.handelScroll}
      >
        {this.renderItem()}
      </div>
    );
  }
}

export default Scoll;

