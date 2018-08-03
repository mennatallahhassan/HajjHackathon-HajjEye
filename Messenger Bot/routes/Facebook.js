var express = require('express');
var router = express.Router();
var request = require('request');
var sleep = require('thread-sleep');
var configurations = require('../Configuration/Config');
var CONSTANTS = require('../Configuration/Constants');
var userOperations = require('./UserOperations');
var FacebookElements = require('./FacebookElements');
var translator = require('./../Language/Translator');

/* Facebook Auth. */
router.get('/api/Facebook/', function (req, res) {
    if (req.query['hub.verify_token'] === configurations.VerifyToken) {
        res.send(req.query['hub.challenge'])
    } else {
        res.send('Error, wrong token')
    }
});
router.get('/api/Init', function (req, res) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messenger_profile',
        qs: { access_token: configurations.PageAccessToken },
        method: 'POST',
        json: {
            "get_started": {
                "payload": CONSTANTS.Commands.GET_STARTED
            }
        }
    }, function (error, response, body) {
        console.log(body);

        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    });
    request({
        url: 'https://graph.facebook.com/v2.6/me/messenger_profile',
        qs: { access_token: configurations.PageAccessToken },
        method: 'POST',
        json: {
            "persistent_menu": [
                {
                    "locale": "default",
                    "composer_input_disabled": true,
                    "call_to_actions": [
                        {
                            "type": "postback",
                            "title": "تطوع",
                            "payload": CONSTANTS.Commands.TTW3
                        }
                    ]
                }, {
                    "locale": "en_us",
                    "composer_input_disabled": false,
                    "call_to_actions": [
                        {
                            "type": "postback",
                            "title": "Volunteer",
                            "payload": CONSTANTS.Commands.TTW3
                        }
                    ]
                }

            ]
        }
    }, function (error, response, body) {
        console.log(body);

        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    });
    res.status(200).end();
});

router.post('/api/Facebook/', function (req, res) {
    var Activity = {};
    let messaging_info = req.body.entry[0].messaging;
    for (let i = 0; i < messaging_info.length; i++) {
        try {
            //Get The User Event.
            let event = messaging_info[i];
            //Get The User ID (Client Messenger ID).
            let senderID = event.sender.id;
            GetFacebookUserData(senderID, function (params) {
                var jsonObj = JSON.parse(params);
                userOperations.Save(jsonObj);
            });
            userOperations.Read(senderID, function (user) {
                if (!user.lang) {
                    user.lang = 'ar';
                }
                //Check If the User Sent a Message.
                if (event.message && event.message.quick_reply) {
                    HandlePostbackEvent(senderID, event.message.quick_reply.payload, user.lang);
                }
                else if (event.message && event.message.text) {
                    //Handle User Text Message and Response To the User.
                }
                //Check If the User Clicked on Button
                else if (event.postback) {
                    //Handle Postback events.
                    HandlePostbackEvent(senderID, event.postback.payload, user.lang);
                }

            });

        } catch (e) {
            console.log(e)
        }
    }
    res.status(200).end();
});

function HandlePostbackEvent(SenderID, Postback, lang) {
    if (Postback === CONSTANTS.Commands.GET_STARTED) {
        SendDynamicTextMessage(SenderID, translator.Get('Welcome_Message', lang), function () {
            let quickReplyActions = [];
            quickReplyActions.push(FacebookElements.QuickReplyAction('اتحدث العربية', CONSTANTS.Commands.LANG + 'ar', 'https://cdn.countryflags.com/thumbs/saudi-arabia/flag-round-250.png'));
            quickReplyActions.push(FacebookElements.QuickReplyAction('Speak English', CONSTANTS.Commands.LANG + 'en', 'https://cdn1.iconfinder.com/data/icons/flags-of-the-world-2/128/united-states-circle-512.png'));

            let quickReply = FacebookElements.QuickReply(translator.Get('Choose_Language', lang), quickReplyActions, SenderID);
            SendQuickReply(quickReply)
        });
    } else if (Postback === CONSTANTS.Commands.TTW3) {
        SendDynamicTextMessage(SenderID, translator.Get('Ttw3_Message', lang));
    } else if (Postback === CONSTANTS.Commands.NOT_NOW) {
        SendTextMessage(SenderID, translator.Get('Not_Now', lang));
    } else if (Postback.startsWith(CONSTANTS.Commands.LANG)) {
        lang = Postback.split(':')[1];
        userOperations.UpdateUserLang(SenderID, Postback.split(':')[1]);
        let quickReplyActions = [];
        quickReplyActions.push(FacebookElements.QuickReplyAction(translator.Get('La7kn', lang), CONSTANTS.Commands.NOT_NOW));
        quickReplyActions.push(FacebookElements.QuickReplyAction(translator.Get('Volunteer', lang), CONSTANTS.Commands.TTW3));

        let quickReply = FacebookElements.QuickReply(translator.Get('Ask_Volenteering', lang), quickReplyActions, SenderID);
        SendQuickReply(quickReply)
    }

}
function GetFacebookUserData(clientMessengerID, callback) {
    request({
        url: 'https://graph.facebook.com/' + clientMessengerID,
        qs: {
            fields: "first_name,last_name,profile_pic",
            access_token: configurations.PageAccessToken
        },
        method: 'GET'
    }, function (error, response, body) {
        callback(body)
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    });

}

//Send Any Facebook Attachment.
function SendAttachment(clientMessengerID, attachment) {

    var obj = {
        recipient: {
            id: clientMessengerID
        },
        message: {
            attachment: {
                type: "template",
                payload: attachment,
            }
        }
    };

    FacebookSendAPI(obj);
}
function SendQuickReply(quickReply) {
    FacebookSendAPI(quickReply);
}
//Send Facebook Text Message.
function SendTextMessage(clientMessengerID, message) {
    var obj = {
        messaging_type: "RESPONSE",
        recipient: {
            id: clientMessengerID
        },
        message: {
            text: message
        }
    };
    FacebookSendAPI(obj);
}
//Send Facebook Dynamic Text Message.
function SendDynamicTextMessage(clientMessengerID, message, callback) {
    var obj = {
        messaging_type: "RESPONSE",
        recipient: {
            id: clientMessengerID
        },
        message: {
            dynamic_text: {
                text: message,
                fallback_text: message,
            },
        }
    };

    FacebookSendAPI(obj, callback);
}
function FacebookSendAPI(obj, callback = null) {
    request({
        url: 'https://graph.facebook.com/v2.11/me/messages',
        qs: { access_token: configurations.PageAccessToken },
        method: 'POST',
        json: obj
    }, function (error, response, body) {
        if (callback)
            callback();
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    });
}
module.exports = router;