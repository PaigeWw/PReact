import React, {useState, useEffect} from 'react'

import ReactDOM from 'react-dom';
function Counter() {
    const [state, setState] = useState(1)
    useEffect(() => {
        const id = setInterval(()=>{
            setState(c => c+1)
        }, 1000)
        return () => {
            clearInterval(id)
        }
    }, [])
    return (
      <h1>
        Time: {state}
      </h1>
    )
  }
  const element = <Counter />
  const container = document.getElementById("root")
  ReactDOM.render(element, container)
