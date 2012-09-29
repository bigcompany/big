var resource = require('resource'),
    user = resource.define('user');

user.schema.description = "for managing users"

user.property('email', {
  "type": "string",
  "format": "email"
});

user.property('password', {
  "type": "string",
  "format": "password"
});

exports.user = user;