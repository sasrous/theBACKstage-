const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const User = require('../models/user');
const Event = require('../models/event')



router.post('/:id',  function(req, res, next) {
  var id = req.params.id
  var newEvent = new Event( {
    eventId: id,
    comments: [],
    usersJoined: [],
  } )

  newEvent.save( function(err) {
    if(err) {
      res.json(err)
    } else {
      res.json({
        message: "created",
        event: newEvent
      })
    }
  })
})


router.get('/:id', function(req, res, next) {
  var id = req.params.id
  Event.find({eventId: id }, function(err, event){
    if(err){
      res.status(500).json(err)
    } else {
      res.status(200).json(event)
    }
  })
})

router.put('/:id', function(req, res, next) {
  const data = req.body;
  const eventID = data.event;
  const {comment, timestamo} = data;
  const user = data.user

  Event.find({eventId: eventID }, function(err, event){
    
    }).then((event)=> {
      const commentsArr = event[0].comments;
      const usersJoined = event[0].usersJoined;
      commentsArr.push(data);
      var eventToUpdate = {
        eventId: eventID,
        comments: commentsArr,
        usersJoined: usersJoined,
        }
      Event.findOneAndUpdate({eventId: eventID }, eventToUpdate, function(err, event){
        if(err) {
          res.json(err)
        } else {
          res.json({message: "updated"})
        }
      })
    })

  })

 
  

module.exports = router;
