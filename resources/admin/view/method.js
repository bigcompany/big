var layout = require('./layout');

module['exports'] = function (options, callback) {

  var methods = options.methods,
      $ = this.$;

  $('h1').html(options.resource.name + ' ' + options.name);
  $('.description').html(options.method.schema.description);
  $('.methods').html(layout.controls.list.present({ items: methods, root: '/admin/resources/foo/' }));

  return $.html();

}