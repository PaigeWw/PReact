function createElement(type, props, ...children){
    return {
        type,
        props:{
            ...props,
            children: children.map(child => typeof child === 'object' ? child : createTextElement(child))
        }
    }
}

function createTextElement(text){
    return {
        type: "TEXT_ELEMENT",
        props: {
            nodeValue: text,
            children: []
        }
    }
}

function createDom(fiber){
    const dom = fiber.type === 'TEXT_ELEMENT' ? document.createTextNode("") : document.createElement(fiber.type)
    updateDom(dom, {}, fiber.props)
    return dom
}


const isEvent = key => key.startsWith("on")
const isProperty = key =>
  key !== "children" && !isEvent(key)
const isNew = (prev, next) => key =>
  prev[key] !== next[key]
const isGone = (prev, next) => key => !(key in next)
function updateDom(dom, prevProps, nextProps) {
  //Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(
      key =>
        !(key in nextProps) ||
        isNew(prevProps, nextProps)(key)
    )
    .forEach(name => {
      const eventType = name
        .toLowerCase()
        .substring(2)
      dom.removeEventListener(
        eventType,
        prevProps[name]
      )
    })

  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
      dom[name] = ""
    })

  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
        console.log(name,'->',nextProps[name])
      dom[name] = nextProps[name]
    })

  // Add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name
        .toLowerCase()
        .substring(2)
      dom.addEventListener(
        eventType,
        nextProps[name]
      )
    })
}

function commitRoot() {
    //  console.log('commitRoot-commitRoot-commitRoot')
    deletions.forEach(commitWork)
    commitWork(wipRoot.child)
    currentRoot = wipRoot
    wipRoot = null
}

function commitWork(fiber){
    if(!fiber) {
        return
    }

    let domParentFiber = fiber.parent
    while(!domParentFiber.dom){
        domParentFiber = domParentFiber.parent
    }
    const domParent = domParentFiber.dom

    if(
        fiber.effectTag === "PLACEMENT" && fiber.dom != null
    ){
        domParent.appendChild(fiber.dom)
    } else if (fiber.effectTag === "UPDATE" && fiber.dom != null){
        updateDom(fiber.dom, fiber.alternate.props, fiber.props)
    }else if( fiber.effectTag === "DELETION") {
        commitDeletion(fiber, domParent)
    }

    commitWork(fiber.child)
    commitWork(fiber.sibling)
}

function commitDeletion(fiber, domParent) {
    if(fiber.dom) {
        domParent.removeChild(fiber.dom)
    }else {
        commitDeletion(fiber.child, domParent)
    }
}


function render(element, container){
     //  console.log({element, container})
    wipRoot = {
        dom: container,
        props:{
            children: [element]
        },
        alternate: currentRoot
    }
    deletions=[]
    nextUnitOfWork = wipRoot
}

let nextUnitOfWork = null
let currentRoot = null
let wipRoot = null
let deletions = null

function workLoop(deadline) {
    let shouldYield = false
    while(nextUnitOfWork && !shouldYield){
        nextUnitOfWork = preformUnitOfWork(nextUnitOfWork)
        shouldYield = deadline.timeRemaining() < 1
    }

    if(!nextUnitOfWork && wipRoot){
        commitRoot()
    }

    requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function preformUnitOfWork(fiber) {
    //  console.log('---preformUnitOfWork----')
    //  console.log('fiber', fiber)
    const isFunctionComponent = fiber.type instanceof Function;
    //  console.log('-isFunctionComponent-', isFunctionComponent)
    if(isFunctionComponent) {
        updateFunctionComponent(fiber)
    }else {
        updateHostComponent(fiber)
    }

    if(fiber.child) {
        return fiber.child
    }

    let nextFiber = fiber
    while (nextFiber) {
        //  console.log('while (nextFiber)')
        if(nextFiber.sibling) {
            return nextFiber.sibling
        }
        nextFiber = nextFiber.parent
    }
}

let wipFiber = null
let hookIndex = null

function updateFunctionComponent(fiber){
    wipFiber = fiber
    hookIndex = 0
    wipFiber.hooks = []
    const children = [fiber.type(fiber.props)]
    reconcileChidren(fiber, children)
}

function updateHostComponent(fiber) {
    if(!fiber.dom) {
        fiber.dom = createDom(fiber)
    }
    reconcileChidren(fiber, fiber.props.children)
}

function reconcileChidren(wipFiber, elements){
    let index  = 0
    let oldFiber = wipFiber.alternate?.child
    let prevSibling = null
    //  console.log(index, elements, oldFiber)
    while(index < elements.length || oldFiber != null){
        const element = elements[index]
        let newFiber = null

        // const 
        const sameType = oldFiber && element && oldFiber.type == element.type

        if(sameType) {
            newFiber = {
                type: oldFiber.type,
                props: element.props,
                parent: wipFiber,
                alternate: oldFiber,
                effectTag: "UPDATE"
            }
        }

        if(element && !sameType) {
            newFiber = {
                type: element.type,
                props: element.props,
                dom: null,
                parent: wipFiber,
                alternate: null,
                effectTag: "PLACEMENT"
            }
        }

        if(oldFiber && !sameType){
            oldFiber.effectTag = "DELETION"
            deletions.push(oldFiber)
        }
        if (oldFiber) {
            oldFiber = oldFiber.sibling
        }

        if(index === 0) {
            wipFiber.child = newFiber
        }else if(element) {
            prevSibling.sibling = newFiber
        }

        prevSibling = newFiber
        index++
    }
}

function useState(initial) {
   
    const oldHook =
      wipFiber.alternate &&
      wipFiber.alternate.hooks &&
      wipFiber.alternate.hooks[hookIndex]
    const hook = {
      state: oldHook ? oldHook.state : initial,
      queue: [],
    }
    //  console.log('useState----' ,oldHook)
    const actions = oldHook ? oldHook.queue : []
    actions.forEach(action => {
      hook.state = action(hook.state)
    })
  
    const setState = action => {
      hook.queue.push(action)
      
      wipRoot = {
        dom: currentRoot.dom,
        props: currentRoot.props,
        alternate: currentRoot,
      }
      //  console.log('action',action)
      nextUnitOfWork = wipRoot
      deletions = []
    }
  
    wipFiber.hooks.push(hook)
    hookIndex++
    return [hook.state, setState]
  }

const PReact = {
    createElement,
    render,
    useState
}

export default PReact