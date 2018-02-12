
learn-react 目录结构 以下代码你可以从 [React/brach:15-stable](https://github.com/facebook/react/tree/15-stable) 上获得
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


一些前提知识：
同构模块：即服务端与客户端共用的模块


## How to read React source code ?
- 官方的一个引导文章：
英文：[Codebase Overview](https://reactjs.org/docs/codebase-overview.html)
中文：[Codebase Overview](http://www.css88.com/react/docs/codebase-overview.html)

还是建议看英文原版，中文版有些地方由出入。

部分译文：
### React 核心
核心代码包括了 React 顶级api，例如：
- React.createElement()
- React.Component
- React.Children
这些核心代码值包括了定义组件的必要 api，他并不包括一致性比较的算法，即 [Reconciliation](http://www.css88.com/react/docs/reconciliation.html)，或者是对一些设备平台进行特殊化处理的代码。这些真正寸在文件中的核心 api 是用于 React DOM 和 React Native components.



### 渲染器 Renderers
渲染器 管理如何使一个 React tree 可以被底层平台调用。
- React DOM Renderer 负责渲染 React 组件 为 Dom。它实现了顶级 ReactDom Api 并且作为 React-dom npm 包是有效的。它也可以被用作独立的浏览器插件react-dom.js并且导出一个全局ReactDOM。
- React Native Renderer 负责渲染 React components 为 native views
- React Test Renderer 渲染 React components 为 Json 树。
还有唯一一个被官方所支持的来自其他的库是 react-art，它曾经是额外独立的一个库，现在已经把它移到了主要代码中。



### Reconcilers
即使是 React DOM 和 React Native 有很大的区别，但是他们还是会需要共享一些逻辑。所以在特殊的情况下， reconciliation 算法需要尽可能的相似，这样就可以使得声明式渲染，自定义 component，state，生命周期方法和 ref 仍然是在跨平台一致的。

为了解决这一问题，不同的 renderers 互相共享一些相同的代码。我们称这部分 React 代码为 reconciler。当一个更新，例如 setState 被调度，这个 reconciler 调用在的 component 上的render() 去加载、更新、或卸载它们。

Reconcilers 没有独立的包，因为它没有公用的 API。相反，它们只被渲染器使用例如 React DOM 和React Native。


### Stack Reconciler
Stack Reconciler 是给 React 15 及以前的版本进行使用的 Reconciler，我们已经停止使用他了，但是仍然有文章详细的记录了他。


### Fiber Reconciler
Fiber Reconciler 是一个新的努力去解决 stack reconciler 中固有的问题和一些长期存在的问题。他 React 16 的默认 Reconciler。

它主要的目标是：
- 能够分块可中断工作的能力
- 能够优先、复位和重用工作进程中的能力
- 在父节点和子节点之间来回支持布局在React 中的能力
- 从render() 中返回多个element 的能力
- 更好支持错误边界


### Event System
React 实现了一个合成的事件系统，它是渲染器不可知的，在 React DOM 和 React Native 中工作。