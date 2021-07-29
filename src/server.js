/* Server */
import Server, { Response } from 'minikin';



const removeProp =
  (prop, rec = {}) =>
  ({ [prop]: _, ...r } = rec, r)



export const serve = 
  (fn, rec) => 
  Server
  .server(rec.port, removeProp('port', rec))
  .then(server => (server.routes(fn(Response)), server))



export default { serve }