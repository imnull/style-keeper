const {
    MinipStyleComputer,
    loadCssFile,
} = require('./src');

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

const stylesheet = loadCssFile('./__css_test__.css');

const computer = new MinipStyleComputer(stylesheet);
console.log(computer.parse(['a', 'c b a'], rnStyleValue))