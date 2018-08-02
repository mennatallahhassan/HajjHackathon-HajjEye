var express = require('express');
var router = express.Router();
var request = require('request');
var sleep = require('thread-sleep');
var configurations = require('../Configuration/Config');
var CONSTANTS = require('../Configuration/Constants');
var fs = require('fs');

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
function GetUser(clientMessengerID,callback) {
    let read = fs.readFile('Users.txt', 'utf8', function (err, data) {
        var jsonObj = JSON.parse(data);
        jsonObj.forEach(element => {
            if (element.id === clientMessengerID)
                callback(element);
        });
    });
}
function SaveUser(user) {
    let read = fs.readFile('Users.txt', 'utf8', function (err, data) {
        var jsonObj = JSON.parse(data);
        let isExist = false;
        jsonObj.forEach(element => {
            if (element.id === user.id)
                isExist = true;
        });
        if (!isExist) {
            jsonObj.push(user);
        }
        var writeStream = fs.createWriteStream("Users.txt");
        var jsonContent = JSON.stringify(jsonObj);
        writeStream.write(jsonContent);
        writeStream.close();


    });

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
                SaveUser(jsonObj);  
            });
            GetUser(senderID, function (params) {
                
            });
            
            //Check If the User Sent a Message.
            if (event.message && event.message.quick_reply) {
                HandlePostbackEvent(senderID, event.message.quick_reply.payload);
            }
            else if (event.message && event.message.text) {
                //Handle User Text Message and Response To the User.
                //HandleTextMessage(senderID, event.message.text);
            }
            //Check If the User Clicked on Button
            else if (event.postback) {
                //Handle Postback events.
                HandlePostbackEvent(senderID, event.postback.payload);
            }

        } catch (e) {
            console.log(e)
        }
    }
    res.status(200).end();
});

function HandlePostbackEvent(SenderID, Postback) {
    if (Postback === CONSTANTS.Commands.GET_STARTED) {
        SendDynamicTextMessage(SenderID, "اهلاً بك يا {{first_name}} فى الــ Hajj Eye");
        sleep(1000);
        let quickReplyActions = [];
        quickReplyActions.push(QuickReplyAction('اتحدث العربية',CONSTANTS.Commands.LANG+'ar'));
        quickReplyActions.push(QuickReplyAction('Speak English',CONSTANTS.Commands.LANG+'en'));

        let quickReply = QuickReply("اخبرنى ما اللغة التى تتحدث بها", quickReplyActions, SenderID);
        SendQuickReply(quickReply)
    } else if (Postback === CONSTANTS.Commands.TTW3) {
        SendDynamicTextMessage(SenderID, "رائع يا {{first_name}}.\n سوف ابلغك وقت وجود شخص يحتاج الى مساعدة فى محادثة فيديو.");
    } else if (Postback === CONSTANTS.Commands.NOT_NOW) {
        SendTextMessage(SenderID, "حسناً يمكنك الانضمام الينا فى اى وقت.");
    }else if (Postback.startsWith(CONSTANTS.Commands.LANG)) {
        UpdateUserLang(SenderID,Postback.split(':')[1]);
        let quickReplyActions = [];
        quickReplyActions.push(QuickReplyAction('لاحقاً', CONSTANTS.Commands.NOT_NOW));
        quickReplyActions.push(QuickReplyAction('تطوع', CONSTANTS.Commands.TTW3));

        let quickReply = QuickReply("يمكنك التطوع لمساعدة اشخاص خلال فترة الحج، و تربح نقاط تشترى بها من علامات تجارية", quickReplyActions, SenderID);
        SendQuickReply(quickReply)    
    }
    
}
function ButtonsCard(title,actions,clientMessengerID) {
    return {
        "recipient":{
          "id":clientMessengerID
        },
        "message":{
          "attachment":{
            "type":"template",
            "payload":{
              "template_type":"button",
              "text":title,
              "buttons": PrepareActionsData(actions)
            }
          }
        }
      }
}

function UpdateUserLang(clientMessengerID,lang) {
    let read = fs.readFile('Users.txt', 'utf8', function (err, data) {
        var jsonObj = JSON.parse(data);
        let user = {};
        jsonObj.forEach(element => {
            if (element.id === clientMessengerID)
                element.lang = lang;
        });

        var writeStream = fs.createWriteStream("Users.txt");
        var jsonContent = JSON.stringify(jsonObj);
        writeStream.write(jsonContent);
        writeStream.close();


    });

}
function QuickReplyAction(title, payload) {
    return {
        "content_type": "text",
        "title": title,
        "payload": payload
    }
}
function QuickReply(text, actions, senderID) {
    return {
        "recipient": {
            "id": senderID
        },
        "message": {
            "text": text,
            "quick_replies": actions
        }
    }
}
function HandleTextMessage(SenderID, Message) {
    //Send The User Message.
    SendTextMessage(SenderID, "You Sent: " + Message);
    //Send Dynamic Text.
    SendDynamicTextMessage(SenderID, "Welcome {{first_name}}");
    //Card actions.
    let actions = [];
    //First Action.
    let action = CreateAction("Click Me", CONSTANTS.ActionTypes.Postback, "Welcome To WideBot");
    actions.push(action);
    //Second Action.
    let secondAction = CreateAction("Google Website", CONSTANTS.ActionTypes.Web_URL, "https://google.com", CONSTANTS.WebViewRatio.Full);
    actions.push(secondAction);
    //Create Card Object.
    let card = GenericCard("Node JS Bot", "Welcome To NodeJS Bot", "https://www.nissanusa.com/content/dam/Nissan/us/vehicles/gtr/r35/2_minor_change/overview/18tdi-gtrhelios104.jpg.ximg.l_full_m.smart.jpg", "https://google.com", actions);
    //Send Card Object or any Attachment.
    SendAttachment(SenderID, card);
}

//Create Facebook Button Object.
function CreateAction(title, type, data, ratio = null) {
    let Action = {};
    Action.title = title;
    Action.type = type;
    Action.data = data;
    Action.webview_height_ratio = ratio;
    return Action;
}
//Create Facebook Generic Card Json Object.
function GenericCard(title, subTitle, imageURL, onClickURL, actions) {

    return {
        template_type: "generic",
        elements: [
            {
                title: title,
                image_url: imageURL,
                subtitle: subTitle,
                default_action: {
                    type: "web_url",
                    url: onClickURL,
                    messenger_extensions: false,
                    webview_height_ratio: "TALL"
                },
                buttons: PrepareActionsData(actions)
            },
        ]
    }
}
//Create Facebook Action Json Object.
function PrepareActionsData(actions) {
    actionsData = [];
    for (let i = 0; i < actions.length; i++) {
        if (actions[i].type === 'web_url') {
            actionData = {
                title: actions[i].title,
                type: actions[i].type,
                url: actions[i].data,
                messenger_extensions: false,
                webview_height_ratio: "TALL"
            };
            actionsData.push(actionData);
        }
        else {

            actionData = {
                title: actions[i].title,
                type: actions[i].type,
                payload: actions[i].data,
            };
            actionsData.push(actionData);
        }
    }
    return actionsData;
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
function SendDynamicTextMessage(clientMessengerID, message) {
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

    FacebookSendAPI(obj);
}
function FacebookSendAPI(obj) {
    request({
        url: 'https://graph.facebook.com/v2.11/me/messages',
        qs: { access_token: configurations.PageAccessToken },
        method: 'POST',
        json: obj
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    });
}
module.exports = router;