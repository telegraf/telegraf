"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ApiClient = exports.defaultOptions = exports.defaultExtensions = exports.webhookBlacklist = void 0;

var _debug = _interopRequireDefault(require("debug"));

var _crypto = _interopRequireDefault(require("crypto"));

var _fs = _interopRequireDefault(require("fs"));

var _https = _interopRequireDefault(require("https"));

var _path = _interopRequireDefault(require("path"));

var _fluture = require("fluture");

var _nodeFetch = _interopRequireDefault(require("node-fetch"));

var _telegramError = require("./telegram-error");

var _multipartStream = require("./multipart-stream");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debug = (0, _debug.default)('telegraf:core');
const webhookBlacklist = ['getChat', 'getChatAdministrators', 'getChatMember', 'getChatMembersCount', 'getFile', 'getFileLink', 'getGameHighScores', 'getMe', 'getUserProfilePhotos', 'getWebhookInfo'];
exports.webhookBlacklist = webhookBlacklist;
const defaultExtensions = {
  audio: 'mp3',
  photo: 'jpg',
  sticker: 'webp',
  video: 'mp4',
  video_note: 'mp4',
  voice: 'ogg'
};
exports.defaultExtensions = defaultExtensions;

function attachFormMedia(form, media, id) {
  let fileName = media.filename || `${id}.${defaultExtensions[id] || 'dat'}`;

  if (media.url) {
    return (0, _nodeFetch.default)(media.url).then(res => form.addPart({
      headers: {
        'content-disposition': `form-data; name="${id}"; filename="${fileName}"`
      },
      body: res.body
    }));
  }

  if (media.source) {
    if (_fs.default.existsSync(media.source)) {
      fileName = media.filename || _path.default.basename(media.source);
      media.source = _fs.default.createReadStream(media.source);
    }

    if (_multipartStream.MultipartStream.isStream(media.source) || Buffer.isBuffer(media.source)) {
      form.addPart({
        headers: {
          'content-disposition': `form-data; name="${id}"; filename="${fileName}"`
        },
        body: media.source
      });
    }
  }

  return Promise.resolve();
}

function attachFormValue(form, value, id) {
  if (!value) {
    return Promise.resolve();
  }

  const valueType = typeof value;

  if (valueType === 'string' || valueType === 'boolean' || valueType === 'number') {
    form.addPart({
      headers: {
        'content-disposition': `form-data; name="${id}"`
      },
      body: `${value}`
    });
    return Promise.resolve();
  }

  if (Array.isArray(value)) {
    return Promise.all(value.map(item => {
      if (typeof item.media === 'object') {
        const attachmentId = _crypto.default.randomBytes(16).toString('hex');

        return attachFormMedia(form, item.media, attachmentId).then(() => Object.assign({}, item, {
          media: `attach://${attachmentId}`
        }));
      }

      return Promise.resolve(item);
    })).then(items => form.addPart({
      headers: {
        'content-disposition': `form-data; name="${id}"`
      },
      body: JSON.stringify(items)
    }));
  }

  return attachFormMedia(form, value, id);
}

function buildJSONPayload(options) {
  return (0, _fluture.resolve)({
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      connection: 'keep-alive'
    },
    body: JSON.stringify(options)
  });
}

function buildFormDataPayload(options) {
  if (options.reply_markup && typeof options.reply_markup !== 'string') {
    options.reply_markup = JSON.stringify(options.reply_markup);
  }

  const boundary = _crypto.default.randomBytes(32).toString('hex');

  const formData = new _multipartStream.MultipartStream(boundary);
  const tasks = Object.keys(options).map(key => attachFormValue(formData, options[key], key));
  return (0, _fluture.tryP)(() => Promise.all(tasks)).map(() => ({
    method: 'POST',
    headers: {
      'content-type': `multipart/form-data; boundary=${boundary}`,
      connection: 'keep-alive'
    },
    body: formData
  }));
}

function request(root, token, method, extra) {
  return (0, _fluture.tryP)(() => (0, _nodeFetch.default)(`${root}/bot${token}/${method}`).then(res => res.text()).catch(error => {
    throw new _telegramError.TelegramError(error.text, {
      method,
      extra
    });
  }).then(text => {
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new _telegramError.TelegramError(error, {
        method,
        extra
      });
    }
  }).then(data => data.result));
}

const defaultOptions = {
  apiRoot: 'https://api.telegram.org',
  webhookReply: true,
  agent: new _https.default.Agent({
    keepAlive: true,
    keepAliveMsecs: 10000
  })
};
exports.defaultOptions = defaultOptions;

class ApiClient {
  constructor(token, options, webhookResponse) {
    Object.defineProperty(this, "token", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "options", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "response", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: void 0
    });
    this.token = token;
    this.options = Object.assign({}, defaultOptions, options);
    this.response = webhookResponse;
  }

  setWebhookReply(enabled) {
    this.options.webhookReply = enabled;
  }

  getWebhookReply() {
    return this.options.webhookReply;
  }

  callApi(method, extra) {
    const isMultipartRequest = Object.keys(extra).filter(x => extra[x]).some(x => Array.isArray(extra[x]) ? extra[x].some(child => typeof child.media === 'object' && (child.media.source || child.media.url)) : extra[x].source || extra[x].url);

    if (this.options.webhookReply && !isMultipartRequest && this.response && !this.response.finished && !webhookBlacklist.includes(method)) {
      debug('▷ webhook', method);
      extra.method = method;

      if (typeof this.response.end === 'function') {
        if (!this.response.headersSent) {
          this.response.setHeader('connection', 'keep-alive');
          this.response.setHeader('content-type', 'application/json');
        }

        this.response.end(JSON.stringify(extra));
      } else if (typeof this.response.header === 'object') {
        // TODO: review response.header
        if (this.response.header == null) {
          this.response.header = {};
        }

        Object.assign(this.response.header, {
          connection: 'keep-alive',
          'content-type': 'application/json'
        });
        this.response.body = extra;
      }

      return (0, _fluture.resolve)({
        webhook: true
      });
    }

    if (!this.token) {
      return (0, _fluture.reject)(new _telegramError.TelegramError({
        error_code: 401,
        description: 'Bot Token is required'
      }));
    }

    debug('▶︎ http', method);
    const buildPayload = isMultipartRequest ? buildFormDataPayload(extra) : buildJSONPayload(extra);
    return buildPayload.chain(payload => {
      payload.agent = this.options.agent;
      return request(this.options.apiRoot, this.token, method, extra);
    }).chainRej(err => (0, _fluture.reject)(new _telegramError.TelegramError(err.message, {
      method,
      extra
    })));
  }

}

exports.ApiClient = ApiClient;