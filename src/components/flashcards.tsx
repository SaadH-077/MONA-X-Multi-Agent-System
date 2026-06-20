"use client";

import { useState } from "react";
import { GraduationCap, Loader2, Check, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/components/language-provider";

type Q = { q: string; options: string[]; answer: number; explain?: string };

/* Interview practice mode: generates MCQs from the interview brief and lets the
   manager answer them, with instant feedback + a final score. */
export default function Flashcards({ context }: { context: string }) {
  const { lang } = useLang();
  const [questions, setQuestions] = useState<Q[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);

  async function start() {
    setLoading(true);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, language: lang }),
      });
      const data = await res.json();
      const parsed = JSON.parse(data.output);
      setQuestions(parsed.questions ?? []);
      setI(0);
      setPicked(null);
      setCorrect(0);
      setDone(false);
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }

  if (!questions) {
    return (
      <button
        onClick={start}
        disabled={loading}
        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent/20 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />}
        {loading ? "Building practice quiz…" : "Practice with flashcards"}
      </button>
    );
  }

  if (questions.length === 0)
    return <p className="mt-4 text-sm text-muted">Couldn&apos;t build a quiz — try running the agent again.</p>;

  if (done) {
    const pct = Math.round((correct / questions.length) * 100);
    return (
      <div className="mt-4 rounded-2xl border border-border p-6 text-center">
        <GraduationCap className="mx-auto h-8 w-8 text-accent" />
        <p className="mt-2 text-2xl font-bold">
          {correct} / {questions.length}
        </p>
        <p className="text-sm text-muted">{pct}% — nice practice run!</p>
        <button
          onClick={start}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          <RotateCcw className="h-4 w-4" /> New quiz
        </button>
      </div>
    );
  }

  const q = questions[i];
  const answered = picked !== null;

  return (
    <div className="mt-4 rounded-2xl border border-border p-5">
      <div className="mb-3 flex items-center justify-between text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <GraduationCap className="h-4 w-4 text-accent" /> Practice
        </span>
        <span>
          {i + 1} / {questions.length} · score {correct}
        </span>
      </div>

      <p className="font-medium">{q.q}</p>

      <div className="mt-3 space-y-2">
        {q.options.map((opt, idx) => {
          const isAnswer = idx === q.answer;
          const isPicked = idx === picked;
          return (
            <button
              key={idx}
              disabled={answered}
              onClick={() => {
                setPicked(idx);
                if (idx === q.answer) setCorrect((c) => c + 1);
              }}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-left text-sm transition-colors",
                !answered && "border-border hover:border-accent",
                answered && isAnswer && "border-accent-2/50 bg-accent-2/10",
                answered && isPicked && !isAnswer && "border-accent-3/50 bg-accent-3/10",
                answered && !isAnswer && !isPicked && "border-border opacity-60",
              )}
            >
              {opt}
              {answered && isAnswer && <Check className="h-4 w-4 text-accent-2" />}
              {answered && isPicked && !isAnswer && <X className="h-4 w-4 text-accent-3" />}
            </button>
          );
        })}
      </div>

      {answered && q.explain && (
        <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted">
          💡 {q.explain}
        </p>
      )}

      {answered && (
        <button
          onClick={() => {
            if (i + 1 >= questions.length) setDone(true);
            else {
              setI(i + 1);
              setPicked(null);
            }
          }}
          className="mt-4 w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white"
        >
          {i + 1 >= questions.length ? "See score" : "Next question"}
        </button>
      )}
    </div>
  );
}
