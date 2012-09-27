var resource = require('resource'),
    creature = resource.define('creature');

creature.schema.description = "for creatures like dragons, unicorns, and ponies";

creature.property('type', { type: "string", enum: ['dragon', 'unicorn', 'pony'], default: "dragon"});
creature.property('life', { type: "number", default: 10 });


function poke(callback) {
  if (callback) {
    return callback(null, 'poked!');
  }
  return 'poked!';
}
function talk (text, callback) {
  var result = {
    text: text,
    status: 200
  }
  if (callback) {
    return callback(null, result);
  }
  return result;
};
function fire (options, callback) {
  var result = {
    status: "fired",
    direction: options.direction,
    power: options.power
  };
  if(callback) {
    return callback(null, result);
  }
  return result;
};

creature.method('poke', poke);

creature.method('fire', fire, { 
  "description": "fires a lazer at a certain power and direction",
  "properties": {
    "options": {
      "type": "object",
      "properties": {
        "power": {
          "type": "number",
          "default": 1,
          "required": true
        },
        "direction": {
          "type": "string",
          "enum": ["up", "down", "left", "right"],
          "required": true,
          "default": "up"
        }
      },
      "callback": {
        "type": "function",
        "required": false
      }
    }
}});

creature.method('talk', talk, {
  "description": "echos back a string",
  "properties": {
    "text": {
      "type": "string",
      "default": "hello!",
      "required": true
    }
  }
});

exports.creature = creature;