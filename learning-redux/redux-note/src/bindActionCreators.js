// Action Creator 很简单，就是一个创建 action 的函数。不要混淆 action 和 action creator 这两个概念。Action 是一个信息的负载，而 action creator 是一个创建 action 的工厂。
// 调用 action creator 只会生产 action，但不分发。你需要调用 store 的 dispatch function 才会引起变化。有时我们讲 bound action creator，是指一个函数调用了 action creator 并立即将结果分发给一个特定的 store 实例。
function bindActionCreator(actionCreator, dispatch) {
  return function() {
    return dispatch(actionCreator.apply(this, arguments))
  }
}

/**
 * Turns an object whose values are action creators, into an object with the
 * same keys, but with every function wrapped into a `dispatch` call so they
 * may be invoked directly. This is just a convenience method, as you can call
 * `store.dispatch(MyActionCreators.doSomething())` yourself just fine.
 *
 * For convenience, you can also pass a single function as the first argument,
 * and get a function in return.
 *
 * @param {Function|Object} actionCreators An object whose values are action
 * creator functions. One handy way to obtain it is to use ES6 `import * as`
 * syntax. You may also pass a single function.
 *
 * @param {Function} dispatch The `dispatch` function available on your Redux
 * store.
 *
 * @returns {Function|Object} The object mimicking the original object, but with
 * every action creator wrapped into the `dispatch` call. If you passed a
 * function as `actionCreators`, the return value will also be a single
 * function.
 */


// 将一个值为多个 action creators 的对象 转换成 具有相同 key 值，并将每个action creators函数包裹在 dispatch中，这样就可以直接被调用。这是一个非常方便的方法，你可以自己调用 `store.dispatch(MyActionCreators.doSomething())`。
// 为了方便，您也可以穿一个单独的 函数 作为第一个参数，然后返回一个函数给你.
// 惟一使用 bindActionCreators 的场景是当你需要把 action creator 往下传到一个组件上，却不想让这个组件觉察到 Redux 的存在，而且不希望把 Redux store 或 dispatch 传给它。
// bindActionCreators 参数：
//      actionCreators ： 一个对象，其值是多个 action creator 函数。一个简单的方法得到他是用 es6 中的 `import * as` 语法。你同样也可以只传一个函数。
//      dispatch ： `dispatch` 函数 用在你的 redux store 上。
// bindActionCreators 函数将返回：
//      一个Function或者一个对象：一个与原对象类似的对象，但是将每个 action creator 包裹在 dispatch 中。如果你传递了一个 actionCreators 函数，同样将返回一个简单的函数
export default function bindActionCreators(actionCreators, dispatch) {
  // 如果actionCreators是一个函数，代表只传入了一个函数，则之间包裹返回
  if (typeof actionCreators === 'function') {
    return bindActionCreator(actionCreators, dispatch)
  }
  // 如果不是一个 函数，则进行类型判断，不是一个对象，或者 为 null，则报错
  if (typeof actionCreators !== 'object' || actionCreators === null) {
    throw new Error(
      `bindActionCreators expected an object or a function, instead received ${
        actionCreators === null ? 'null' : typeof actionCreators
      }. ` +
        `Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?`
    )
  }

  // 如果传入了一个对象，则表示传入了多个 actionCreators 函数
  // 暂存 key 值
  const keys = Object.keys(actionCreators)
  // 定义并初始化变量：所有包裹后的 ActionCreators 对象
  const boundActionCreators = {}
  // 循环遍历
  for (let i = 0; i < keys.length; i++) {
    // 暂存每一个 key
    const key = keys[i]
    // 当前对应的 actionCreator
    const actionCreator = actionCreators[key]
    // 在进行一次类型检查，如果当前的 actionCreator 是个函数，则进行包裹，并将结果赋值给 boundActionCreators[key]
    if (typeof actionCreator === 'function') {
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch)
    }
  }
  // 返回boundActionCreators对象
  return boundActionCreators
}
