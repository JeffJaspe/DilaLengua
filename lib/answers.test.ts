import { test } from "node:test";
import assert from "node:assert/strict";
import { checkBuild, checkSpoken, checkTyped, compareSpeech, normalize, stripAccents } from "./answers.ts";

test("normalize drops punctuation and case, keeps accents", () => {
  assert.equal(normalize("¡Hola!  ¿Cómo estás?"), "hola cómo estás");
});

test("stripAccents removes accents and tilde", () => {
  assert.equal(stripAccents("adiós niño"), "adios nino");
});

test("typed: exact answer passes", () => {
  assert.deepEqual(checkTyped("Adiós", ["adiós"]), { ok: true });
});

test("typed: missing accent passes with a hint", () => {
  assert.deepEqual(checkTyped("adios", ["adiós"]), { ok: true, accentHint: "adiós" });
});

test("typed: wrong word fails", () => {
  assert.deepEqual(checkTyped("hola", ["adiós"]), { ok: false });
  assert.deepEqual(checkTyped("   ", ["adiós"]), { ok: false });
});

test("typed: any accepted form passes", () => {
  assert.equal(checkTyped("cama", ["la cama", "cama"]).ok, true);
});

test("build: order matters, case and punctuation don't", () => {
  assert.equal(checkBuild(["Buenos", "días", "cómo", "estás"], ["buenos", "días", "cómo", "estás"]), true);
  assert.equal(checkBuild(["días", "Buenos"], ["Buenos", "días"]), false);
});

test("spoken: pattern match on accent-free transcript", () => {
  assert.equal(checkSpoken("Soy de Filipinas.", ["(soy|vengo) de \\S+"]), true);
  assert.equal(checkSpoken("Filipinas", ["(soy|vengo) de \\S+"]), false);
  assert.equal(checkSpoken("Tengo 20 años", ["tengo \\S+( \\S+)? anos"]), true);
});

test("compareSpeech marks the missed word", () => {
  const r = compareSpeech("Buenos días, mucho gusto", "buenos dias mucho busto");
  assert.deepEqual(r.words.map((w) => w.ok), [true, true, true, false]);
  assert.equal(r.score, 75);
});

test("compareSpeech tolerates an extra word", () => {
  const r = compareSpeech("Me llamo Ana", "eh me llamo ana");
  assert.equal(r.score, 100);
});
