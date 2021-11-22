import React from "react";
import ReactDOM from "react-dom";

function App() {
  const dataList = [
    { id: 1, name: "A" },
    { id: 2, name: "B" },
    { id: 3, name: "C" },
    { id: 4, name: "D" },
    { id: 5, name: "E" },
  ];
  return (
    <div>
      {dataList.map((x) => (
        <h1 key={x.id}>{x.name}</h1>
      ))}
    </div>
  );
}

const container = document.getElementById("root");
ReactDOM.render(App(), container);
