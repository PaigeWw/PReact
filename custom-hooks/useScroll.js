import { useEffect,useRef } from 'react'
import useThrottle from './useThrottle'
var throttle = (fn, time) => {
   
    let timeId = null;
    return function () {
      if (timeId) {
        return;
      }
      timeId = setTimeout(() => {
        fn.apply(this, arguments);
        timeId = null;
      }, time);
    };
  };
const useScroll = (loaderMore) => {
    const wrapperRef = useRef(null)
    const contextRef = useRef(null)
    useEffect(() => {
        const wrapperNode = wrapperRef.current;
        const contextNode =  contextRef.current;
        const OnScroll = throttle(() => {
            const contextBottom = contextNode.getBoundingClientRect().bottom
            const wrapperBottom = wrapperNode.getBoundingClientRect().bottom
            if(contextBottom < wrapperBottom) {
                loaderMore()
            }
            
        }, 200)
        wrapperNode.addEventListener("scroll", OnScroll)
        return () => {
            wrapperNode.addEventListener("scroll", OnScroll)
        }
    }, [ ])
    return { wrapperRef, contextRef}
}

export default useScroll