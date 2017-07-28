import React, {Component} from 'react';
import ReactDom from 'react-dom';
import Scroll from '../src/Scroll';
import Infinite from '../src/Infinite';
import './style.less';

class Main extends Component {
  render() {
    let init = fetch(100);

    return <Infinite className='center'/>;
      {/* <Scroll className='left' length={1000}/> */}
  }
}

ReactDom.render(
  <Main/>,
  document.getElementById('app')
);
