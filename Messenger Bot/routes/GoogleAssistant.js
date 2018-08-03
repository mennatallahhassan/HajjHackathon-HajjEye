var express = require('express');
var router = express.Router();
var CONSTANTS = require('../Configuration/Constants');
var Broadcasting = require('./FacebookBroadcasting');
var translator = require('./../Language/Translator');

router.post('/InitCall', function (req, res) {
    let lang = req.body.language.split('-')[0];
    let message = BroadcastMessage(translator.Get('Broadcast_Message',lang)+'\n'+req.body.room_url);
    console.log(lang);

    Broadcasting.Send(lang, message);
    res.status(200).end();
});

function BroadcastMessage(message) {
    return {
        "messages": [
            {
                "dynamic_text": {
                    "text": message,
                    "fallback_text": message,
                },

            }]
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

//Create Facebook Button Object.
function CreateAction(title, type, data, ratio = null) {
    let Action = {};
    Action.title = title;
    Action.type = type;
    Action.data = data;
    Action.webview_height_ratio = ratio;
    return Action;
}

module.exports = router;