/**
 * Turns the arguments of an API call into the parts of a request body.
 * Builds a JSON string, or the segments of a multipart/form-data body for the client
 * to send as a `ReadableStream` or a `Blob`.
 *
 * Web APIs only, so it runs on Node, Deno, Bun, Cloudflare Workers and in a browser.
 */

/** Using Symbol.for so two copies of Telegraf recognise each other's files. */
const brand: unique symbol = Symbol.for("telegraf.InputFile");

export type ByteStream = AsyncIterable<Uint8Array> | ReadableStream<Uint8Array>;

/**
 * The contents of a file.
 * A stream is given as a function so an upload can be repeated.
 */
export type FileSource = Blob | Uint8Array | ArrayBuffer | (() => ByteStream);

export class InputFile {
  readonly [brand] = true;

  constructor(
    readonly source: FileSource,
    /** Derived from the parameter if omitted. */
    readonly name?: string,
  ) {}

  static is(value: unknown): value is InputFile {
    return (
      typeof value === "object" &&
      value !== null &&
      (value as { [brand]?: unknown })[brand] === true
    );
  }

  toJSON(): never {
    throw new TypeError(
      "An InputFile cannot be serialized. It must sit in a plain object or an array.",
    );
  }
}

/** A file to be attached, referenced from it as `attach://<id>`. */
export interface Attachment {
  id: string;
  /** The parameter of the API method the file was found under. */
  parameter: string;
  file: InputFile;
}

/**
 * Replaces every `InputFile` in a payload with a reference to an attachment.
 * The payload is not changed: objects and arrays that hold a file are copied, everything
 * else is shared.
 */
export function extractFiles(payload: Record<string, unknown>): {
  payload: Record<string, unknown>;
  attachments: Attachment[];
} {
  const attachments: Attachment[] = [];

  const visit = (value: unknown, parameter: string): unknown => {
    if (InputFile.is(value)) {
      const id = randomId();
      attachments.push({ id, parameter, file: value });
      return `attach://${id}`;
    }
    if (Array.isArray(value)) {
      let copy: unknown[] | undefined;
      value.forEach((item, index) => {
        const visited = visit(item, parameter);
        if (visited === item) return;
        copy ??= value.slice();
        copy[index] = visited;
      });
      return copy ?? value;
    }
    if (isPlainObject(value)) return visitObject(value, () => parameter);
    return value;
  };

  const visitObject = (object: Record<string, unknown>, parameterOf: (key: string) => string) => {
    let copy: Record<string, unknown> | undefined;
    for (const [key, value] of Object.entries(object)) {
      const visited = visit(value, parameterOf(key));
      if (visited === value) continue;
      copy ??= { ...object };
      copy[key] = visited;
    }
    return copy ?? object;
  };

  return { payload: visitObject(payload, (key) => key), attachments };
}

/** `JSON.stringify` that removes `null` and `undefined` values */
export function toJson(value: unknown): string {
  return JSON.stringify(value, (_, member: unknown) => member ?? undefined);
}

/** A piece of a multipart body. A function is a stream that hasn't been opened. */
export type Segment = Uint8Array | Blob | (() => ByteStream);

export interface Multipart {
  contentType: string;
  segments: Segment[];
}

/**
 * Encodes a payload as multipart/form-data.
 */
export function toMultipart(
  payload: Record<string, unknown>,
  attachments: readonly Attachment[],
  boundary = randomId(16),
): Multipart {
  const segments: Segment[] = [];
  let text = "";
  let opened = false;
  const open = () => {
    text += `${opened ? "\r\n" : ""}--${boundary}\r\n`;
    opened = true;
  };
  const flush = () => {
    if (text !== "") segments.push(encoder.encode(text));
    text = "";
  };

  for (const [key, value] of Object.entries(payload)) {
    if (value == null) continue;
    open();
    text += `content-disposition: form-data; name="${escape(key)}"\r\n\r\n`;
    text += typeof value === "object" ? toJson(value) : String(value);
  }

  for (const { id, parameter, file } of attachments) {
    const name = file.name ?? `${parameter}.${extensions[parameter] ?? "dat"}`;
    open();
    text += `content-disposition: form-data; name="${id}"; `;
    text += `filename="${escape(name)}"\r\n`;
    text += "content-type: application/octet-stream\r\n\r\n";
    flush();
    segments.push(toSegment(file.source));
  }

  text += `${opened ? "\r\n" : ""}--${boundary}--\r\n`;
  flush();
  return { contentType: `multipart/form-data; boundary=${boundary}`, segments };
}

const encoder = new TextEncoder();

const extensions: Record<string, string | undefined> = {
  animation: "mp4",
  audio: "mp3",
  photo: "jpg",
  sticker: "webp",
  video: "mp4",
  video_note: "mp4",
  voice: "ogg",
};

function toSegment(source: FileSource): Segment {
  if (typeof source === "function") return source;
  if (Object.prototype.toString.call(source) === "[object ArrayBuffer]") {
    return new Uint8Array(source as ArrayBuffer);
  }
  return source as Uint8Array | Blob;
}

/** Escape a field or file name for multipart/form-data. */
function escape(name: string) {
  return name.replace(/\r/g, "%0D").replace(/\n/g, "%0A").replace(/"/g, "%22");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === null || Object.getPrototypeOf(prototype) === null;
}

function randomId(bytes = 8) {
  let id = "";
  for (const byte of crypto.getRandomValues(new Uint8Array(bytes))) {
    id += byte.toString(16).padStart(2, "0");
  }
  return id;
}
