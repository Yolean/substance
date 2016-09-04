'use strict';

var Tool = require('../../ui/Tool');
var util = require('util');

function ResizeImageTool() {
  ResizeImageTool.super.apply(this, arguments);
}

ResizeImageTool.Prototype = function() {

  var _super = ResizeImageTool.super.prototype;

  this.getClassNames = function() {
    return 'sc-resize-image-tool';
  };

  this.renderButton = function($$) {
    var button = _super.renderButton.apply(this, arguments);
    var input = $$('input').attr('type', 'range').ref('input')
      .on('change', this.onSizeChange);
    return [button, input];
  };

  this.onClick = function() {
    this.refs.input.click();
  };

  this.onSizeChange = function(e) {
    var percentage = e.currentTarget.valueAsNumber;
    console.log("Would set some image to size " + percentage + "%");
    this.performAction({
      percentage: percentage
    });
  };

};

Tool.extend(ResizeImageTool);

module.exports = ResizeImageTool;
