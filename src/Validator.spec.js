import test from 'ava'
import sinon from 'sinon'


import { promises as fs } from 'fs';
import * as Validator from './Validator.bs.js'



const openFileStub = 
  x =>
  sinon.stub(fs, 'open').returns(x)



test.serial(
`#pathsExist
  Throw error, if a path does not exist.`,

  async t => {
    //s
    const path = '💀/💀/💀'
    const value = `No this nor that named \'${path}\'.`
    const openReject = openFileStub(Promise.reject(new Error(value)))

    //e
    const result = await t.throwsAsync(Validator.pathsExist([path]))

    //v
    t.is(result.message, value)

    //td
    openReject.restore()
  }
)



test.serial(
`#pathsExist
  Throw error, if file could't be closed.`,

  async t => {
    //s
    const path = '💀/💀/💀'
    const value = `Could not close \'${path}\'.`
    const closeReject = openFileStub(Promise.resolve(
      { close: sinon.stub().returns(Promise.reject(new Error(value))) }
    ))

    //e
    const result = await t.throwsAsync(Validator.pathsExist([path]))

    //v
    t.is(result.message, value)

    //td
    closeReject.restore()
  }
)



test(
`#isStringEmpty
  Assert string and that it is empty.`,

  t =>
  t.assert(Validator.isStringEmpty(''))
)



test(
`#isStringEmpty
  Assert string and that it is not empty.`,

  t => 
  t.not(Validator.isStringEmpty(' '))
)



test(
`#isStringEmpty
  Assert that the value is not a string with type number.`,

  t =>
  t.not(Validator.isStringEmpty(1))
)



test(
`#isStringEmpty
  Assert that the value is not a string with type boolean (true).`,

  t =>
  t.not(Validator.isStringEmpty(true))
)



test(
`#isStringEmpty
  Assert that the value is not a string with type boolean (false).`,

  t =>
  t.not(Validator.isStringEmpty(false))
)



test(
`#isStringEmpty
  Assert that the value is not a string with undefined.`,

  t =>
  t.not(Validator.isStringEmpty())
)



test(
`#isStringEmpty
  Assert that the value is not a string with null.`,

  t =>
  t.not(Validator.isStringEmpty(null))
)



test(
`#isStringNotEmpty
  Assert string and that it is not empty.`,

  t =>
  t.assert(Validator.isStringNotEmpty(' '))
)



test(
`#isStringNotEmpty
  Assert string and that it is empty.`,

  t => 
  t.not(Validator.isStringNotEmpty(''))
)



test(
`#isStringNotEmpty
  Assert that the value is not a string with type number.`,

  t =>
  t.not(Validator.isStringNotEmpty(1))
)


test(
`#isStringNotEmpty
  Assert that the value is not a string with type boolean (true).`,

  t =>
  t.not(Validator.isStringNotEmpty(true))
)



test(
`#isStringNotEmpty
  Assert that the value is not a string with type boolean (false).`,

  t =>
  t.not(Validator.isStringNotEmpty(false))
)



test(
`#isStringNotEmpty
  Assert that the value is not a string with undefined.`,

  t =>
  t.not(Validator.isStringNotEmpty())
)



test(
`#isStringNotEmpty
  Assert that the value is not a string with null.`,

  t =>
  t.not(Validator.isStringNotEmpty(null))
)
