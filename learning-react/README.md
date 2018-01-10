```
.
├── README.md   
├── ReactVersion.js // React 当前版本。本源码阅读的是 15.6.2
├── addons    // 插件
├── isomorphic  // React 核心 apis (如 React.Component React.Children)
├── renderers  // DOM、Native 等的渲染逻辑
├── shared // 通用方法
└── umd   
```

主要要关注的源码是在 isomorphic 和 renderers 两个文件夹中

而我们阅读的开始是从 isomorphic 文件夹中的 React.js 开始的

isomorphic 文件夹中
```
.
├── React.js  // 将核心方法暴露出来，复制在 React 对象上。 源码阅读开始
├── __tests__
├── children
├── classic
├── getNextDebugID.js
├── hooks
└── modern
```

renderers 文件夹中
```
.
├── art
├── dom
├── native
├── noop
├── shared 
└── testing
```
