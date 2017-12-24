import $$observable from 'symbol-observable'

import ActionTypes from './utils/actionTypes' // 工具库
import isPlainObject from './utils/isPlainObject' // 工具库

/**
 * Creates a Redux store that holds the state tree.
 * The only way to change the data in the store is to call `dispatch()` on it.
 *
 * There should only be a single store in your app. To specify how different
 * parts of the state tree respond to actions, you may combine several reducers
 * into a single reducer function by using `combineReducers`.
 *
 * @param {Function} reducer A function that returns the next state tree, given
 * the current state tree and the action to handle.
 *
 * @param {any} [preloadedState] The initial state. You may optionally specify it
 * to hydrate the state from the server in universal apps, or to restore a
 * previously serialized user session.
 * If you use `combineReducers` to produce the root reducer function, this must be
 * an object with the same shape as `combineReducers` keys.
 *
 * @param {Function} [enhancer] The store enhancer. You may optionally specify it
 * to enhance the store with third-party capabilities such as middleware,
 * time travel, persistence, etc. The only store enhancer that ships with Redux
 * is `applyMiddleware()`.
 *
 * @returns {Store} A Redux store that lets you read the state, dispatch actions
 * and subscribe to changes.
 */

/**
 * createStore 方法主要用来 创建一个 redux store 用来存放 state。
 * 唯一可以改变 store 中数据的方法就是调用 dispatch() 方法。
 * 在你的 app 中，应该只有一个 store。为了在这一个 store 中回应不同 action，你可能需要多个 reducer ，然后利用 combineReducers 方法将多个 reducer 合并生成一个最终的 reducer。
 * createStore 参数说明：
 *    reducer：一个方法。告诉它现有的 state，以及将如何改变这个 state，最后返回新的 state。
 *    preloadedState：初始化 state。但是如果使用 combineReducers 来生成 reducer，那必须保持状态对象的 key 和 combineReducers 中的 key 相对应；
 *    enhancer：一个方法用来丰富 store。你可以选择性的通过 第三方工具像中间件、time travel、persistence等来定义它。9999这个函数只能用 Redux 提供的 applyMiddleware 函数来生成。
 * createStore 将返回：
 *    一个可供你查看 state、出发 actions 、订阅变化的 redux store 。
 * 
 */
export default function createStore(reducer, preloadedState, enhancer) {
  // 如果 preloadedState 是一个 function，并且用户没有传 enhancer 参数，则 preloadedState 就是 enhancer，preloadedState 设为 undefined
  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    enhancer = preloadedState
    preloadedState = undefined
  }

  // 如果传了 enhancer ，然而并不是 一个 function ，则报错 enhancer 必须是一个函数
  // 如果是个函数，就直接调用他，进入中间件执行函数，并停止后面函数的执行。
  if (typeof enhancer !== 'undefined') {
    if (typeof enhancer !== 'function') {
      throw new Error('Expected the enhancer to be a function.')
    }
    // 返回 enhancer 丰富过后的 store
    // enhancer 方法首先接收createStore作为参数，并且返回一个函数，这个函数接收的参数是reducer,preloadedState
    // 这里利用了函数的柯里化 
    return enhancer(createStore)(reducer, preloadedState) 
  }

  // 如果 reducer 不是一个 function，则报错 reducer必须是一个 function
  if (typeof reducer !== 'function') {
    throw new Error('Expected the reducer to be a function.')
  }

  // 定义一些变量
  //保存当前的 reducer
  let currentReducer = reducer
  //保存当前的 state
  let currentState = preloadedState
  // 保存监听列表
  let currentListeners = []
  // 保存当前要监听的函数列表
  let nextListeners = currentListeners
  // 标记是否正在更新当前的状态
  let isDispatching = false

  // 生成 currentListeners 副本 复值给 nextListeners，确保两个引用地址不同，发生改变互不影响
  // 这里要是有疑问的话，大家可以看一下 我的一篇关于深浅拷贝的文章：https://zhuanlan.zhihu.com/p/26282765
  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice()
    }
  }

  /**
   * Reads the state tree managed by the store.
   *
   * @returns {any} The current state tree of your application.
   */
  // getState 用来获取 store 中管理的 state， 即当前的状态
  function getState() {
    // 如果你在 reducer 执行的过程中在 store 上调用 getState 方法，请修改，因为 reducer 已经作为一个参数传进来了，可以从父级传下来而不是从 store 中读取。
    if (isDispatching) {
      throw new Error(
        'You may not call store.getState() while the reducer is executing. ' +
          'The reducer has already received the state as an argument. ' +
          'Pass it down from the top reducer instead of reading it from the store.'
      )
    }

    return currentState
  }

  /**
   * Adds a change listener. It will be called any time an action is dispatched,
   * and some part of the state tree may potentially have changed. You may then
   * call `getState()` to read the current state tree inside the callback.
   *
   * You may call `dispatch()` from a change listener, with the following
   * caveats:
   *
   * 1. The subscriptions are snapshotted just before every `dispatch()` call.
   * If you subscribe or unsubscribe while the listeners are being invoked, this
   * will not have any effect on the `dispatch()` that is currently in progress.
   * However, the next `dispatch()` call, whether nested or not, will use a more
   * recent snapshot of the subscription list.
   *
   * 2. The listener should not expect to see all state changes, as the state
   * might have been updated multiple times during a nested `dispatch()` before
   * the listener is called. It is, however, guaranteed that all subscribers
   * registered before the `dispatch()` started will be called with the latest
   * state by the time it exits.
   *
   * @param {Function} listener A callback to be invoked on every dispatch.
   * @returns {Function} A function to remove this change listener.
   */
  // 用来给 Store 添加监听其变化的函数。当一个 action 被 dispatch ，这个函数就会被调用，state 中可能有改变。你接下来可能需要在回调中调用getState 去获取新的state。

  // 你可能需要从监听变化的方法上调用 dispatch() 方法，这有几点建议：
  // 1、在每次调用 dispatch 方法之前，当时的订阅都会被记录，如果你在调用监听函数的过程中订阅或者是取消订阅，这个对正在进行的 dispatch() 函数没有任何影响。然而在下一次调用 dispatch ，无论是否嵌套（被之前的 dispatch 嵌套），都会用最新的订阅。
  // 2、订阅不应该期望看到所有 state 上的变化，比如说在监听被调用之前，某个 state 有可能在嵌套的 dispatch 方法中被改变多次。所以就要确保所有被注册的订阅在调用 dispatch 之前 被调用。
  // subscribe 参数说明：
  //      listener：一个方法，一个在每次 dispatch 之前被调用的回调函数。
  // subscribe 方法将返回：
  //      一个方法，用来解绑当前传入的 监听函数。
  function subscribe(listener) {
    // 监听者要求是一个函数
    if (typeof listener !== 'function') {
      throw new Error('Expected listener to be a function.')
    }

    // 在 reducer 执行的过程中你不需要调用 store.subscribe()，如果你希望在 store 在更新后收到通知，你可以订阅一个 component，然后在回调中调用 store.getState() 获取最新的 state。
    if (isDispatching) {
      throw new Error(
        'You may not call store.subscribe() while the reducer is executing. ' +
          'If you would like to be notified after the store has been updated, subscribe from a ' +
          'component and invoke store.getState() in the callback to access the latest state. ' +
          'See http://redux.js.org/docs/api/Store.html#subscribe for more details.'
      )
    }

    // 标记变量，用来标志变量来判断当前的订阅是否已经被解绑。
    let isSubscribed = true
    // 调用上面定义的 ensureCanMutateNextListeners 方法，nextListeners 的改变不影响 currentListeners。
    ensureCanMutateNextListeners()
    // 然后在新的监控中添加当前传入的 新的需要监控函数
    nextListeners.push(listener)

    // 返回一个取消订阅监听的函数
    return function unsubscribe() {
      // 如果已经取消了，就直接返回
      if (!isSubscribed) {
        return
      }
      // 你不应该在 reducer 正在执行的时候，取消订阅 store 监听。
      if (isDispatching) {
        throw new Error(
          'You may not unsubscribe from a store listener while the reducer is executing. ' +
            'See http://redux.js.org/docs/api/Store.html#subscribe for more details.'
        )
      }
      // 将 标记变量 置为 false 
      isSubscribed = false
      // 再次调用上面的 ensureCanMutateNextListeners 方法，又重新生成了 currentListeners 副本 复值给 nextListeners，确保两个引用地址不同，发生改变互不影响
      ensureCanMutateNextListeners()
      // 获得当前传进来的 listener 的 index
      const index = nextListeners.indexOf(listener)
      // 然后在 nextListeners 删除
      nextListeners.splice(index, 1)
    }
  }

  /**
   * Dispatches an action. It is the only way to trigger a state change.
   *
   * The `reducer` function, used to create the store, will be called with the
   * current state tree and the given `action`. Its return value will
   * be considered the **next** state of the tree, and the change listeners
   * will be notified.
   *
   * The base implementation only supports plain object actions. If you want to
   * dispatch a Promise, an Observable, a thunk, or something else, you need to
   * wrap your store creating function into the corresponding middleware. For
   * example, see the documentation for the `redux-thunk` package. Even the
   * middleware will eventually dispatch plain object actions using this method.
   *
   * @param {Object} action A plain object representing “what changed”. It is
   * a good idea to keep actions serializable so you can record and replay user
   * sessions, or use the time travelling `redux-devtools`. An action must have
   * a `type` property which may not be `undef ined`. It is a good idea to use
   * string constants for action types.
   *
   * @returns {Object} For convenience, the same action object you dispatched.
   *
   * Note that, if you use a custom middleware, it may wrap `dispatch()` to
   * return something else (for example, a Promise you can await).
   */
  // dispatch 方法 用来 触发或者说调用一个 action，这是唯一改变 state 的方式

  // reducer 函数 会在这个时候被调用，传参是 现在的 state 和 对应的 action。reducer 返回的值 将会被作为新的状态，同时告知事件监听，我们这边有更新。

  // dispatch 的基本参数是只支持简单的对象，如果你想要 dispatch 一个 Promise、 Observable、thunk 或者别的什么，你需要包装 创建store 的 function 到 合适的 中间件中。例如，你可以看一下redux-thunk 这个包。即使是中间件最终也会使用这种方法 dispatch 简单的对象操作。
  // dispatch 参数介绍： 
  //      action 一个简单的用来描述 什么东西变化了的对象。保持你的 actions 序列化是一个非常好的事情，这有助于你记录和回忆，或者你也可以使用 time travelling 工具 redux-devtools。 action 对象中必须要有 type 属性，值为字符串常量最好
  // dispatch 函数将返回：
  //      你传进来的 action 对象一样的对象

  // 这里要注意的是，如果你用到一个 定制的中间件，他有可能会将 dispatch 包装起来，从而返回的其他东西（比如说一个你可以等待的 Promise）
  function dispatch(action) {
    // 判断 action 类型，不是简单的对象就报错
    if (!isPlainObject(action)) {
      throw new Error(
        'Actions must be plain objects. ' +
          'Use custom middleware for async actions.'
      )
    }

    // 如果 action 没有 type 属性，就报错
    if (typeof action.type === 'undefined') {
      throw new Error(
        'Actions may not have an undefined "type" property. ' +
          'Have you misspelled a constant?'
      )
    }
    
    // reducer 不要调用触发actions
    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.')
    }

    try {
      // 设置 isDispatching 为 true；
      isDispatching = true
      // 更新当前的 state 为最新
      currentState = currentReducer(currentState, action)
    } finally {
      // 在 try 语句执行完之后 再将 isDispatching 置为false
      isDispatching = false
    }

    // 执行当前的所有监听函数，告诉他们状态已经改变
    const listeners = (currentListeners = nextListeners)
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i]
      listener()
    }

    // 返回传进来的 action
    return action
  }

  /**
   * Replaces the reducer currently used by the store to calculate the state.
   *
   * You might need this if your app implements code splitting and you want to
   * load some of the reducers dynamically. You might also need this if you
   * implement a hot reloading mechanism for Redux.
   *
   * @param {Function} nextReducer The reducer for the store to use instead.
   * @returns {void}
   */

  //  替换当前store中使用的 reducer 来计算目前的state；简单来讲就是替换下一个reducer
  //  可能用到这个方法的场景：如果你的应用代码是分离的然后你想手动加载 reducers；如果你为给想要 redux 热部署。
  // replaceReducer参数说明：
  //      nextReducer ：要替换的下一个 reducer；
  // 这个方法什么也不返回
  function replaceReducer(nextReducer) {
    // 类型判断 如果不是 function 报错
    if (typeof nextReducer !== 'function') {
      throw new Error('Expected the nextReducer to be a function.')
    }
    // 然后 替换一下 reducer ，变成下一个
    currentReducer = nextReducer
    // 然后触发 dispatch 改变 state 
    dispatch({ type: ActionTypes.REPLACE })
  }

  /**
   * Interoperability point for observable/reactive libraries.
   * @returns {observable} A minimal observable of state changes.
   * For more information, see the observable proposal:
   * https://github.com/tc39/proposal-observable
   */
  // 预留给 observable/reactive 库的交互接口
  // 此方法没有参数
  // 此方法将返回 
  //      observable： 表示 state 变化了的最小 observable 对象
  function observable() {
    // 将我们上方的 subscribe 方法 暂存
    const outerSubscribe = subscribe
    return {
      /**
       * The minimal observable subscription method.
       * @param {Object} observer Any object that can be used as an observer.
       * The observer object should have a `next` method.
       * @returns {subscription} An object with an `unsubscribe` method that can
       * be used to unsubscribe the observable from the store, and prevent further
       * emission of values from the observable.
       */
      // 一个最小的 observable 订阅方法
      // subscribe 参数介绍：
      //    可以被当作观察者的对象，这个观察者对象应该有一个 next 方法
      // subscribe 方法将返回：
      //     一个对象，他有取消订阅的 unsubscribe 方法可以用来停止接收来自 store 中的状态变更信息。
      subscribe(observer) {
        // 检测参数类型
        if (typeof observer !== 'object') {
          throw new TypeError('Expected the observer to be an object.')
        }


        function observeState() {
          // 如果 observer 有next 方法，则将当前最新的状态传给 observer
          if (observer.next) {
            observer.next(getState())
          }
        }

        // 立即条用一次observeState，用来告知初始化状态
        observeState()
        
        // 取消订阅的函数 是上面定义的 subscribe ，subscribe函数会返回取消订阅当前当前传进来的订阅函数
        const unsubscribe = outerSubscribe(observeState)
        return { unsubscribe }
      },
      // 顶部引入的 $$observable，根据 observable 协议，[Symbol.observable]()返回observable对象自身
      [$$observable]() {
        return this
      }
    }
  }

  // When a store is created, an "INIT" action is dispatched so that every
  // reducer returns their initial state. This effectively populates
  // the initial state tree.
  // 当一个创建一个 store 之后，一个 init 的 action 会被 dispatch，这样就使得每个 reducer 返回他们 state 的 初始值。这个就是用来完整整个初始化 state。
  dispatch({ type: ActionTypes.INIT })

  // 暴露方法
  return {
    dispatch,
    subscribe,
    getState,
    replaceReducer,
    [$$observable]: observable
  }
}
