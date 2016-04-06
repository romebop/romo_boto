populateChat('Arteezy');
populateChat('Eternalenvyy');

function populateChat(target) {
  $.getJSON(target + '.json', function(json){
    var chatArray = json;
    for (var i = 0; i < chatArray.length; i++) {
      var date = datify(chatArray[i]['date']);
      var message = chatArray[i]['message']
      $('#' + target + '-list').append('<li><p class="date">' + date + ':</p><b>' + message + '</b></li>');
    }
    scrollBottom(target);
  });
}

function scrollBottom(target) {
  $('#' + target + '-list').scrollTop( $('#' + target + '-list')[0].scrollHeight );
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