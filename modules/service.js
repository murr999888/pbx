var service = {};
module.exports = service;

service.getNewActionId = function(){
	return Date.now();
}

service.getPeerNum = function(channel) {
	var re = /^(.*\/)?.*?-?(\d*)([-@].*)?$/i;
	var peer_str = channel;
	var found = peer_str.match(re);
	var peer = '';
	if (found && found.length > 1) {
		peer =  found[2];	
	}
	return peer;
}

service.isSIP = function(channel) {
	if (channel.indexOf('SIP') != -1) {
		return true;
	} else {
		return false;
	}
}

service.isLocal = function(channel) {
	if (channel.indexOf('Local') != -1) {
		return true;
	} else {
		return false;
	}
}

service.getLocalChannelEx = function(channel) {
	var ind = channel.indexOf(';'); 

	var ss = channel;
	if (ind != 0) {
		ss = channel.substr(0,ind);
	}
	return ss;
}

service.log = function(message) {
	console.log(service.convertTimestampToDateTime(Date.now()) + ' ' + message);
}

service.convertTimestampToDateTime = function(timestamp) {
	//	return timestamp/1000;
	var d = new Date(timestamp); // Convert the passed timestamp to milliseconds
	var yyyy = d.getFullYear();
	var mm = ('0' + (d.getMonth() + 1)).slice(-2); // Months are zero based. Add leading 0.
	var dd = ('0' + d.getDate()).slice(-2); // Add leading 0.
	var hh = ('0' + d.getHours()).slice(-2);
	var mn = ('0' + d.getMinutes()).slice(-2); // Add leading 0.
	var ss = ('0' + d.getSeconds()).slice(-2);

	// ie: 2013-02-18, 8:35 AM	
	var time = yyyy + '-' + mm + '-' + dd + ' ' + hh + ':' + mn + ':' + ss;

	return time;
}

service.convertTimestampToDate = function(timestamp) {
	//	return timestamp/1000;
	var d = new Date(timestamp); // Convert the passed timestamp to milliseconds
	var yyyy = d.getFullYear();
	var mm = ('0' + (d.getMonth() + 1)).slice(-2); // Months are zero based. Add leading 0.
	var dd = ('0' + d.getDate()).slice(-2); // Add leading 0.

	var time = yyyy + '-' + mm + '-' + dd;

	return time;
}

service.getDuration = function(difference_ms) {
	//take out milliseconds
  	difference_ms = difference_ms/1000;

	var seconds = Math.floor(difference_ms % 60);
	if (seconds < 10){seconds = '0' + seconds};
  	difference_ms = difference_ms/60; 

  	var minutes = Math.floor(difference_ms % 60);
	if (minutes < 10){minutes = '0' + minutes};
  	difference_ms = difference_ms/60; 

  	var hours = Math.floor(difference_ms % 24);
	if (hours < 10){hours = '0' + hours};  

  	var days = Math.floor(difference_ms/24);

	var str = '';  
	if (days > 0) {str = str + days + ' day(s), '};
	str = str + hours + 'h ';

  	return  str + minutes + 'm';
}