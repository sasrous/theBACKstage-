const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const User = require('../models/user');
const Event = require('../models/event');
const { isLoggedIn } = require('../helpers/is-logged');

router.get('/me', (req, res, next) => {
	// console.log('me', req.session.currentUser);
	if (req.session.currentUser) {
		res.json(req.session.currentUser);
	} else {
		res.status(404).json({
			error: 'not-found'
		});
	}
});

router.post('/login', (req, res, next) => {
	if (req.session.currentUser) {
		return res.status(401).json({
			error: 'unauthorized'
		});
	}

	const { username, password } = req.body;

	if (!username || !password) {
		return res.status(422).json({
			error: 'validation'
		});
	}

	User.findOne({
		username
	})
		.then((user) => {
			if (!user) {
				return res.status(404).json({
					error: 'not-found'
				});
			}
			if (bcrypt.compareSync(password, user.password)) {
				req.session.currentUser = user;
				return res.json(user);
			}
			return res.status(404).json({
				error: 'not-found'
			});
		})
		.catch(next);
});

router.post('/signup', (req, res, next) => {
	const { username, password } = req.body;

	if (!username || !password) {
		return res.status(422).res.json({
			error: 'empty'
		});
	}

	User.findOne(
		{
			username
		},
		'username'
	)
		.then((userExists) => {
			if (userExists) {
				return res.status(422).json({
					error: 'username-not-unique'
				});
			}

			const salt = bcrypt.genSaltSync(10);
			const hashPass = bcrypt.hashSync(password, salt);

			const newUser = User({
				username,
				password: hashPass,
				about: 'empty',
				age: 'empty',
				name: 'empty',
				eventsJoined: [],
				profilePicture:
					'http://profilepicturesdp.com/wp-content/uploads/2018/06/blank-user-profile-picture-1.gif'
			});

			return newUser.save().then(() => {
				req.session.currentUser = newUser;
				res.json(newUser);
			});
		})
		.catch(next);
});

router.post('/logout', (req, res) => {
	req.session.currentUser = null;
	return res.status(204).send();
});

router.get('/private', isLoggedIn(), (req, res, next) => {
	res.status(200).json({
		message: 'This is a private message'
	});
});

router.put('/edit', isLoggedIn(), (req, res, next) => {
	var newUserData = req.body;
	const id = req.session.currentUser._id;
	var dataToUpdate = {
		_id: id,
		username: req.session.currentUser.username,
		password: req.session.currentUser.password,
		about: newUserData.about,
		age: newUserData.age,
		name: newUserData.name,
		eventsJoined: req.session.currentUser.eventsJoined,
		profilePicture: newUserData.profilePicture
	};

	req.session.currentUser = dataToUpdate;

	User.findByIdAndUpdate(id, dataToUpdate, function(err) {
		if (err) {
			res.json(err);
		} else {
			res.json({ message: 'updated' });
		}
	});
});
router.put('/join', isLoggedIn(), (req, res, next) => {
	var newEventId = req.body.id;
	const id = req.session.currentUser._id;
	let eventArray = [];

	User.findById(id)
		.then((data) => {
			eventArray = data.eventsJoined;
		})
		.then(() => {
			eventArray.push(newEventId);
			const dataToUpdate = {
				_id: id,
				username: req.session.currentUser.username,
				password: req.session.currentUser.password,
				about: req.session.currentUser.about,
				age: req.session.currentUser.age,
				name: req.session.currentUser.name,
				eventsJoined: eventArray,
				profilePicture: req.session.currentUser.profilePicture
			};
			req.session.currentUser = dataToUpdate;
			User.findByIdAndUpdate(id, dataToUpdate, function(err) {
				if (err) {
					res.json(err);
				} else {
					res.json({ message: 'updated' });
				}
			});
		});
});

router.put('/check', isLoggedIn(), (req, res, next) => {
	var newEventId = req.body.id;

	const id = req.session.currentUser._id;

	User.findById(id).then((data) => {
		for (i = 0; i < data.eventsJoined.length; i++) {
			if (data.eventsJoined[i] === newEventId) {
				res.status(200).json(data.eventsJoined[i]);
			} else if (i === data.eventsJoined.length - 1) {
				res.status(500).json({ error: 'error' });
			}
		}
	});
});
router.get('/:id', function(req, res, next) {
	var id = req.params.id;
	User.findById(id, function(err, event) {
		if (err) {
			res.status(500).json(err);
		} else {
			res.status(200).json(event);
		}
	});
});

router.put('/delete', isLoggedIn(), (req, res, next) => {
	const id = req.session.currentUser._id;
	var EventId = req.body.id;
	const arr = req.session.currentUser.eventsJoined;
	var index = arr.indexOf(EventId);

	if (index > -1) {
		arr.splice(index, 1);
	}
	var dataToUpdate = {
		_id: id,
		username: req.session.currentUser.username,
		password: req.session.currentUser.password,
		about: req.session.currentUser.about,
		age: req.session.currentUser.age,
		name: req.session.currentUser.name,
		eventsJoined: arr,
		profilePicture: req.session.currentUser.profilePicture
	};

	req.session.currentUser = dataToUpdate;
	User.findByIdAndUpdate(id, dataToUpdate, function(err) {
		if (err) {
			res.json(err);
		} else {
			res.json({ message: 'updated' });
		}
	});
});
module.exports = router;
