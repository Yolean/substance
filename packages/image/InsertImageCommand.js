'use strict';

var Command = require('../../ui/Command');
var paste = require('../../model/transform/paste');

function ImageCommand() {
  ImageCommand.super.call(this, { name: 'insert-image' });
}

ImageCommand.Prototype = function() {

  this.getUrlPath = function() {
    var propPath = this.constructor.urlPropertyPath;
    return [this.props.node.id].concat(propPath);
  };

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
    Inserts (stub) images and triggers a fileupload.
    After upload has completed, the image URLs get updated.
  */
  this.execute = function(props, context) {
    var state = this.getCommandState(props, context);
    // Return if command is disabled
    if (state.disabled) return;

    var documentSession = context.documentSession;
    var sel = props.selection || documentSession.getSelection();
    var surface = props.surface || context.surfaceManager.getFocusedSurface();
    var fileClient = context.fileClient;
    var files = props.files;

    // can drop images only into container editors
    if (!surface.isContainerEditor()) return;

    // creating a small doc where we add the images
    // and then we use the paste transformation to get this snippet
    // into the real doc
    var doc = surface.getDocument();
    var snippet = doc.createSnippet();

    // as file upload takes longer we will insert stub images
    var path = sel.path;
    var items = files.map(function(file) {
      var type = "link";
      var node = undefined;
      if(/\.PDF/i.test(file.name)) {
        type = "link";
        var textlength = file.name.length;
        //node = snippet.create({ type: "link", title: file.name, path: path, startOffset: sel.startOffset, endOffset: (sel.startOffset+textlength) });
        //node = snippet.create({ type: "text" });
        sel.endOffset = sel.endOffset + textlength;
        documentSession.setSelection(sel);
        surface.transaction(function(tx, args) {
          args.text = file.name;
          surface.paste(tx, args);
          //snippet.show(node); // without this, no node.id.

          /*tx.before.selection = sel;
          paste(tx, {
            selection: sel,
            containerId: surface.getContainerId(),
            doc: snippet
          });*/
        });

        var props = { mode: "create" };
        var commandManager = surface._getContext().commandManager;
        var info = commandManager.executeCommand("link", props);

        var nodeId = info.anno.id;
        var node = doc.get(nodeId);

        node.emit('upload:started');
        var channel = fileClient.uploadFile(file, function(err, url) {
          if (err) {
            url = "error";
          }
          // get the node again to make sure it still exists
          node = doc.get(nodeId);
          if (node) {
            node.emit('upload:finished');
            console.log("upload:finished for PDF insert.");
            documentSession.transaction(function(tx) {
              console.log("Setting url to " + url + " for " + nodeId);
              tx.set([nodeId, 'url'], url);
            });
          }
        });
        channel.on('progress', function(progress) {
          // console.log('Progress', progress);
          node.emit('upload:progress', progress);
        });
        
        return {
          status: 'file-upload-process-started'
        };
      } else if(/\.PNG/i.test(file.name) || /\.JPG/i.test(file.name)) {
        type = "image";
        node = snippet.create({ type: "image" });
        snippet.show(node);

        surface.transaction(function(tx) {
          tx.before.selection = sel;
          return paste(tx, {
            selection: sel,
            containerId: surface.getContainerId(),
            doc: snippet
          });
        });

        var nodeId = node.id;
        var node = doc.get(nodeId);
        node.emit('upload:started');
        var channel = fileClient.uploadFile(file, function(err, url) {
          if (err) {
            url = "error";
          }
          // get the node again to make sure it still exists
          var node = doc.get(nodeId);
          if (node) {
            node.emit('upload:finished');
            documentSession.transaction(function(tx) {
              tx.set([nodeId, 'src'], url);
            });
          }
        });
        channel.on('progress', function(progress) {
          // console.log('Progress', progress);
          node.emit('upload:progress', progress);
        });

        return {
          status: 'file-upload-process-started'
        };
      }
    });
  }
};

Command.extend(ImageCommand);

module.exports = ImageCommand;
