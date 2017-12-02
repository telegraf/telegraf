"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.TelegramError = void 0;








const DEFAULT_ERROR_CODE = 9999;

class TelegramError extends Error {





  constructor(payload = {}, on = {}) {
    super(`${payload.error_code || DEFAULT_ERROR_CODE}: ${payload.description || ''}`);
    this.name = 'TelegramError';

    this.code = payload.error_code || DEFAULT_ERROR_CODE;
    this.response = payload;
    this.description = payload.description;
    this.parameters = payload.parameters || {};
    this.on = on || {};
  }}exports.TelegramError = TelegramError;