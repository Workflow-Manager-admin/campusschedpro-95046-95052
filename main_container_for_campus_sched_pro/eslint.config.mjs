import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";

export default [
  { files: ["**/*.{js,mjs,cjs,jsx}"] },
  { 
    languageOptions: { 
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true }
      },
      globals: {
        document: "readonly",
        window: "readonly",
        localStorage: "readonly",
        console: "readonly",
        test: "readonly",
        expect: "readonly"
      }
    },
    rules: {
      'no-unused-vars': ['warn', { 
        varsIgnorePattern: 'React|App',
        args: 'none',
        ignoreRestSiblings: true,
        argsIgnorePattern: '^_'
      }],
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'off'
    }
  },
  pluginJs.configs.recommended,
  {
    plugins: { react: pluginReact },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react/jsx-uses-vars": "error"
    }
  }
];
