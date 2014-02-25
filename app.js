/**
 * Module dependencies.
 */

var express = require('express'),
	routes = require('./routes'),
	http = require('http'),
	https = require('https'),

	path = require('path'),
	// gox = require('goxstream'),
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

app.get('/', routes.index);

server.listen(app.get('port'), function() {
	console.log("Express server listening on port " + app.get('port'));
});


mongoose.connect('mongodb://' + process.env.MONGODB_USERNAME + ':' + process.env.MONGODB_PASSWORD + '@ds027729.mongolab.com:27729/bitcoin')


var Schema = mongoose.Schema

var secondSchema = new Schema({
	timestamp: {
		type: [Date],
		index: true
	},
	last: Number,
	bid: Number,
	ask: Number
}, {
	capped: {
		size: 52428800
	},
})

var minuteSchema = new Schema({
	timestamp: {
		type: [Date],
		index: true
	},
	last: Number,
	bid: Number,
	ask: Number
}, {
	capped: {
		size: 52428800
	},
	// strict: false,
})

var hourSchema = new Schema({
	timestamp: {
		type: [Date],
		index: true
	},
	last: Number,
	bid: Number,
	ask: Number
}, {
	capped: {
		size: 52428800
	},
	// strict: false,
})

var daySchema = new Schema({
	timestamp: {
		type: [Date],
		index: true
	},
	last: Number,
	bid: Number,
	ask: Number,
	high: Number,
	low: Number,
	volume: Number
}, {
	capped: {
		size: 52428800
	},
	// strict: false,
})

var secondModel = mongoose.model('secondModel', secondSchema);
var minuteModel = mongoose.model('minuteModel', minuteSchema);
var hourModel = mongoose.model('hourModel', hourSchema);
var dayModel = mongoose.model('dayModel', daySchema);

// var btc = gox.createStream({
// 	trade: false,
// 	ticker: true
// })

// btc.on('data', function(data) {

// 	var ticker = new bitcoinModel({
// 		data: JSON.parse(data)
// 	})

// 	ticker.save(function(err, result) {
// 		if (err) return console.log(err);
// 	})

// })


var getData, seconds, data_interval, counter;

seconds = 5;

data_interval = seconds * 1000;

counter = 0;

var filterData = function(data) {
	data.timestamp = new Date(parseInt(data.timestamp) * 1000);
	return data;
	// data.last = parseFloat(data.last);
}

var lastMinute = new Date(0);
var lastHour = new Date(0);
var lastDay = new Date(0);

getData = function() {
	var url;
	url = "https://www.bitstamp.net:443/api/ticker/";
	// var options = {
	// 	host: 'bitstamp.net',
	// 	// port: 80,
	// 	path: '/api/ticker/',
	// 	method: 'GET',
	// }
	return https.get(url, function(res) {
		var body;
		body = "";
		res.on("data", function(chunk) {
			body += chunk;
		});
		res.on("end", function() {
			var data;
			try {
				data = JSON.parse(body);
			} catch (error) {
				console.log(body)
				console.log(error)
				return;

			}
			data = filterData(data);
			// console.log("update sec")

			var sticker = new secondModel(data)
			sticker.save(function(err, result) {
				if (err) return console.log(err);
				// else console.log(result)
			})

			if (data.timestamp - lastMinute > 59 * 1000) {
				// console.log("update minutes")
				lastMinute = data.timestamp;
				var mticker = new minuteModel(data)
				mticker.save(function(err, result) {
					if (err) return console.log(err);
					// else console.log(result)
				})
			}


			if (data.timestamp - lastHour > 59 * 59 * 1000) {
				// console.log("update hours")
				lastHour = data.timestamp;
				var hticker = new hourModel(data)
				hticker.save(function(err, result) {
					if (err) return console.log(err);
					// else console.log(result)
				})
			}

			if (data.timestamp - lastDay > 23 * 59 * 59 * 1000) {
				// console.log("update days")
				lastDay = data.timestamp;
				var dticker = new dayModel(data)
				dticker.save(function(err, result) {
					if (err) return console.log(err);
					// else console.log(result)
				})
			}

		});
	}).on("error", function(e) {
		console.log("Got error: ", e);
	});
};

getData()

setInterval(getData, data_interval)




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


//HEROKU KEEP AWAKE
var minutes = 30,
	the_interval = minutes * 60 * 1000;

setInterval(function() {
	var options = {
		host: 'btcfeed.herokuapp.com'
	};
	http.get(options, function(http_res) {
		console.log("Sent http request to btcfeed.herokuapp.com to stay awake.");
	});
}, the_interval);



// test

// secondModel.find().sort({
// 	'timestamp': -1
// }).limit(2).exec(function(err, data) {
// 	if (err)
// 		console.log(err)
// 	else {

// 		data.forEach(function(d) {
// 			// console.log(d.timestamp)
// 			console.log(d)
// 			// console.log(new Date(parseInt(post.data.ticker.now) / 1000))
// 		})
// 	}
// })

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