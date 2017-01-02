const express = require('express');
const app = express();
const server = require('http').createServer(app);
// const io = require('socket.io')(server);
const Lemonade = require('./index');

const lemon = new Lemonade({node:{log:console}});
lemon.setupRoutes(server, app, express);
require('./db').UserDb.initDb();
server.listen(3000, function(){
	console.log('Server listening on port 3000.');
});
