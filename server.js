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
  res.json(ArteezyChat);
})
app.get('/Eternalenvyy', function(req, res) {
  res.json(EternalenvyyChat);
})
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

var ArteezyChat
  , EternalenvyyChat
  ;
loadChats(mongoURL);

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

// store new chat into datastore
client.on('chat', function(channel, user, message, self) {
  function record(target) {
    if (true) { //user['display-name'] === target) {
      var msg = { date: Date.now(), message };
      if (target === "Arteezy") ArteezyChat.push(msg);
      if (target === "Eternalenvyy") EternalenvyyChat.push(msg);
      updateDB(mongoURL, target);
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
    function update(target) {
      if (true) { //user['display-name'] === target) {
        var msg = { date: Date.now(), message, target }; 
        socket.emit('message', msg);
      }
    }
    update('Arteezy');
    update('Eternalenvyy');
  });
});

function loadChats(url) {
  mongo.connect(url, function(err, db) {
    assert.equal(null, err);  
    var cursor = db.collection('messages').find();
    cursor.each(function(err, doc) {
      assert.equal(null, err);
      if (!doc) db.close();
      else if (doc.target === "Arteezy") {
        ArteezyChat = doc.log;
      }
      else if (doc.target === "Eternalenvyy") {
        EternalenvyyChat = doc.log;
      }
    });
  });
}

function updateDB(url, target) {
  mongo.connect(url, function(err, db) {
    assert.equal(null, err);
    var col = db.collection('messages');
    if (target === "Arteezy") {
      col.update({ target : target }
        , { $set: { log : ArteezyChat } }, function(err, result) {
          assert.equal(err, null);
          db.close();
        }
      );
    }
    if (target === "Eternalenvyy") {
      col.update({ target : target }
        , { $set: { log : EternalenvyyChat } }, function(err, result) {
          assert.equal(err, null);
          db.close();
        }
      ); 
    }
  });
}
