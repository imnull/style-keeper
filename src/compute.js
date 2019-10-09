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
    console.log(weight);
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
 * 判断className是否命中选择器
 * @param {String} selectorItem 选择器单项，类似`.aaa.bbb`
 * @param {String} className 节点className，类似`aaa bbb ccc`
 */
const selectorMatch = (selectorItem, className) => {
    const selector = readSelectorItem(selectorItem);
    const classNm = className.replace(/^\s+|\s+$/g, '').split(/\s+/).map(s => '.' + s);
    return selector.every(item => classNm.includes(item));
}

// console.log(selectorMatch('.aaa.bbb', 'aaa bbb ccc'))

const css = require('css');

const css2js = s => s.replace(/\-[a-z]/gi, (_) => _.charAt(1).toUpperCase())

const getDeclarations = (rule) => {
    const map = {};
    const { declarations = [], selectors = [] } = rule;
    declarations.forEach(dec => {
        map[css2js(dec.property)] = dec.value;
    });
    return {
        selectors: selectors.map(s => readSelectorPath(s)),
        declarations: map,
    };
}

const { stylesheet: { rules } } = css.parse(`
.container {
    border: 1px solid #000;
    margin: 1em;
    padding: 1em;
    font-size: 24px;
}
.item{
    font-size: 16px;
    padding: 0 1em;
    border: 1px solid #ccc;
}

.container       .item, .aaa {
    color: #f00;
    font-size: 24px;
}
.container.item, .aaa> .bbbbb {
    color: #f00;
    font-size: 24px;
}
`)

rules.map(rule => getDeclarations(rule)).forEach(r => console.log(r))