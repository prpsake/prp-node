import { nodeResolve } from '@rollup/plugin-node-resolve'
import pkg from './package.json';


export default {
  input: 'src/PRPNode.js',
  output: [
    // { file: pkg.main,
    //   format: 'cjs',
    //   exports: 'named'
    // },
    { file: pkg.module,
      format: 'es',
      exports: 'named'
    }
  ],

  plugins: [ nodeResolve({ extensions: ['.js' ] }) ],
  external: [
    'minikin',
    'playwright',
    'fs-extra',
    'yargs'
  ]
};