module.exports = {
  root: true,
  extends: ['@react-native-community'],
  parserOptions: {
    requireConfigFile: false
  },
  rules: {
    'prettier/prettier': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/no-unstable-nested-components': 'off',
    'react-native/no-inline-styles': 'off',
    curly: 'off',
    semi: 'off',
    'comma-dangle': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }]
  }
}
