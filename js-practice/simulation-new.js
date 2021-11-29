const SimulationNew = function (_constructor, ...args) {
  let target = {};
  target.__proto__ = _constructor.prototype;
  let res = _constructor.apply(target, args);
  if (res && typeof res === "object") {
    return res;
  }
  return target;
};
