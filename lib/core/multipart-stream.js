"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MultipartStream = void 0;

var _stream = require("stream");

var _sandwichStream = require("sandwich-stream");

/* eslint-disable guard-for-in */
const CRNL = '\r\n';

class MultipartStream extends _sandwichStream.SandwichStream {
  constructor(boundary) {
    super({
      head: `--${boundary}${CRNL}`,
      tail: `${CRNL}--${boundary}--`,
      separator: `${CRNL}--${boundary}${CRNL}`
    });
  }

  addPart(part) {
    const partStream = new _stream.PassThrough();

    if (part.headers) {
      for (const key in part.headers) {
        const header = part.headers[key];
        partStream.write(`${key}:${header}${CRNL}`);
      }
    }

    partStream.write(CRNL);

    if (MultipartStream.isStream(part.body)) {
      part.body.pipe(partStream);
    } else {
      partStream.end(part.body);
    }

    this.add(partStream);
  }

  static isStream(targetStream) {
    return targetStream && typeof targetStream === 'object' && typeof targetStream.pipe === 'function';
  }

}

exports.MultipartStream = MultipartStream;