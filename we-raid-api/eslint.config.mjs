// // @ts-check
// import eslint from '@eslint/js';
// import { FlatCompat } from '@eslint/eslintrc';
// import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
// import globals from 'globals';
// import tseslint from 'typescript-eslint';
// import { fileURLToPath } from 'url';
// import path from 'path';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const compat = new FlatCompat({ baseDirectory: __dirname });

// // @typescript-eslint v8에서 제거된 규칙 — airbnb-typescript가 아직 참조함
// // (포맷팅 규칙은 모두 제거됨, 일부는 이름 변경)
// const removedTsRules = [
//   '@typescript-eslint/lines-between-class-members',
//   '@typescript-eslint/no-loss-of-precision',
//   '@typescript-eslint/no-extra-semi',
//   '@typescript-eslint/no-throw-literal',     // → only-throw-error
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
// function filterRemovedRules(configs) {
//   return configs.map((/** @type {any} */ config) => {
//     if (!config.rules) return config;
//     const rules = { ...config.rules };
//     removedTsRules.forEach((rule) => delete rules[rule]);
//     return { ...config, rules };
//   });
// }

// const airbnbConfigs = filterRemovedRules(
//   compat.extends('airbnb-base', 'airbnb-typescript/base'),
// );

// export default tseslint.config(
//   {
//     ignores: ['eslint.config.mjs', 'dist/**'],
//   },
//   eslint.configs.recommended,
//   ...tseslint.configs.recommendedTypeChecked,
//   ...airbnbConfigs,
//   eslintPluginPrettierRecommended,
//   {
//     languageOptions: {
//       globals: {
//         ...globals.node,
//         ...globals.jest,
//       },
//       sourceType: 'commonjs',
//       parserOptions: {
//         projectService: true,
//         tsconfigRootDir: import.meta.dirname,
//       },
//     },
//     settings: {
//       'import/resolver': {
//         typescript: { project: './tsconfig.json' },
//         node: true,
//       },
//     },
//   },
//   {
//     rules: {
//       '@typescript-eslint/no-explicit-any': 'off',
//       '@typescript-eslint/no-floating-promises': 'warn',
//       '@typescript-eslint/no-unsafe-argument': 'warn',
//       'prettier/prettier': ['error', { endOfLine: 'auto' }],
//       // @typescript-eslint/no-floating-promises 에서 void 사용 허용
//       'no-void': ['error', { allowAsStatement: true }],
//       // NestJS 패턴 허용
//       'import/prefer-default-export': 'off',
//       'class-methods-use-this': 'off',
//       '@typescript-eslint/no-useless-constructor': 'off',
//       'no-useless-constructor': 'off',
//       // NestJS DTO 파일에 여러 클래스 허용
//       'max-classes-per-file': 'off',
//       // NestJS peer dep(multer, express 등)을 직접 import하는 패턴 허용
//       'import/no-extraneous-dependencies': 'off',
//       // Node.js에서 for...of 허용
//       'no-restricted-syntax': [
//         'error',
//         { selector: 'LabeledStatement', message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.' },
//         { selector: 'WithStatement', message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.' },
//       ],
//       // Prisma 필터 등 snake_case 키 허용 (변수명 컨벤션은 유지)
//       '@typescript-eslint/naming-convention': [
//         'warn',
//         { selector: 'variable', format: ['camelCase', 'PascalCase', 'UPPER_CASE'], leadingUnderscore: 'allow' },
//         { selector: 'parameter', format: ['camelCase'], leadingUnderscore: 'allow' },
//         // NestJS: private constructor injection은 underscore prefix 불필요
//         { selector: 'memberLike', modifiers: ['private'], format: ['camelCase'], leadingUnderscore: 'allow' },
//         { selector: 'typeLike', format: ['PascalCase'] },
//       ],
//     },
//   },
// );
