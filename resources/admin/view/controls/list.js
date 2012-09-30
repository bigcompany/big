module['exports'] = function (options, callback) {

  var items = options.items,
      $ = this.$;

  $('.items').children().remove();

  Object.keys(items).forEach(function(item){
    $('.items').append('<li><a href="' + options.root + item +'">' + item + '</a></li>');
  });

  return $.html();

}