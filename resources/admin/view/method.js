var layout = require('./layout');

module['exports'] = function (options, callback) {
  console.log('aa',options)

  var methods = options.methods,
      $ = this.$;
  $('.methods').html(layout.controls.list.present({ items: methods }));

  return $.html();

}