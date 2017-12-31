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
export default function combineReducers(reducers) {
  const reducerKeys = Object.keys(reducers)
  const finalReducers = {}
  for (let i = 0; i < reducerKeys.length; i++) {
    const key = reducerKeys[i]

    if (process.env.NODE_ENV !== 'production') {
      if (typeof reducers[key] === 'undefined') {
        warning(`No reducer provided for key "${key}"`)
      }
    }

    if (typeof reducers[key] === 'function') {
      finalReducers[key] = reducers[key]
    }
  }
  const finalReducerKeys = Object.keys(finalReducers)

  let unexpectedKeyCache
  if (process.env.NODE_ENV !== 'production') {
    unexpectedKeyCache = {}
  }

  let shapeAssertionError
  try {
    assertReducerShape(finalReducers)
  } catch (e) {
    shapeAssertionError = e
  }

  return function combination(state = {}, action) {
    if (shapeAssertionError) {
      throw shapeAssertionError
    }

    if (process.env.NODE_ENV !== 'production') {
      const warningMessage = getUnexpectedStateShapeWarningMessage(
        state,
        finalReducers,
        action,
        unexpectedKeyCache
      )
      if (warningMessage) {
        warning(warningMessage)
      }
    }

    let hasChanged = false
    const nextState = {}
    for (let i = 0; i < finalReducerKeys.length; i++) {
      const key = finalReducerKeys[i]
      const reducer = finalReducers[key]
      const previousStateForKey = state[key]
      const nextStateForKey = reducer(previousStateForKey, action)
      if (typeof nextStateForKey === 'undefined') {
        const errorMessage = getUndefinedStateErrorMessage(key, action)
        throw new Error(errorMessage)
      }
      nextState[key] = nextStateForKey
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey
    }
    return hasChanged ? nextState : state
  }
}
