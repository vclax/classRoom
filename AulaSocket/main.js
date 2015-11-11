WebSocketServer = require('websocket').server;
http = require('http');
express = require('express');
ROUTER = require('./router');

var app = express();
var server = app.listen(3000, function () {});


wsServer = new WebSocketServer({
    httpServer: server
});

var rooms = [];

wsServer.on('request', function (request) {

	this.router = new ROUTER (request.accept(null, request.origin), this);

	var router = this.router;

	this.router.on ('/register', function (data) {

		var room_token = data.room_token;
		var auth_token = data.auth_token;

		if (!rooms [room_token]) {
			rooms [room_token] = new ROOM ();
		}

		if (auth_token) 
			router.on ('/change', function (data) {
				console.log (data);

				rooms [room_token].change (data);
			});
		else
			rooms [room_token].add_change (function (data) {
				router.send ({
					route: '/change',
					data: data
				});
			});

	});

});

var ROOM = function () {
  	var events = [];

	this.add_change = function (fn) {
		events.push (fn);
	}

	this.change = function (data) {
		for (var i = events.length - 1; i >= 0; i--) {
			events[i] (data);
		};
	}

}