const fs = require('fs');
const path = require('path');
const css = require('css');

const unionStyleSheet = (file, trap = []) => {
    if(!path.isAbsolute(file)){
        file = path.resolve(process.cwd(), file);
    }
    if(trap.includes(file)){
        return [];
    }
    trap.push(file);
    const filePath = path.dirname(file);
    const code = fs.readFileSync(file, { encoding: 'utf-8' });
    const { stylesheet: { rules = [] } } = css.parse(code);
    const importRules = rules.filter(r => r.type === 'import');
    const normalRules = rules.filter(r => r.type === 'rule');
    const innerRules = importRules
        .map(({ import: importPath }) => unionStyleSheet(path.resolve(filePath, importPath.slice(1, -1)), trap))
        .reduce((r, v) => r.concat(v), [])
        ;
    return [ ...innerRules, ...normalRules ];
}

const loadCssFile = (entry) => {
    const rules = unionStyleSheet(entry);
    return { rules }
}

module.exports = {
    loadCssFile,
};