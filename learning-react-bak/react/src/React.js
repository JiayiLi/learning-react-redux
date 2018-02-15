/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// 真正的入口文件
// 将所有已经写好的工具方法 引入进来
import assign from 'object-assign';
import ReactVersion from 'shared/ReactVersion';
import {
  REACT_FRAGMENT_TYPE,
  REACT_STRICT_MODE_TYPE,
  REACT_ASYNC_MODE_TYPE,
} from 'shared/ReactSymbols';

import {Component, PureComponent} from './ReactBaseClasses';
import {createRef} from './ReactCreateRef';
import {forEach, map, count, toArray, only} from './ReactChildren';
import ReactCurrentOwner from './ReactCurrentOwner';
import {
  createElement,
  createFactory,
  cloneElement,
  isValidElement,
} from './ReactElement';
import {createContext} from './ReactContext';
import {
  createElementWithValidation,
  createFactoryWithValidation,
  cloneElementWithValidation,
} from './ReactElementValidator';
import ReactDebugCurrentFrame from './ReactDebugCurrentFrame';

// 定义一个对象，命名为 React ，上面挂在了所要暴露的所有方法，也就是 react 的所有方法。
const React = {
  // react children 相关的方法
  // 提供了处理 this.props.children 这个不透明数据结构的工具
  Children: {
    map, // React.Children.map(children, function[(thisArg)]) 在包含在 children 里的每个子级上调用函数，调用的函数的 this 设置为 thisArg 。如果 children 是一个嵌套的对象或数组，它将被遍历。如果 children 是 null 或 undefined ，返回 null 或 undefined 而不是一个空数组。
    forEach,  // React.Children.forEach(children, function[(thisArg)]) 类似 React.Children.map() ，但是不返回数组。
    count, //React.Children.count(children) 返回 children 中的组件总数，相等于传给 map 或 forEach 时，回调函数被调用次数。
    toArray, // React.Children.toArray(children) 返回以赋key给每个子级 child 的扁平数组形式来组成不透明的 children 数据结构。如果你打算在你的渲染方法里操纵子级集合这很有用，特别是你想在 this.props.children 传下之前对它重新排序或切割。
    only,  //React.Children.only(children) 返回children里仅有的子级。否则抛出异常。
  },

  createRef,
  // React 组件可以让你把UI分割为独立、可复用的片段，并将每一片段视为相互独立的部分。
  Component,
  // React.PureComponent 与 React.Component 几乎完全相同，但 React.PureComponent 通过prop和state的浅对比来实现 shouldComponentUpate()。
  // 如果React组件的 render() 函数在给定相同的props和state下渲染为相同的结果，在某些场景下你可以使用 React.PureComponent 来提升性能。
  // React.PureComponent 的 shouldComponentUpate() 会忽略整个组件的子级。确保所有的子级组件也是"Pure"的。
  PureComponent,

  // 新的组件类型：Provider 和 Consumer. Provider和Consumer成对出现，对于每一个 Provider 都有一个对应的 Consumer。
  // 通过createContext方法创建 一对 Provider 和 Consumer
  createContext,

  // React 中一个常见模式是为一个组件返回多个元素。Fragments 可以让你聚合一个子元素列表，并且不在DOM中增加额外节点。
  // render() {
  //   return (
  //     <React.Fragment>
  //       <ChildA />
  //       <ChildB />
  //       <ChildC />
  //     </React.Fragment>
  //   );
  // }
  Fragment: REACT_FRAGMENT_TYPE,
  StrictMode: REACT_STRICT_MODE_TYPE,
  unstable_AsyncMode: REACT_ASYNC_MODE_TYPE,

  // 在在开发或者非开发中以下方法有一些区别
  
  // React.createElement(
  //   type,
  //   [props],
  //   [...children]
  // )
  // createElement 方法根据给定的类型创建并返回新的 React element 
  createElement: __DEV__ ? createElementWithValidation : createElement,
  
  // React.cloneElement(
  //   element,
  //   [props],
  //   [...children]
  // )
  // cloneElement 方法以 element 作为起点，克隆并返回一个新的React元素(React Element)。生成的元素将会拥有原始元素props与新props的浅合并。新的子级会替换现有的子级。来自原始元素的 key 和 ref 将会保留。
  cloneElement: __DEV__ ? cloneElementWithValidation : cloneElement,
  // React.createFactory(type)
  // 根据给定的类型返回一个创建React元素的函数。类似 React.createElement ，参数type既可以一个html标签名称字符串，也可以是一个 React component 类型(一个类或时一个函数)。
  // 推荐使用JSX或直接使用 React.createElement() 来替代它。
  createFactory: __DEV__ ? createFactoryWithValidation : createFactory,

  // React.isValidElement(object)
  // 验证对象是否是一个React元素。返回 true 或 false 。
  isValidElement: isValidElement,
  // react 版本号
  version: ReactVersion, 

  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
    ReactCurrentOwner,
    // Used by renderers to avoid bundling object-assign twice in UMD bundles:
    assign,
  },
};

// 如果是在 开发环境下
if (__DEV__) {
  // Object.assign() 方法用于将所有可枚举属性的值从一个或多个源对象复制到目标对象。它将返回目标对象。
  Object.assign(React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, {
    // These should not be included in production.
    ReactDebugCurrentFrame,
    // Shim for React DOM 16.0.0 which still destructured (but not used) this.
    // TODO: remove in React 17.0.
    ReactComponentTreeHook: {},
  });
}

// 然后将 React 对象暴露出去，这样就可以使用这些方法了。
export default React;
