import * as React from "react";
const { useState, useEffect } = React;
// import useKeyPress from '../custom-hooks/useKeyPress'
import useScroll from "../custom-hooks/useScroll";
import * as ReactDOM from "react-dom";

function App() {
  const [listData, setListData] = useState([
    { id: 1, name: "A" },
    { id: 2, name: "B" },
    { id: 3, name: "C" },
    { id: 4, name: "D" },
    { id: 5, name: "E" },
    { id: 6, name: "F" },
    { id: 7, name: "G" },
    { id: 8, name: "H" },
    { id: 9, name: "I" },
    { id: 10, name: "J" },
  ]);
  useEffect(() => {
    console.log("更新啦！！！");
  }, [listData]);
  const { wrapperRef, contextRef } = useScroll(() => {
    setListData((x) =>
      x.concat([
        {
          id: x[x.length - 1].id + 1,
          name: String.fromCharCode(x[x.length - 1].name.charCodeAt(0) + 1),
        },
      ])
    );
  });

  return (
    <div style={{ height: "600px", overflowY: "scroll" }} ref={wrapperRef}>
      <div ref={contextRef}>
        {listData.map((x) => (
          <h1
            style={{
              border: "1px solid",
              padding: "20px 0",
              textAlign: "center",
            }}
            key={x.id}
          >
            {x.name}
          </h1>
        ))}
      </div>
    </div>
  );
}

const container = document.getElementById("root");
let intan = ReactDOM.render(<App />, container, function () {
  console.log("this", this);
});
console.dir(intan);
/**
 * concurrent 模式： ReactDOM.createRoot(rootNode).render(<App />)
 */
// ReactDOM.createRoot(document.getElementById("root")).render(<App />);
