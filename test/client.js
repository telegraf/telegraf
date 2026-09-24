const test = require("ava");
const { attachFormValue } = require("../lib/core/network/client");

function formStub() {
  const parts = [];
  return { parts, addPart: (part) => parts.push(part) };
}

const name = (part) => /name="([^"]+)"/.exec(part.headers["content-disposition"])[1];
const filename = (part) => {
  const m = /filename="([^"]+)"/.exec(part.headers["content-disposition"]);
  return m && m[1];
};

test("a plain object is serialised as JSON", async (t) => {
  const form = formStub();
  await attachFormValue(form, "reply_parameters", {
    message_id: 2919,
    allow_sending_without_reply: true,
  });

  t.is(form.parts.length, 1, "reply_parameters must produce exactly one part");
  const [part] = form.parts;
  t.is(name(part), "reply_parameters");
  t.is(filename(part), null, "it is data, not an upload");
  t.deepEqual(JSON.parse(part.body), {
    message_id: 2919,
    allow_sending_without_reply: true,
  });
});

test("an object with a source is uploaded as a file", async (t) => {
  const form = formStub();
  const source = Buffer.from("file-bytes");
  await attachFormValue(form, "photo", { source, filename: "a.jpg" });

  t.is(form.parts.length, 1);
  const [part] = form.parts;
  t.is(name(part), "photo");
  t.is(filename(part), "a.jpg");
  t.is(part.body, source, "the buffer must be attached as-is, not serialised");
});

test("an object with a url is uploaded as a file, not serialised", async (t) => {
  const form = formStub();
  // Reaching the fetch would mean the value was classified as a file; that classification is
  // the assertion here, so the request is cut short by an agent that refuses to connect.
  const refuse = () => {
    throw new Error("classified as a file");
  };
  await t.throwsAsync(attachFormValue(form, "photo", { url: "http://127.0.0.1:1/x.jpg" }, refuse), {
    message: "classified as a file",
  });
  t.is(form.parts.length, 0, "nothing is serialised when the value is a file");
});

test("primitives are sent as-is", async (t) => {
  const form = formStub();
  await attachFormValue(form, "chat_id", 1);
  await attachFormValue(form, "caption", "hello");
  await attachFormValue(form, "disable_notification", true);

  t.deepEqual(
    form.parts.map((p) => [name(p), p.body]),
    [
      ["chat_id", "1"],
      ["caption", "hello"],
      ["disable_notification", "true"],
    ],
  );
});

test("null and undefined are ignored", async (t) => {
  const form = formStub();
  await attachFormValue(form, "reply_parameters", null);
  await attachFormValue(form, "reply_markup", undefined);

  t.is(form.parts.length, 0);
});

test("a thumbnail is uploaded and referenced by attach://", async (t) => {
  const form = formStub();
  await attachFormValue(form, "thumbnail", { source: Buffer.from("thumb") });

  t.is(form.parts.length, 2, "the file part, then the reference");
  const [file, ref] = form.parts;
  t.regex(filename(file), /\.dat$/);
  t.is(name(ref), "thumbnail");
  t.is(ref.body, `attach://${name(file)}`);
});

test("an InputMedia object uploads its media and keeps the rest as JSON", async (t) => {
  const form = formStub();
  await attachFormValue(form, "media", {
    type: "photo",
    media: { source: Buffer.from("bytes") },
    caption: "hi",
  });

  t.is(form.parts.length, 2);
  const [file, json] = form.parts;
  t.is(name(json), "media");
  const parsed = JSON.parse(json.body);
  t.is(parsed.caption, "hi");
  t.is(parsed.media, `attach://${name(file)}`);
});

test("a media group uploads each item and sends the array as JSON", async (t) => {
  const form = formStub();
  await attachFormValue(form, "media", [
    { type: "photo", media: { source: Buffer.from("one") } },
    { type: "photo", media: { source: Buffer.from("two") } },
  ]);

  t.is(form.parts.length, 3, "two uploads plus the array");
  const [a, b, json] = form.parts;
  t.is(name(json), "media");
  t.deepEqual(
    JSON.parse(json.body).map((item) => item.media),
    [`attach://${name(a)}`, `attach://${name(b)}`],
  );
});
