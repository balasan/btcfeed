/**
 * Module dependencies.
 */

var express = require('express'),
	routes = require('./routes'),
	user = require('./routes/user'),
	http = require('http'),
	path = require('path'),
	// socket = require('./routes/socket'),
	gox = require('goxstream'),
	mongoose = require('mongoose');


var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);


app.configure(function() {
	app.set('port', process.env.PORT || 3000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function() {
	app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/users', user.list);

server.listen(app.get('port'), function() {
	console.log("Express server listening on port " + app.get('port'));
});


mongoose.connect('mongodb://' + process.env.MONGODB_USERNAME + ':' + process.env.MONGODB_PASSWORD + '@ds027729.mongolab.com:27729/bitcoin')


var Schema = mongoose.Schema

var bitcoinSchema = new Schema({
	// date: {
	//  default: new Date()
	// },
	// trade: {},
	// ticker: {},
}, {
	capped: {
		max: 2000
	},
	strict: false

})

var bitcoinModel = mongoose.model('bitcoinModel', bitcoinSchema);

var btc = gox.createStream({
	trade: false,
	ticker: true
})

btc.on('data', function(data) {

	console.log(JSON.parse(data))
	delete data._id

	var ticker = new bitcoinModel(JSON.parse(data))

	ticker.save(function(err, result) {
		if (err) return console.log(err);
		else console.log(result);
		// saved!
	})

})