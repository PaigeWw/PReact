export default (store) => (next) => {
  return function (action) {
    console.log("CURRENT TIME", new Date());
    next(action);
  };
};
