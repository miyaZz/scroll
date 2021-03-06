# scroll -- 无限滚动
#### 功能描述：
无限滚动组件，可一次加载全部数据，也可以异步加载数据
#### 适用场景
可适用场景：无限下拉选择，无限滚动列表等。
#### Props
###### async boolean
标识组件为同步还是异步的标志位。false: 同步（一次加载所有数据），true: 异步（通过scroll函数异步获取数据）。
###### _*_ itemRender (function)
渲染列表内展示元素的方法,eg: `record => <div id={record.id} key={record.id}>{o.name}</div>`, 必须要有id和key
###### tombstoneRender (function)
渲染占位元素的方法, eg: `record => <div id={record.id} key={record.id}>占位符</div>`, 如传入该属性则必须传入id和key
###### pageSize (number)
每页的数据量，默认20
###### _*_ dataSource (array)
需进行展示的数据
###### onScroll (function)
滚动时的回掉函数，作用等同于onScroll

#### 参考文件：

<https://juejin.im/post/58a3c81e128fe10058c57a8b/>

<https://github.com/orgsync/react-list/>
