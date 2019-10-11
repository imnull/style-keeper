const {
    computeStyle,
    parseStyle,
    matchClassName
} = require('./src/compute-style');

const css2js = s => s.replace(/\-[a-z]/gi, (_) => _.charAt(1).toUpperCase());
const rnStyleValue = (key, val) => {
    key = css2js(key);
    let match;
    switch(key){
        case 'fontSize':
            match = val.match(/^([-\.]?[\d\.]+)([^\d\.]*)$/);
            if(match){
                if(match[2] === 'px'){
                    val = Number(match[1]);
                }
            }
            break;
    }
    return { [key]: val };
}

const css = require('css');
const { stylesheet } = css.parse(`
.a.b {/*2*/
    color: #ff0;
}

.b {/*4*/
    color: #00f;
    font-size: 16px;
}
.a, .c, .a .c, .c {/*3*/
    color: #f00;
    font-size: 14px;
}
.a .b {/*1*/
    color: #fa0;
}
.c {
    font-size: 24px;
}
`)
console.log(parseStyle(computeStyle(stylesheet, ['a', 'c b a'], matchClassName), rnStyleValue))