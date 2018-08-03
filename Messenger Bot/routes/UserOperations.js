var fs = require('fs');
var filePath = 'Users.txt';

var userOperations = {};

userOperations.Read = function (clientMessengerID, callback) {
    let read = fs.readFile(filePath, 'utf8', function (err, data) {
        var jsonObj = JSON.parse(data);
        jsonObj.forEach(element => {
            if (element.id === clientMessengerID)
                callback(element);
        });
    });
}

userOperations.Save = function (user) {
    let read = fs.readFile(filePath, 'utf8', function (err, data) {
        var jsonObj = JSON.parse(data);
        let isExist = false;
        jsonObj.forEach(element => {
            if (element.id === user.id)
                isExist = true;
        });
        if (!isExist) {
            jsonObj.push(user);
        }
        var writeStream = fs.createWriteStream(filePath);
        var jsonContent = JSON.stringify(jsonObj);
        writeStream.write(jsonContent);
        writeStream.close();


    });

}
userOperations.GetUsersWithLang = function (lang, callback) {
    fs.readFile(filePath, 'utf8', function (err, data) {
        var jsonObj = JSON.parse(data);
        let users = [];
        jsonObj.forEach(element => {
            if (element.lang === lang)
                users.push(element);
        });

        callback(users);

    });
}
userOperations.UpdateUserLang = function (clientMessengerID,lang) {
    let read = fs.readFile(filePath, 'utf8', function (err, data) {
        var jsonObj = JSON.parse(data);
        let user = {};
        jsonObj.forEach(element => {
            if (element.id === clientMessengerID)
                element.lang = lang;
        });

        var writeStream = fs.createWriteStream(filePath);
        var jsonContent = JSON.stringify(jsonObj);
        writeStream.write(jsonContent);
        writeStream.close();


    });

}

module.exports = userOperations;