'use strict';

var DocumentNode = require('../../model/DocumentNode');

function Image() {
  Image.super.apply(this, arguments);
}

DocumentNode.extend(Image);

Image.define({
  type: "image",
  src: { type: "string", default: "http://" },
  width: { type: "string", default: "100%" },
  previewSrc: { type: "string", optional: true }
});

module.exports = Image;
