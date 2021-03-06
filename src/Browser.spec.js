import test from 'ava'
import sinon from 'sinon'


import { chromium } from 'playwright'
import * as Browser from './Browser.mjs'



const launchStub =
  x =>
  sinon.stub(chromium, 'launch').returns(x)



test.serial(
`#launch
  Launch chromium browser.`,
  
  async t => {
    //s
    const browser = launchStub('value')
    const value = browser()

    //e
    const result = await Browser.launch()

    //v
    t.is(result, value)

    //td
    browser.restore()
  }
)