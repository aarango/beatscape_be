module.exports = {
  root: true,
  env: {
    es2021: true, // Habilita las características modernas de JavaScript
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
  ],
  parserOptions: {
    // project: ["tsconfig.json", "tsconfig.dev.json"],
    sourceType: "module",
  },
  ignorePatterns: [
    // "/output/**/*", // Ignore built files.
    // "**/*.test.ts",
    // "jest.config.js",
  ],
  plugins: ["import"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "object-curly-spacing": "off",
    quotes: ["error", "double"],
    "block-spacing": "off",
    "brace-style": "off",
    "padded-blocks": "off",
    "no-trailing-spaces": "off",
    "require-jsdoc": [
      "error",
      {
        require: {
          FunctionDeclaration: false,
          MethodDefinition: false,
          ClassDeclaration: false,
          ArrowFunctionExpression: false,
          FunctionExpression: false,
        },
      },
    ],
    "space-before-blocks": "off",
    "eol-last": "off",
    "new-cap": "off",
    "spaced-comment": "off",
    "no-multi-spaces": "off",
    "max-len": "off",
    curly: "off",
    "keyword-spacing": "off",
    "comma-spacing": "off",
    camelcase: "off",
    "@typescript-eslint/ban-types": "off",
    "key-spacing": "off",
    "no-multiple-empty-lines": "off",
    "comma-dangle": "off",
    semi: "off",
    "@typescript-eslint/no-inferrable-types": "off",
    "arrow-parens": "off",
    "prefer-const": "off",
    "quote-props": "off",
    "import/no-unresolved": "off",
    "no-prototype-builtins": "off",
  },
};
