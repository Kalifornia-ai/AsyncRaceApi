// server.js
import jsonServer from 'json-server';
import addHeaders from './middlewares/addHeaders.cjs';   // your custom middleware

const server = jsonServer.create();
const router = jsonServer.router('db.json');
const defaults = jsonServer.defaults();

server.use(addHeaders);   // your CORS-expose header for X-Total-Count
server.use(defaults);     // logger, CORS, gzip, etc.
server.use(router);       // actual API routes

server.listen(3000, () => {
  console.log('JSON Server (v1) with middleware running on http://localhost:3000');
});
