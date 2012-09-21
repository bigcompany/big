var j = require('jugglingdb');

var s = new j.Schema('redis', {});
var User = s.define('User', {email: String});

j.Validatable.haha = function () {
    console.log(this._validations);
};

User.validatesUniquenessOf('email'); 
User.validateAsync('email', function(err, done) { 
    done();
});

var u = new User({
    email: "rob@foo.com"
});

User.haha();

u.isValid(function (valid) {
    console.log('boooom');
    console.log(valid);
});

