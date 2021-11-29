const deepCopy = (sourceObj = {}, map = new Map()) => {
  if (sourceObj instanceof Date) {
    return new Date(sourceObj);
  }
  if (sourceObj instanceof RegExp) {
    return new RegExp(sourceObj);
  }

  if (map.has(sourceObj)) {
    return map.get(sourceObj);
  }

  let newObj = new sourceObj.constructor();
  map.set(sourceObj, newObj);
  for (let key in sourceObj) {
    if (typeof sourceObj[key] === "object") {
      console.log("key：", key);
      newObj[key] = deepCopy(sourceObj[key], map);
    } else {
      newObj[key] = sourceObj[key];
    }
  }
  return newObj;
};

export default deepCopy;
