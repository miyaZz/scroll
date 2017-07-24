import React, {Component} from 'react';
import ReactDom from 'react-dom';
import ScrollList from '../src/ScrollList';
import Scroll from '../src/Scroll';
import Infinite from '../src/Infinite';
import './style.less';

class Main extends Component {
  render() {
    let init = fetch(100);

    return (
      <div>
        {/* <Scroll className='left' length={1000}/> */}
        <Infinite className='center'/>
        {/* <div className='center'><ScrollList length={1000}/></div>*/}
      </div>
    );
  }
}

ReactDom.render(
  <Main/>,
  document.getElementById('app')
);
