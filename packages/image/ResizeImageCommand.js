'use strict';
'use strict';

var Command = require('../../ui/Command');
var paste = require('../../model/transform/paste');

function ImageCommand() {
  ImageCommand.super.call(this, { name: 'resize-image' });
}

ImageCommand.Prototype = function() {

  this.getCommandState = function(props, context) {
    var documentSession = context.documentSession;
    var sel = props.selection || documentSession.getSelection();
    var surface = props.surface || context.surfaceManager.getFocusedSurface();
    var newState = {
      disabled: true,
      active: false
    };
    if (sel && !sel.isNull() && !sel.isCustomSelection() &&
        surface && surface.isContainerEditor()) {
      newState.disabled = false;
    }
    return newState;
  };

  /**
    Resize image.
  */
  this.execute = function(props, context) {
    var state = this.getCommandState(props, context);
    // Return if command is disabled
    if (state.disabled) return;

    var documentSession = context.documentSession;
    var sel = props.selection || documentSession.getSelection();
    var surface = props.surface || context.surfaceManager.getFocusedSurface();

    // images valid for container editors
    if (!surface.isContainerEditor()) return;

    var doc = surface.getDocument();

    var nodeId = sel.nodeId;
    documentSession.transaction(function(tx) {
      tx.set([nodeId, 'width'], props.percentage + "%");
    });
    //node.width = ;

    return {
      status: 'file-resized'
    };
  };

};

Command.extend(ImageCommand);

module.exports = ImageCommand;
