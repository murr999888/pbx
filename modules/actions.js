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
	/*
	{ response: 'Success',
  	actionid: '123456',
  	message: 'Peer status will follow' }

	{ response: 'Error',
  	actionid: '123456',
  	message: 'No such peer' }

	{ event: 'PeerStatus',
  	privilege: 'System',
  	channeltype: 'SIP',
  	peer: 'SIP/102',
  	peerstatus: 'Reachable',
  	time: '1',
  	actionid: '123456' }
	*/
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
	/*
	{ response: 'Success',
	  actionid: '123456',
  	channeltype: 'SIP',
  	objectname: '102',
  	chanobjecttype: 'peer',
  	secretexist: 'Y',
  	remotesecretexist: 'N',
  	md5secretexist: 'N',
  	context: 'from-internal',
  	language: 'ru',
  	tonezone: '<Not set>',
  	amaflags: 'Unknown',
  	'cid-callingpres': 'Presentation Allowed, Not Screened',
  	callgroup: '',
  	pickupgroup: '',
  	'named callgroup': '',
  	'named pickupgroup': '',
  	mohsuggest: '',
  	voicemailbox: '102@device',
  	transfermode: 'open',
  	lastmsgssent: '0',
  	maxforwards: '0',
  	'call-limit': '2147483647',
  	'busy-level': '0',
  	maxcallbr: '384 kbps',
  	dynamic: 'Y',
  	callerid: '"Dispetcher-102" <102>',
  	regexpire: '673 seconds',
  	'sip-authinsecure': 'no',
  	'sip-forcerport': 'N',
  	'sip-comedia': 'N',
  	acl: 'Y',
  	'sip-canreinvite': 'N',
  	'sip-directmedia': 'N',
  	'sip-promiscredir': 'N',
  	'sip-userphone': 'N',
  	'sip-videosupport': 'N',
  	'sip-textsupport': 'Y',
  	'sip-t.38support': 'Y',
  	'sip-t.38ec': 'Redundancy',
  	'sip-t.38maxdtgrm': '400',
  	'sip-sess-timers': 'Accept',
  	'sip-sess-refresh': 'uas',
  	'sip-sess-expires': '1800',
  	'sip-sess-min': '90',
  	'sip-rtp-engine': 'asterisk',
  	'sip-encryption': 'N',
  	'sip-dtmfmode': 'rfc2833',
  	tohost: '',
  	'address-ip': '10.0.0.2',
  	'address-port': '5060',
  	'default-addr-ip': '(null)',
  	'default-addr-port': '0',
  	'default-username': '102',
	codecs: '(ulaw|alaw)',
  	codecorder: 'ulaw,alaw',
  	status: 'OK (2 ms)',
  	'sip-useragent': 'SIPPER for PhonerLite',
  	'reg-contact': 'sip:102@10.0.0.2:5060',
  	qualifyfreq: '60000 ms',
  	parkinglot: '',
  	'sip-use-reason-header': 'N',
  	description: '' }
*/
}

actions.getShowRegistry = function(ami, actionid) {
	ami.action({
  		'action':'SIPshowregistry',
  		'actionid':actionid
		}, function(err, res) {
			//console.log(res);	
	});

	/*
	{ response: 'Success',
  	actionid: '123456',
  	eventlist: 'start',
  	message: 'Registrations will follow' }
	*/
}

actions.SIPpeers = function(ami, actionid, callback){
	ami.action({
  		'action':'Sippeers'
		}, function(err, res) {
			if (res) {
				//console.log(res);	
				callback(res);
			}
			//console.log(res);	
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
