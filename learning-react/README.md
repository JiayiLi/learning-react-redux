```
.
├── README.md   
├── ReactVersion.js // React 当前版本。本源码阅读的是 15.6.2
├── addons    // 插件
├── isomorphic  // 同构 
├── renderers  // DOM、Native 等的渲染逻辑
├── shared // 通用方法
└── umd   
```

主要要关注的源码是在 renderers 和 isomorphic 两个文件夹中

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
