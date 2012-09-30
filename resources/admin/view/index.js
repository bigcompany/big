var layout = require('./layout');

module['exports'] = function (options, callback) {

  var resources = options.resources,
      $ = this.$;

//  $('.resources').html(layout.controls.list.present({ items: resources, root: '/admin/resources/' }));

  return $.html();

}