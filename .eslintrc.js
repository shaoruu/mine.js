module.exports = {
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  parserOptions: {
    ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports
  },
  extends: [
    'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
    'prettier/@typescript-eslint', // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
    'plugin:prettier/recommended', // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
  ],
  plugins: ['import'],
  rules: {
    'import/order': [2, { groups: ['parent', 'sibling'], 'newlines-between': 'always' }],
    'import/prefer-default-export': 'off',
    'prefer-promise-reject-errors': 'off',
    'no-plusplus': 'off',
    'no-return-assign': 'off',
    'no-nested-ternary': 'off',
    'no-param-reassign': 'off',
    'no-continue': 'off',
    'func-names': 'off',
    'no-bitwise': 'off',
    'consistent-return': 'off',
    'import/no-webpack-loader-syntax': 'off',
    'no-restricted-globals': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    'prefer-template': true,
  },
};
