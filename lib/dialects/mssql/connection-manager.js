"use strict";
var AbstractConnectionManager = require('../abstract/connection-manager')
  , ConnectionManager
  , Utils = require('../../utils')
  , Promise = require('../../promise');

ConnectionManager = function(dialect, sequelize) {
  AbstractConnectionManager.call(this, dialect, sequelize);

  this.sequelize = sequelize;
  this.sequelize.config.port = this.sequelize.config.port || 1433;

  try {
    this.lib = require(sequelize.config.dialectModulePath || 'seriate');
  } catch (err) {
    throw new Error('Please install seriate package manually');
  }
};

Utils._.extend(ConnectionManager.prototype, AbstractConnectionManager.prototype);

ConnectionManager.prototype.connect = function(config) {
  var self = this;

  return new Promise(function (resolve, reject) {
    var connectionConfig = {
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: config.database,
      timezone: self.sequelize.options.timezone
    };

    if (config.dialectOptions) {
      Object.keys(config.dialectOptions).forEach(function(key) {
        connectionConfig[key] = config.dialectOptions[key];
      });
    }

    // pooling?
    var connection = self.lib.getPlainContext({
      user: connectionConfig.user,
      password: connectionConfig.password,
      server: connectionConfig.host,
      database: connectionConfig.database
    });

    connection
      .step('sum', { query: 'SELECT 1 + 1 AS sum' })
      .end(function (sets) {
        console.log(sets);
        resolve(connection);
      })
      .error(function (err) {
        console.log(err);
        reject(err);
      });
  });
};
ConnectionManager.prototype.disconnect = function(connection) {
  return new Promise(function (resolve, reject) {
    connection.end(function(err) {
      if (err) return reject(err);
      resolve();
    });
  });
};
ConnectionManager.prototype.validate = function(connection) {
  console.log('add code for validations here', connection);
  return true;
};

module.exports = ConnectionManager;
