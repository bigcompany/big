var big = require('../../big');

var twitter = big.use('twitter');

//
// Create an array of tweets
//
var tweets = [
  "foo bar lol",
  "foo bar do soemthing",
  "fool"
];

//
// Every 10 seconds, fire off a new tweet
//
big.logger.info('starting twitter bot...first tweet will fire in 10 seconds')
setInterval(function(){
  var message = tweets.shift();
  big.logger.info('pick and send tweet', message);
  twitter.connect({
    "consumer_key": "",
    "consumer_secret": "",
    "access_token_key": "",
    "access_token_secret": ""
  }, function(err, result){
    if (err) {
      throw err;
    }
    twitter.send({ message: message }, function(err, result){
      console.log(err, result);
      tweets.push(message);
    });
  })
}, 10000)

