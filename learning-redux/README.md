## src 目录结构

```
.
├── applyMiddleware.js  // API: applyMiddleware 中间件，对store.dispatch方法进行了改造。作用是将所有中间件组成一个数组，依次执行
├── bindActionCreators.js  // API: bindActionCreators 把 action creator 往下传到一个组件上，却不想让这个组件觉察到 Redux 的存在，而且不希望把 Redux store 或 dispatch 传给它
├── combineReducers.js  // API: combineReducers 把一个由多个不同 reducer 函数作为 value 的 object，合并成一个 reducer 函数
├── compose.js     // API: compose  从右到左来组合多个函数。
├── createStore.js    // API: createStore 创建一个 Redux store 来以存放应用中所有的 state。
├── index.js     // 负责暴露 API，像 createStore 、combineReducers 等
└── utils  // 工具包
    ├── actionTypes.js  // Redux 保留的私有 action 类型。
    ├── isPlainObject.js // 判断是否为普通对象
    └── warning.js  // 在控制台中打印警告
```

可以看出来 index.js 主要是负责把方法暴露出来，然后每个方法各自用一个文件定义。 
