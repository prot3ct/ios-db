'use strict';

// MongoDB config
const mongojs = require('mongojs');
const connectionString = 'mongodb://Admin1:secret@ds135800.mlab.com:35800/ios-db';
const collections = ['users', 'events'];

const db = mongojs(connectionString, collections);

var ObjectId = require('mongodb').ObjectId; 

const express = require('express')
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const apiRouter = new express.Router();

apiRouter
	.post('/auth/register', function (req, res, next) {
		let user = req.body;
		if (!user) {
			return res.status(404).json({ "error": "Please Enter username or password" });
		}
		else {
			db['users'].findOne({ username: req.body.username }, function(err, userInDb) {
				if (userInDb) {
					return res.status(404).json({"error": "Please choose another username. This username is already in use!"});
				}

				user.friends = ["no friends"];
				db['users'].save(user, function (err, user) {
					if (err) {
						return res.status(404).json({"error": "DB error"});
					}
					return res.json({
						username: user.username
					});
				})
			})
		}
	})
	.post('/auth/login', function(req, res, next)  {
		if (!req.body) {
			return res.status(404).json({ "error": "You must send the username and the password" });
		}
		db['users'].findOne({ username: req.body.username }, function(err, user) {
			if (!user) {
				return res.status(404).json({ "error": "The username or password doesn't match" });
			}
			if (!(user.passHash === req.body.passHash)) {
				return res.status(404).json({ "error": "The username or password doesn't match" });
			}
			
			res.json({
				username: user.username
			});
		});
	})
	.get('/users', function (req, res, next) {
		db['users'].find(function (err, users) {
			if (err) {
				return res.json({ "error": "DB Error"});
			}
			return res.json(users);
		})
	})
	.post('/users/update', function(req, res, next) {
		let user = req.body;
		db['users'].update({ username: user.userToChange }, user, { upsert: true }, function(err, user) {
			if (!user) {
				return res.status(401).json({"error": "DB: User not found"});
			}

			return res.status(200).json({
				username: user.username
			});
		});
	})
	.get('/users/:username', function(req, res, next) {
		let username = req.params.username;
		username = JSON.parse(username).username;

		db['users'].findOne({ username: username }, function(err, user) {
			if (!user) {
				return res.status(401).json({"error": "DB: User not found"});
			}
			return res.status(200).json(user);
		});
	})
	.post('/events', function(req, res, next) {
		let event = req.body;


		db['events'].findOne({ title: event.title, creator: event.creator }, function(err, eventInDb) {
			if(err) {
				return res.status(402).json({"error": "DB error"});
			}
			
			if (eventInDb) {
				return res.status(404).json({"error": "You already have that event"});
			}

			db['events'].save(event, function (err, event) {
				if (err) {
					return res.status(404).json({"error": "DB error"});
				}
				return res.json(event);
			});
		});
	})
	.get('/events/:username', function(req, res, next) {
		let username = req.params.username;
		
		db['events'].find({ creator: username},function (err, events) {
			if (err) {
				return res.status(404).json({ "error": "DB Error"});
			}
			return res.json({"result": events});
		});
	})
	.post('/:username/friends', function(req, res, next) {
		let currentUsername = req.params.username;
		let friendUsername = req.body.username;


		let error = false;
		db['users'].findOne({ username: friendUsername }, function(err, friendInDb) {
			if (err) {
				error = true;
				return res.status(404).json({ "error": "DB Error"});
			}

			if (!friendInDb) {
				error = true;
				return res.status(404).json({ "error": "User with that username not found" });
			}
		});

		db['users'].findOne({ username: currentUsername }, function(err, userInDb) {
			if (err) {
				return res.status(404).json({ "error": "DB Error"});
			}

			if(userInDb.friends.indexOf(friendUsername) === -1) {
				userInDb.friends.push(friendUsername);
			}
			else {
				error = true;
				return res.status(404).json({ "error": "You have already added that friend." });
			}
			if (userInDb.friends[0] === "no friends") {
				userInDb.friends.shift();
			}

			db['users'].update({ username: currentUsername }, userInDb, { upsert: true }, function(err, updatedUser) {
				if (err) {
					error = true;
					return res.status(404).json({ "error": "DB error" });
				}

				if (!error) {
					return res.json({ updatedUser });
				}

			});
		});
	})
	.get('/:username/friends', function(req, res, next) {
		let username = req.params.username;
		
		db['users'].find({ username: username}, function (err, events) {
			if (err) {
				return res.status(403).json({ "error": "DB Error"});
			}
			return res.json({"result": events});
		});
	})
app.use('/api', apiRouter);

const port = process.env.PORT || 3000;
app.listen(port);
console.log(`Server running on port:${port}`);