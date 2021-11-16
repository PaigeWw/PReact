import React from "react";
import ReactDOM from "react-dom";

String.fromCharCode("A".charCodeAt(0) + 1);

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dataList: [
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
      ],
    };
  }
  render() {
    return (
      <div style={{ padding: "20px 50px" }}>
        {this.state.dataList.map((x) => (
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
    );
  }
}

const container = document.getElementById("root");
ReactDOM.render(<App />, container);
