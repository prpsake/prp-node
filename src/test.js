import { serve } from './server.bs.js'


serve(fromFile => ({
  'GET /': () => fromFile('/Users/jerome/Projects/PRP/prp-node/src/test.html')
}))