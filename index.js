var ami = new require('asterisk-manager')('5038','10.10.1.5','murr','rfcmurr', true);
var mysql = require('mysql');
var fs = require('fs');

var db = require('./modules/db');
var actions = require('./modules/actions');
var service = require('./modules/service');

var poll_registry_interval = 60;
var collect_all_messages = false;
var registries = [];

var connection;
 
handleDisconnect();

function handleDisconnect() {
	connection = mysql.createConnection({
		host: 'localhost',
		user: 'goip',
		password: 'goip',
		database: 'pbx'
	});

	connection.connect(function (err) {  // ошибка первичного соединения с БД
		if (err) {
			setTimeout(handleDisconnect, 5000); 
			service.log('error when connecting to db ');
			service.log(err);
			connection.end();
			return;
		}
		// удержание коннекта к БД
		db.keepConnection(connection);
		init();
	});
}

connection.on('error', function(err) { // ошибка соединения в процессе работы
    	service.log('db error');
	service.log(err);
	if(err.code === 'PROTOCOL_CONNECTION_LOST') { 
      		handleDisconnect();                        
    	}
});

// In case of any connectiviy problems we got you coverd.
ami.keepConnected();

ami.on('fullybooted', function(evt) {
	service.log('fully booted ..');
});

ami.on('newchannel', function(evt) {
	var peer = service.getPeerNum(evt.channel);		
	db.channel_newchannel(connection, peer, evt);
});

ami.on('rename', function(evt) {
	var peer = service.getPeerNum(evt.newname);	
	db.channel_rename(connection, peer, evt);
});

ami.on('newstate', function(evt) {
	db.channel_newstate(connection, evt);
});

ami.on('musiconhold', function(evt) {
	if (evt.state == 'Start') {
		db.channel_event(connection, evt.uniqueid, 'Music on hold');
	}

	if (evt.state == 'Stop') {
		db.channel_event(connection, evt.uniqueid, '');
	}
});

ami.on('dial', function(evt) {
//Fri Feb 22 2019 15:03:46 GMT+0200 (EET) {"event":"Dial","privilege":"call,all","subevent":"Begin","channel":"SIP/3001-000008cd","destination":"SIP/102-000008ce","calleridnum":"380677981500","calleridname":"Людмила Викторовна, Каб. 18 (бывш.№2, №22 - Людмила Викторовна), ГНИ Жовтн.р-на (каб.18, каб.19, каб.20)","connectedlinenum":"<unknown>","connectedlinename":"<unknown>","uniqueid":"1550840624.2721","destuniqueid":"1550840625.2722","dialstring":"102"}
	if (evt.subevent == 'Begin'){
		db.dial_begin(connection, evt);
	}

	if (evt.subevent == 'End'){
		db.dial_end(connection, evt);
	}
});

ami.on('newcallerid', function(evt) {
     	db.channel_newcallerid(connection, evt);
});

ami.on('join', function(evt) {
//Tue Feb 19 2019 17:42:10 GMT+0200 (EET) {"event":"Join","privilege":"call,all","channel":"SIP/3002-000004b9","calleridnum":"380974284233","calleridname":"Строителей пр.,165- 26"x,"connectedlinenum":"113","connectedlinename":"Dispetcher-113","queue":"1000","position":"1","count":"1","uniqueid":"1550590909.1446"}
     	db.queue_join(connection, evt);
});

ami.on('leave', function(evt) {
     	db.queue_leave(connection, evt);
});

ami.on('queuecallerabandon', function(evt) {
//Sat Feb 23 2019 14:53:16 GMT+0200 (EET) {"event":"QueueCallerAbandon","privilege":"agent,all","queue":"1000","uniqueid":"1550926371.4369","position":"1","originalposition":"1","holdtime":"18"}
     	db.queue_abandon(connection, evt);
});

ami.on('queuecallerabandon', function(evt) {
     	//db.queue_leave(connection, evt);
});

ami.on('agentcomplete', function(evt) {
     	//db.queue_leave(connection, evt);
});

ami.on('bridge', function(evt) {
//Wed Feb 13 2019 11:04:16 GMT+0200 (EET) {"event":"Bridge","privilege":"call,all","bridgestate":"Link","bridgetype":"core","channel1":"SIP/3002-00002e7d","channel2":"SIP/102-00002e7f","uniqueid1":"1550048651.16877","uniqueid2":"1550048653.16879","callerid1":"380972238055","callerid2":"102"}
//Wed Feb 13 2019 11:04:39 GMT+0200 (EET) {"event":"Bridge","privilege":"call,all","bridgestate":"Unlink","bridgetype":"core","channel1":"SIP/3002-00002e7d","channel2":"SIP/102-00002e7f","uniqueid1":"1550048651.16877","uniqueid2":"1550048653.16879","callerid1":"380972238055","callerid2":"102"}
	if (evt.bridgestate == 'Link') {
		db.bridge_begin(connection, evt);
	}

	if (evt.bridgestate == 'Unlink') {
		db.bridge_end(connection, evt);
	}
});

ami.on('hangup', function(evt) {
	db.channel_hangup(connection, evt);
});

ami.on('dbgetresponse', function(evt) {
	if(evt.family == 'DND' && evt.val == 'YES') {
		db.peer_set_dnd(connection, evt.key, 1);
	}
});

ami.on('userevent-dndenabled', function(evt) {
	db.peer_set_dnd(connection, evt.num, 1);
});

ami.on('userevent-dnddisabled', function(evt) {
	//console.log(evt);
	db.peer_set_dnd(connection, evt.num, 0);
});

ami.on('userevent-announcestart', function(evt) {
	db.channel_event(connection, evt.uniqueid, 'Announce');
});

ami.on('userevent-announcestop', function(evt) {
	db.channel_event(connection, evt.uniqueid, '');
});

ami.on('userevent-noanswer', function(evt) {
	db.channel_event(connection, evt.uniqueid, 'NO ANSWER');
});

ami.on('userevent-busy', function(evt) {
	db.channel_event(connection, evt.uniqueid, 'BUSY');
});

ami.on('peerstatus', function(evt) {
//Fri Feb 22 2019 15:03:24 GMT+0200 (EET) {"event":"PeerStatus","privilege":"system,all","channeltype":"SIP","peer":"SIP/3005","peerstatus":"Registered","address":"10.10.1.9:5060"}
	var ip = '';
	var peer = service.getPeerNum(evt.peer);	

	if (evt.address) {
		ip = evt.address.split(':')[0];
		db.peer_set_registered(connection, peer, 1, ip);
	}

	db.peer_set_state(connection, peer, evt.peerstatus);

	if (evt.peerstatus == 'Registered'){
		db.peer_set_registered(connection, peer, 1, ip);
		db.peer_set_reachable(connection, peer, 1, ip);
	} else if (evt.peerstatus == 'Unregistered') {
		db.peer_set_registered(connection, peer, 0, ip);
	} else if (evt.peerstatus == 'Rejected') {
		db.peer_set_registered(connection, peer, 0, ip);
	} else if (evt.peerstatus == 'Reachable') {
		db.peer_set_reachable(connection, peer, 1, ip);
	} else if (evt.peerstatus == 'Unreachable') {
		db.peer_set_reachable(connection, peer, 0, ip);
	} else if (evt.peerstatus == 'Unknown') {
		db.peer_set_reachable(connection, peer, 0, ip);
	} else if (evt.peerstatus == 'No Authentication') {
		db.peer_set_reachable(connection, peer, 0, ip);
	} else if (evt.peerstatus == 'Lagged') {
		db.peer_set_reachable(connection, peer, 1, ip);
	} else {
		service.log('unknown peerstatus \n' + JSON.stringify(evt) + '\n');
	}
});

ami.on('peerentry', function(evt) {
//Fri Feb 22 2019 15:53:44 GMT+0200 (EET) {"event":"PeerEntry","actionid":"1550843624881","channeltype":"SIP","objectname":"100","chanobjecttype":"peer","ipaddress":"-none-","ipport":"0","dynamic":"yes","autoforcerport":"no","forcerport":"no","autocomedia":"no","comedia":"no","videosupport":"no","textsupport":"yes","acl":"yes","status":"UNKNOWN","realtimedevice":"no","description":""}
//Fri Feb 22 2019 15:53:44 GMT+0200 (EET) {"event":"PeerEntry","actionid":"1550843624881","channeltype":"SIP","objectname":"3001","chanobjecttype":"peer","ipaddress":"10.10.1.6","ipport":"5060","dynamic":"yes","autoforcerport":"no","forcerport":"no","autocomedia":"no","comedia":"no","videosupport":"no","textsupport":"yes","acl":"yes","status":"OK (17 ms)","realtimedevice":"no","description":""}
	db.peers_check_exist(connection, evt.objectname);

	var ip = evt.ipaddress;
	var peer = evt.objectname;
	db.peer_set_state(connection, peer, evt.status); 

	if (evt.ipaddress != '' &&  evt.ipaddress != '-none-') {
		db.peer_set_registered(connection, peer, 1, ip);
	} else {
		db.peer_set_registered(connection, peer, 0, ip);
	}
//{"event":"PeerEntry","actionid":"1552087171383","channeltype":"SIP","objectname":"380629560744","chanobjecttype":"peer","ipaddress":"93.178.205.41","ipport":"5060","dynamic":"no","autoforcerport":"no","forcerport":"yes","autocomedia":"no","comedia":"yes","videosupport":"no","textsupport":"yes","acl":"yes","status":"OK (49 ms)","realtimedevice":"no","description":""}

	if (evt.status.indexOf('OK') != -1) {
		db.peer_set_reachable(connection, peer, 1, ip);
	} else {
		db.peer_set_reachable(connection, peer, 0, ip);
	}
});

ami.on('registry', function(evt) {
//Fri Feb 22 2019 15:04:02 GMT+0200 (EET) {"event":"Registry","privilege":"system,all","channeltype":"SIP","username":"380629409915","domain":"93.178.205.42","status":"Registered"}
	if (!evt.actionid) {
		var peer = evt.username;
		var ip = evt.domain;
       	
		db.peer_set_state(connection, peer, evt.status); 

		if (evt.status == 'Registered') {
			db.peer_set_registered(connection, peer, 1, ip);
			db.peer_set_reachable(connection, peer, 1, ip);
		} else if (evt.status == 'Unregistered') {
			db.peer_set_registered(connection, peer, 0, ip);
			//db.peer_set_reachable(connection, peer, 0);
		} else if (evt.status == 'Rejected') {
			db.peer_set_registered(connection, peer, 0, ip);
		} else if (evt.status == 'Auth. Sent') {
			db.peer_set_registered(connection, peer, 0, ip);
		} else if (evt.status == 'Reachable') {
			db.peer_set_reachable(connection, peer, 1, ip);
		} else if (evt.status == 'Unreachable') {
			db.peer_set_reachable(connection, peer, 0, ip);
		} else if (evt.status == 'No Authentication') {
			db.peer_set_reachable(connection, peer, 0, ip);
		} else if (evt.status == 'Request Sent') {
			db.peer_set_reachable(connection, peer, 0, ip);
		} else if (evt.status == 'Lagged') {
			db.peer_set_reachable(connection, peer, 1, ip);
		} else {
			service.log('unknown registry \n' + JSON.stringify(evt) + '\n');
		}
	} else {
		service.log('registry \n' + JSON.stringify(evt) + '\n');
	}
});

ami.on('registryentry', function(evt) {
//Fri Feb 22 2019 15:53:44 GMT+0200 (EET) {"event":"RegistryEntry","actionid":"1550843624882","host":"93.178.205.41","port":"5060","username":"380629406599202","domain":"93.178.205.41","domainport":"5060","refresh":"585","state":"Registered","registrationtime":"1550843341"}
	if (evt.actionid) {
		var peer = evt.username;
		var ip = evt.domain;
		var statetime = '';
		if (evt.registrationtime && evt.registrationtime > 0) {
			statetime = ' ' + service.convertTimestampToDateTime(evt.registrationtime*1000);
		}
		
                db.peer_set_state(connection, peer, evt.state + statetime);

		if (evt.state == 'Registered') {
			db.peer_set_registered(connection, peer, 1, ip);
			db.peer_set_reachable(connection, peer, 1, ip);
		} else if (evt.state == 'Unregistered') {
			db.peer_set_registered(connection, peer, 0, ip);
			//db.peer_set_reachable(connection, peer, 0);
		} else if (evt.state == 'Rejected') {
			db.peer_set_registered(connection, peer, 0, ip);
		} else if (evt.state == 'Auth. Sent') {
			db.peer_set_registered(connection, peer, 0, ip);
		} else if (evt.state == 'No Authentication') {
			db.peer_set_registered(connection, peer, 0, ip);
		} else if (evt.state == 'Reachable') {
			db.peer_set_reachable(connection, peer, 1, ip);
		} else if (evt.state == 'Unreachable') {
			db.peer_set_reachable(connection, peer, 0, ip);
		} else if (evt.state == 'Request Sent') {
			db.peer_set_reachable(connection, peer, 0, ip);
		} else if (evt.state == 'Lagged') {
			db.peer_set_reachable(connection, peer, 1, ip);
		} else {
			service.log('unknown registryentry \n' + JSON.stringify(evt) + '\n');
		}
	} else {
		service.log('registryentry \n'  + JSON.stringify(evt) + '\n');
	}
});

if (collect_all_messages) {
	// Listen for any/all AMI events.
	ami.on('managerevent', function(evt) {
		//console.log(evt);
		fs.appendFile('message.txt', Date.now() + ' ' + JSON.stringify(evt) + '\n' , function (err) {
  			if (err) throw err;
		});
	});
}

function get_registries_state() {
	actions.getShowRegistry(ami, service.getNewActionId());
};

function init() {
	//инициализация
	// сброс данных в таблицах
	db.peer_resetall(connection);

	// запрос состояния пиров и регистри, обновление таблицы peers
	// получим всех пиров от астериска

	actions.SIPpeers(ami, service.getNewActionId(),function(results){

	});

	db.get_peers(connection, function(results){
		if (results) {
			results.forEach(function(item, i, arr) {
				var num = item.num;
				if (num.length == 3) {
					actions.getDND(ami, service.getNewActionId(), num, function(res){
						if (res.response == 'Error') {
               						db.peer_set_dnd(connection, num, 0);	
						}       	
					});
				}
			});
		}
	});

	get_registries_state();

	setInterval(function () {
    		get_registries_state();
	}, poll_registry_interval * 1000);
}