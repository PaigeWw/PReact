import React from "react";
import ReactDOM from "react-dom";
window.count = 0;
String.fromCharCode("A".charCodeAt(0) + 1);
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
class App extends React.Component {
  constructor(props) {
    console.log(window.count++, "constructor");
    super(props);
    this.state = {
      loading: false,
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
    this.wrapperRef = React.createRef();
  }
  static getDerivedStateFromProps() {
    console.log(window.count++, "getDerivedStateFromProps");
    return null;
  }

  shouldComponentUpdate() {
    console.log(window.count++, "shouldComponentUpdate");
    return true;
  }

  getSnapshotBeforeUpdate() {
    console.log(window.count++, "getSnapshotBeforeUpdate");
    return null;
  }

  componentDidMount() {
    console.log(window.count++, "componentDidMount");
    const node = this.wrapperRef.current;
    console.log("onScroll", this.checkVisible(node));
    this.scrollParent = this.getScrollParent(node);
    if (this.checkVisible(node)) {
      this.setState({ ...this.state, loading: false });
    } else {
      const scrollParent = this.scrollParent || window;
      scrollParent.addEventListener("scroll", this.onScroll);
    }
  }

  componentDidUpdate() {
    console.log(window.count++, "componentDidUpdate");
  }

  componentWillUnmount() {
    console.log(window.count++, "componentWillUnmount");
    const scrollParent = this.scrollParent || window;
    scrollParent.removeEventListener("scroll", this.onScroll);
  }
  onScroll = throttle(() => {
    const node = this.ref.current;

    if (this.checkVisible(node)) {
      this.setState({ ...this.state, loading: false });
    } else {
      this.setState({
        ...this.state,

        dataList: this.state.concat({
          id: this.state.dataList.length,
          name: String.fromCharCode(
            "A".charCodeAt(0) + this.state.dataList.length
          ),
        }),
      });
    }
  }, 200);

  checkVisible = (node) => {
    if (node) {
      const { top, bottom, left, right } = node.getBoundingClientRect();
      return (
        bottom > 0 &&
        top < window.innerHeight &&
        left < window.innerWidth &&
        right > 0
      );
    }
    return false;
  };

  getScrollParent = (node) => {
    if (!node || node.parentNode === document.documentElement) {
      return null;
    }
    const parentNode = node.parentNode;
    if (
      parentNode.scrollHeight > parentNode.clientHeight ||
      parentNode.scrollWidth > parentNode.clientWidth
    ) {
      return parentNode;
    }
    return this.getScrollParent(parentNode);
  };

  render() {
    console.log(window.count++, "render");
    return (
      <div style={{ padding: "20px 50px" }} ref={this.wrapperRef}>
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
