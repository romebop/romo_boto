const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const tmi = require('tmi.js');
const fs = require('fs');
const mongo = require('mongodb').MongoClient;
const assert = require('assert');

app.set('port', (process.env.PORT || 3000));
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});
app.get('/Arteezy', function(req, res) {
  connectAndRespond(mongoURL, 'Arteezy', res);
});
app.get('/Eternalenvyy', function(req, res) {
  connectAndRespond(mongoURL, 'Eternalenvyy', res);
});
app.use(express.static(__dirname));

http.listen(app.get('port'), function() {
  console.log('Server running on localhost:' + app.get('port'));
});

// read from environment config if on heroku
try {
  var fileContents = fs.readFileSync('config.json');
  var config = JSON.parse(fileContents);
  var twitch_username = config.twitch_username;
  var twitch_password = config.twitch_password;
  var mongo_username = config.mongo_username;
  var mongo_password = config.mongo_password;
} catch(e) {
  var twitch_username = process.env.twitch_username;
  var twitch_password = process.env.twitch_password;
  var mongo_username = process.env.mongo_username;
  var mongo_password = process.env.mongo_password;
}

var mongoURL = 'mongodb://' + mongo_username + ':' + mongo_password + '@ds019990.mlab.com:19990/heroku_mfhrc2hl';

var options = {
  options: {
    debug: true
  },
  connection: {
    cluster: 'aws',
    reconnect: true
  },
  identity: {
    username: twitch_username,
    password: twitch_password
  },
  //channels: ['arteezy', 'eternalenvyy']
  channels: ['rome_bop']
};

var client = new tmi.client(options);
client.connect();

// store new messages into mongo
client.on('chat', function(channel, user, message, self) {
  function record(source) {
    if (user['display-name'] === source || user['display-name'] === 'rome_bop') {
      var msg = { date: Date.now(), message, source };
      storeMessage(mongoURL, msg);
    }
  }
  record('Arteezy');
  record('Eternalenvyy');

  if (message === 'romo_boto, are you there?') {
    client.action(channel, "I am here! :D");
  }

});

// socket new chat messages to client
io.on('connection', function(socket) {
  client.on('chat', function(channel, user, message, self) {
    function update(source) {
      if (user['display-name'] === source || user['display-name'] === 'rome_bop') {
        var msg = { date: Date.now(), message, source }; 
        socket.emit('message', msg);
      }
    }
    update('Arteezy');
    update('Eternalenvyy');
  });
});

// document schema: { date, message, source }
function storeMessage(url, message) {
  mongo.connect(url, function(err, db) {
    if (err) throw err;
    var col = db.collection('messages');
    col.insertOne(message, function(err, r) {
      if (err) throw err;
      db.close();
    });
  });
}

// connect to database and send json response
function connectAndRespond(url, source, res) {
  mongo.connect(url, function(err, db) {
    if (err) throw err;
    db.collection('messages').find({source: source}).toArray(function(err, docs) {
      if (err) throw err;
      res.json(docs);
      db.close();
    });
  });
}