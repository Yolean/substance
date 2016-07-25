'use strict';

var Superscript = require('./Superscript');
var AnnotationCommand = require('../../ui/AnnotationCommand');
var AnnotationComponent = require('../../ui/AnnotationComponent');
var AnnotationTool = require('../../ui/AnnotationTool');

module.exports = {
  name: 'superscript',
  configure: function(config) {
    config.addNode(Superscript);
    config.addComponent('superscript', AnnotationComponent);
    config.addCommand('superscript', AnnotationCommand, { nodeType: 'superscript' });
    config.addTool('superscript', AnnotationTool);
    config.addStyle(__dirname, '_superscript.scss');
    config.addIcon('superscript', { 'fontawesome': 'fa-superscript' });
    config.addLabel('superscript', {
      en: 'Superscript',
      de: 'Hochgestellt'
    });
  }
};
