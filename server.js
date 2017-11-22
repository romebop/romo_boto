const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const tmi = require('tmi.js');
const fs = require('fs');
const mongo = require('mongodb').MongoClient;
const assert = require('assert');
const favicon = require('serve-favicon');
const path = require('path');

app.set('port', (process.env.PORT || 3000));
app.use(express.static(__dirname));
app.use(favicon('favicon.ico'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});
app.get('/Arteezy', function(req, res) {
  fetchAndRespond('Arteezy', res);
});
app.get('/Eternalenvyy', function(req, res) {
  fetchAndRespond('Eternalenvyy', res);
});

function fetchAndRespond(source, res) {
  var chatColl = myDB.collection(source);
  chatColl.find({}, {'_id': false}).sort({date: 1}).toArray(function(err, docs) {
    if (err) throw err;
    res.json(docs);
  });
}

// read config variables
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

var myDB;

mongo.connect(mongoURL, function(err, db) {
  if (err) throw err;
  myDB = db;
  http.listen(app.get('port'), function() {
    console.log('Server running on localhost:' + app.get('port'));
  });
});

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
  channels: ['arteezy', 'eternalenvyy']
};

var client = new tmi.client(options);

client.connect();

client.on('chat', function(channel, user, message, self) {
  // logs any message from rtz or ee to respective collection
  var currentUser = user['display-name'];
  if (currentUser === 'Arteezy' || currentUser === 'EternaLEnVyy') {
    var chat = {
      date: Date.now(),
      message,
    };
    var chatColl = myDB.collection(currentUser);
    chatColl.insertOne(chat, function(err) {
      if (err) throw err;
    });
  }
  if (message === 'romo_boto, are you there?') {
    client.action(channel, "I am here! :D");
  }
});

// socket new chat messages to client
io.on('connection', function(socket) {
  client.on('chat', function(channel, user, message, self) {
    var currentUser = user['display-name'];
    if (currentUser === 'Arteezy' || currentUser === 'EternaLEnVyy') {
      var chat = {
        date: Date.now(),
        source: currentUser,
        message,
      };
      socket.emit('chat', chat);
    }
  });
});
