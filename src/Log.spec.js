import test from 'ava'
import sinon from 'sinon'



import * as Log from './Log.bs.js'



const timeStub = 
  x =>
  sinon.stub(Date.prototype, 'toISOString').returns(x)



test(
`Log, #logColor
  Return ANSI escape code by name.`,

  t => {
    //s
    const value = [
      [ 'green', '\x1b[32m' ]
    , [ 'red', '\x1b[31m' ]
    , [ 'dim', '\x1b[2m' ]
    , [ 'reset', '\x1b[0m' ]
    ]
    const codes = value.map(x => x[1])

    //e
    const result = value.map(([name_, _]) => Log.logColor(name_))

    //v
    t.deepEqual(result, codes)
  }
)



test(
`Log, #log.concat
  #concat one #log with another and return new #log holding
  their concatenated values.`,

  t => {
    //s
    const value1 = 'one'
    const value2 = 'two'

    //e
    const log1 = Log.log('one')
    const log2 = Log.log('two')
    const result = log1.concat(log2).val

    //v
    t.is(result, value1 + value2)
  }
)



test(
`Log, #log.replace
  Substitute a placeholder by name.`,
  
  t => {
    //s
    const value = 'value'
    const valueVar = '%placeholder'

    //e
    const result = Log.log(valueVar).replace('placeholder', value).val

    //v
    t.is(result, value)
  }
)



test(
`Log, #log.time
  Substitute time placeholder with crooks datetime.`,
  
  t => {
    //s
    const time = timeStub('foifidrüäzwäng')
    const value = time()
    const valueVar = '%time'

    //e
    const result = Log.log(valueVar).time().val

    //v
    t.is(result, value)

    //td
    time.restore()
  }
)



test(
`Log, #parseDefault
  Join log segments with #delimiter, then #parseDefault 
  and return record of type #segments #Default.`,

  t => {
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
  }
)