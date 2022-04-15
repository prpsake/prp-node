import test from 'ava'
import sinon from 'sinon'


import { promises as fs } from 'fs';
import * as Validator from './Validator.mjs'



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



/* #isStringEmpty */

test(
`#isStringEmpty
  Empty string is an empty string.`,

  t =>
  t.true(Validator.isStringEmpty(''))
)



test(
`#isStringEmpty
  Non-empty string is not an empty string.`,

  t => 
  t.false(Validator.isStringEmpty(' '))
)



test(
`#isStringEmpty
  Number is not an empty string.`,

  t =>
  t.false(Validator.isStringEmpty(0))
)



test(
`#isStringEmpty
  True is not an empty string.`,

  t =>
  t.false(Validator.isStringEmpty(true))
)



test(
`#isStringEmpty
  False is not an empty string.`,

  t =>
  t.false(Validator.isStringEmpty(false))
)



test(
`#isStringEmpty
  Undefined is not an empty string.`,

  t =>
  t.false(Validator.isStringEmpty(undefined))
)



test(
`#isStringEmpty
  Null is not an empty string.`,

  t =>
  t.false(Validator.isStringEmpty(null))
)



/* #isStringNotEmpty */

test(
`#isStringNotEmpty
  Non-empty string is not an empty string.`,

  t =>
  t.true(Validator.isStringNotEmpty(' '))
)



test(
`#isStringNotEmpty
  Empty string is not a non-empty string.`,

  t => 
  t.false(Validator.isStringNotEmpty(''))
)



test(
`#isStringNotEmpty
  Number is not a non-empty string.`,

  t =>
  t.false(Validator.isStringNotEmpty(0))
)


test(
`#isStringNotEmpty
  True is not a non-empty string.`,

  t =>
  t.false(Validator.isStringNotEmpty(true))
)



test(
`#isStringNotEmpty
  False is not a non-empty string.`,

  t =>
  t.false(Validator.isStringNotEmpty(false))
)



test(
`#isStringNotEmpty
  Undefined is not a non-empty string.`,

  t =>
  t.false(Validator.isStringNotEmpty(undefined))
)



test(
`#isStringNotEmpty
  Null is not a non-empty string..`,

  t =>
  t.false(Validator.isStringNotEmpty(null))
)



/* #coerceString */

test(
`#coerceString
  Empty string returns the same.`,

  t =>
  t.is(Validator.coerceString(''), '')
)



test(
`#coerceString
  Non-Empty string returns the same.`,

  t =>
  t.is(Validator.coerceString(' '), ' ')
)



test(
`#coerceString
  Number returns an empty string.`,

  t =>
  t.is(Validator.coerceString(0), '')
)



test(
`#coerceString
  True returns am empty string.`,

  t =>
  t.is(Validator.coerceString(true), '')
)



test(
`#coerceString
  False returns an empty string.`,

  t =>
  t.is(Validator.coerceString(false), '')
)



test(
`#coerceString
  Undefined returns an empty string.`,

  t =>
  t.is(Validator.coerceString(undefined), '')
)



test(
`#coerceString
  Null returns an empty string.`,

  t =>
  t.is(Validator.coerceString(null), '')
)



/* #coerceBoolean */

test(
`#coerceBoolean
  True returns the same.`,

  t =>
  t.true(Validator.coerceBool(true))
)



test(
`#coerceBoolean
  False returns the same.`,

  t =>
  t.false(Validator.coerceBool(false))
)



test(
`#coerceBoolean
  String returns true.`,

  t =>
  t.true(Validator.coerceBool(''))
)



test(
`#coerceBoolean
  Number returns false.`,

  t =>
  t.false(Validator.coerceBool(1))
)



test(
`#coerceBoolean
  Undefined returns false.`,

  t =>
  t.false(Validator.coerceBool(undefined))
)



test(
`#coerceBoolean
  Null returns false.`,

  t =>
  t.false(Validator.coerceBool(undefined))
)



/* #throwOnStringEmpty */

test(
`#throwOnStringEmpty
  Throw on empty string.`,

  t => {
    //s
    const message = 'emptiness'

    //e
    const result =  t.throws(() => Validator.throwOnStringEmpty(message, ''), { instanceOf: Error})

    //v
    t.is(result.message, message)
  }
)



test(
`#throwOnStringEmpty
  Return the same.`,

  t =>
  t.is(Validator.throwOnStringEmpty('message', 'value'), 'value')
)