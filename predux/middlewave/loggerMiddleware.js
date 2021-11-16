export default (store) => (next) => {
  return function (action) {
    console.log("this state", store.getState());
    next(action);
    console.log("next state", store.getState());
    console.log("=================");
  };
};
