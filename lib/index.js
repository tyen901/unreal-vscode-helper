const fileio = require('./fileio');
const engine = require('./engine');
const tasks = require('./tasks');
const cpp = require('./cpp');
const utils = require('./utils');

module.exports = Object.assign({}, fileio, engine, tasks, cpp, utils, {
  autoFix: require('./simple_compat')?.autoFix,
});
