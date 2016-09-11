'use strict';

var ImageNode = require('./Image');
var ImageComponent = require('./ImageComponent');
var ImageHTMLConverter = require('./ImageHTMLConverter');
var ImageXMLConverter = require('./ImageXMLConverter');
var InsertImageCommand = require('./InsertImageCommand');
var ResizeImageCommand = require('./ResizeImageCommand');
var InsertImageTool = require('./InsertImageTool');
var ResizeImageTool = require('./ResizeImageTool');
var DropImage = require('./DropImage');

module.exports = {
  name: 'image',
  configure: function(config) {
    config.addNode(ImageNode);
    config.addComponent('image', ImageComponent);
    config.addConverter('html', ImageHTMLConverter);
    config.addConverter('xml', ImageXMLConverter);
    config.addCommand('insert-image', InsertImageCommand);
    config.addCommand('resize-image', ResizeImageCommand);
    config.addTool('insert-image', InsertImageTool);
    config.addTool('resize-image', ResizeImageTool);
    config.addIcon('insert-image', { 'fontawesome': 'fa-image' });
    config.addStyle(__dirname, '_image.scss');
    config.addLabel('image', {
      en: 'Image',
      de: 'Bild'
    });
    config.addLabel('insert-image', {
      en: 'Insert image',
      de: 'Bild einfügen'
    });
    config.addDragAndDrop(DropImage);
  }
};
