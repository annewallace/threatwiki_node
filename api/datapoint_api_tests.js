//To execute the tests, go in the console and type: node datapoint_api_tests.js 
var vows = require('vows')
, assert = require('assert')
, tobi = require('tobi');

var serverUrl = 'localhost';
var serverPort = 3000;
var defaultHeaders = { 'Content-Type': 'application/json' };
var currentTime = new Date();
var time2000 = new Date("January 1, 2000 00:00:01");


var month = currentTime.getMonth();
if(month <= 9)
    month = '0'+(month+1);

var day= currentTime.getDate();
if(day <= 9)
    day = '0'+day;

var api = {
    get: function (path) {
        return function () {
            var browser = tobi.createBrowser(serverPort, serverUrl);
            browser.get(path, this.callback.bind(this, null));
        };
    },
    post: function (path, data) {
        return function () {
            var browser = tobi.createBrowser(serverPort, serverUrl);
            browser.post(path, { body: JSON.stringify(data), headers: defaultHeaders }, this.callback.bind(this, null));
        };
    },
    //this is an empty PUT, without any data, since we are not logged in anyway
    put: function (path, data) {
        return function () {
            var browser = tobi.createBrowser(serverPort, serverUrl);
            browser.put(path, this.callback.bind(this, null));
        };
    }
};

function assertStatus(code) {
    return function (e, res) {
        console.log(res.statusCode);
        assert.equal (res.statusCode, code);
    };
}
vows.describe('Test Datapoint API').addBatch({
    'GET /api/datapoint': {
        topic: function () {
            var browser = tobi.createBrowser(serverPort, serverUrl);
            browser.get('/api/datapoint', this.callback.bind(this, null));
        },
            //first we test that we get results from getting all datapoints
            'should respond with a 200 OK': assertStatus(200),
            'should return a list of datapoints if the DB contains some': function (res) {
            assert.isArray (res.body);
            },
            //We take the first datapoint that we receive when we get all datapoints, get the _id of it
            //call a nested test to /api/datapoint/:id and make sure they both are the same
            'Retrieve /api/datapoint/:id from the first datapoint retrieved in /api/datapoint':{
               topic: function (e, res) {
                var browser = tobi.createBrowser(serverPort, serverUrl);
                browser.get('/api/datapoint/'+res[0]._id, this.callback.bind(this, null,res[0]._id));
                },
                'Both _id are equal': function (e,prevId,res){
                    assert.equal(res.body._id,prevId);
                }
            }
    },
    'GET /api/datapoint/delete/ random id number that doesnt exist': {
        topic: api.get('/api/datapoint/delete/123'),
        'should respond with a 200 OK': assertStatus(200)
    },
    'GET /api/datapoint/date/after/ from Jan 1st 2000': {
        topic: api.get('/api/datapoint/date/after/'+time2000.getTime().toString()),
        'should respond with a 200 OK': assertStatus(200),
        'should return a list of datapoints if the DB contains some': function (res) {
            assert.isArray (res.body);
        }
    },
     'GET /api/datapoint/date/before/ todays date': {
        topic: api.get('/api/datapoint/date/before/'+currentTime.getTime().toString()),
        'should respond with a 200 OK': assertStatus(200),
        'should return a list of datapoints if the DB contains some': function (res) {
            assert.isArray (res.body);
        }
    },
    'GET /api/datapoint/date/range/ year 2000 to today': {
        topic: api.get('/api/datapoint/date/range/'+time2000.getTime().toString()+'/'+currentTime.getTime().toString()),
        'should respond with a 200 OK': assertStatus(200),
        'should return a list of datapoints if the DB contains some': function (res) {
            //console.log(res.body);
            assert.isArray (res.body);
        }
    },
    'POST empty data to /api/datapoint without being logged in': {
        topic: api.post('/api/datapoint'),
        'should respond with a 200 OK': assertStatus(200)
    },'PUT(update) empty data to /api/datapoint/:id': {
        topic: api.put('/api/datapoint/1224444'),
        'should respond with a 200 OK': assertStatus(200)
    }

}).run(); // Run it