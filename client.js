populateChat('Arteezy');
populateChat('Eternalenvyy');

var socket = io();

socket.on('chat', function(obj) {
  var source = obj.source;
  var date = datify(obj.date);
  var message = obj.message;
  appendChat(source, date, message);
  scrollBottom(source);
});

function populateChat(source) {
  $.getJSON('/' + source, function(data) {
    data.forEach( function(d) {
      appendChat(source, datify(d.date), d.message);
    });
    scrollBottom(source);
  });  
}

function appendChat(source, date, message) {
  $('#' + source + '-list').append('<li><p class="date">' + date + ':</p><b>' + message + '</b></li>');
}

function scrollBottom(source) {
  $('#' + source + '-list').scrollTop( $('#' + source + '-list')[0].scrollHeight );
} 

function datify(date_ms) {
  var time = new Date(date_ms);
  var month = time.getMonth();
  var day = time.getDate();
  var hours = time.getHours();
  var minutes = time.getMinutes();
  var seconds = time.getSeconds();
  var am_pm;
  if (minutes < 10) minutes = '0' + minutes;
  if (seconds < 10) seconds = '0' + seconds;
  if (hours >= 12) {
    am_pm = 'pm';
    if (hours > 12) hours -= 12;
  } else {
    am_pm = 'am';
    if (hours == 0) hours = 12;
  }
  return month+1 + '/' + day + ' ' + hours + ':' + minutes + ' ' + am_pm;
}