/**
 * Module dependencies.
 */

var express = require('express'),
	routes = require('./routes'),
	http = require('http'),
	path = require('path'),
	gox = require('goxstream'),
	mongoose = require('mongoose');


var app = express();
var server = http.createServer(app);
// var io = require('socket.io').listen(server, {
// 	log: false
// });


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

app.get('/', routes);

server.listen(app.get('port'), function() {
	console.log("Express server listening on port " + app.get('port'));
});


mongoose.connect('mongodb://' + process.env.MONGODB_USERNAME + ':' + process.env.MONGODB_PASSWORD + '@ds027729.mongolab.com:27729/bitcoin')


var Schema = mongoose.Schema

var bitcoinSchema = new Schema({
	data: Schema.Types.Mixed
}, {
	capped: {
		size: 268435456
	},
	strict: false,
	toJSON: true

})

var bitcoinModel = mongoose.model('bitcoinModel', bitcoinSchema);

var btc = gox.createStream({
	trade: false,
	ticker: true
})

btc.on('data', function(data) {

	var ticker = new bitcoinModel({
		data: JSON.parse(data)
	})

	ticker.save(function(err, result) {
		if (err) return console.log(err);
	})

})


app.get('/data/:limit', function(req, res) {
	var limit = 1000;
	if (req.params.limit)
		limit = req.params.limit
	bitcoinModel.find().sort({
		'data.ticker.now': -1
	}).limit(limit).exec(function(err, tickers) {
		if (err) {
			console.log(err)
			res.json({})
		} else {
			console.log(tickers)
			res.json(tickers)
		}
	})
});


var minutes = 30,
	the_interval = minutes * 60 * 1000;

setInterval(function() {
	var options = {
		host: 'myapp.herokuapp.com'
	};
	http.get(options, function(http_res) {
		console.log("Sent http request to myapp.herokuapp.com to stay awake.");
	});
}, the_interval);

// test
// bitcoinModel.find().sort({
// 	'data.ticker.now': -1
// }).limit(2).exec(function(err, posts) {
// 	if (err)
// 		console.log(err)
// 	else {

// 		posts.forEach(function(post) {
// 			console.log(post.data.ticker.now)
// 			console.log(new Date(parseInt(post.data.ticker.now) / 1000))
// 		})
// 	}
// })