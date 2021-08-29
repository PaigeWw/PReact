import PReact from './preact/index'

function Counter() {
    const [state, setState] = PReact.useState(1)
    return (
      <h1 onClick={() => setState(c => c + 1)}>
        Count: {state}
      </h1>
    )
  }
  const element = <Counter />
  const container = document.getElementById("root")
  PReact.render(element, container)