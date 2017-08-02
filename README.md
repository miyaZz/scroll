# scroll -- 无限滚动
#### 功能描述：
无限滚动组件，可一次加载全部数据，也可以异步加载数据
#### how to use
###### itemRender (function)
渲染列表内展示元素的方法,eg: `(content, key) => <div id={key} key={key}>{content}</div>`, 必须要有id和key
###### determinateSize (number)
可用于展示数据的最大值，默认1000
###### pageSize (number)
每页的数据量，默认20
###### threshold (number)
锚点位置距离视口上下边距的大小，默认200
###### preCount (number)
首次加载的节点数量，默认30
###### dataSource (function || array)
若传入的数据为数组，则表示组件类型为一次加载全部数据。
若传入的函数类型，则表示该组件为异步加载数据，传入函数需为获取数据的方法。
