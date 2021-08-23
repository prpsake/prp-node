import test from 'ava'
import sinon from 'sinon'



import * as Log from './Log.bs.js'



const timeStub = 
  x =>
  sinon.stub(Date.prototype, 'toISOString').returns(x)



const consoleStub =
  x =>
  sinon.stub(console, 'log').returns(x)



test(
`#logColor
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
`#log.concat
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
`#log.replace
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
`#log.time
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
`#log.log
  Print current value with datetime to the console`,
  
  t => {
    //s
    const time = timeStub('foifidrüäzwäng')
    const stdout = consoleStub(`sischetz ${time()}`)
    const value = stdout()
    const valueVar = 'sischetz %time'

    //e
    const result = Log.log(valueVar).log().val

    //v
    t.is(result, value)

    //td
    time.restore()
    stdout.restore()
  }
)
  



test(
`#parseDefault
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