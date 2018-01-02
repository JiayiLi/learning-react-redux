import compose from './compose'

/**
 * Creates a store enhancer that applies middleware to the dispatch method
 * of the Redux store. This is handy for a variety of tasks, such as expressing
 * asynchronous actions in a concise manner, or logging every action payload.
 *
 * See `redux-thunk` package as an example of the Redux middleware.
 *
 * Because middleware is potentially asynchronous, this should be the first
 * store enhancer in the composition chain.
 *
 * Note that each middleware will be given the `dispatch` and `getState` functions
 * as named arguments.
 *
 * @param {...Function} middlewares The middleware chain to be applied.
 * @returns {Function} A store enhancer applying the middleware.
 */

// 用法：
// import { createStore, applyMiddleware } from 'redux';
// import thunkMiddleware from 'redux-thunk';

// const store = createStore(
//       reducers,
//       state,
//       applyMiddleware(thunkMiddleware)
// );
// applyMiddleware(thunkMiddleware) 即 createStore 方法中的第三个参数 enhancer，在 createStore 方法中，如果有合理的 enhancer ，将会执行  enhancer(createStore)(reducer, initialState),即 
// applyMiddleware(thunkMiddleware)(createStore)(reducer, initialState); 这里就用到了柯里化。
// 这里 thunkMiddleware 就是第一个参数 对应的是 applyMiddleware 函数中的 ...middlewares，后面的 createStore 就是将 createStore 方法传入进来，也就是作为了 applyMiddleware 中 第二个参数 return 后面的 createStore，再后面的 reducer, initialState 则是第三个参数，作为 applyMiddleware 中的 (...args),在下一行中 createStore(...args) 中被传到第二参数中调用。

//  创建一个 store 增强器，这个增强器可以应用中间件在你的 Redux store 上的 dispatch 方法上。这样方便处理多种任务，像以简洁的方式描述异步 actions 或者 记录每个 action 的有效负载。
// 你可以看看 redux-thunk 包，这就是一个 Redux middleware 的例子
// 同时， middleware 还拥有“可组合”这一关键特性。多个 middleware 可以被组合到一起使用，形成 middleware 链。其中，每个 middleware 都不需要关心链中它前后的 middleware 的任何信息。
// 注意，每个中间件将接受`dispatch`和`getState`作为命名参数。

// applyMiddleware 参数：
//      middlewares ： 要应用的 中间件链
// applyMiddleware 将返回：
//      function：一个应用了 middleware 后的 store enhancer。
export default function applyMiddleware(...middlewares) {
  return createStore => (...args) => {
    // createStore(...args) 函数将返回一个新创建的 store
    const store = createStore(...args)
  
    // 相当于 var dispatch = function dispatch() {}
    // 尝试调用 dispatch，看是否正在 dispatch，如果正在 dispatch，报错：不允许在构建中间件时进行 dispatch，其他中间件有可能不适用于此 dispatch。
    let dispatch = () => {
      throw new Error(
        `Dispatching while constructing your middleware is not allowed. ` +
          `Other middleware would not be applied to this dispatch.`
      )
    }
    // 定义并初始化变量 chain 中间件链
    let chain = []

    // middlewareAPI 的 api，每个中间件都支持 getState 和 dispatch 作为参数，这里将这两个要传入中间件的参数保存到 middlewareAPI 中
    const middlewareAPI = {
      getState: store.getState,
      dispatch: (...args) => dispatch(...args)
    }
    // 遍历每个 中间件 调用，并将 middlewareAPI 传入进去
    chain = middlewares.map(middleware => middleware(middlewareAPI))
    dispatch = compose(...chain)(store.dispatch)

    return {
      ...store,
      dispatch
    }
  }
}
