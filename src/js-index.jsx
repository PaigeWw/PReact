import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import deepCopy from "../js-practice/deep-copy-obj";
import simulationNew from "../js-practice/simulation-new";
const urls = [
  "/api/user/getList",
  "/api/user/getLeaveInfos?start=2021-08-30&end=2021-09-26",
  "/api/department/getList",
  // "https://www.iana.org/domains/root/db/xn--0zwm56d.html",
  // "http://data.iana.org/root-anchors/root-anchors.xml",
  // "http://data.iana.org/root-anchors/root-anchors.xml",
  // "https://www.iana.org/domains/root/db/xn--g6w251d.html",
  // "https://www.iana.org/domains/root/db/xn--9t4b11yi5a.html",
];
const arr = [1, 2, 3, 4, 5, 6, [7, 8, 9, 10], 7, 8, 11, 12, 13];
function App() {
  useEffect(() => {
    window.deepCopy = deepCopy;
    window.simulationNew = simulationNew;
  }, []);
  const fetchFun = async function (e) {
    for (let i = 0; i < urls.length; i++) {
      const data = await fetch(urls[i]);
      if (!data) {
        throw new Error("fetch error");
      }
    }
  };
  const fetchAll = async function (e) {
    let fetchs = [];
    for (let i = 0; i < urls.length; i++) {
      fetchs.push(fetch(urls[i]));
    }
    const data = await Promise.all(fetchs);
    console.log(data);
  };
  const fetchAllSettled = async function (e) {
    let fetchs = [];
    for (let i = 0; i < urls.length; i++) {
      fetchs.push(fetch(urls[i]));
    }
    const data = await Promise.allSettled(fetchs);
    console.log(data);
  };
  const fetchRace = async function (e) {
    let fetchs = [];
    for (let i = 0; i < urls.length; i++) {
      fetchs.push(fetch(urls[i]));
    }
    const data = await Promise.race(fetchs);
    console.log(data);
  };
  const fetchAny = async function (e) {
    let fetchs = [];
    for (let i = 0; i < urls.length; i++) {
      fetchs.push(fetch(urls[i]));
    }
    const data = await Promise.any(fetchs);
    console.log(data);
  };
  // Promise.
  return (
    <div>
      <h3>Promise</h3>
      <h5 onClick={fetchFun}>串行执行</h5>
      <h5 onClick={fetchAll}>Promise.all</h5>
      <h5 onClick={fetchAllSettled}>Promise.allSettled</h5>
      <h5 onClick={fetchRace}>Promise.race</h5>
      <h5 onClick={fetchAny}>Promise.any</h5>
      <h3>Programming</h3>
      <h5>v 实现一个深拷贝</h5>
      <h5>柯里化函数实现</h5>
      <h5>实现JS的call和apply方法</h5>
      <h5>实现Array.prototype.reduce</h5>
      <h5>实现Function.prototype.apply</h5>
      <h5>实现Function.prototype.bind</h5>
      <h5>实现add(1)(2)(3)(4)=10</h5>
      <h5>v 模拟new操作</h5>
      <h5>模拟typeof、instanceof操作</h5>
      <h5>实现一个大文件上传和断点续传</h5>
      <h5>
        JS实现一个带并发限制的异步调度器Scheduler，保证同时运行的任务最多有两个。完善下面代码的Scheduler类，使以下程序能够正常输出：
      </h5>
      <pre>
        {`class Scheduler {
            constructor() {
              this.wiatQueue = []
              this.runningQueue = []
            }
            add(promiseCreator) {
              // ...
              this.wiatQueue.push(promiseCreator)
              this.askRun()
            }
            askRun() {

              if(this.runningQueue.length < 2) {
                const current = this.wiatQueue.shift()
                if(current) {
                  current().then((resolve, reject) => {
                    let index = this.runningQueue.indexOf(current)
                    this.runningQueue.splice(index, 1)
                    this.askRun()
                  })
                  this.runningQueue.push(current)
                }
              }

            }
          }    
            const timeout = time => new Promise(resolve => {
              setTimeout(resolve, time);
            })
              
            const scheduler = new Scheduler();
              
            const addTask = (time,order) => {
              scheduler.add(() => timeout(time).then(()=>console.log(order)))
            }

            addTask(1000, '1');
            addTask(500, '2');
            addTask(300, '3');
            addTask(400, '4');

            // output: 2 3 1 4
         
          `}
      </pre>
      <h5></h5>
    </div>
  );
}

const container = document.getElementById("root");
ReactDOM.render(<App />, container);
