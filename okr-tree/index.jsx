import * as React from "react";
import lodash from "lodash";
const { useState, useEffect, useRef, useLayoutEffect } = React;
const statusInfo = {
  smoothly: { label: "顺利进行", color: "#31cc5a" },
  unconsidered: { label: "尚未考量", color: "#42a8fd" },
  completed: { label: "已经完成", color: "#9ecd6a" },
  hard: { label: "遇到困难", color: "#fece56" },
  "": { label: "尚未考量", color: "#42a8fd" },
  abandoned: { label: "已放弃", color: "red", key: "abandoned" },
};

function OkrNode({ node, onExtend }) {
  const { id, children, name, status, expand, show, x, y, expandSvgInfo } =
    node;
  const ref = useRef(null);
  const [height, setHeight] = useState(0);
  useLayoutEffect(() => {
    setHeight(ref.current.offsetHeight);
  }, []);
  // console.log(height);
  return (
    <div
      ref={ref}
      style={{
        width: "360px",
        border: "1px solid #cccccc",
        padding: "6px",
        position: "absolute",
        top: ` ${y}px`,
        left: `${x}px`,
        borderLeft: `3px solid ${statusInfo[status].color}`,
        height: "80px",
        boxSizing: "border-box",
        display: show ? "block" : "none",
      }}
      key={id}
    >
      <div
        style={{
          width: "340px",
          height: "60px",
          boxSizing: "border-box",
          overflow: "hidden",
          textOverflow: "ellipsis",
          wordBreak: "break-all",
        }}
      >
        {name}
      </div>
      {children?.length > 0 ? (
        <div
          onClick={() => {
            // console.log("onClick");
            onExtend();
          }}
          style={{
            position: "absolute",
            right: "0",
            top: "50%",
            transform: "translate(50%,-50%)",
            border: "1px solid #cccccc",
            borderRadius: "50%",
            width: "20px",
            height: "20px",
            lineHeight: expand ? "18px" : "20px",
            textAlign: "center",
            background: "cornflowerblue",
            cursor: "pointer",
          }}
        >
          {expand ? "-" : children?.length}
        </div>
      ) : null}
      {expandSvgInfo ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          height={expandSvgInfo.height + 6}
          width="60"
          style={{
            position: "absolute",
            top: ` ${-expandSvgInfo.height / 2 + 40}px`,
            left: `${366}px`,
            opacity: expand ? 1 : 0,
          }}
        >
          {expandSvgInfo.pathsInfo.map((info, i) => (
            <path
              key={`${id}-${i}`}
              d={`M ${info.x0} ${info.y0} L ${info.x1} ${info.y1}`}
              stroke="#b3b3b3"
              strokeWidth="1"
              fill="none"
            />
          ))}
        </svg>
      ) : null}
    </div>
  );
}

const MemoOkrNode = React.memo(OkrNode, (prevProps, nextProps) => {
  if (
    prevProps.node.y !== nextProps.node.y ||
    prevProps.node.show !== nextProps.node.show ||
    prevProps.node.expand !== nextProps.node.expand
  ) {
    return false;
  }
  return true;
});

function OkrTree({ dataSource }) {
  const [originData, setOriginData] = useState([]);
  const [okrTreeInfo, setOkrTreeInfo] = useState([]);

  const wrpperRef = useRef(null);
  const [startDragXY, setStartDragXY] = useState(null);
  const [baseY, setBaseY] = useState(0);
  const [originY, setOriginY] = useState(0);
  const [scale, setScale] = useState(100);
  // setScale(scale - 10);
  // setStartDrag;
  useEffect(() => {
    let queue = dataSource.map((x, i) => {
      x.level = 1;

      x.index = i;
      x.expand = true;
      x.show = true;
      x.levelIndex = i;
      x.originY = 0;
      return x;
    });
    let pos = 0;
    let indexLevelMap = {};
    // let queue = [];
    while (pos < queue.length) {
      if (queue[pos].children) {
        const level = queue[pos].level + 1;
        queue[pos].childrenIds = queue[pos].children.map((x) => x.id);
        queue.push(
          ...queue[pos].children.map((x, i) => {
            if (indexLevelMap[level]) {
              indexLevelMap[level]++;
            } else {
              indexLevelMap[level] = 1;
            }
            x.level = level;
            x.expand = false;
            x.levelIndex = indexLevelMap[level];
            x.show = queue[pos].expand;

            x.index = i;
            return x;
          })
        );
      }
      pos++;
    }
    // console.log("originData", dataSource);
    setOriginData(dataSource);
  }, [dataSource]);

  useEffect(() => {
    if (originData.length < 1) {
      return;
    }
    let queue = originData.map((x) => x);

    let y = 0;

    for (let i = 0; i < queue.length; i++) {
      y = dfsAllTree(queue[i], y, 1, [i]);
    }

    if (originY === 0) {
      setOriginY(y - 120);
    }
    y = (y - 120) / 2;
    for (let i = 0; i < queue.length; i++) {
      y = dfsTree(queue[i], y, 1, [i]);
    }

    // console.log(y);
    let pos = 0;
    while (pos < queue.length) {
      if (queue[pos].expand && queue[pos].children) {
        // const level = queue[pos].level + 1;
        queue[pos].childrenIds = queue[pos].children.map((x) => x.id);
        queue.push(...queue[pos].children);
      }
      pos++;
    }

    // setOkrTreeInfo(queue);
    setOkrTreeInfo(queue);
  }, [originData]);

  useLayoutEffect(() => {
    let wrapper = wrpperRef.current;
    // console.dir(wrpperRef.current);
    // return;
    // console.log("baseY", baseY);
    // if (originY === 0) {
    wrpperRef.current.scrollTo(
      wrapper.scrollLeft,
      baseY ? wrapper.scrollTop - (scale * baseY) / 100 : originY / 2
      // (wrapper.scrollHeight - wrapper.clientHeight) / 2
    );
    // }

    // console.log("wrpperRef.current", wrpperRef.current.scrollTo);
  }, [baseY, originY]);

  const dfsTree = (treeNode, y, level, parentsIndex = []) => {
    let nextY = y;
    treeNode.level = level;
    treeNode.parentsIndex = parentsIndex;
    // treeNode.expand = true;
    treeNode.x = (level - 1) * 360 + level * 70;
    if (treeNode.expand && treeNode.children) {
      treeNode.expandSvgInfo = {
        pathNum: treeNode.children.length + 2,
        pathsInfo: [],
      };
      let y0 = 0;
      for (let i = 0; i < treeNode.children.length; i++) {
        treeNode.children[i].show = treeNode.expand;
        nextY = dfsTree(treeNode.children[i], nextY, level + 1, [
          ...parentsIndex,
          i,
        ]);
        if (i === 0) {
          //
          y0 = treeNode.children[0].y;
        }
        treeNode.expandSvgInfo.pathsInfo.push({
          x0: 30,
          x1: 60,
          y0: treeNode.children[i].y - y0 + 2,
          y1: treeNode.children[i].y - y0 + 2,
        });
      }
      nextY -= 120;
      treeNode.y =
        (treeNode.children[0].y +
          treeNode.children[treeNode.children.length - 1].y) /
        2;
      treeNode.expandSvgInfo.pathsInfo.push({
        x0: 30,
        x1: 30,
        y0: treeNode.children[0].y - y0 + 2,
        y1: treeNode.children[treeNode.children.length - 1].y - y0 + 2,
      });
      treeNode.expandSvgInfo.pathsInfo.push({
        x0: 0,
        x1: 30,
        y0: treeNode.y - y0 + 2,
        y1: treeNode.y - y0 + 2,
      });
      treeNode.expandSvgInfo.height =
        treeNode.children[treeNode.children.length - 1].y - y0 + 2;
      treeNode.expandSvgInfo.posY = y0 + 2;
    } else {
      treeNode.y = y;
    }
    return nextY + 120;
  };

  const dfsAllTree = (treeNode, y, level, parentsIndex = []) => {
    let nextY = y;
    treeNode.level = level;
    treeNode.parentsIndex = parentsIndex;
    // treeNode.expand = true;
    treeNode.x = (level - 1) * 360 + level * 70;
    if (treeNode.children) {
      let y0 = 0;
      for (let i = 0; i < treeNode.children.length; i++) {
        nextY = dfsAllTree(treeNode.children[i], nextY, level + 1, [
          ...parentsIndex,
          i,
        ]);
        if (i === 0) {
          //
          y0 = treeNode.children[0].y;
        }
      }
      nextY -= 120;
      treeNode.y =
        (treeNode.children[0].y +
          treeNode.children[treeNode.children.length - 1].y) /
        2;
    } else {
      treeNode.y = y;
    }
    return nextY + 120;
  };
  const handleExtend = (node) => {
    let indexArr = node.parentsIndex;
    let itemArr = originData;
    let item = null;

    // console.log(indexArr);
    for (let i = 0; i < indexArr.length; i++) {
      const index = indexArr[i];
      item = itemArr[index];
      itemArr = item.children;
    }
    let itemY = item.y;
    item.expand = !item.expand;

    let y = originY / 2;
    for (let i = 0; i < originData.length; i++) {
      y = dfsTree(originData[i], y, 1, [i]);
    }
    // originData[0].originY = itemY - item.y;
    originData[0].originY = 0;
    setBaseY(itemY - item.y);
    setOriginData([...originData]);
    // dfsTree()
  };
  const handleDrag = (e) => {
    if (startDragXY) {
      wrpperRef.current.scrollTo(
        wrapper.scrollLeft - (e.clientX - startDragXY.x),
        wrapper.scrollTop - (e.clientY - startDragXY.y)
      );
      setStartDragXY({ x: e.clientX, y: e.clientY });
    }
  };

  useEffect(() => {
    window.addEventListener("mouseup", () => {
      setStartDragXY(null);
    });
  }, []);
  const handleDragStart = (e) => {
    setStartDragXY({ x: e.clientX, y: e.clientY });
  };

  return (
    <div>
      <div
        id="wrapper"
        style={{
          width: "100%",
          height: "900px",
          position: "relative",
          overflow: "auto",
          willChange: "transform",
          cursor: startDragXY ? "grabbing" : "grab",
          userSelect: "none",
        }}
        ref={wrpperRef}
        onMouseMove={handleDrag}
        onMouseDown={handleDragStart}
      >
        <div
          style={{
            height: `${originY * 2}px`,
            width: `${1500}px`,
            transformOrigin: "left top",
            transform: `scale(${scale / 100})`,
          }}
        >
          {okrTreeInfo.map((x) => (
            <MemoOkrNode
              node={{ ...x }}
              key={`${x.id}-okr-node`}
              onExtend={() => {
                handleExtend(x);
              }}
            />
          ))}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: 0,
          bottom: 0,
          display: "flex",
          padding: "10px",
          cursor: "pointer",
        }}
      >
        <div
          style={{ padding: "4px 6px" }}
          onClick={() => {
            setScale(scale - 10);
          }}
        >
          -
        </div>
        <div
          style={{ padding: "4px 6px" }}
          onClick={() => {
            setScale(scale + 10);
          }}
        >
          +
        </div>
        <div style={{ padding: "4px 6px" }}>{scale}%</div>
      </div>
    </div>
  );
}

export default OkrTree;
