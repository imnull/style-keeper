const MinipStyleComputer = require('./minip-style-computer');
module.exports = {
    ...require('./compute-style'),
    ...require('./load-css-file'),
    MinipStyleComputer,
};
