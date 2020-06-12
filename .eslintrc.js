module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
    jest: true,
  },
  extends: "eslint:recommended",
  parser: "babel-eslint",
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2018,
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ["react"],
  rules: {
    "no-console": "off",
    "no-underscore-dangle": "off",
    "no-plusplus": "off",
    "no-unused-vars": "off",
    "no-continue": "off",
    camelcase: "off",
    "no-empty": "off",
    "no-param-reassign": "off",
    "func-names": ["warn", "never"],
    "prefer-destructuring": [
      "warn",
      {
        object: false,
        array: false,
      },
    ],
    indent: ["warn", 4, { SwitchCase: 1 }],
    "linebreak-style": ["warn", "unix"],
    quotes: ["warn", "single", { allowTemplateLiterals: true }],
    semi: ["warn", "always"],
    "react/jsx-uses-vars": 1,
    "react/jsx-uses-react": 1,
    "spaced-comment": ["warn", "always", { exceptions: ["-", "+"] }],
  },
};
("warn");
