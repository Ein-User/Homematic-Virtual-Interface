"use strict"

//
//  HueSceneManager.js
//  Homematic Virtual Interface Plugin
//
//  Created by Thomas Kluge on 20.11.16.
//  Copyright © 2016 kSquare.de. All rights reserved.
//

var HomematicDevice

var HueSceneManager = function(plugin, hueApi, instance) {

    this.mappedScenes = []
    this.hmDevices = []
    this.hueApi = hueApi
    this.log = plugin.log
    this.server = plugin.server
    this.bridge = plugin.server.getBridge()
    this.instance = instance
    this.plugin = plugin
    if (this.bridge == undefined) {
        throw ("HM Layer was not set correctly")
    }
    HomematicDevice = plugin.server.homematicDevice
}

HueSceneManager.prototype.addScene = function(scene) {
    this.mappedScenes.push(scene)
}


HueSceneManager.prototype.getScene = function(sceneId) {
    var result = undefined

    this.mappedScenes.forEach(function(scene) {
        if (scene["id"] == sceneId) {
            result = scene
        }
    })
    return result
}



HueSceneManager.prototype.publish = function(publishedscenes, ccuNotification) {
    /* what do we do here
    First find out how many RemoteControls we need by dividing / 19
    and then initialize alle the remotes
    */
    // First remove all HUES* Devices

    var i = 1
    var cnt = 0
    var that = this

    this.log.debug("Scenemanager publish. First remove all old devices ...")
    var devices = this.bridge.devicesWithNameLike("HUES" + this.instance)
    this.log.debug("Old Devices: %s", devices)
    devices.forEach(function(device) {
        that.bridge.deleteDevice(device, ccuNotification)
    })
    this.log.debug("Publish new Scenes")


    var scenes = publishedscenes
    if (scenes.length > 0) {
        that.addHMRemote("HUES_" + this.instance + "0" + cnt)
        scenes.forEach(function(sceneid) {
            var scene = that.getScene(sceneid)
            if (scene != undefined) {
                scene["hmchannel"] = "HUES_" + that.instance + "0" + cnt + ":" + i
                i = i + 1
                if (i > 19) {
                    i = 1
                    cnt = cnt + 1
                    that.addHMRemote("HUES_" + that.instance + "0" + cnt)
                }
            }
        })
    }

    this.log.debug("And i am done ")
}

HueSceneManager.prototype.addHMRemote = function(remoteName) {
    var hmDevice = new HomematicDevice()
    hmDevice.initWithType("HM-RC-19", remoteName)

    this.hmDevices.push(hmDevice)
    this.bridge.addDevice(hmDevice)
    var that = this

    hmDevice.on('device_channel_value_change', function(parameter) {
        var newValue = parameter.newValue
        var channel = hmDevice.getChannel(parameter.channel)
        if (parameter.name == "PRESS_SHORT") {
            that.mappedScenes.forEach(function(scene) {
                if (scene["hmchannel"] == channel.adress) {
                    scene["lights"].forEach(function(lightId) {
                        var light = that.plugin.lightWithId(lightId)
                        if (light) {
                            light.emit('direct_light_event', light)
                        }
                    })
                    that.log.info("Scene found %s (%s) will run that", scene["name"], scene["id"])
                    that.hueApi.scenes.activateScene(scene["id"]).then(function(activated) {
                        that.log.info('The Scene was successfully activated? %s', activated);
                    })
                }
            })
        }
    })
}

HueSceneManager.prototype.getMappedScenes = function() {
    return this.mappedScenes
}

module.exports = {
    HueSceneManager: HueSceneManager
}