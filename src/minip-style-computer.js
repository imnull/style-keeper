const {
    computeStyle,
    parseStyle,
    matchClassName
} = require('./compute-style');

class MinipStyleComputer {
    constructor(stylesheet){
        this.stylesheet = stylesheet;
    }

    compute(classPath){
        if(!this.stylesheet || typeof this.stylesheet !== 'object'){
            return {};
        }
        const r = computeStyle(this.stylesheet, classPath, matchClassName);
        return r;
    }

    parse(classPath, parser){
        const r = this.compute(classPath);
        if(typeof parser === 'function'){
            return parseStyle(r, parser);
        }
        return r;
    }
}

module.exports = MinipStyleComputer;