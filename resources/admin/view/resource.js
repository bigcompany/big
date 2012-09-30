var layout = require('./layout');

module['exports'] = function (options, callback) {

  var $ = this.$;

  $('.methods').html(layout.controls.list.present({ items: options.methods, root: '/admin/resources/' + options.resource.name + '/' }));

  return $.html();

}