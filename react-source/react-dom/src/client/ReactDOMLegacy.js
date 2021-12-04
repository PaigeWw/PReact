/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Legacy：这里应该是“传统的”的意思
 * ReactDOMLegacy.js 里就是一些操作传统Dom的内容
 *
 */

import {
  getInstanceFromNode,
  isContainerMarkedAsRoot,
  unmarkContainerAsRoot,
} from "./ReactDOMComponentTree";
import { createLegacyRoot, isValidContainer } from "./ReactDOMRoot";
import { ROOT_ATTRIBUTE_NAME } from "../shared/DOMProperty";
import {
  DOCUMENT_NODE,
  ELEMENT_NODE,
  COMMENT_NODE,
} from "../shared/HTMLNodeType";

import {
  findHostInstanceWithNoPortals,
  updateContainer,
  unbatchedUpdates,
  getPublicRootInstance,
  findHostInstance,
  findHostInstanceWithWarning,
} from "react-reconciler/src/ReactFiberReconciler";
import getComponentName from "shared/getComponentName";
import invariant from "shared/invariant";
import ReactSharedInternals from "shared/ReactSharedInternals";
import { has as hasInstance } from "shared/ReactInstanceMap";

const ReactCurrentOwner = ReactSharedInternals.ReactCurrentOwner;

let topLevelUpdateWarnings;
let warnedAboutHydrateAPI = false;

if (__DEV__) {
  topLevelUpdateWarnings = (container) => {
    if (container._reactRootContainer && container.nodeType !== COMMENT_NODE) {
      const hostInstance = findHostInstanceWithNoPortals(
        container._reactRootContainer._internalRoot.current
      );
      if (hostInstance) {
        if (hostInstance.parentNode !== container) {
          console.error(
            "render(...): It looks like the React-rendered content of this " +
              "container was removed without using React. This is not " +
              "supported and will cause errors. Instead, call " +
              "ReactDOM.unmountComponentAtNode to empty a container."
          );
        }
      }
    }

    const isRootRenderedBySomeReact = !!container._reactRootContainer;
    const rootEl = getReactRootElementInContainer(container);
    const hasNonRootReactChild = !!(rootEl && getInstanceFromNode(rootEl));

    if (hasNonRootReactChild && !isRootRenderedBySomeReact) {
      console.error(
        "render(...): Replacing React-rendered children with a new root " +
          "component. If you intended to update the children of this node, " +
          "you should instead have the existing children update their state " +
          "and render the new components instead of calling ReactDOM.render."
      );
    }

    if (
      container.nodeType === ELEMENT_NODE &&
      container.tagName &&
      container.tagName.toUpperCase() === "BODY"
    ) {
      console.error(
        "render(): Rendering components directly into document.body is " +
          "discouraged, since its children are often manipulated by third-party " +
          "scripts and browser extensions. This may lead to subtle " +
          "reconciliation issues. Try rendering into a container element created " +
          "for your app."
      );
    }
  };
}

function getReactRootElementInContainer(container) {
  if (!container) {
    return null;
  }

  if (container.nodeType === DOCUMENT_NODE) {
    return container.documentElement;
  } else {
    return container.firstChild;
  }
}

function shouldHydrateDueToLegacyHeuristic(container) {
  const rootElement = getReactRootElementInContainer(container);
  return !!(
    rootElement &&
    rootElement.nodeType === ELEMENT_NODE &&
    rootElement.hasAttribute(ROOT_ATTRIBUTE_NAME)
  );
}

function legacyCreateRootFromDOMContainer(container, forceHydrate) {
  const shouldHydrate =
    forceHydrate || shouldHydrateDueToLegacyHeuristic(container);
  // First clear any existing content. 清除根节点下的内容
  if (!shouldHydrate) {
    let warned = false;
    let rootSibling;
    while ((rootSibling = container.lastChild)) {
      if (__DEV__) {
        if (
          !warned &&
          rootSibling.nodeType === ELEMENT_NODE &&
          rootSibling.hasAttribute(ROOT_ATTRIBUTE_NAME)
        ) {
          warned = true;
          console.error(
            "render(): Target node has markup rendered by React, but there " +
              "are unrelated nodes as well. This is most commonly caused by " +
              "white-space inserted around server-rendered markup."
          );
        }
      }
      container.removeChild(rootSibling);
    }
  }
  if (__DEV__) {
    if (shouldHydrate && !forceHydrate && !warnedAboutHydrateAPI) {
      warnedAboutHydrateAPI = true;
      console.warn(
        "render(): Calling ReactDOM.render() to hydrate server-rendered markup " +
          "will stop working in React v18. Replace the ReactDOM.render() call " +
          "with ReactDOM.hydrate() if you want React to attach to the server HTML."
      );
    }
  }

  return createLegacyRoot(
    container,
    shouldHydrate
      ? {
          hydrate: true,
        }
      : undefined
  );
}

function warnOnInvalidCallback(callback, callerName) {
  if (__DEV__) {
    if (callback !== null && typeof callback !== "function") {
      console.error(
        "%s(...): Expected the last optional `callback` argument to be a " +
          "function. Instead received: %s.",
        callerName,
        callback
      );
    }
  }
}

function legacyRenderSubtreeIntoContainer(
  parentComponent,
  children,
  container,
  forceHydrate, // ssr相关的
  callback
) {
  if (__DEV__) {
    topLevelUpdateWarnings(container);
    warnOnInvalidCallback(callback === undefined ? null : callback, "render");
  }
  // TODO: Without `any` type, Flow says "Property cannot be accessed on any
  // member of intersection type." Whyyyyyy.
  let root = container._reactRootContainer;
  let fiberRoot;
  if (!root) {
    // Initial mount
    root = container._reactRootContainer = legacyCreateRootFromDOMContainer(
      container,
      forceHydrate
    );
    fiberRoot = root._internalRoot;

    if (typeof callback === "function") {
      const originalCallback = callback;
      callback = function () {
        const instance = getPublicRootInstance(fiberRoot);
        originalCallback.call(instance);
      };
    }
    // Initial mount should not be batched.
    unbatchedUpdates(() => {
      updateContainer(children, fiberRoot, parentComponent, callback);
    });
  } else {
    fiberRoot = root._internalRoot;
    if (typeof callback === "function") {
      const originalCallback = callback;
      callback = function () {
        const instance = getPublicRootInstance(fiberRoot);
        originalCallback.call(instance);
      };
    }
    // Update
    updateContainer(children, fiberRoot, parentComponent, callback);
  }
  return getPublicRootInstance(fiberRoot);
}

export function findDOMNode(componentOrElement) {
  if (__DEV__) {
    const owner = ReactCurrentOwner.current;
    if (owner !== null && owner.stateNode !== null) {
      const warnedAboutRefsInRender = owner.stateNode._warnedAboutRefsInRender;
      if (!warnedAboutRefsInRender) {
        console.error(
          "%s is accessing findDOMNode inside its render(). " +
            "render() should be a pure function of props and state. It should " +
            "never access something that requires stale data from the previous " +
            "render, such as refs. Move this logic to componentDidMount and " +
            "componentDidUpdate instead.",
          getComponentName(owner.type) || "A component"
        );
      }
      owner.stateNode._warnedAboutRefsInRender = true;
    }
  }
  if (componentOrElement == null) {
    return null;
  }
  if (componentOrElement.nodeType === ELEMENT_NODE) {
    return componentOrElement;
  }
  if (__DEV__) {
    return findHostInstanceWithWarning(componentOrElement, "findDOMNode");
  }
  return findHostInstance(componentOrElement);
}

export function hydrate(element, container, callback) {
  invariant(
    isValidContainer(container),
    "Target container is not a DOM element."
  );
  if (__DEV__) {
    const isModernRoot =
      isContainerMarkedAsRoot(container) &&
      container._reactRootContainer === undefined;
    if (isModernRoot) {
      console.error(
        "You are calling ReactDOM.hydrate() on a container that was previously " +
          "passed to ReactDOM.createRoot(). This is not supported. " +
          "Did you mean to call createRoot(container, {hydrate: true}).render(element)?"
      );
    }
  }
  // TODO: throw or warn if we couldn't hydrate?
  return legacyRenderSubtreeIntoContainer(
    null,
    element,
    container,
    true,
    callback
  );
}

export function render(element, container, callback) {
  invariant(
    isValidContainer(container),
    "Target container is not a DOM element."
  );
  if (__DEV__) {
    const isModernRoot =
      isContainerMarkedAsRoot(container) &&
      container._reactRootContainer === undefined;
    if (isModernRoot) {
      console.error(
        "You are calling ReactDOM.render() on a container that was previously " +
          "passed to ReactDOM.createRoot(). This is not supported. " +
          "Did you mean to call root.render(element)?"
      );
    }
  }
  // 传统模式 渲染子树到容器中
  return legacyRenderSubtreeIntoContainer(
    null,
    element,
    container,
    false,
    callback
  );
}

export function unstable_renderSubtreeIntoContainer(
  parentComponent,
  element,
  containerNode,
  callback
) {
  invariant(
    isValidContainer(containerNode),
    "Target container is not a DOM element."
  );
  invariant(
    parentComponent != null && hasInstance(parentComponent),
    "parentComponent must be a valid React Component"
  );
  return legacyRenderSubtreeIntoContainer(
    parentComponent,
    element,
    containerNode,
    false,
    callback
  );
}

export function unmountComponentAtNode(container) {
  invariant(
    isValidContainer(container),
    "unmountComponentAtNode(...): Target container is not a DOM element."
  );

  if (__DEV__) {
    const isModernRoot =
      isContainerMarkedAsRoot(container) &&
      container._reactRootContainer === undefined;
    if (isModernRoot) {
      console.error(
        "You are calling ReactDOM.unmountComponentAtNode() on a container that was previously " +
          "passed to ReactDOM.createRoot(). This is not supported. Did you mean to call root.unmount()?"
      );
    }
  }

  if (container._reactRootContainer) {
    if (__DEV__) {
      const rootEl = getReactRootElementInContainer(container);
      const renderedByDifferentReact = rootEl && !getInstanceFromNode(rootEl);
      if (renderedByDifferentReact) {
        console.error(
          "unmountComponentAtNode(): The node you're attempting to unmount " +
            "was rendered by another copy of React."
        );
      }
    }

    // Unmount should not be batched.
    unbatchedUpdates(() => {
      legacyRenderSubtreeIntoContainer(null, null, container, false, () => {
        // $FlowFixMe This should probably use `delete container._reactRootContainer`
        container._reactRootContainer = null;
        unmarkContainerAsRoot(container);
      });
    });
    // If you call unmountComponentAtNode twice in quick succession, you'll
    // get `true` twice. That's probably fine?
    return true;
  } else {
    if (__DEV__) {
      const rootEl = getReactRootElementInContainer(container);
      const hasNonRootReactChild = !!(rootEl && getInstanceFromNode(rootEl));

      // Check if the container itself is a React root node.
      const isContainerReactRoot =
        container.nodeType === ELEMENT_NODE &&
        isValidContainer(container.parentNode) &&
        !!container.parentNode._reactRootContainer;

      if (hasNonRootReactChild) {
        console.error(
          "unmountComponentAtNode(): The node you're attempting to unmount " +
            "was rendered by React and is not a top-level container. %s",
          isContainerReactRoot
            ? "You may have accidentally passed in a React root node instead " +
                "of its container."
            : "Instead, have the parent component update its state and " +
                "rerender in order to remove this component."
        );
      }
    }

    return false;
  }
}
