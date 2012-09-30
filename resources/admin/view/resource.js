var layout = require('./layout');

module['exports'] = function (options, callback) {

  var $ = this.$;

  $('.methods').html(layout.controls.list.present({ items: options.methods }));

  return $.html();

}