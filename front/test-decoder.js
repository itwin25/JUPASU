const fs = require('fs');
global.self = global;
require('paddleocr/dist/index.js');
console.log(global.paddleocr.RecognitionService.prototype.decode.toString());
