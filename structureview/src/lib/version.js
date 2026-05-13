/** Returns the package.json version. SRP: version exposure only. */
const { version } = require('../../package.json');

const getVersion = () => version;

module.exports = { getVersion };
