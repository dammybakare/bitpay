'use strict';

var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var bitcore = require('bitcore-lib');
var bodyParser = require('body-parser');

function LemonadeStand(options) {
  EventEmitter.call(this);

  this.node = options.node;
  this.log = this.node.log;

  this.invoiceHtml = fs.readFileSync(__dirname + '/invoice.html', 'utf8');
  this.amount = 12340000;

  // Use 1 HD Private Key and generate a unique address for every invoice
  this.hdPrivateKey = new bitcore.HDPrivateKey(this.node.network);
  this.log.info('Using key:', this.hdPrivateKey);
  this.addressIndex = 0;
}

LemonadeStand.dependencies = ['bitcoind'];

LemonadeStand.prototype.start = function(callback) {
  setImmediate(callback);
};

LemonadeStand.prototype.stop = function(callback) {
  setImmediate(callback);
};

LemonadeStand.prototype.getAPIMethods = function() {
  return [];
};

LemonadeStand.prototype.getPublishEvents = function() {
  return [];
};

LemonadeStand.prototype.setupRoutes = function(server, app, express) {
  var self = this;

  app.use(bodyParser.urlencoded({extended: true}));

  app.use('/', express.static(`${__dirname}/static`));
  app.use(`/${this.getRoutePrefix()}/`, express.static(`${__dirname}/static`));

  app.post('/invoice', function(req, res) {
    self.addressIndex++;
    self.amount = parseFloat(req.body.amount) * 1e8;
    res.status(200).send(self.filterInvoiceHTML());
  });

  const io = require('socket.io')(server);
  io.on('connection', function (socket) {
    console.log('New socket connection');
  	socket.on('add-user', function (account) {
      self.addAccount(account).then(function(data){
        socket.emit('user-added', data);
    	  socket.emit('status','Successful account creation');
    	}).catch(function(){
    		socket.emit('status','Unable to create account');
    	});
  	});
    socket.on('get-user', function (account) {
      self.getAccount(account).then(function(data){
    	  socket.emit('user-found', data);
    	}).catch(function(err){
    		socket.emit('status',`Unable to find account: ${err||''}`);
    	});
  	});
  });
};

LemonadeStand.prototype.addAccount = function(param){
  console.log('Add Account', param);
  return new Promise(function(resolve){
    param.account = '';
    require('./db').UserDb.save(param);
    resolve(param);
  });
};

LemonadeStand.prototype.getAccount = function(param){
  console.log('Get Account', param);
  return new Promise(function(resolve, reject){
    var callback = function (err, data){
      if(!err && data && data.length && data.length > 0)
        resolve(data[0]);
      else reject(err);
    }
    require('./db').UserDb.search(param, callback);
  });
};

LemonadeStand.prototype.getRoutePrefix = function() {
  return 'lemonade-stand';
};

LemonadeStand.prototype.filterInvoiceHTML = function() {
  var btc = this.amount / 1e8;
  var address = this.hdPrivateKey.derive(this.addressIndex).privateKey.toAddress();
  this.log.info('New invoice with address:', address);
  var hash = address.hashBuffer.toString('hex');
  var transformed = this.invoiceHtml
    .replace(/{{amount}}/g, btc)
    .replace(/{{address}}/g, address)
    .replace(/{{hash}}/g, hash)
    .replace(/{{baseUrl}}/g, '/' + this.getRoutePrefix() + '/');
  return transformed;
};

module.exports = LemonadeStand;
