/**
*    Webarena - A web application for responsive graphical knowledge work
*
*    @author Felix Winkelnkemper, University of Paderborn, 2012
*
*/

/**
*	the UserManager holds connection information. For every connection, it saves
*	information about who is logged in, which room he is subscribed to
*	and the socket. Actual socket connections are handled by SocketServer
**/

"use strict";

var Modules=false;

var UserManager={};

UserManager.connections={};

/**
*	socketConnect
*
*	in case of a new connection, a new entry is created.
**/
UserManager.socketConnect=function(socket){
	this.connections[socket.id]=({'socket':socket,'user':false,'room':false});
}

/**
*	socketDisconnect
*
*	delete all connection data, when a socket disconnects.
*
**/
UserManager.socketDisconnect=function(socket){
	delete(this.connections[socket.id]);
}


/**
*	login
*
*	when a user tries to log in, his credentials are tested and added to the connection
**/
UserManager.login=function(socketOrUser,data){
	if(typeof socketOrUser.id=='string') var userID=socketOrUser.id; else var userID=socketOrUser; 
	
	var connection=UserManager.connections[userID];
	if (!connection) {
		Modules.Log.error("UserManager", "+login", "There is no connection for this user (user: '"+userID+"')");
		return;
	}
	
	var socket=connection.socket;
	var connector=Modules.Connector;
	var socketServer=Modules.SocketServer;
	
	
	var userObject=require('./User.js');
	connection.user=new userObject(this);
	connection.user.username=data.username;
	connection.user.password=data.password;
	
	connector.login(data.username,data.password,function(data){
		
		if (data) {
		
			connection.user.home=data.home;
			connection.user.hash='___'+require('crypto').createHash('md5').update(socket.id+connection.user).digest("hex");
		
			socketServer.sendToSocket(socket,'loggedIn',{
				username: connection.user,
				userhash: connection.user.hash
			});
			
		} else {
			socketServer.sendToSocket(socket,'loginFailed','Wrong username or password!');
		}
		
	}, connection);
	
}

UserManager.subscribe=function(socketOrUser,roomID){
	
	if(typeof socketOrUser.id=='string') var userID=socketOrUser.id; else var userID=socketOrUser;
	
	Modules.Log.debug("UserManager", "+subscribe", "Subscribe (roomID: '"+roomID+"', user: '"+userID+"')");
	
	var connection=UserManager.connections[userID];
	var ObjectManager=Modules.ObjectManager;
	
	if (!connection) {
		Modules.Log.error("UserManager", "+subscribe", "There is no connection for this user (user: '"+userID+"')");
		return;
	}
	var socket=connection.socket;
	var connector=Modules.Connector;
	var socketServer=Modules.SocketServer;
	var user=connection.user;
	
	connector.maySubscribe(roomID,connection, function(maySub) {

		if (maySub) {
			
			ObjectManager.getRoom(roomID,connection,function(room){
				console.log('roomID:'+roomID);
				console.log('room.id'+room.id);				
				socketServer.sendToSocket(socket,'subscribed',room.id);
				connection.room=room;
				ObjectManager.sendRoom(socket,room.id);
			})

		} else {
			socketServer.sendToSocket(socket,'error', 'User '+userID+' may not subscribe to '+roomID);
		}
		
	});
		
		

}

UserManager.init=function(theModules){
 	Modules=theModules;
	var Dispatcher=Modules.Dispatcher;
	Dispatcher.registerCall('login',UserManager.login);
    Dispatcher.registerCall('subscribe',UserManager.subscribe);
    Dispatcher.registerCall('unsubscribe',UserManager.unsubscribe);
}

UserManager.getConnectionsForRoom=function(roomID){
	var result={};
	for (var connectionID in this.connections){
		var connection=this.connections[connectionID];
		if (roomID===connection.room.id) result[connectionID]=connection;
	}
	return result;
}

UserManager.getConnectionBySocket=function(socket){
	for (var i in this.connections){
		var connection=this.connections[i];
		if (connection.socket==socket) return connection;
	}
	return false;
}

UserManager.getConnectionBySocketID=function(socketID){
	for (var i in this.connections){
		var connection=this.connections[i];
		if (connection.socket.id==socketID) return connection;
	}
	return false;
}

UserManager.getConnectionByUserHash=function(userHash){
	for (var i in this.connections){
		var connection=this.connections[i];
		if (connection.user.hash==userHash) return connection;
	}
	return false;
}

module.exports=UserManager;

function isInArray(haystack,needle){
	for(var i = 0; i < haystack.length; i++){
	   if(haystack[i] === needle) return true;
	}
	return false;
}