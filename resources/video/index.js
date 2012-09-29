var resource = require('resource'),
    video = resource.define('video');

video.schema.description = "for managing online digital videos";

video.property("title", {
  "type":"string",
  "default": "my title",
  "description": "the title of the video"
});

video.property("link", {
  "type":"string",
  "description": "the link to the video on a third party site",
  "format": "url"
});

video.property("description", {
  "type":"string",
  "description": "a brief description of the video"
});

video.method("play", function () {
}, {});
video.method("stop", function () {
}, {});


exports.video = video;