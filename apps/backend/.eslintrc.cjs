/** Backend ESLint — same standards as desktop. */
module.exports = {
  root: true,
  env: { node: true, es2022: true, jest: true },
  parserOptions: { ecmaVersion: 2022, sourceType: "script" },
  extends: ["eslint:recommended"],
  rules: {
    "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "no-console": "off",
    complexity: ["warn", 10],
    "max-lines-per-function": [
      "warn",
      { max: 40, skipBlankLines: true, skipComments: true },
    ],
    "max-params": ["warn", 5],
  },
  ignorePatterns: ["node_modules/", "coverage/"],
};
