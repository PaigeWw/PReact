// 虚拟dom元素的类 构建实例对象 用来描述dom
class Element {
  constructor(type, props, children) {
    this.type = type;
    this.props = props;
    this.children = children;
  }
}

function createElement(type, props, children) {
  return new Element(type, props, children);
}

function setAttr(node, key, value) {
  switch (key) {
    case "value":
      // node是一个input/textarea就直接设置value
      if (["input", "textarea"].includes(node.tagName.toLowCase())) {
        node.value = value;
      } else {
        node.setAttribute(key, value);
      }
      break;
    case "style":
      node.style.cssText = value;
      break;
    default:
      node.setAttribute(key, value);
  }
}

function render(domObj) {
  let el = document.createElement(domObj.type);

  for (let key in domObj.props) {
    setAttr(el, key, domObj.props[key]);
  }

  domObj.children.forEach((child) => {
    child =
      child instanceof Element ? render(child) : document.createTextNode(child);
    el.appendChild(child);
  });

  return el;
}

function renderDom(el, target) {
  target.appendChild(el);
}

export { Element, createElement, render, renderDom, setAttr };
