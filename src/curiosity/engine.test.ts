import assert from "node:assert/strict";
import test from "node:test";
import { questions } from "./questions.ts";
import {
  answerResult,
  bankProblems,
  emptyProgress,
  factualScore,
  orderChoices,
  parseProgress,
  pickQuestion,
  recordAnswer,
  toggleBookmark,
  withCategory,
} from "./engine.ts";

function randomFrom(values: number[]): () => number {
  let index = 0;
  return () => {
    const value = values[index % values.length];
    index += 1;
    return value;
  };
}

test("the question bank is large, varied, and internally consistent", () => {
  assert.deepEqual(bankProblems(questions), []);
});

test("shuffling choices keeps the correct id attached to the same label", () => {
  const question = questions.find((item) => item.id === "lg-bat-ball");
  assert.ok(question);
  const ordered = orderChoices(question, randomFrom([0.9, 0.1, 0.4]));
  const correct = ordered.find((choice) => choice.id === question.correctChoiceId);
  assert.equal(correct?.label, "5 cents");
  assert.equal(new Set(ordered.map((choice) => choice.id)).size, question.choices.length);
});

test("new questions are preferred over ones already discovered", () => {
  const first = questions[0];
  const progress = { ...emptyProgress(), discovered: [first.id], answers: {} };
  const next = pickQuestion(questions, progress, () => 0);
  assert.ok(next);
  assert.notEqual(next.id, first.id);
});

test("a category filter stays inside that category", () => {
  const progress = withCategory(emptyProgress(), "logic");
  const next = pickQuestion(questions, progress, () => 0.5);
  assert.equal(next?.category, "logic");
});

test("factual answers are scored and subjective answers are not judged", () => {
  const fact = questions.find((item) => item.id === "sf-sharks-trees");
  const opinion = questions.find((item) => item.id === "ed-cereal-soup");
  assert.ok(fact && opinion);
  assert.equal(answerResult(fact, "sharks"), true);
  assert.equal(answerResult(fact, "trees"), false);
  assert.equal(answerResult(opinion, opinion.choices[0].id), null);

  let progress = recordAnswer(emptyProgress(), fact, "trees", questions);
  progress = recordAnswer(progress, opinion, opinion.choices[0].id, questions);
  assert.equal(progress.answers[fact.id].correct, false);
  assert.equal(progress.answers[opinion.id].correct, null);
  assert.equal(factualScore(progress).answered, 1);
  assert.equal(factualScore(progress).correct, 0);
  const again = recordAnswer(progress, fact, "sharks", questions);
  assert.equal(again.answers[fact.id].choiceId, "trees");
});

test("achievements follow exploration rather than speed", () => {
  let progress = emptyProgress();
  const surprising = questions.filter((item) => item.category === "surprising-facts").slice(0, 10);
  for (const question of surprising) {
    progress = recordAnswer(progress, question, question.choices[0].id, questions);
  }
  assert.ok(progress.achievements.includes("curious-one"));
  assert.ok(progress.achievements.includes("rabbit-hole"));
  assert.ok(progress.achievements.includes("wait-what"));
  assert.equal(progress.achievements.includes("completionist"), false);
});

test("corrupt or outdated storage falls back to an empty trail", () => {
  assert.equal(parseProgress("not json", questions).discovered.length, 0);
  assert.equal(parseProgress(JSON.stringify({ version: 2, discovered: ["sf-sharks-trees"] }), questions).discovered.length, 0);
  const partial = parseProgress(JSON.stringify({ version: 1, discovered: ["sf-sharks-trees", "missing", 4] }), questions);
  assert.deepEqual(partial.discovered, ["sf-sharks-trees"]);
});

test("bookmarks only toggle real questions", () => {
  const saved = toggleBookmark(emptyProgress(), "sf-venus-day", questions);
  assert.deepEqual(saved.bookmarks, ["sf-venus-day"]);
  const cleared = toggleBookmark(saved, "sf-venus-day", questions);
  assert.deepEqual(cleared.bookmarks, []);
  assert.deepEqual(toggleBookmark(emptyProgress(), "nope", questions).bookmarks, []);
});
