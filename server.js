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

var options = {
  options: {
    debug: true
  },
  connection: {
    cluster: 'aws',
    reconncet: true
  },
  identity: {
    username: 'romo_boto',
    password: 'oauth:d9w2t4p1kda84xfrpsotemysan3mry'
  },
  channels: ['arteezy', 'eternalenvyy']
};

var client = new tmi.client(options);
client.connect();

io.on('connection', function(socket) {

  client.on('chat', function(channel, user, message, self) {
    function record(target) {
      if (user['display-name'] === target) {
        var msg = { date: Date.now(), message }; 
        storeJSON(target + '.json', msg);
        msg['target'] = target;
        socket.emit('message', msg);
      }
    }
    record('Arteezy');
    record('Eternalenvyy')
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