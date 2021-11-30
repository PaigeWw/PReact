/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *      
 */

                                                          
                                                                              
             
               
                              
                              
                                                 
                                             
                                                          
                                                                                  

import {
  precacheFiberNode,
  updateFiberProps,
  getClosestInstanceFromNode,
  getFiberFromScopeInstance,
  getInstanceFromNode as getInstanceFromNodeDOMTree,
  isContainerMarkedAsRoot,
} from './ReactDOMComponentTree';
import {hasRole} from './DOMAccessibilityRoles';
import {
  createElement,
  createTextNode,
  setInitialProperties,
  diffProperties,
  updateProperties,
  diffHydratedProperties,
  diffHydratedText,
  trapClickOnNonInteractiveElement,
  warnForUnmatchedText,
  warnForDeletedHydratableElement,
  warnForDeletedHydratableText,
  warnForInsertedHydratedElement,
  warnForInsertedHydratedText,
} from './ReactDOMComponent';
import {getSelectionInformation, restoreSelection} from './ReactInputSelection';
import setTextContent from './setTextContent';
import {validateDOMNesting, updatedAncestorInfo} from './validateDOMNesting';
import {
  isEnabled as ReactBrowserEventEmitterIsEnabled,
  setEnabled as ReactBrowserEventEmitterSetEnabled,
} from '../events/ReactDOMEventListener';
import {getChildNamespace} from '../shared/DOMNamespaces';
import {
  ELEMENT_NODE,
  TEXT_NODE,
  COMMENT_NODE,
  DOCUMENT_NODE,
  DOCUMENT_FRAGMENT_NODE,
} from '../shared/HTMLNodeType';
import dangerousStyleValue from '../shared/dangerousStyleValue';

import {REACT_OPAQUE_ID_TYPE} from 'shared/ReactSymbols';
import {retryIfBlockedOn} from '../events/ReactDOMEventReplaying';

import {
  enableSuspenseServerRenderer,
  enableFundamentalAPI,
  enableCreateEventHandleAPI,
  enableScopeAPI,
  enableEagerRootListeners,
} from 'shared/ReactFeatureFlags';
import {HostComponent, HostText} from 'react-reconciler/src/ReactWorkTags';
import {
  listenToReactEvent,
  listenToAllSupportedEvents,
} from '../events/DOMPluginEventSystem';

                          
                     
                      
                   
                     
                   
                                     
                                  
                                  
                         
                       
                        
                      
     
  
                                       
               
                 
             
                        
                      
                      
                    
                     
                   
         
      
       
    
     
  
                       
                                                     
                                                       
                               
                                
                                                                         
                                                                            
                                            
                       
                    
                      
     
  
                              
                                                           
                                         
                             // Unused
                                      
                           
                                                       

                                 
          
     
                                    
                                   
      

                              
                                  
                        
   

let SUPPRESS_HYDRATION_WARNING;
if (__DEV__) {
  SUPPRESS_HYDRATION_WARNING = 'suppressHydrationWarning';
}

const SUSPENSE_START_DATA = '$';
const SUSPENSE_END_DATA = '/$';
const SUSPENSE_PENDING_START_DATA = '$?';
const SUSPENSE_FALLBACK_START_DATA = '$!';

const STYLE = 'style';

let eventsEnabled           = null;
let selectionInformation                              = null;

function shouldAutoFocusHostComponent(type        , props       )          {
  switch (type) {
    case 'button':
    case 'input':
    case 'select':
    case 'textarea':
      return !!props.autoFocus;
  }
  return false;
}

export * from 'react-reconciler/src/ReactFiberHostConfigWithNoPersistence';

export function getRootHostContext(
  rootContainerInstance           ,
)              {
  let type;
  let namespace;
  const nodeType = rootContainerInstance.nodeType;
  switch (nodeType) {
    case DOCUMENT_NODE:
    case DOCUMENT_FRAGMENT_NODE: {
      type = nodeType === DOCUMENT_NODE ? '#document' : '#fragment';
      const root = (rootContainerInstance     ).documentElement;
      namespace = root ? root.namespaceURI : getChildNamespace(null, '');
      break;
    }
    default: {
      const container      =
        nodeType === COMMENT_NODE
          ? rootContainerInstance.parentNode
          : rootContainerInstance;
      const ownNamespace = container.namespaceURI || null;
      type = container.tagName;
      namespace = getChildNamespace(ownNamespace, type);
      break;
    }
  }
  if (__DEV__) {
    const validatedTag = type.toLowerCase();
    const ancestorInfo = updatedAncestorInfo(null, validatedTag);
    return {namespace, ancestorInfo};
  }
  return namespace;
}

export function getChildHostContext(
  parentHostContext             ,
  type        ,
  rootContainerInstance           ,
)              {
  if (__DEV__) {
    const parentHostContextDev = ((parentHostContext     )                );
    const namespace = getChildNamespace(parentHostContextDev.namespace, type);
    const ancestorInfo = updatedAncestorInfo(
      parentHostContextDev.ancestorInfo,
      type,
    );
    return {namespace, ancestorInfo};
  }
  const parentNamespace = ((parentHostContext     )                 );
  return getChildNamespace(parentNamespace, type);
}

export function getPublicInstance(instance          )    {
  return instance;
}

export function prepareForCommit(containerInfo           )                {
  eventsEnabled = ReactBrowserEventEmitterIsEnabled();
  selectionInformation = getSelectionInformation();
  let activeInstance = null;
  if (enableCreateEventHandleAPI) {
    const focusedElem = selectionInformation.focusedElem;
    if (focusedElem !== null) {
      activeInstance = getClosestInstanceFromNode(focusedElem);
    }
  }
  ReactBrowserEventEmitterSetEnabled(false);
  return activeInstance;
}

export function beforeActiveInstanceBlur()       {
  if (enableCreateEventHandleAPI) {
    ReactBrowserEventEmitterSetEnabled(true);
    dispatchBeforeDetachedBlur((selectionInformation     ).focusedElem);
    ReactBrowserEventEmitterSetEnabled(false);
  }
}

export function afterActiveInstanceBlur()       {
  if (enableCreateEventHandleAPI) {
    ReactBrowserEventEmitterSetEnabled(true);
    dispatchAfterDetachedBlur((selectionInformation     ).focusedElem);
    ReactBrowserEventEmitterSetEnabled(false);
  }
}

export function resetAfterCommit(containerInfo           )       {
  restoreSelection(selectionInformation);
  ReactBrowserEventEmitterSetEnabled(eventsEnabled);
  eventsEnabled = null;
  selectionInformation = null;
}

export function createInstance(
  type        ,
  props       ,
  rootContainerInstance           ,
  hostContext             ,
  internalInstanceHandle        ,
)           {
  let parentNamespace        ;
  if (__DEV__) {
    // TODO: take namespace into account when validating.
    const hostContextDev = ((hostContext     )                );
    validateDOMNesting(type, null, hostContextDev.ancestorInfo);
    if (
      typeof props.children === 'string' ||
      typeof props.children === 'number'
    ) {
      const string = '' + props.children;
      const ownAncestorInfo = updatedAncestorInfo(
        hostContextDev.ancestorInfo,
        type,
      );
      validateDOMNesting(null, string, ownAncestorInfo);
    }
    parentNamespace = hostContextDev.namespace;
  } else {
    parentNamespace = ((hostContext     )                 );
  }
  const domElement           = createElement(
    type,
    props,
    rootContainerInstance,
    parentNamespace,
  );
  precacheFiberNode(internalInstanceHandle, domElement);
  updateFiberProps(domElement, props);
  return domElement;
}

export function appendInitialChild(
  parentInstance          ,
  child                         ,
)       {
  parentInstance.appendChild(child);
}

export function finalizeInitialChildren(
  domElement          ,
  type        ,
  props       ,
  rootContainerInstance           ,
  hostContext             ,
)          {
  setInitialProperties(domElement, type, props, rootContainerInstance);
  return shouldAutoFocusHostComponent(type, props);
}

export function prepareUpdate(
  domElement          ,
  type        ,
  oldProps       ,
  newProps       ,
  rootContainerInstance           ,
  hostContext             ,
)                      {
  if (__DEV__) {
    const hostContextDev = ((hostContext     )                );
    if (
      typeof newProps.children !== typeof oldProps.children &&
      (typeof newProps.children === 'string' ||
        typeof newProps.children === 'number')
    ) {
      const string = '' + newProps.children;
      const ownAncestorInfo = updatedAncestorInfo(
        hostContextDev.ancestorInfo,
        type,
      );
      validateDOMNesting(null, string, ownAncestorInfo);
    }
  }
  return diffProperties(
    domElement,
    type,
    oldProps,
    newProps,
    rootContainerInstance,
  );
}

export function shouldSetTextContent(type        , props       )          {
  return (
    type === 'textarea' ||
    type === 'option' ||
    type === 'noscript' ||
    typeof props.children === 'string' ||
    typeof props.children === 'number' ||
    (typeof props.dangerouslySetInnerHTML === 'object' &&
      props.dangerouslySetInnerHTML !== null &&
      props.dangerouslySetInnerHTML.__html != null)
  );
}

export function createTextInstance(
  text        ,
  rootContainerInstance           ,
  hostContext             ,
  internalInstanceHandle        ,
)               {
  if (__DEV__) {
    const hostContextDev = ((hostContext     )                );
    validateDOMNesting(null, text, hostContextDev.ancestorInfo);
  }
  const textNode               = createTextNode(text, rootContainerInstance);
  precacheFiberNode(internalInstanceHandle, textNode);
  return textNode;
}

export const isPrimaryRenderer = true;
export const warnsIfNotActing = true;
// This initialization code may run even on server environments
// if a component just imports ReactDOM (e.g. for findDOMNode).
// Some environments might not have setTimeout or clearTimeout.
export const scheduleTimeout      =
  typeof setTimeout === 'function' ? setTimeout : (undefined     );
export const cancelTimeout      =
  typeof clearTimeout === 'function' ? clearTimeout : (undefined     );
export const noTimeout = -1;

// -------------------
//     Mutation
// -------------------

export const supportsMutation = true;

export function commitMount(
  domElement          ,
  type        ,
  newProps       ,
  internalInstanceHandle        ,
)       {
  // Despite the naming that might imply otherwise, this method only
  // fires if there is an `Update` effect scheduled during mounting.
  // This happens if `finalizeInitialChildren` returns `true` (which it
  // does to implement the `autoFocus` attribute on the client). But
  // there are also other cases when this might happen (such as patching
  // up text content during hydration mismatch). So we'll check this again.
  if (shouldAutoFocusHostComponent(type, newProps)) {
    ((domElement     ) 
                         
                        
                         
                           ).focus();
  }
}

export function commitUpdate(
  domElement          ,
  updatePayload              ,
  type        ,
  oldProps       ,
  newProps       ,
  internalInstanceHandle        ,
)       {
  // Update the props handle so that we know which props are the ones with
  // with current event handlers.
  updateFiberProps(domElement, newProps);
  // Apply the diff to the DOM node.
  updateProperties(domElement, updatePayload, type, oldProps, newProps);
}

export function resetTextContent(domElement          )       {
  setTextContent(domElement, '');
}

export function commitTextUpdate(
  textInstance              ,
  oldText        ,
  newText        ,
)       {
  textInstance.nodeValue = newText;
}

export function appendChild(
  parentInstance          ,
  child                         ,
)       {
  parentInstance.appendChild(child);
}

export function appendChildToContainer(
  container           ,
  child                         ,
)       {
  let parentNode;
  if (container.nodeType === COMMENT_NODE) {
    parentNode = (container.parentNode     );
    parentNode.insertBefore(child, container);
  } else {
    parentNode = container;
    parentNode.appendChild(child);
  }
  // This container might be used for a portal.
  // If something inside a portal is clicked, that click should bubble
  // through the React tree. However, on Mobile Safari the click would
  // never bubble through the *DOM* tree unless an ancestor with onclick
  // event exists. So we wouldn't see it and dispatch it.
  // This is why we ensure that non React root containers have inline onclick
  // defined.
  // https://github.com/facebook/react/issues/11918
  const reactRootContainer = container._reactRootContainer;
  if (
    (reactRootContainer === null || reactRootContainer === undefined) &&
    parentNode.onclick === null
  ) {
    // TODO: This cast may not be sound for SVG, MathML or custom elements.
    trapClickOnNonInteractiveElement(((parentNode     )             ));
  }
}

export function insertBefore(
  parentInstance          ,
  child                         ,
  beforeChild                                            ,
)       {
  parentInstance.insertBefore(child, beforeChild);
}

export function insertInContainerBefore(
  container           ,
  child                         ,
  beforeChild                                            ,
)       {
  if (container.nodeType === COMMENT_NODE) {
    (container.parentNode     ).insertBefore(child, beforeChild);
  } else {
    container.insertBefore(child, beforeChild);
  }
}

function createEvent(type              , bubbles         )        {
  const event = document.createEvent('Event');
  event.initEvent(((type     )        ), bubbles, false);
  return event;
}

function dispatchBeforeDetachedBlur(target             )       {
  if (enableCreateEventHandleAPI) {
    const event = createEvent('beforeblur', true);
    // Dispatch "beforeblur" directly on the target,
    // so it gets picked up by the event system and
    // can propagate through the React internal tree.
    target.dispatchEvent(event);
  }
}

function dispatchAfterDetachedBlur(target             )       {
  if (enableCreateEventHandleAPI) {
    const event = createEvent('afterblur', false);
    // So we know what was detached, make the relatedTarget the
    // detached target on the "afterblur" event.
    (event     ).relatedTarget = target;
    // Dispatch the event on the document.
    document.dispatchEvent(event);
  }
}

export function removeChild(
  parentInstance          ,
  child                                            ,
)       {
  parentInstance.removeChild(child);
}

export function removeChildFromContainer(
  container           ,
  child                                            ,
)       {
  if (container.nodeType === COMMENT_NODE) {
    (container.parentNode     ).removeChild(child);
  } else {
    container.removeChild(child);
  }
}

export function clearSuspenseBoundary(
  parentInstance          ,
  suspenseInstance                  ,
)       {
  let node = suspenseInstance;
  // Delete all nodes within this suspense boundary.
  // There might be nested nodes so we need to keep track of how
  // deep we are and only break out when we're back on top.
  let depth = 0;
  do {
    const nextNode = node.nextSibling;
    parentInstance.removeChild(node);
    if (nextNode && nextNode.nodeType === COMMENT_NODE) {
      const data = ((nextNode     ).data        );
      if (data === SUSPENSE_END_DATA) {
        if (depth === 0) {
          parentInstance.removeChild(nextNode);
          // Retry if any event replaying was blocked on this.
          retryIfBlockedOn(suspenseInstance);
          return;
        } else {
          depth--;
        }
      } else if (
        data === SUSPENSE_START_DATA ||
        data === SUSPENSE_PENDING_START_DATA ||
        data === SUSPENSE_FALLBACK_START_DATA
      ) {
        depth++;
      }
    }
    node = nextNode;
  } while (node);
  // TODO: Warn, we didn't find the end comment boundary.
  // Retry if any event replaying was blocked on this.
  retryIfBlockedOn(suspenseInstance);
}

export function clearSuspenseBoundaryFromContainer(
  container           ,
  suspenseInstance                  ,
)       {
  if (container.nodeType === COMMENT_NODE) {
    clearSuspenseBoundary((container.parentNode     ), suspenseInstance);
  } else if (container.nodeType === ELEMENT_NODE) {
    clearSuspenseBoundary((container     ), suspenseInstance);
  } else {
    // Document nodes should never contain suspense boundaries.
  }
  // Retry if any event replaying was blocked on this.
  retryIfBlockedOn(container);
}

export function hideInstance(instance          )       {
  // TODO: Does this work for all element types? What about MathML? Should we
  // pass host context to this method?
  instance = ((instance     )             );
  const style = instance.style;
  if (typeof style.setProperty === 'function') {
    style.setProperty('display', 'none', 'important');
  } else {
    style.display = 'none';
  }
}

export function hideTextInstance(textInstance              )       {
  textInstance.nodeValue = '';
}

export function unhideInstance(instance          , props       )       {
  instance = ((instance     )             );
  const styleProp = props[STYLE];
  const display =
    styleProp !== undefined &&
    styleProp !== null &&
    styleProp.hasOwnProperty('display')
      ? styleProp.display
      : null;
  instance.style.display = dangerousStyleValue('display', display);
}

export function unhideTextInstance(
  textInstance              ,
  text        ,
)       {
  textInstance.nodeValue = text;
}

export function clearContainer(container           )       {
  if (container.nodeType === ELEMENT_NODE) {
    ((container     )         ).textContent = '';
  } else if (container.nodeType === DOCUMENT_NODE) {
    const body = ((container     )          ).body;
    if (body != null) {
      body.textContent = '';
    }
  }
}

// -------------------
//     Hydration
// -------------------

export const supportsHydration = true;

export function canHydrateInstance(
  instance                    ,
  type        ,
  props       ,
)                  {
  if (
    instance.nodeType !== ELEMENT_NODE ||
    type.toLowerCase() !== instance.nodeName.toLowerCase()
  ) {
    return null;
  }
  // This has now been refined to an element node.
  return ((instance     )          );
}

export function canHydrateTextInstance(
  instance                    ,
  text        ,
)                      {
  if (text === '' || instance.nodeType !== TEXT_NODE) {
    // Empty strings are not parsed by HTML so there won't be a correct match here.
    return null;
  }
  // This has now been refined to a text node.
  return ((instance     )              );
}

export function canHydrateSuspenseInstance(
  instance                    ,
)                          {
  if (instance.nodeType !== COMMENT_NODE) {
    // Empty strings are not parsed by HTML so there won't be a correct match here.
    return null;
  }
  // This has now been refined to a suspense node.
  return ((instance     )                  );
}

export function isSuspenseInstancePending(instance                  ) {
  return instance.data === SUSPENSE_PENDING_START_DATA;
}

export function isSuspenseInstanceFallback(instance                  ) {
  return instance.data === SUSPENSE_FALLBACK_START_DATA;
}

export function registerSuspenseInstanceRetry(
  instance                  ,
  callback            ,
) {
  instance._reactRetry = callback;
}

function getNextHydratable(node) {
  // Skip non-hydratable nodes.
  for (; node != null; node = node.nextSibling) {
    const nodeType = node.nodeType;
    if (nodeType === ELEMENT_NODE || nodeType === TEXT_NODE) {
      break;
    }
    if (enableSuspenseServerRenderer) {
      if (nodeType === COMMENT_NODE) {
        const nodeData = (node     ).data;
        if (
          nodeData === SUSPENSE_START_DATA ||
          nodeData === SUSPENSE_FALLBACK_START_DATA ||
          nodeData === SUSPENSE_PENDING_START_DATA
        ) {
          break;
        }
      }
    }
  }
  return (node     );
}

export function getNextHydratableSibling(
  instance                    ,
)                            {
  return getNextHydratable(instance.nextSibling);
}

export function getFirstHydratableChild(
  parentInstance                      ,
)                            {
  return getNextHydratable(parentInstance.firstChild);
}

export function hydrateInstance(
  instance          ,
  type        ,
  props       ,
  rootContainerInstance           ,
  hostContext             ,
  internalInstanceHandle        ,
)                      {
  precacheFiberNode(internalInstanceHandle, instance);
  // TODO: Possibly defer this until the commit phase where all the events
  // get attached.
  updateFiberProps(instance, props);
  let parentNamespace        ;
  if (__DEV__) {
    const hostContextDev = ((hostContext     )                );
    parentNamespace = hostContextDev.namespace;
  } else {
    parentNamespace = ((hostContext     )                 );
  }
  return diffHydratedProperties(
    instance,
    type,
    props,
    parentNamespace,
    rootContainerInstance,
  );
}

export function hydrateTextInstance(
  textInstance              ,
  text        ,
  internalInstanceHandle        ,
)          {
  precacheFiberNode(internalInstanceHandle, textInstance);
  return diffHydratedText(textInstance, text);
}

export function hydrateSuspenseInstance(
  suspenseInstance                  ,
  internalInstanceHandle        ,
) {
  precacheFiberNode(internalInstanceHandle, suspenseInstance);
}

export function getNextHydratableInstanceAfterSuspenseInstance(
  suspenseInstance                  ,
)                            {
  let node = suspenseInstance.nextSibling;
  // Skip past all nodes within this suspense boundary.
  // There might be nested nodes so we need to keep track of how
  // deep we are and only break out when we're back on top.
  let depth = 0;
  while (node) {
    if (node.nodeType === COMMENT_NODE) {
      const data = ((node     ).data        );
      if (data === SUSPENSE_END_DATA) {
        if (depth === 0) {
          return getNextHydratableSibling((node     ));
        } else {
          depth--;
        }
      } else if (
        data === SUSPENSE_START_DATA ||
        data === SUSPENSE_FALLBACK_START_DATA ||
        data === SUSPENSE_PENDING_START_DATA
      ) {
        depth++;
      }
    }
    node = node.nextSibling;
  }
  // TODO: Warn, we didn't find the end comment boundary.
  return null;
}

// Returns the SuspenseInstance if this node is a direct child of a
// SuspenseInstance. I.e. if its previous sibling is a Comment with
// SUSPENSE_x_START_DATA. Otherwise, null.
export function getParentSuspenseInstance(
  targetInstance      ,
)                          {
  let node = targetInstance.previousSibling;
  // Skip past all nodes within this suspense boundary.
  // There might be nested nodes so we need to keep track of how
  // deep we are and only break out when we're back on top.
  let depth = 0;
  while (node) {
    if (node.nodeType === COMMENT_NODE) {
      const data = ((node     ).data        );
      if (
        data === SUSPENSE_START_DATA ||
        data === SUSPENSE_FALLBACK_START_DATA ||
        data === SUSPENSE_PENDING_START_DATA
      ) {
        if (depth === 0) {
          return ((node     )                  );
        } else {
          depth--;
        }
      } else if (data === SUSPENSE_END_DATA) {
        depth++;
      }
    }
    node = node.previousSibling;
  }
  return null;
}

export function commitHydratedContainer(container           )       {
  // Retry if any event replaying was blocked on this.
  retryIfBlockedOn(container);
}

export function commitHydratedSuspenseInstance(
  suspenseInstance                  ,
)       {
  // Retry if any event replaying was blocked on this.
  retryIfBlockedOn(suspenseInstance);
}

export function didNotMatchHydratedContainerTextInstance(
  parentContainer           ,
  textInstance              ,
  text        ,
) {
  if (__DEV__) {
    warnForUnmatchedText(textInstance, text);
  }
}

export function didNotMatchHydratedTextInstance(
  parentType        ,
  parentProps       ,
  parentInstance          ,
  textInstance              ,
  text        ,
) {
  if (__DEV__ && parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
    warnForUnmatchedText(textInstance, text);
  }
}

export function didNotHydrateContainerInstance(
  parentContainer           ,
  instance                    ,
) {
  if (__DEV__) {
    if (instance.nodeType === ELEMENT_NODE) {
      warnForDeletedHydratableElement(parentContainer, (instance     ));
    } else if (instance.nodeType === COMMENT_NODE) {
      // TODO: warnForDeletedHydratableSuspenseBoundary
    } else {
      warnForDeletedHydratableText(parentContainer, (instance     ));
    }
  }
}

export function didNotHydrateInstance(
  parentType        ,
  parentProps       ,
  parentInstance          ,
  instance                    ,
) {
  if (__DEV__ && parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
    if (instance.nodeType === ELEMENT_NODE) {
      warnForDeletedHydratableElement(parentInstance, (instance     ));
    } else if (instance.nodeType === COMMENT_NODE) {
      // TODO: warnForDeletedHydratableSuspenseBoundary
    } else {
      warnForDeletedHydratableText(parentInstance, (instance     ));
    }
  }
}

export function didNotFindHydratableContainerInstance(
  parentContainer           ,
  type        ,
  props       ,
) {
  if (__DEV__) {
    warnForInsertedHydratedElement(parentContainer, type, props);
  }
}

export function didNotFindHydratableContainerTextInstance(
  parentContainer           ,
  text        ,
) {
  if (__DEV__) {
    warnForInsertedHydratedText(parentContainer, text);
  }
}

export function didNotFindHydratableContainerSuspenseInstance(
  parentContainer           ,
) {
  if (__DEV__) {
    // TODO: warnForInsertedHydratedSuspense(parentContainer);
  }
}

export function didNotFindHydratableInstance(
  parentType        ,
  parentProps       ,
  parentInstance          ,
  type        ,
  props       ,
) {
  if (__DEV__ && parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
    warnForInsertedHydratedElement(parentInstance, type, props);
  }
}

export function didNotFindHydratableTextInstance(
  parentType        ,
  parentProps       ,
  parentInstance          ,
  text        ,
) {
  if (__DEV__ && parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
    warnForInsertedHydratedText(parentInstance, text);
  }
}

export function didNotFindHydratableSuspenseInstance(
  parentType        ,
  parentProps       ,
  parentInstance          ,
) {
  if (__DEV__ && parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
    // TODO: warnForInsertedHydratedSuspense(parentInstance);
  }
}

export function getFundamentalComponentInstance(
  fundamentalInstance                                      ,
)           {
  if (enableFundamentalAPI) {
    const {currentFiber, impl, props, state} = fundamentalInstance;
    const instance = impl.getInstance(null, props, state);
    precacheFiberNode(currentFiber, instance);
    return instance;
  }
  // Because of the flag above, this gets around the Flow error;
  return (null     );
}

export function mountFundamentalComponent(
  fundamentalInstance                                      ,
)       {
  if (enableFundamentalAPI) {
    const {impl, instance, props, state} = fundamentalInstance;
    const onMount = impl.onMount;
    if (onMount !== undefined) {
      onMount(null, instance, props, state);
    }
  }
}

export function shouldUpdateFundamentalComponent(
  fundamentalInstance                                      ,
)          {
  if (enableFundamentalAPI) {
    const {impl, prevProps, props, state} = fundamentalInstance;
    const shouldUpdate = impl.shouldUpdate;
    if (shouldUpdate !== undefined) {
      return shouldUpdate(null, prevProps, props, state);
    }
  }
  return true;
}

export function updateFundamentalComponent(
  fundamentalInstance                                      ,
)       {
  if (enableFundamentalAPI) {
    const {impl, instance, prevProps, props, state} = fundamentalInstance;
    const onUpdate = impl.onUpdate;
    if (onUpdate !== undefined) {
      onUpdate(null, instance, prevProps, props, state);
    }
  }
}

export function unmountFundamentalComponent(
  fundamentalInstance                                      ,
)       {
  if (enableFundamentalAPI) {
    const {impl, instance, props, state} = fundamentalInstance;
    const onUnmount = impl.onUnmount;
    if (onUnmount !== undefined) {
      onUnmount(null, instance, props, state);
    }
  }
}

export function getInstanceFromNode(node             )                {
  return getClosestInstanceFromNode(node) || null;
}

let clientId         = 0;
export function makeClientId()               {
  return 'r:' + (clientId++).toString(36);
}

export function makeClientIdInDEV(warnOnAccessInDEV            )               {
  const id = 'r:' + (clientId++).toString(36);
  return {
    toString() {
      warnOnAccessInDEV();
      return id;
    },
    valueOf() {
      warnOnAccessInDEV();
      return id;
    },
  };
}

export function isOpaqueHydratingObject(value       )          {
  return (
    value !== null &&
    typeof value === 'object' &&
    value.$$typeof === REACT_OPAQUE_ID_TYPE
  );
}

export function makeOpaqueHydratingObject(
  attemptToReadValue            ,
)               {
  return {
    $$typeof: REACT_OPAQUE_ID_TYPE,
    toString: attemptToReadValue,
    valueOf: attemptToReadValue,
  };
}

export function preparePortalMount(portalInstance          )       {
  if (enableEagerRootListeners) {
    listenToAllSupportedEvents(portalInstance);
  } else {
    listenToReactEvent('onMouseEnter', portalInstance, null);
  }
}

export function prepareScopeUpdate(
  scopeInstance                    ,
  internalInstanceHandle        ,
)       {
  if (enableScopeAPI) {
    precacheFiberNode(internalInstanceHandle, scopeInstance);
  }
}

export function getInstanceFromScope(
  scopeInstance                    ,
)                {
  if (enableScopeAPI) {
    return getFiberFromScopeInstance(scopeInstance);
  }
  return null;
}

export const supportsTestSelectors = true;

export function findFiberRoot(node          )                   {
  const stack = [node];
  let index = 0;
  while (index < stack.length) {
    const current = stack[index++];
    if (isContainerMarkedAsRoot(current)) {
      return ((getInstanceFromNodeDOMTree(current)     )           );
    }
    stack.push(...current.children);
  }
  return null;
}

export function getBoundingRect(node          )               {
  const rect = node.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
  };
}

export function matchAccessibilityRole(node          , role        )          {
  if (hasRole(node, role)) {
    return true;
  }

  return false;
}

export function getTextContent(fiber       )                {
  switch (fiber.tag) {
    case HostComponent:
      let textContent = '';
      const childNodes = fiber.stateNode.childNodes;
      for (let i = 0; i < childNodes.length; i++) {
        const childNode = childNodes[i];
        if (childNode.nodeType === Node.TEXT_NODE) {
          textContent += childNode.textContent;
        }
      }
      return textContent;
    case HostText:
      return fiber.stateNode.textContent;
  }

  return null;
}

export function isHiddenSubtree(fiber       )          {
  return fiber.tag === HostComponent && fiber.memoizedProps.hidden === true;
}

export function setFocusIfFocusable(node          )          {
  // The logic for determining if an element is focusable is kind of complex,
  // and since we want to actually change focus anyway- we can just skip it.
  // Instead we'll just listen for a "focus" event to verify that focus was set.
  //
  // We could compare the node to document.activeElement after focus,
  // but this would not handle the case where application code managed focus to automatically blur.
  let didFocus = false;
  const handleFocus = () => {
    didFocus = true;
  };

  const element = ((node     )             );
  try {
    element.addEventListener('focus', handleFocus);
    (element.focus || HTMLElement.prototype.focus).call(element);
  } finally {
    element.removeEventListener('focus', handleFocus);
  }

  return didFocus;
}

                  
                
                     
  

export function setupIntersectionObserver(
  targets                 ,
  callback                             ,
  options                              ,
)    
                         
                                        
                                          
   {
  const rectRatioCache                           = new Map();
  targets.forEach(target => {
    rectRatioCache.set(target, {
      rect: getBoundingRect(target),
      ratio: 0,
    });
  });

  const handleIntersection = (entries                                  ) => {
    entries.forEach(entry => {
      const {boundingClientRect, intersectionRatio, target} = entry;
      rectRatioCache.set(target, {
        rect: {
          x: boundingClientRect.left,
          y: boundingClientRect.top,
          width: boundingClientRect.width,
          height: boundingClientRect.height,
        },
        ratio: intersectionRatio,
      });
    });

    callback(Array.from(rectRatioCache.values()));
  };

  const observer = new IntersectionObserver(handleIntersection, options);
  targets.forEach(target => {
    observer.observe((target     ));
  });

  return {
    disconnect: () => observer.disconnect(),
    observe: target => {
      rectRatioCache.set(target, {
        rect: getBoundingRect(target),
        ratio: 0,
      });
      observer.observe((target     ));
    },
    unobserve: target => {
      rectRatioCache.delete(target);
      observer.unobserve((target     ));
    },
  };
}
