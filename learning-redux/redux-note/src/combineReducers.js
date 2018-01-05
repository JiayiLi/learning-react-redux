import ActionTypes from './utils/actionTypes' // 工具库
import warning from './utils/warning'  // 工具库
import isPlainObject from './utils/isPlainObject' // 工具库

// 如果没有获得对应的 state 报 undefined 错
function getUndefinedStateErrorMessage(key, action) {
  // 获得 action type
  const actionType = action && action.type
  // 对 action 进行描述，如果有 action type 就用 action 「type」来描述，负责就用 一个 action
  const actionDescription =
    (actionType && `action "${String(actionType)}"`) || 'an action'

  // 返回 报错信息 
  // 你所给的 action type ,reducer 的 key 返回 undefined. 如果你想要忽略一个 action ，你必须传入一个明确返回上一个 state，如果你希望 这个 reducer 没有任何值，你可以返回一个 null 而不是 undefined；
  return (
    `Given ${actionDescription}, reducer "${key}" returned undefined. ` +
    `To ignore an action, you must explicitly return the previous state. ` +
    `If you want this reducer to hold no value, you can return null instead of undefined.`
  )
}

// 如果 没有获得期待的 state 值，报警告错
function getUnexpectedStateShapeWarningMessage(
  inputState,
  reducers,
  action,
  unexpectedKeyCache
) {
  // 存储所有的 reducers key
  const reducerKeys = Object.keys(reducers)

  const argumentName =
    action && action.type === ActionTypes.INIT
      ? 'preloadedState argument passed to createStore'
      : 'previous state received by the reducer'

  // 如果 reducerKeys 中没有东西，代表有可能参数传错了，或者别的什么问题，报错
  if (reducerKeys.length === 0) {
    return (
      'Store does not have a valid reducer. Make sure the argument passed ' +
      'to combineReducers is an object whose values are reducers.'
    )
  }

  // 判断 inputState 是不是一个对象，如果不是报错
  if (!isPlainObject(inputState)) {
    return (
      `The ${argumentName} has unexpected type of "` +
      {}.toString.call(inputState).match(/\s([a-z|A-Z]+)/)[1] +
      `". Expected argument to be an object with the following ` +
      `keys: "${reducerKeys.join('", "')}"`
    )
  }

  // 不期待的 key，即  state 中没有 reducer 中对应的 key，
  const unexpectedKeys = Object.keys(inputState).filter(
    key => !reducers.hasOwnProperty(key) && !unexpectedKeyCache[key]
  )

  // 将不期待的 key 保存到 unexpectedKeys 中
  unexpectedKeys.forEach(key => {
    unexpectedKeyCache[key] = true
  })

  // 如果 action.type 是 预留值 REPLACE，则直接返回
  if (action && action.type === ActionTypes.REPLACE) return

  // 如果 unexpectedKeys 中有东西，也就是说有不期待的 key ，就报错
  if (unexpectedKeys.length > 0) {
    return (
      `Unexpected ${unexpectedKeys.length > 1 ? 'keys' : 'key'} ` +
      `"${unexpectedKeys.join('", "')}" found in ${argumentName}. ` +
      `Expected to find one of the known reducer keys instead: ` +
      `"${reducerKeys.join('", "')}". Unexpected keys will be ignored.`
    )
  }
}


// 验证 Reducer 的合理性
function assertReducerShape(reducers) {
  // 遍历 reducers
  Object.keys(reducers).forEach(key => {
    // 保存每个 reducer；
    const reducer = reducers[key]
    // 初始化调用reducer，返回初始化状态
    const initialState = reducer(undefined, { type: ActionTypes.INIT })

    // 如果返回的初始化状态为undefined，报错：这个key的reducer在初始化的时候返回undefined，如果传给reducer 的state 是 undefined，你必须明确的返回最初的state。最初的state 可能不是undefined。如果你不想给这个reducer设置一个值，你可以使用 null 而不是undefined；
    if (typeof initialState === 'undefined') {
      throw new Error(
        `Reducer "${key}" returned undefined during initialization. ` +
          `If the state passed to the reducer is undefined, you must ` +
          `explicitly return the initial state. The initial state may ` +
          `not be undefined. If you don't want to set a value for this reducer, ` +
          `you can use null instea d of undefined.`
      )
    }

    // 生成一个随机的 type
    const type =
      '@@redux/PROBE_UNKNOWN_ACTION_' +
      Math.random()
        .toString(36)
        .substring(7)
        .split('')
        .join('.')
    // 用随机 action type 测试，如果得到的值是 undefined ，则报错：当用随机的type测试这个key的reducer时返回undefined
    if (typeof reducer(undefined, { type }) === 'undefined') {
      throw new Error(
        `Reducer "${key}" returned undefined when probed with a random type. ` +
          `Don't try to handle ${
            ActionTypes.INIT
          } or other actions in "redux/*" ` +
          `namespace. They are considered private. Instead, you must return the ` +
          `current state for any unknown actions, unless it is undefined, ` +
          `in which case you must return the initial state, regardless of the ` +
          `action type. The initial state may not be undefined, but can be null.`
      )
    }
  })
}

/**
 * Turns an object whose values are different reducer functions, into a single
 * reducer function. It will call every child reducer, and gather their results
 * into a single state object, whose keys correspond to the keys of the passed
 * reducer functions.
 *
 * @param {Object} reducers An object whose values correspond to different
 * reducer functions that need to be combined into one. One handy way to obtain
 * it is to use ES6 `import * as reducers` syntax. The reducers may never return
 * undefined for any action. Instead, they should return their initial state
 * if the state passed to them was undefined, and the current state for any
 * unrecognized action.
 *
 * @returns {Function} A reducer function that invokes every reducer inside the
 * passed object, and builds a state object with the same shape.
 */

 /**
  * 将一个其值是多个不同的reducer 函数，变为一个reducer 函数。这将会调用每个子 reducer，同时将他们的值收集到一
  * 个 state 对象中，这个对象中的 key 对应所传的 reducer 函数的 key。
  *
  * combineReducers 参数：
  *      reducers：一个对象，他的值对应不同的reducer函数，这些函数需要被合并为一个。一个简单的获得它的方法就是* * 用 es 6 的 `import * as reducers` 语法。reducers 可能永远不会对任何 action 返回 undefined。相反，如果* 传给他们的状态就是 undefined，他们应该返回他们最初的状态。
  * combineReducers 将返回：
  *      一个reducer函数：这个函数包括了所有传进来的 reducer 函数并建立一个形状相同的状态对象。
  */
export default function combineReducers(reducers) {
  // 存储传进来的 reducer 的 key
  const reducerKeys = Object.keys(reducers)
  // 生成的最终的 reducer
  const finalReducers = {}
  // 循环遍历传进来的 reducerKeys，过滤掉不是一个函数的 reducer 存到 finalReducers 中
  for (let i = 0; i < reducerKeys.length; i++) {
    const key = reducerKeys[i]

    // 如果不是在production的环境下，reducers[key]是undefined，则警告没有这个key的reducer
    if (process.env.NODE_ENV !== 'production') {
      if (typeof reducers[key] === 'undefined') {
        warning(`No reducer provided for key "${key}"`)
      }
    }

    // 过滤不是函数的reducer
    if (typeof reducers[key] === 'function') {
      finalReducers[key] = reducers[key]
    }
  }
  // 存储过滤后的 Reducer Key
  const finalReducerKeys = Object.keys(finalReducers)
  // 定义变量存放不期待的key值；
  let unexpectedKeyCache
  // 如果当前环境不是 production
  if (process.env.NODE_ENV !== 'production') {
    // 初始化 存放不期待的key值的变量 为一个空对象
    unexpectedKeyCache = {}
  }

  // 验证 reducer 是否合法
  let shapeAssertionError
  try {
    assertReducerShape(finalReducers)
  } catch (e) {
    // 将错误存到shapeAssertionError中
    shapeAssertionError = e
  }

  return function combination(state = {}, action) {
    // 如果有错误，就报错
    if (shapeAssertionError) {
      throw shapeAssertionError
    }

    // 如果当前环境不是 production
    if (process.env.NODE_ENV !== 'production') {
      // 检查是否没有获得期待的 state 值
      const warningMessage = getUnexpectedStateShapeWarningMessage(
        state,
        finalReducers,
        action,
        unexpectedKeyCache
      )
      // 如果有警告错误，就报警告错误
      if (warningMessage) {
        warning(warningMessage)
      }
    }

    // 定义并初始化变量 hasChanged = false
    let hasChanged = false
    // 定义变量新的的state
    const nextState = {}
    // 循环遍历 finalReducerKeys 
    for (let i = 0; i < finalReducerKeys.length; i++) {
      // 暂存 每一个 key
      const key = finalReducerKeys[i]
      // 暂存 每一个 reducer
      const reducer = finalReducers[key]
      // 当前 key 之前的状态
      const previousStateForKey = state[key]
      // 调用 reducer 获取新的 state
      const nextStateForKey = reducer(previousStateForKey, action)
      // 如果新的 state 是 undefined
      if (typeof nextStateForKey === 'undefined') {
        // 获取 错误信息 并报错
        const errorMessage = getUndefinedStateErrorMessage(key, action)
        throw new Error(errorMessage)
      }
      // 保存到新的 nextState 中
      nextState[key] = nextStateForKey
      // 如果新旧 state  不一样，则代编已经变化了， 将变量 hasChanged 设为 true
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey
    }
    // 如果已经变化了，就返回新的 state，否则就是传进来的 state
    return hasChanged ? nextState : state
  }
}
