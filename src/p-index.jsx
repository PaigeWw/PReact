import React from '../preact/index.js'

function Counter() {
    const [state, setState] = React.useState(1)
    return (
      <h1 onClick={() => {
          console.log('onclick---')
          setState(c => c + 1)
          }}>
        Count: {state}
      </h1>
    )
  }
  const element = <Counter />
  const container = document.getElementById("root")
  React.render(element, container)