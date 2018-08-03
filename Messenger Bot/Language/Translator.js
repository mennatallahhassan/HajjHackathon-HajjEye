var fs = require('fs');
var translator = {};
var filePath = './Language/Locale.json';

translator.Get = function (key,lang) {
  let fileData = fs.readFileSync(filePath,'utf-8');
  let fileObj = JSON.parse(fileData);
  let value = fileObj[key];
  return value[lang];
}

module.exports = translator;