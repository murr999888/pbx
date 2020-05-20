var service = require('./service');

var db = {};
module.exports = db;

db.keepConnection = function(connection) {
	// держим соединение с сервером БД
	setInterval(function () {
    		connection.query('SELECT 1');
	}, 5000);
}

db.peers_check_exist = function(connection, num){
	var query_str = "INSERT INTO `peers` (num) VALUES ('" + num + "') ON DUPLICATE KEY UPDATE `last_update` = '" + service.convertTimestampToDateTime(Date.now()) + "'";
	connection.query(query_str);
}

db.peer_set_registered = function(connection, peer, registered, ip) {
	var query_str = "UPDATE `peers` SET `registered` = " + registered + ", `ip` = '" + ip + "' WHERE `num` = '" + peer + "'";
	connection.query(query_str);
}

db.peer_set_reachable = function(connection, peer, reachable, ip) {
	var query_str = "UPDATE `peers` SET `reachable` = " + reachable + ", `ip` = '" + ip + "' WHERE `num` = '" + peer + "'";
	connection.query(query_str);
}

db.peer_set_state = function(connection, peer, last_state) {
	var query_str = "UPDATE `peers` SET `last_state` = '" + last_state + "' WHERE `num` = '" + peer + "'";
	connection.query(query_str);
}

db.peer_resetall = function(connection) {
	var query_str = "UPDATE `peers` SET `registered` = 0, `reachable` = 0, `ip` = '', `last_state` = ''";
	connection.query(query_str);

	var query_str = "DELETE FROM `channels`";
	connection.query(query_str);

	var query_str = "DELETE FROM `bridges`";
	connection.query(query_str);

	var query_str = "DELETE FROM `dials`";
	connection.query(query_str);

	var query_str = "DELETE FROM `queues`";
	connection.query(query_str);
}

db.get_peers = function(connection, callback) {
	var query_str = "SELECT * FROM `peers` WHERE `is_registry` = 0";
	connection.query(query_str, function (error, results, fields){
		if (results) {
                	callback(results);
		}
	});
}

db.get_registries = function(connection, callback) {
	var query_str = "SELECT * FROM `peers` WHERE `is_registry` = 1";
	connection.query(query_str, function (error, results, fields){
		if (results) {
                	callback(results);
		}
	});
}

db.get_trunks = function(connection, callback) {
	var query_str = "SELECT `num` FROM `peers` WHERE `is_trunk` = 1";
	connection.query(query_str, function (error, results, fields){
		if (results) {
                	callback(results);
		}
	});
}

db.peer_set_dnd = function(connection, peer, dnd) {
	var query_str = "UPDATE `peers` SET `dnd` = " + dnd + " WHERE `num` = '" + peer + "'";
//console.log(query_str);
	connection.query(query_str);
}

db.channel_newchannel = function(connection, peer, evt) {
	var channel_type = '';
	if (evt.channel.indexOf('SIP') != -1) {
		channel_type = 'SIP';
	}

	if (evt.channel.indexOf('Local') != -1) {
		channel_type = 'Local';
	}

	var query_str = "INSERT INTO `channels` SET `channel_type` = '" + channel_type + "',`num` = '" + peer + "', `uniqueid` = '" + evt.uniqueid + "', `channel` = '" + evt.channel + "', `channelstate` = '" + evt.channelstate + "', `channelstatedesc` = '" + evt.channelstatedesc + "', `calleridnum` = '" + evt.calleridnum + "', `calleridname` = '" + evt.calleridname + "', `connectedlinenum` = '" + evt.connectedlinenum + "', `connectedlinename` = '" + evt.connectedlinename + "', `exten` = '" + evt.exten + "'";
	connection.query(query_str);
};

db.channel_rename = function(connection, peer, channel){
	var query_str = "UPDATE `channels` SET `num` = '" + peer + "', `channel` = '" + channel.newname + "' WHERE `uniqueid` = '" + channel.uniqueid + "'";
	connection.query(query_str);
}

db.channel_newstate = function(connection, channel) {
	var query_str = "UPDATE `channels` SET `channelstate` = " + channel.channelstate + ", `channelstatedesc` = '" + channel.channelstatedesc + "', `connectedlinenum` = '" + channel.connectedlinenum + "', `connectedlinename` = '" + channel.connectedlinename + "' WHERE `uniqueid` = '" + channel.uniqueid + "'";
	connection.query(query_str);
};

db.channel_event = function(connection, uniqueid, event) {
	var query_str = "UPDATE `channels` SET `event` = '" + event + "' WHERE `uniqueid` = '" + uniqueid + "'";
	connection.query(query_str);
}

db.channel_hangup = function(connection, channel) {
	var query_str = "DELETE FROM `channels` WHERE `uniqueid` = '" + channel.uniqueid + "'";
	connection.query(query_str);
};

db.channel_newcallerid = function(connection, channel) {
//Wed Feb 13 2019 11:04:13 GMT+0200 (EET) {"event":"NewCallerid","privilege":"call,all","channel":"SIP/3002-00002e7d","calleridnum":"380972238055","calleridname":"","uniqueid":"1550048651.16877","cid-callingpres":"0 (Presentation Allowed, Not Screened)"}
	var query_str = "UPDATE `channels` SET `calleridnum` = '" + channel.calleridnum + "', `calleridname` = '" + channel.calleridname + "' WHERE `uniqueid` = '" + channel.uniqueid + "'";
	connection.query(query_str);
};

db.dial_begin = function(connection, dial) {
	//Wed Feb 13 2019 11:04:13 GMT+0200 (EET) {"event":"Dial","privilege":"call,all","subevent":"Begin","channel":"SIP/3002-00002e7d","destination":"SIP/102-00002e7f","calleridnum":"380972238055","calleridname":"380972238055","connectedlinenum":"<unknown>","connectedlinename":"<unknown>","uniqueid":"1550048651.16877","destuniqueid":"1550048653.16879","dialstring":"102"}
	var query_str = "INSERT INTO `dials` SET `channel` = '" + dial.channel + "', `destination` = '" + dial.destination + "', `calleridnum` = '" + dial.calleridnum + "', `calleridname` = '" + dial.calleridname + "', `connectedlinenum` = '" + dial.connectedlinenum + "', `connectedlinename` = '" + dial.connectedlinename + "', `uniqueid` = '" + dial.uniqueid + "', `destuniqueid` = '" + dial.destuniqueid  + "', `dialstring` = '" + dial.dialstring + "', `dialstatus` = ''";
	connection.query(query_str);
}

db.dial_end = function(connection, dial) {
//Wed Feb 13 2019 11:04:27 GMT+0200 (EET) {"event":"Dial","privilege":"call,all","subevent":"End","channel":"SIP/3005-00002e7e","uniqueid":"1550048651.16878","dialstatus":"ANSWER"}
	var query_str = "DELETE FROM `dials` WHERE `uniqueid` = '" + dial.uniqueid + "'";
	connection.query(query_str);
}

db.bridge_begin = function(connection, bridge) {
//Sat Feb 23 2019 17:10:02 GMT+0200 (EET) {"event":"Bridge","privilege":"call,all","bridgestate":"Link","bridgetype":"core","channel1":"SIP/3001-00000dab","channel2":"Local/113@from-queue-00000296;1","uniqueid1":"1550934573.4819","uniqueid2":"1550934598.4827","callerid1":"380965668503","callerid2":"113"}
	var query_str = "INSERT INTO `bridges` SET `channel1` = '" + bridge.channel1 + "', `channel2` = '" + bridge.channel2 + "', `uniqueid1` = '" + bridge.uniqueid1 + "', `uniqueid2` = '" + bridge.uniqueid2 + "', `callerid1` = '" + bridge.callerid1 + "', `callerid2` = '" + bridge.callerid2 + "'";
	connection.query(query_str);
}

db.bridge_end = function(connection, bridge) {
	var query_str = "DELETE FROM `bridges` WHERE `uniqueid1` = '" + bridge.uniqueid1 + "' AND `uniqueid2` = '" + bridge.uniqueid2 + "'";
	connection.query(query_str);
}

db.queue_join = function(connection, queue) {
//Sat Feb 16 2019 12:21:48 GMT+0200 (EET) {"event":"Join","privilege":"call,all","channel":"SIP/3003-00003d65","calleridnum":"380988241351","calleridname":"Николаенко А.В. ФЛП","connectedlinenum":"unknown","connectedlinename":"unknown","queue":"1000","position":"1","count":"1","uniqueid":"1550312502.21801"}
	var query_str = "INSERT INTO `queues` SET `channel` = '" + queue.channel + "', `calleridnum` = '" + queue.calleridnum + "', `calleridname` = '" + queue.calleridname + "', `connectedlinenum` = '" + queue.connectedlinenum + "', `queue` = '" + queue.queue + "', `position` = '" + queue.position + "', `count` = '" + queue.count + "', `uniqueid` = '" + queue.uniqueid + "'";
	connection.query(query_str);
}

db.queue_leave = function(connection, queue) {
//Tue Feb 19 2019 17:42:14 GMT+0200 (EET) {"event":"Leave","privilege":"call,all","channel":"SIP/3002-000004b9","queue":"1000","count":"0","position":"1","uniqueid":"1550590909.1446"}
	var query_str = "DELETE FROM `queues` WHERE `queue` = '" + queue.queue + "' AND `uniqueid` = '" + queue.uniqueid + "'";
	connection.query(query_str);
}

db.queue_abandon = function(connection, evt) {
//Tue Feb 19 2019 17:42:14 GMT+0200 (EET) {"event":"Leave","privilege":"call,all","channel":"SIP/3002-000004b9","queue":"1000","count":"0","position":"1","uniqueid":"1550590909.1446"}
	var query_str = "INSERT INTO `queue_abandon` (`queue`,`uniqueid`,`position`,`originalposition`,`holdtime`, `calleridnum`, `calleridname`)"
	+ " SELECT '" + evt.queue +"', '" + evt.uniqueid + "', '" + evt.position + "', '" + evt.originalposition + "', '" + evt.holdtime + "', calleridnum, calleridname "
	+ " FROM `channels` WHERE `uniqueid` = '" + evt.uniqueid + "'";
	connection.query(query_str);
}