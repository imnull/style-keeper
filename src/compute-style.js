const { read } = require('./utils');

/**
 * ### 计算选择器优先级，为css样式排序。
 * #### 算法的过程
 * A specificity is determined by plugging numbers into (a, b, c, d):
 * - If the styles are applied via the style attribute, a=1; otherwise, a=0.
 * - b is equal to the number of ID selectors present.
 * - c is equal to the number of class selectors, attribute selectors, and pseudoclasses present.
 * - d is equal to the number of type selectors and pseudoelements present.
 * @param {String} selector 选择器
 */
const calRuleWeight = (selector) => {
    let weight = [0, 0, 0, 0];
    let match;
    // id选择器查找(1)
    if(match = selector.match(/\#/g)){
        weight[1] += match.length;
    }
    // 类选择器查找(2)
    if(match = selector.match(/\./g)){
        weight[2] += match.length;
    }
    // 属性选择器查找(2)
    if(match = selector.match(/\[[^\]]+]/g)){
        weight[2] += match.length;
    }
    // 伪类选择器查找(2)
    if(match = selector.match(/\:/g)){
        weight[2] += match.length;
    }
    selector = selector
        .replace(/\[[^\]]+]/g, '')  // 清理属性选择器
        .replace(/\:[^\s]+/g, '')   // 清理伪类选择器
        .replace(/\.[^\s\.\#]+/g, '')   // 清理类选择器
        .replace(/\#[^\s\.\#]+/g, '')   // 清理ID选择器
        ;
    // 标签选择器查找(3)
    if(match = selector.match(/^[a-z\-_][0-9a-z\-_]*|[^\.\#][a-z\-_][0-9a-z\-_]*/ig)){
        weight[3] += match.length;
    }
    // console.log(weight);
    return weight;
};

/**
 * 比较两个选择器权重
 * @param {Number[]} wa 
 * @param {Number[]} wb 
 */
const compareRuleWeight = (wa, wb) => {
    for(let i = 0; i < 4; i++){
        if(wa[i] < wb[i]){
            return -1;
        } else if(wa[i] > wb[i]) {
            return 1;
        }
    }
    return 0;
};


/**
 * 解析单条selector路径
 * @param {String} selector 
 */
const readSelectorPath = (selector) => {
    const team = [];
    read(selector, (c) => /[\s\>\+\~]+/.test(c), (str, i) => {
        //空白字起始
        const m = str.substr(i).match(/^(\s*)([\>\+\~]*)\s*/);
        if(!m) return -1;
        team.push(m[2] || ' ');
        return i + m[0].length;
    }, (m, s) => team.push(s));

    return team;        
};

/**
 * 解析单条selector路径
 * @param {String} selector 
 */
const readSelectorItem = (item) => {
    return (item.match(/[\.\#]?[^\.\#\:]+/g) || [])
    // .filter(s => s.charAt(0) === '.')
    .map(it => {
        return it;
    })
};

// console.log(readSelectorPath('div.aaa       p.bbb>.ccc'));
// console.log(readSelectorItem('div#id.aaa.b.cc'));


// calRuleWeight('li')    //[ 0, 0, 0, 1 ]
// calRuleWeight('ul li:after')   //[ 0, 0, 1, 2 ]
// calRuleWeight('ul ol+li')  //[ 0, 0, 0, 3 ]
// calRuleWeight('h1 + *[REL=up]')    //[ 0, 0, 1, 1 ]
// calRuleWeight('ul ol li.red ') //[ 0, 0, 1, 3 ]
// calRuleWeight('li.red.level')  //[ 0, 0, 2, 1 ]
// calRuleWeight('.a1.a2.a3.a4.a5.a6.a7.a8.a9.a10.a11')   //[ 0, 0, 11, 0 ]
// calRuleWeight('#x34y') //[ 0, 1, 0, 0 ]
// calRuleWeight('li:first-child h2 .title')  //[ 0, 0, 2, 2 ]
// calRuleWeight('#nav .selected > a:hover')  //[ 0, 1, 2, 1 ]
// calRuleWeight('html body #nav .selected > a:hover')    //[ 0, 1, 2, 3 ]

// const selectors = ['ul ol li.red ', 'ul ol+li', 'ul li:after', 'li', 'li.red.level', 'h1 + *[REL=up]'];
// selectors.sort((a, b) => compareRuleWeight(calRuleWeight(a), calRuleWeight(b)))
// console.log(selectors.map(s => [s, calRuleWeight(s)]))


/**
 * 判断选择器是否与节点路径匹配
 * @param {String[]} selectorChain 解构的选择器
 * @param {String[]} elementPath 节点树样式路径
 * @param {Function} matcher 选择器单元与选择器比对的函数
 */
const selectorPathMatch = (selectorChain, elementPath, matcher) => {
    if(elementPath.length * 2 - 1 < selectorChain.length) return false;
    const p0 = [...selectorChain], p1 = [...elementPath];
    let r = -1;
    while(p0.length > 0 && p1.length > 0){
        let t0 = p0.pop(), t1 = p1.pop();
        if(r === -1){
            if(!matcher(t0, t1)){
                return false;
            }
        } else {
            switch(r){
                case '>':
                    if(!matcher(t0, t1)){
                        return false;
                    }
                    break;
                case ' ':
                    while(!matcher(t0, t1)){
                        if(p1.length < 1){
                            return false;
                        }
                        t1 = p1.pop();
                    }
                    break;
                default:
                    return false;
            }
        }
        r = p0.pop();
    }
    // console.log(p0, p1)
    return p0.length < 1;
}

/**
 * 格式化css-rule
 * @param {Object} rule CSSRule对象
 */
const normalizeRule = (rule) => {
    const map = {};
    const { declarations = [], selectors = [] } = rule;
    declarations.filter(d => d.type === 'declaration').forEach(dec => {
        map[dec.property] = dec.value;
    });
    return {
        selectors: selectors.map(s => readSelectorPath(s)),
        declarations: map,
    };
}


/**
 * Matcher: 判断className是否命中选择器
 * @param {String} selectorItem 选择器单项，类似`.aaa.bbb`
 * @param {String} className 节点className，类似`aaa bbb ccc`
 */
const matchClassName = (selectorItem, className) => {
    const selector = readSelectorItem(selectorItem);
    const classNm = className.replace(/^\s+|\s+$/g, '').split(/\s+/).map(s => '.' + s);
    return selector.every(item => classNm.includes(item));
}

const computeStyle = ({ rules = [] }, stylePath = [], matcher) => {
    const rs = rules
    // 查找命中的规则。如果规则存在多个选择器，则返回权重最大的选择器。
    .map(rule => normalizeRule(rule)).map((r, i) => {
        const { selectors, ...other } = r;
        const sels = selectors.filter(selector => selectorPathMatch(selector, stylePath, matcher)).map(s => s.join(''));
        if(sels.length < 1) return false;
        else if(sels.length > 1) {
            sels.sort((a, b) => compareRuleWeight(calRuleWeight(b), calRuleWeight(a)))
        }
        return {
            selectors: [sels[0], i],
            ...other
        };
    })
    .filter(r => !!r)
    .sort((a, b) => {
        const { selectors: [aa, ai] } = a;
        const { selectors: [bb, bi] } = b;
        let r = compareRuleWeight(calRuleWeight(aa), calRuleWeight(bb));
        if(r === 0){
            r = ai - bi;
        }
        return r;
    })
    .map(({ selectors, declarations }) => ({ selector: selectors[0], declarations }))
    .reduce((r, { declarations }) => Object.assign(r, declarations), {});

    return rs;
}

const parseStyle = (styleObj, parser) => {
    const f = typeof parser !== 'function' ? (key, val) => ({ [key]: val }) : (key, val) => {
        let r = parser(key, val);
        if(!r || typeof r !== 'object'){
            r = { [key]: val };
        }
        return r;
    }
    return Object.assign({}, ...Object.keys(styleObj).map(key => f(key, styleObj[key])));
}

module.exports = {
    computeStyle,
    parseStyle,
    matchClassName
};