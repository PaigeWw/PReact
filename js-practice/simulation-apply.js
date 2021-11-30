 Function.prototype.simulationApply = function(thisArg, argArrs) {
     let s = Symbol(this.name)
     thisArg[s] = this
     let res =  thisArg[s](...argArrs)
     delete thisArg[s]
     return res
 }