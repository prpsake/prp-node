const fs = require('fs-extra')
const path = require('path')



const { pkg, name } = require('./package.json')



fs.rename(
  path.resolve('./', pkg.outputPath, name),
  path.resolve('./', pkg.outputPath, `${name}-x86_64-apple-darwin`)
);



console.log('post-build done')