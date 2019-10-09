const NEST = {
    '(': ')',
    '[': ']',
    '{': '}',
};
const QUOTE = '\'"`';
const ESC = '\\';

const is_quote = c => QUOTE.indexOf(c.charAt(0)) > -1;
const is_nest = c => c in NEST;
const read_quote = (str, startIndex) => {
    let i = startIndex, len = str.length, quote = str.charAt(++i), ch;
    while(i < len){
        ch = str.charAt(i);
        if(ch === ESC){
            i += 2;
            continue;
        } else if(ch === quote){
            return i + 1;
        }
        i += 1;
    }
    return -1;
}

const read_nest = (str, startIndex) => {
    let i = startIndex, len = str.length, left = str.charAt(++i), right = NEST[left], ch;
    while(i < len){
        ch = str.charAt(i);
        if(ch === ESC){
            i += 2;
            continue;
        } else if(ch === right){
            return i + 1;
        } else if(is_quote(ch)){
            let j = read_quote(str, i);
            if(j < i) return -1;
            i = j;
            continue; 
        } else if(is_nest(ch)){
            let j = read_nest(str, i);
            if(j < i) return -1;
            i = j;
            continue; 
        }
        i += 1;
    }
    return -1;
}

const read = (str, test, reader, f, startIndex = 0) => {
    let i = startIndex, _i = i, len = str.length, ch;
    while(i < len){
        ch = str.charAt(i);
        if(ch === ESC){
            i += 2;
            continue;
        } else if(is_quote(ch)){
            let j = read_quote(str, i);
            if(j < i) break;
            i = j;
            continue;
        } else if(is_nest(ch)){
            let j = read_nest(str, i);
            if(j < i) break;
            i = j;
            continue;
        } else if(test(ch, i, str, _i)) {
            if(i > _i){
                f(true, str.substring(_i, i), ch, _i, i);
                let j = reader(str, i, ch);
                if(j < i) break;
                i = j;
                _i = i;
                continue;
            }
        }
        i += 1;
    }
    if(i > _i){
        f(false, str.substring(_i, i), null, _i, i);
        _i = i;
    }
}

module.exports = {
    read,
}