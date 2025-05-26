import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";

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
      'react/jsx-uses-react': 'off',
      'react-hooks/exhaustive-deps': 'off', // Turn off exhaustive deps rule
      'react-hooks/rules-of-hooks': 'error' // Keep rules of hooks enabled
    }
  },
  pluginJs.configs.recommended,
  {
    plugins: { 
      react: pluginReact,
      'react-hooks': pluginReactHooks
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react/jsx-uses-vars": "error",
      'react-hooks/exhaustive-deps': 'off', // Turn off exhaustive deps rule
      'react-hooks/rules-of-hooks': 'error' // Keep rules of hooks enabled
    }
  }
];
