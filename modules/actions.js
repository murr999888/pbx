var service = require('./service');
var db = require('./db');

var actions = {};
module.exports = actions;

actions.getPeerStatus = function(ami, actionid, peername) {
	ami.action({
  		'action':'SIPpeerstatus',
  		'actionid': actionid,
  		'peer':peername
		}, function(err, res) {
			//console.log(res);	
	});
}

actions.getShowPeer = function(ami, actionid, peername, callback) {
	ami.action({
  		'action':'SIPshowpeer',
  		'actionid':actionid,
  		'peer':peername
		}, function(err, res) {
			if (res) {
				callback(res);
			}
	});
}

actions.getShowRegistry = function(ami, actionid) {
	ami.action({
  		'action':'SIPshowregistry',
  		'actionid':actionid
		}, function(err, res) {
			//console.log(res);	
	});
}

actions.SIPpeers = function(ami, actionid, callback){
	ami.action({
  		'action':'Sippeers'
		}, function(err, res) {
			if (res) {
				//console.log(res);	
				callback(res);
			}
	});
}

actions.getDND = function(ami, actionid, num, callback){
	ami.action({
  		'action':'DBGet',
		'Family':'DND',
		'Key': num
		}, function(err, res) {
			if (res) {
				//console.log(res);	
				callback(res);
			}
			//console.log(res);	
	});
}

actions.getAllChannels = function(ami, actionid, callback){
	ami.action({
  		'action':'CoreShowChannels',
  		'actionid':actionid
		}, function(err, res) {
			if (res) {
				callback(res);
			}
			//console.log(res);	
	});
}
