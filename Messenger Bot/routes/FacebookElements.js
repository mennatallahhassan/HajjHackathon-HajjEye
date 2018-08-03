var FacebookElements = {};

FacebookElements.ButtonsCard = function (title,actions,clientMessengerID) {
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
function QuickReplyAction(title, payload) {
    return {
        "content_type": "text",
        "title": title,
        "payload": payload
    }
}

FacebookElements.QuickReply = function (text, actions, senderID) {
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

FacebookElements.QuickReplyAction = function (title, payload,image) {
    return {
        "content_type": "text",
        "title": title,
        "payload": payload,
        "image_url":image
    }
}

//Create Facebook Button Object.
FacebookElements.CreateAction= function (title, type, data, ratio = null) {
    let Action = {};
    Action.title = title;
    Action.type = type;
    Action.data = data;
    Action.webview_height_ratio = ratio;
    return Action;
}
//Create Facebook Generic Card Json Object.
FacebookElements.GenericCard = function(title, subTitle, imageURL, onClickURL, actions) {

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
module.exports = FacebookElements;