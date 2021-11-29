import { isString } from "lodash";

function diff(oldTree, newTree) {
  console.log(oldTree, newTree);
  let patches = {};

  let index = 0;

  walk(oldTree, newTree, index, patches);

  return patches;
}

function diffAttr(oldAttrs, newAttrs) {
  let patch = {};
  for (let key in oldAttrs) {
    if (oldAttrs[key] !== newAttrs[key]) {
      patch[key] = newAttrs[key];
    }
  }

  for (let key in newAttrs) {
    if (!oldAttrs.hasOwnProperty(key)) {
      patch[key] = newAttrs[key];
    }
  }
  return patch;
}

let num = 0;

function diffChildren(oldChildren, newChildren, patches) {
  // 比较老的第一个和新的第一个
  oldChildren.forEach((child, index) => {
    walk(child, newChildren[index], ++num, patches);
  });
}

function walk(oldNode, newNode, index, patches) {
  let current = [];

  if (!newNode) {
    current.push({ type: "REMOVE", index });
  } else if (isString(oldNode) && isString(newNode)) {
    if (oldNode !== newNode) {
      current.push({ type: "TEXT", text: newNode });
    }
  } else if (oldNode.type === newNode.type) {
    let attr = diffAttr(oldNode.props, newNode.props);
    if (Object.keys(attr).length > 0) {
      current.push({ type: "ATTR", attr });
    }
    diffChildren(oldNode.children, newNode.children, patches);
  } else {
    current.push({ type: "REPLACE", newNode });
  }

  if (current.length) {
    patches[index] = current;
  }
}

export default diff;
