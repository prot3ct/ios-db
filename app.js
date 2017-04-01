'use strict';

// MongoDB config
const mongojs = require('mongojs');
const connectionString = 'mongodb://Admin1:secret@ds135800.mlab.com:35800/ios-db';
const collections = ['users'];

const db = mongojs(connectionString, collections);

var ObjectId = require('mongodb').ObjectId; 

const express = require('express')
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const apiRouter = new express.Router();

apiRouter
	.get('/users', function (req, res, next) {
		db['users'].find(function (err, users) {
			if (err) {
				return res.json({ "error": "DB Error"});
			}
			return res.status(200).json(users);
		})
	})
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
		if (!req.body.username || !req.body.password) {
			return res.status(400).json({ "error": "You must send the username and the password" });
		}
		db['users'].findOne({ username: req.body.username }, function(err, user) {
			if (!user) {
				return res.status(401).json({ "error": "The username or password doesn't match" });
			}
			if (!(user.password === req.body.password)) {
				return res.status(401).json({ "error": "The username or password doesn't match" });
			}
			
			res.status(200).json({
				username: user.username
			});
		});
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
    
app.use('/api', apiRouter);

const port = process.env.PORT || 3000;
app.listen(port);
console.log(`Server running on port:${port}`);