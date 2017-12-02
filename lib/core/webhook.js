"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.webhook = webhook;

var _debug = _interopRequireDefault(require("debug"));

var _fluture = require("fluture");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debug = (0, _debug.default)('telegraf:webhook');
const HTTP_SERVER_ERROR = 500;
const HTTP_UNSUPPORT_MEDIA = 415;
const HTTP_FORBIDDEN = 403;

function webhook(path, updateHandler, errorHandler) {
  return (req, res, next) => {
    if (req.method !== 'POST' || req.url !== `${path}`) {
      if (typeof next === 'function') {
        return next();
      }

      res.statusCode = HTTP_FORBIDDEN;
      return res.end();
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      let update = {};

      try {
        update = JSON.parse(body);
      } catch (error) {
        res.writeHead(HTTP_UNSUPPORT_MEDIA);
        res.end();
        return errorHandler(error);
      }

      updateHandler(update, res).map(() => {
        if (!res.finished) {
          res.end();
        }

        return undefined;
      }).mapRej(err => {
        debug('webhook error', err);
        res.writeHead(HTTP_SERVER_ERROR);
        res.end();
      });
      return undefined;
    });
    return undefined;
  };
}