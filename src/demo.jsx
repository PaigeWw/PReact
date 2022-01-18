import React from "react";
import ReactDOM from "react-dom";

function Son(props) {
  const { grandRef, getWantRef } = props;
  return (
    <div>
      <div> i am alien </div>
      <span ref={getWantRef}>这个是想要获取元素</span>
    </div>
  );
}

class Father extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <div>
        <Son
          grandRef={this.props.grandRef}
          getWantRef={this.props.getWantRef}
        />
      </div>
    );
  }
}

const NewFather = React.forwardRef((props, ref) => (
  <Father grandRef={ref} {...props} />
));

class GrandFather extends React.Component {
  constructor(props) {
    super(props);
  }
  node = null;
  componentDidMount() {
    console.log(this.node);
  }
  render() {
    return (
      <div>
        <Father
          // ref={(node) => (this.node = node)}
          getWantRef={(node) => (this.node = node)}
        />
      </div>
    );
  }
}
const container = document.getElementById("root");
ReactDOM.render(<GrandFather />, container);
