import { nodeResolve } from '@rollup/plugin-node-resolve'
import { prp } from './package.json';


export default {
  input: prp.esmInput,
  output: [
    { file: prp.esmOutput,
      format: 'es',
      exports: 'named'
    }
  ],

  plugins: [ nodeResolve({ extensions: ['.js'] }) ],
  external: [
    'minikin',
    'playwright',
    'fs-extra',
    'yargs'
  ]
};