import test from 'ava'



import * as Log from './Log.bs.js'



test.serial(
`Log, #parseDefault
  Join log segments with #delimiter, then #parseDefault 
  and return record of type #segments #Default.`,

  async t => {

    //s
    const value = 
      [ 
        'PRP'
      , '2021-08-22T22:58:34.677Z'
      , 'prp-node pdf'
      , 'templatedir : Argument must not be empty.'
      ]

    //e
    const strVal = value.join(Log.delimiter)
    const result = Log.parseDefault(strVal)

    //v
    t.deepEqual(
      result,
      {
        org: value[0]
      , time: value[1]
      , ctx: value[2]
      , msg: value[3]
      }
    )

    //td
  }
)