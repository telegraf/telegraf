"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TelegrafContext = exports.Telegram = exports.messageSubTypes = exports.updateTypes = void 0;

var tt = _interopRequireWildcard(require("./telegram.h"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

const updateTypes = ['callback_query', 'channel_post', 'chosen_inline_result', 'edited_channel_post', 'edited_message', 'inline_query', 'shipping_query', 'pre_checkout_query', 'message'];
exports.updateTypes = updateTypes;
const messageSubTypes = ['voice', 'video_note', 'video', 'venue', 'text', 'supergroup_chat_created', 'successful_payment', 'sticker', 'pinned_message', 'photo', 'new_chat_title', 'new_chat_photo', 'new_chat_members', 'migrate_to_chat_id', 'migrate_from_chat_id', 'location', 'left_chat_member', 'invoice', 'group_chat_created', 'game', 'document', 'delete_chat_photo', 'contact', 'channel_chat_created', 'audio'];
exports.messageSubTypes = messageSubTypes;

class Telegram {}

exports.Telegram = Telegram;

class TelegrafContext {
  // TODO: review map value to type
  constructor(update, telegram, options) {
    Object.defineProperty(this, "options", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "tg", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "update", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "updateType", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: 'message'
    });
    Object.defineProperty(this, "updateSubTypes", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: []
    });
    Object.defineProperty(this, "contextState", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: {}
    });
    Object.defineProperty(this, "me", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: () => this.options.username
    });
    Object.defineProperty(this, "telegram", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: () => this.tg
    });
    Object.defineProperty(this, "message", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: () => this.update.message
    });
    Object.defineProperty(this, "editedMessage", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: () => this.update.edited_message
    });
    Object.defineProperty(this, "inlineQuery", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: () => this.update.inline_query
    });
    Object.defineProperty(this, "getState", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: () => this.contextState
    });
    Object.defineProperty(this, "setState", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: _value => {
        this.contextState = Object.assign({}, _value);
      }
    });
    this.tg = telegram;
    this.update = update;
    this.options = options;

    if ('message' in this.update) {
      this.updateType = 'message';
    } else {
      this.updateType = updateTypes.find(key => key in this.update) || 'message';
    }
  }

}

exports.TelegrafContext = TelegrafContext;