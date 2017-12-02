"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TelegramError = void 0;
const DEFAULT_ERROR_CODE = 9999;

class TelegramError extends Error {
  constructor(payload = {}, on = {}) {
    super(`${payload.error_code || DEFAULT_ERROR_CODE}: ${payload.description || ''}`);
    Object.defineProperty(this, "code", {
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
    Object.defineProperty(this, "parameters", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "on", {
      configurable: true,
      enumerable: true,
      writable: true,
      value: void 0
    });
    this.name = 'TelegramError';
    this.code = payload.error_code || DEFAULT_ERROR_CODE;
    this.response = payload;
    this.description = payload.description;
    this.parameters = payload.parameters || {};
    this.on = on || {};
  }

}

exports.TelegramError = TelegramError;