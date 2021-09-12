import test from 'ava'


import { delimiter } from '../Log.bs.js'
import { PDF } from './PDF.bs.js'



const removeAnsiCodes =
  str =>
  str.replace(/\\(u00|x)1b\[[0-9]{1,2}m/g, '')



test.serial(
`#pdf
  Resolves with an error, if template directory does not exist.`,
  
  async t => {
    //s
    const path = '💀/💀/💀'
    const value =
      JSON.stringify(
        [ 'PRP' 
        , 'prp-node pdf'
        , `failed : ENOENT: no such file or directory, open '${path}/index.html'`
        ].join(delimiter)
      )

    //e
    const errorMsg = await PDF.pdf({ templatedir: path })
    const [ ctx, _, cmd, msg ] = 
      removeAnsiCodes(JSON.stringify(errorMsg))
      .split(delimiter)
    const result = [ ctx, cmd, msg ].join(delimiter)
        
    //v
    t.is(result, value)
  }
)