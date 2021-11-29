import { createElement, render, renderDom } from "./element";
import diff from "./diff";
import patch from "./patch";

let virtualDom = createElement("ul", { class: "list" }, [
  createElement("li", { class: "item" }, ["周杰伦"]),
  createElement("li", { class: "item" }, ["林俊杰"]),
  createElement("li", { class: "item" }, ["王力宏"]),
]);

console.log(virtualDom);

let el = render(virtualDom);
renderDom(el, document.getElementById("root"));

let virtualDom2 = createElement("ul", { class: "list-group" }, [
  createElement("li", { class: "item active" }, ["七里香"]),
  createElement("li", { class: "item" }, ["一千年以后"]),
  createElement("li", { class: "item" }, ["需要人陪"]),
  createElement("li", { class: "item" }, ["啦啦啦"]),
]);
// diff一下两个不同的虚拟DOM
let patches = diff(virtualDom, virtualDom2);
console.log(el);
console.log(patches);
// patch(el, patches);
// 将变化打补丁，更新到el
setTimeout(() => {
  console.log("setTimeout");
  patch(el, patches);
}, 3000);
