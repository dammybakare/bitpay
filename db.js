const mongoose = require('mongoose');
 const conn = mongoose.createConnection('localhost', 'mydatabase');
conn.once('open', function() {
  console.log('Connection Successful');
});
//conn.open('localhost', 'database')
var User;
const DB = {
  initDb: function initDb() {
    var userSchema = new mongoose.Schema({
      name: String,
      account: String
    });
    User = conn.model('User', userSchema);
  },
  search: function(str, callback) {
    return User.find(str, callback);
  },
  save: function(params){
    const user = new User({name: params.name, account: params.account});
    user.save(function(err){
      if(err) throw err;
    });
  }
}

module.exports.UserDb = DB;
