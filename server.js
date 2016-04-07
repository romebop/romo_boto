const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const tmi = require('tmi.js');
const fs = require('fs');

app.set('port', (process.env.PORT || 3000));
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
app.use(express.static(__dirname));

http.listen(app.get('port'), function() {
  console.log('Server running on localhost:' + app.get('port'));
});

// read from environment config if on heroku
try {
  var fileContents = fs.readFileSync('config.json');
  var config = JSON.parse(fileContents);
  var username = config.username;
  var password = config.password;
} catch(e) {
  var username = process.env.USERNAME;
  var password = process.env.PASSWORD;
}

var options = {
  options: {
    debug: true
  },
  connection: {
    cluster: 'aws',
    reconnect: true
  },
  identity: {
    username,
    password
  },
  channels: ['arteezy', 'eternalenvyy']
  //channels: ['rome_bop']
};

var client = new tmi.client(options);
client.connect();

client.on('chat', function(channel, user, message, self) {
  function record(target) {
    if (user['display-name'] === target || user['display-name'] === 'Moobot') {
      var msg = { date: Date.now(), message }; 
      storeJSON(target + '.json', msg);
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
      if (user['display-name'] === target || user['display-name'] === 'Moobot') {
        var msg = { date: Date.now(), message, target }; 
        socket.emit('message', msg);
      }
    }
    update('Arteezy');
    update('Eternalenvyy');
  });
});

function storeJSON(file, message) {
  fs.readFile(file, function(err, data) {
    if (err) throw err;
    else {
      var jsonForm = JSON.parse(data);
      jsonForm.push(message);
      var stringified = JSON.stringify(jsonForm);
      fs.writeFile(file, stringified, function(err) {
        if (err) throw err;
      });
    }
  });
}