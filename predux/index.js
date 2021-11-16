import { isPlainObject } from "./helper";

export function createStore(reducer, preloadedState, enhancer) {
  // 当第二个参数得是function，第三个参数没传，就会把这个function当成enhancer
  if (typeof preloadedState === "function" && typeof enhancer === "undefined") {
    enhancer = preloadedState;
    preloadedState = undefined;
  }
  // 当第三个参数传了但是不是function也会报错
  if (typeof enhancer !== "undefined") {
    if (typeof enhancer !== "function") {
      throw new Error("Expected the enhancer to be a function");
    }
    console.log("----enhancer------");
    return enhancer(createStore)(reducer, preloadedState);
  }

  // reducer必须为函数
  if (typeof reducer !== "function") {
    throw new Error("Expected the reducer to be a function");
  }

  let currentState = preloadedState;
  let currentListeners = [];
  const getState = () => currentState;
  const subscribe = (listener) => {
    if (typeof listener !== "function") {
      throw new Error("Expected listener to be a function");
    }
    currentListeners.push(listener);
    return () => {
      const index = currentListeners.indexOf(listener);
      currentListeners.splice(index, 1);
    };
  };

  let isDispatching = false;
  const dispatch = (action) => {
    // 判断是否是一个普通对象
    if (!isPlainObject(action)) {
      throw new Error("Actions muste plain objects. ");
    }

    // 防止多次dispatch请求同时改状态

    if (isDispatching) {
      throw new Error("Reducers may not dispatch actions.");
    }

    try {
      isDispatching = true;
      currentState = reducer(currentState, action);
    } finally {
      isDispatching = false;
    }
    currentListeners.forEach((listener) => listener());
    return action;
  };

  dispatch({ type: "@@mini-redux/~GSDG4%FDG#*&" });
  return {
    getState,
    subscribe,
    dispatch,
  };
}

export function combineReducers(reducers) {
  const reducerKeys = Object.keys(reducers);

  // 合并后返回新的reducer函数
  // reducerKeys.map(reducerKey => { })
  return function combination(state, action) {
    const nextState = {};
    reducerKeys.forEach((key) => {
      const reducer = reducers[key];
      const previousStateForKey = state[key];
      const nextStateForKey = reducer(previousStateForKey, action);
      nextState[key] = nextStateForKey;
    });
    return nextState;
  };
}
export function compose(...funcs) {
  if (funcs.length === 1) {
    return funcs[0];
  }
  return funcs.reduce(
    (a, b) =>
      (...args) =>
        a(b(...args))
  );
}

export function applyMiddleware(...middlewares) {
  // 返回一个重写createStore的方法
  return function rewriteCreateStoreFunc(oldCreateStore) {
    return function newCreateStore(reducer, initState) {
      // 生成store
      const store = oldCreateStore(reducer, initState);
      console.log("-----newCreateStore-----");
      const chain = middlewares.map((middleware) => middleware(store));
      store.dispatch = compose(...chain)(store.dispatch);
      return store;
    };
  };
}
