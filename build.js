import caxa from 'caxa'
import pkg from './package.json'



(async () => {
  
  await caxa.default({
    input: pkg.prp.binInput,
    output: pkg.prp.binOutput,
    command: [
      "{{caxa}}/node_modules/.bin/node",
      `{{caxa}}/${pkg.prp.esmOutput}`,
      // args...
    ]
  })

})()