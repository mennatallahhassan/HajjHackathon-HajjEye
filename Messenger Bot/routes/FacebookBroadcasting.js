var userOperations = require('./UserOperations');
var configurations = require('../Configuration/Config');
var request = require('request');
var BroadcastManager = {};

BroadcastManager.Send = function (lang, message) {
    userOperations.GetUsersWithLang(lang, function (users) {
        GenerateLable(Date.now().toString(), function (labelId) {
            AddUsersToBroadcast(users, labelId,function() {
                GetMessageId(message, function (messageId) {
                    SendBroadcast(messageId, labelId);
                }); 
            });
        });
    });
}

function SendBroadcast(messageId, labelId) {
    request({
        url: 'https://graph.facebook.com/v2.11/me/broadcast_messages',
        qs: { access_token: configurations.PageAccessToken },
        method: 'POST',
        json: {
            "message_creative_id": messageId,
            "custom_label_id": labelId
        }

    }, function (error, response, body) {
        console.log('Broadcast Id: ' + body.broadcast_id);
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    });
}
function AddUsersToBroadcast(users, lableId,callback) {
    users.forEach(user => {
        request({
            url: 'https://graph.facebook.com/v2.11/' + lableId + '/label',
            qs: { access_token: configurations.PageAccessToken },
            method: 'POST',
            json: {
                "user": user.id
            }

        }, function (error, response, body) {
            console.log('User Added: '+body.success);
            callback();
            if (error) {
                console.log('Error sending messages: ', error)
            } else if (response.body.error) {
                console.log('Error: ', response.body.error)
            }
        });
    });
}

function GetMessageId(message, callback) {
    request({
        url: 'https://graph.facebook.com/v2.11/me/message_creatives',
        qs: { access_token: configurations.PageAccessToken },
        method: 'POST',
        json: message

    }, function (error, response, body) {
        console.log('Message Id: ' + body.message_creative_id);
        
        callback(body.message_creative_id);
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    });
}

function GenerateLable(labelName, callback) {
    request({
        url: 'https://graph.facebook.com/v2.11/me/custom_labels',
        qs: { access_token: configurations.PageAccessToken },
        method: 'POST',
        json: {
            "name": labelName,
        }

    }, function (error, response, body) {
        console.log('Label Id: '+ body.id);
        
        callback(body.id);
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    });
}


module.exports = BroadcastManager;