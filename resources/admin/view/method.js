var layout = require('./layout');

module['exports'] = function (options, callback) {

  var methods = options.methods,
      $ = this.$;
  $('.methods').html(layout.controls.list.present({ items: methods, root: '/admin/resources/foo/' }));

  return $.html();

}