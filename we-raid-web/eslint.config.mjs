// import { defineConfig, globalIgnores } from 'eslint/config';
// import { FlatCompat } from '@eslint/eslintrc';
// import nextVitals from 'eslint-config-next/core-web-vitals';
// import nextTs from 'eslint-config-next/typescript';
// import { fileURLToPath } from 'url';
// import path from 'path';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const compat = new FlatCompat({ baseDirectory: __dirname });

// // eslint-config-next가 이미 등록한 플러그인 — 중복 등록 방지
// const nextRegisteredPlugins = ['react', 'react-hooks', 'jsx-a11y', '@next/next', 'import'];

// // @typescript-eslint v8에서 제거된 규칙 — airbnb-typescript가 아직 참조함
// const removedTsRules = [
//   '@typescript-eslint/lines-between-class-members',
//   '@typescript-eslint/no-loss-of-precision',
//   '@typescript-eslint/no-extra-semi',
//   '@typescript-eslint/no-throw-literal',
//   '@typescript-eslint/no-extra-parens',
//   '@typescript-eslint/brace-style',
//   '@typescript-eslint/comma-dangle',
//   '@typescript-eslint/comma-spacing',
//   '@typescript-eslint/func-call-spacing',
//   '@typescript-eslint/indent',
//   '@typescript-eslint/keyword-spacing',
//   '@typescript-eslint/object-curly-spacing',
//   '@typescript-eslint/quotes',
//   '@typescript-eslint/semi',
//   '@typescript-eslint/space-before-blocks',
//   '@typescript-eslint/space-before-function-paren',
//   '@typescript-eslint/space-infix-ops',
// ];

// /** @param {any[]} configs */
// function processAirbnbConfigs(configs) {
//   return configs.map((/** @type {any} */ config) => {
//     const result = { ...config };

//     // 중복 플러그인 제거
//     if (result.plugins) {
//       const plugins = { ...result.plugins };
//       nextRegisteredPlugins.forEach((p) => delete plugins[p]);
//       result.plugins = plugins;
//     }

//     // 제거된 typescript-eslint 규칙 필터링
//     if (result.rules) {
//       const rules = { ...result.rules };
//       removedTsRules.forEach((rule) => delete rules[rule]);
//       result.rules = rules;
//     }

//     return result;
//   });
// }

// const airbnbConfigs = processAirbnbConfigs(
//   compat.extends('airbnb', 'airbnb-typescript', 'airbnb/hooks'),
// );

// const eslintConfig = defineConfig([
//   ...nextVitals,
//   ...nextTs,
//   ...airbnbConfigs,
//   {
//     languageOptions: {
//       parserOptions: {
//         tsconfigRootDir: __dirname,
//         project: './tsconfig.eslint.json',
//       },
//     },
//     settings: {
//       'import/resolver': {
//         typescript: {
//           project: './tsconfig.eslint.json',
//           alwaysTryTypes: true,
//         },
//         node: true,
//       },
//     },
//     rules: {
//       // Windows 환경 — Prettier가 줄바꿈 처리
//       'linebreak-style': 'off',
//       // React 17+ JSX transform
//       'react/react-in-jsx-scope': 'off',
//       // TypeScript에서 optional prop 기본값은 destructuring으로 처리
//       'react/require-default-props': 'off',
//       // 커스텀 Input 컴포넌트도 form control로 인식
//       'jsx-a11y/label-has-associated-control': ['error', {
//         controlComponents: ['Input'],
//         assert: 'htmlFor',
//       }],
//       'react/jsx-props-no-spreading': 'off',
//       'import/prefer-default-export': 'off',
//       // Next.js 페이지 컴포넌트는 arrow function
//       'react/function-component-definition': [
//         'error',
//         { namedComponents: 'arrow-function', unnamedComponents: 'arrow-function' },
//       ],
//     },
//   },
//   globalIgnores([
//     '.next/**',
//     'out/**',
//     'build/**',
//     'next-env.d.ts',
//     'postcss.config.mjs',
//     'eslint.config.mjs',
//   ]),
// ]);

// export default eslintConfig;
