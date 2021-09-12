import caxa from 'caxa'



(async () => {
  
  await caxa.default({
    input: ".",
    output: "dist/prp-node-x86_64-apple-darwin",
    command: [
      "{{caxa}}/node_modules/.bin/node",
      "{{caxa}}/build/PRPNode.esm.js",
      // args...
    ]
  })

})()