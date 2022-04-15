import test from 'ava'
import sinon from 'sinon'


import minikin from 'minikin'
import * as Server from './Server.mjs'



const launchStub =
  x =>
  sinon.stub(minikin.default, 'server').returns(x)



test.serial(
`#launch
  Launch server.`,
  
  async t => {
    //s
    const server = launchStub('value')
    const value = server()

    //e
    const result = await Server.launch()

    //v
    t.is(result, value)

    //td
    server.restore()
  }
)