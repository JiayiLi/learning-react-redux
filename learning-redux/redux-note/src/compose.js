/**
 * Composes single-argument functions from right to left. The rightmost
 * function can take multiple arguments as it provides the signature for
 * the resulting composite function.
 *
 * @param {...Function} funcs The functions to compose.
 * @returns {Function} A function obtained by composing the argument functions
 * from right to left. For example, compose(f, g, h) is identical to doing
 * (...args) => f(g(h(...args))).
 */
// 从右到左组合单参数函数。最右边的函数可以是多个参数。
// compose 参数
//      {...Function} 需要组合的多个函数
// compose 将返回
//      Function：通过从右到左组合参数函数获得的函数，例如
//      compose(f, g, h) 将转化为 (...args) => f(g(h(...args)))
export default function compose(...funcs) {
  // 如果什么都没有传，则直接返回 参数
  // return arg => arg 即
  // return function (arg) {
  //   return arg;
  // };
  if (funcs.length === 0) {
    return arg => arg
  }
  // 如果funcs中只有一个中间件，那么就直接返回这个 中间件
  if (funcs.length === 1) {
    return funcs[0]
  } 
  
  // reduce() 方法对累加器和数组中的每个元素（从左到右）应用一个函数，将其减少为单个值。
  return funcs.reduce((a, b) => (...args) => a(b(...args)))
}
