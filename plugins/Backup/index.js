var BackupPlatform = require(__dirname + '/BackupPlatform.js');


module.exports = function(server, name, logger, instance) {

    this.name = name;
    this.instance = instance;
    this.initialized = false;
    this.platform = new BackupPlatform(this, name, server, logger, instance);
    this.platform.init();


    this.handleConfigurationRequest = function(dispatched_request) {
        this.platform.handleConfigurationRequest(dispatched_request);
    };
}