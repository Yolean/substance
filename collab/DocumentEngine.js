"use strict";

var EventEmitter = require('../util/EventEmitter');
var JSONConverter = require('../model/JSONConverter');
var Err = require('../util/SubstanceError');
var SnapshotEngine = require('./SnapshotEngine');
var ObjectOperation = require('substance/model/data/ObjectOperation');

/*
  DocumentEngine
*/
function DocumentEngine(config) {
  DocumentEngine.super.apply(this);

  this.configurator = config.configurator;
  // Where changes are stored
  this.documentStore = config.documentStore;
  this.changeStore = config.changeStore;

  // SnapshotEngine instance is required
  this.snapshotEngine = config.snapshotEngine || new SnapshotEngine({
    configurator: this.configurator,
    documentStore: this.documentStore,
    changeStore: this.changeStore,
    snapshotStore: config.snapshotStore
  });
}

DocumentEngine.Prototype = function() {

  /*
    Creates a new empty or prefilled document

    Writes the initial change into the database.
    Returns the JSON serialized version, as a starting point
  */
  this.createDocument = function(args, cb) {
    var schema = this.configurator.getSchema();
    if (!schema) {
      return cb(new Err('SchemaNotFoundError', {
        message: 'Schema not found for ' + args.schemaName
      }));
    }

    var doc = this.configurator.createArticle();

    // TODO: I have the feeling that this is the wrong approach.
    // While in our tests we have seeds I don't think that this is a general pattern.
    // A vanilla document should be just empty, or just have what its constructor
    // is creating.
    // To create some initial content, we should use the editor,
    // e.g. an automated script running after creating the document.

    // HACK: we use the info object for the change as well, however
    // we should be able to control this separately.

    this.documentStore.createDocument({
      schemaName: schema.name,
      schemaVersion: schema.version,
      documentId: args.documentId,
      version: 0, // we start with version 0 and waiting for the initial seed change from client
      info: args.info
    }, function(err, docRecord) {
      if (err) {
        return cb(new Err('CreateError', {
          cause: err
        }));
      }

      var converter = new JSONConverter();
      cb(null, {
        documentId: docRecord.documentId,
        data: converter.exportDocument(doc),
        version: 0
      });
    }.bind(this)); //eslint-disable-line
  };

  /*
    Get a document snapshot.

    @param args.documentId
    @param args.version
  */
  this.getDocument = function(args, cb) {
    this.snapshotEngine.getSnapshot(args, cb);
  };

  /*
    Delete document by documentId
  */
  this.deleteDocument = function(documentId, cb) {
    this.changeStore.deleteChanges(documentId, function(err) {
      if (err) {
        return cb(new Err('DeleteError', {
          cause: err
        }));
      }
      this.documentStore.deleteDocument(documentId, function(err, doc) {
        if (err) {
          return cb(new Err('DeleteError', {
            cause: err
          }));
        }
        cb(null, doc);
      });
    }.bind(this));
  };

  /*
    Check if a given document exists
  */
  this.documentExists = function(documentId, cb) {
    this.documentStore.documentExists(documentId, cb);
  };

  /*
    Get changes based on documentId, sinceVersion
  */
  this.getChanges = function(args, cb) {
    this.documentExists(args.documentId, function(err, exists) {
      if (err || !exists) {
        return cb(new Err('ReadError', {
          message: !exists ? 'Document does not exist' : null,
          cause: err
        }));
      }
      this.changeStore.getChanges(args, cb);
    }.bind(this));
  };

  /*
    Get version for given documentId
  */
  this.getVersion = function(documentId, cb) {
    this.documentExists(documentId, function(err, exists) {
      if (err || !exists) {
        return cb(new Err('ReadError', {
          message: !exists ? 'Document does not exist' : null,
          cause: err
        }));
      }
      this.changeStore.getVersion(documentId, cb);
    }.bind(this));
  };

  /*
    Add change to a given documentId

    args: documentId, change [, documentInfo]
  */
  this.addChange = function(args, cb) {
    this.documentExists(args.documentId, function(err, exists) {
      if (err || !exists) {
        return cb(new Err('ReadError', {
          message: !exists ? 'Document does not exist' : null,
          cause: err
        }));
      }
      this.changeStore.addChange(args, function(err, newVersion) {
        if (err) return cb(err);
        // We write the new version to the document store.
        this.documentStore.updateDocument(args.documentId, {
          version: newVersion,
          // Store custom documentInfo
          info: args.documentInfo
        }, function(err) {
          if (err) return cb(err);
          this.snapshotEngine.requestSnapshot(args.documentId, newVersion, function() {
            // no matter if errored or not we will complete the addChange
            // successfully
            cb(null, newVersion);
          });
        }.bind(this));
      }.bind(this));
    }.bind(this));
  };

};

EventEmitter.extend(DocumentEngine);

module.exports = DocumentEngine;
