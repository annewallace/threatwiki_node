var express = require("express");
var util = require("util");
var time = require('time')(Date);

function generateDevUser(UserModel, callback) {
  user = new UserModel({
    name: "developer"+Date.now(),
    email: "dev@outerspace.com"+Date.now(),
    created : Date.now(),
    modified: Date.now()
  });
  user.save(function (err) {
    if (!err) {
      console.log("created");
      callback(user);
      return user;
    } else {
      console.log("Could not Save: " + err);
      return res.send(500);
    }
  });
}

// authenticate user based on the incoming request
function authenticate(req, res, UserModel, callback) {
  if (req.session.auth && req.session.auth.loggedIn) {
    UserModel.findOne({'email':req.session.auth.google.user.email}).exec(function (err, user) {
      if(!err && user){
        callback(user);
        return user;
      } else {
        console.log(err);
        return res.send(null);
      }
    });
    return true;
  } else {
    console.log("This action is not permitted if you are not logged in");
    return res.send(401);
  }
}

function load_tagApi(app, TagModel,DataPointModel,UserModel) {

  // retrieve all
  app.get('/api/tag', function (req, res){
    return TagModel.find({archive: {$ne: true}}).populate('createdBy','name').populate('modifiedBy','name').sort('title').exec(function (err, tags) {
      if (!err && tags) {
        return res.jsonp(tags);
      } else {
        console.log(err);
        return res.send(null);
      }
    });
  });

  // retrieve by list of id format /api/tag/idnumberone,idnumbertwo,idnumberthree
  app.get('/api/tag/:tagsid', function (req, res) {
   var tagsid=req.params.tagsid.split(',');
    return TagModel.find().where('_id').in(tagsid).populate('createdBy','name').populate('modifiedBy','name').exec(function (err, tags) {
      if (!err && tags) {
        return res.jsonp(tags);
      } else {
        console.log(err);
        return res.send(null);
      }
    });
  });

  // retrieve all tags by by soc name
  app.get('/api/tag/soc/:soc', function (req, res) {
    return TagModel.find({ soc: { $regex : new RegExp(req.params.soc, "i")},archive: {$ne: true}}).populate('createdBy','name').populate('modifiedBy','name').sort('title').exec(function (err, tag) {
      if (!err && tag) {
        return res.jsonp(tag);
      } else {
        console.log(err);
        return res.send(null);
      }
    });
  });

  // retrieve all tags that have this title
  app.get('/api/tag/title/:title', function (req, res) {
    return TagModel.find({ title: { $regex : new RegExp(req.params.title, "i")},archive: {$ne: true}}).populate('createdBy','name').populate('modifiedBy','name').exec( function (err, tag) {
      if (!err && tag) {
        return res.jsonp(tag);
      } else {
        console.log(err);
        return res.send(null);
      }
    });
  });

  // retrieve all tags inside a datapoint
  app.get('/api/tag/datapoint/:datapointid', function (req, res) {
    console.log('TAG_API:DatapointId:Search by ' + req.params.datapointid);
    var datapoint = DataPointModel.findById(req.params.datapointid, function (err, datapoint) {
      if (!err && datapoint) {
         console.log('TAG_API:Id:Search by ' + datapoint.tags);
          return TagModel.find({ _id: {$in: datapoint.tags }}).populate('createdBy','name').populate('modifiedBy','name').sort('title').exec(function (err, tag) {
            if (!err && tag) {
              console.log("Tag found: %o", tag);
              return res.jsonp(tag);
            } else {
              console.log(err);
              return res.send(null);
            }
          });
        } else {
            console.log(err);
            return res.send(null);
        }
       });
  });

  // retrieve by date, date format is milliseconds since 1970/01/01
  app.get('/api/tag/date/:date', function (req, res) {
    var d_small = new Date(parseInt(req.params.date,10));
    var d_big = d_small;
    d_small.setHours(0,0,0,0);
    d_big.setHours(23,59,59,59);
    return TagModel.find({created: {$gte : d_small, $lt : d_big},archive: {$ne: true}}).populate('createdBy','name').populate('modifiedBy','name').sort('title').exec(function (err, tag) {
      if (!err && tag) {
        return res.jsonp(tag);
      } else {
        console.log(err);
        return res.send(null);
      }
    });
  });

  // retrieve by date after, date format is milliseconds since 1970/01/01
  app.get('/api/tag/date/after/:date', function (req, res) {
    var d_small = new Date(parseInt(req.params.date,10));
    d_small.setHours(0,0,0,0);
    return TagModel.find({created: {$gte : d_small},archive: {$ne: true}}).populate('createdBy','name').populate('modifiedBy','name').sort('title').exec(function (err, tag) {
      if (!err && tag) {
        return res.jsonp(tag);
      } else {
        console.log(err);
        return res.send(null);
      }
    });
  });

  // retrieve by date before, date format is milliseconds since 1970/01/01
  app.get('/api/tag/date/before/:date', function (req, res) {
    var d_big = new Date(parseInt(req.params.date,10));
    d_big.setHours(23,59,59,59);
    return TagModel.find({created: {$lt : d_big},archive: {$ne: true}}).populate('createdBy','name').populate('modifiedBy','name').sort('title').exec(function (err, tag) {
      if (!err && tag) {
        return res.jsonp(tag);
      } else {
        console.log(err);
        return res.send(null);
      }
    });
  });

  // retrieve by date range, date format is milliseconds since 1970/01/01
  app.get('/api/tag/date/range/:date_start/:date_end', function (req, res) {
    var d_start = new Date(parseInt(req.params.date_start,10));
    var d_end = new Date(parseInt(req.params.date_end,10));
    d_start.setHours(0,0,0,0);
    d_end.setHours(23,59,59,59);
    return TagModel.find({created: {$gte : d_start, $lt : d_end},archive: {$ne: true}}).populate('createdBy','name').populate('modifiedBy','name').sort('title').exec(function (err, tag) {
      if (!err && tag) {
        return res.jsonp(tag);
      } else {
        console.log(err);
        return res.send(null);
      }
    });
  });

  // retrieve by user email
  app.get('/api/tag/user/:email', function (req, res) {
    // first retrieve user based on user_name
    var user = UserModel.find({ email: { $regex : new RegExp(req.params.email, "i")}}, function (err, user) {
      if (!err && user) {
        // search tag for the user_id that we just found
        return TagModel.find({createdBy: user[0]._id,archive: {$ne: true}}).populate('createdBy','name').populate('modifiedBy','name').sort('title').exec(function (err, tag) {
          if (!err && tag) {
            return res.jsonp(tag);
          } else {
            console.log(err);
            return res.send(null);
          }
        });
      } else {
        console.log(err);
        return res.send(null);
      }
    });
  });

  // create
  app.post('/api/tag', function (req, res) {
    var tag;
    console.log("POST: ");
    console.log(req.body);

    var date_now = new Date();
    date_now.setTimezone('UTC');

    function save_tag (req, date_now, user) {
      tag = new TagModel({
        title: req.body.title,
        description: req.body.description,
        soc: req.body.soc,
        created: date_now,
        modified: date_now,
        createdBy: user._id,
        modifiedBy: user._id
      });

      tag.save(function (err) {
        if (!err) {
          console.log("tag created");
          return res.jsonp(tag);
        } else {
          console.log(err);
          return res.send(500);
        }
      });
    }
    //we make sure there is not another tag with same title in that specific SOC before saving
    TagModel.count({ soc: req.body.soc, title: { $regex : new RegExp(req.body.title, "i")}},function (err, count) {
      if (!err && count>0) {
        console.log('Cant have more than 1 tag with same name in the same SOC');
        return res.send(400);
      } else if (!err) {
        if((app.settings.env != 'production')) {
          generateDevUser(UserModel, function(user) {
            save_tag(req, date_now, user);
          });
        } else {
          authenticate(req, res, UserModel, function(user) {
            save_tag(req, date_now, user);
          });
        }
      } else {
        console.log(err);
        return res.send(null);
      }
    });
  });

  // update
  app.put('/api/tag/:id', function (req, res) {
    var date_now = new Date();
    date_now.setTimezone('UTC');

    function update_tag(req, date_now, user) {
      TagModel.findById(req.params.id, function (err, tag) {
        if (!err && tag){
          tag.title = req.body.title;
          tag.description = req.body.description;
          tag.soc = req.body.soc;
          tag.modified = date_now;
          tag.modifiedBy = user._id;

          return tag.save(function (err) {
            if (!err) {
              console.log("updated");
            } else {
              console.log(err);
              return res.send(500);
            }
            return res.jsonp(tag);
          });
        } else {
          console.log(err);
          return res.send(null);
        }
      });
    }

    if((app.settings.env != 'production')) {
      generateDevUser(UserModel, function(user) {
        update_tag(req, date_now, user);
      });
    } else {
      authenticate(req, res, UserModel, function(user) {
        update_tag(req, date_now, user);
      });
    }
  });

  //archive tag by ID
  app.put('/api/tag/:id/archive', function (req, res) {
    console.log("Archive: "+req.params.id+' '+req.body.archive);

    function archiveTag(req){
      return TagModel.update({ _id: req.params.id }, { archive: req.body.archive }, function (err) {
        if (!err){
          return res.send(200);
        } else {
          console.log('Cant archive the datapoint'+req.params.id);
          return res.send(500);
        }
      });
    }

    if((app.settings.env != 'production')) {
      generateDevUser(UserModel, function(user) {
        archiveTag(req);
      });
    } else {
      authenticate(req, res, UserModel, function(user) {
        archiveTag(req);
      });
    }
});
}

exports.load_tagApi = load_tagApi;
