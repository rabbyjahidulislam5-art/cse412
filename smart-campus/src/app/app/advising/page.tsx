"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Spinner,
  StatusBadge,
} from "@/components/ui/Primitives";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import type { AdvisingState, Course } from "@/lib/types";

interface Data {
  advising: AdvisingState;
  courses: Course[];
  selected: string[];
  totalCredits: number;
  activeFines: number;
}

export default function AdvisingPage() {
  const { push } = useToast();
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [search, setSearch] = useState("");

  async function load() {
    try {
      setData(await api<Data>("/api/advising"));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  const locked = (data?.advising.locked || (data?.activeFines ?? 0) > 0) ?? false;

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase().trim();
    if (!q) return data.courses;
    return data.courses.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.instructor.toLowerCase().includes(q)
    );
  }, [data, search]);

  async function toggle(courseId: string) {
    if (!data || locked) return;
    setToggling(courseId);
    try {
      await api("/api/advising/toggle", { method: "POST", body: { courseId } });
      await load();
    } catch (e: any) {
      push({ type: "error", title: "Could not update", message: e.message });
    } finally {
      setToggling(null);
    }
  }

  async function finalize() {
    setFinalizing(true);
    try {
      await api("/api/advising/finalize", { method: "POST" });
      push({
        type: "success",
        title: "Advising finalized!",
        message: `${data?.totalCredits} credits locked in for ${data?.advising.term}.`,
      });
      await load();
    } catch (e: any) {
      push({ type: "error", title: "Could not finalize", message: e.message });
    } finally {
      setFinalizing(false);
      setConfirmOpen(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center text-ink-400">
        <Spinner size={28} />
      </div>
    );
  }

  const selectedCourses = data.courses.filter((c) => data.selected.includes(c.id));
  const pct = Math.min(100, (data.totalCredits / data.advising.maxCredits) * 100);

  return (
    <div className="space-y-6">
      {/* Term header */}
      <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-ink-900 sm:text-xl">
              {data.advising.term}
            </h2>
            <StatusBadge status={locked ? "locked" : "available"} />
          </div>
          <p className="mt-0.5 text-xs text-ink-500">
            Registration {data.advising.registrationOpen ? "is open" : "closed"} ·
            Min {data.advising.minCredits} / Max {data.advising.maxCredits} credits
          </p>
        </div>
        <Button onClick={() => setConfirmOpen(true)} disabled={locked || data.totalCredits < data.advising.minCredits}>
          <Icon.Check size={16} /> Finalize Advising
        </Button>
      </div>

      {/* Lock banner */}
      {locked && (
        <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <Icon.Lock size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-800">
                Advising locked — {data.activeFines} pending fine
                {data.activeFines === 1 ? "" : "s"}
              </p>
              <p className="text-xs text-rose-600">
                Clear all active fines to unlock course selection.
              </p>
            </div>
          </div>
          <Link href="/app/fines" className="btn btn-danger shrink-0">
            Pay Fines
          </Link>
        </div>
      )}

      {/* Credit progress */}
      <div className="card p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-ink-900">Total Credits</span>
          <span className="font-extrabold text-brand-600">
            {data.totalCredits} / {data.advising.maxCredits}
          </span>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-ink-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {data.totalCredits < data.advising.minCredits && !locked && (
          <p className="mt-2 text-xs text-amber-600">
            Select at least {data.advising.minCredits} credits to finalize.
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Course catalog */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-ink-100 p-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-bold text-ink-900">Available Courses</h3>
              <div className="relative w-full sm:w-64">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">
                  <Icon.Search size={16} />
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search courses…"
                  className="input py-2 pl-9 text-sm"
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={<Icon.Search size={26} />}
                title="No courses found"
                description="Try a different search term."
              />
            ) : (
              <div className="divide-y divide-ink-50">
                {filtered.map((c) => {
                  const selected = data.selected.includes(c.id);
                  const isFull = c.status === "full" && !selected;
                  const seatsLeft = c.seats - c.seatsTaken;
                  return (
                    <div
                      key={c.id}
                      className={`flex flex-col gap-3 p-4 transition sm:flex-row sm:items-center sm:justify-between sm:p-5 ${
                        selected ? "bg-brand-50/50" : "hover:bg-ink-50"
                      } ${locked ? "opacity-60" : ""}`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-brand-100 px-2 py-0.5 text-[11px] font-bold text-brand-700">
                            {c.code}
                          </span>
                          <span className="text-[11px] text-ink-400">
                            {c.credits} credits · Sec {c.section}
                          </span>
                          <StatusBadge status={selected ? "selected" : c.status} />
                        </div>
                        <p className="mt-1 text-sm font-semibold text-ink-900">
                          {c.title}
                        </p>
                        <p className="mt-0.5 text-xs text-ink-500">
                          {c.instructor} · {c.schedule}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-ink-100">
                            <div
                              className={`h-full rounded-full ${
                                seatsLeft <= 5 ? "bg-rose-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${(c.seatsTaken / c.seats) * 100}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-ink-400">
                            {seatsLeft} seats left
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {selected ? (
                          <Button
                            variant="outline"
                            className="border-rose-200 text-rose-600 hover:bg-rose-50"
                            disabled={locked}
                            loading={toggling === c.id}
                            onClick={() => toggle(c.id)}
                          >
                            <Icon.Minus size={14} /> Remove
                          </Button>
                        ) : (
                          <Button
                            variant={isFull ? "ghost" : "primary"}
                            disabled={locked || isFull}
                            loading={toggling === c.id}
                            onClick={() => toggle(c.id)}
                          >
                            {isFull ? (
                              <>
                                <Icon.Lock size={14} /> Full
                              </>
                            ) : (
                              <>
                                <Icon.Plus size={14} /> Add
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Selected summary */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-bold text-ink-900">
              Selected Courses ({selectedCourses.length})
            </h3>
            {selectedCourses.length === 0 ? (
              <p className="py-6 text-center text-xs text-ink-400">
                No courses selected yet.
              </p>
            ) : (
              <div className="space-y-2">
                {selectedCourses.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-ink-800">
                        {c.code}
                      </p>
                      <p className="truncate text-[11px] text-ink-400">{c.title}</p>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-brand-600">
                      {c.credits}cr
                    </span>
                  </div>
                ))}
                <div className="mt-2 flex items-center justify-between border-t border-ink-100 pt-3 text-sm">
                  <span className="font-semibold text-ink-700">Total</span>
                  <span className="font-extrabold text-brand-600">
                    {data.totalCredits} credits
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2 text-brand-700">
              <Icon.Info size={16} />
              <h3 className="text-sm font-bold">How advising works</h3>
            </div>
            <ul className="mt-2 space-y-1.5 text-xs text-ink-500">
              <li>• Credits update in real time as you add/remove.</li>
              <li>• Cannot exceed {data.advising.maxCredits} credits.</li>
              <li>• Must meet minimum {data.advising.minCredits} credits.</li>
              <li>• Pending fines lock your registration.</li>
            </ul>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={finalize}
        loading={finalizing}
        title="Finalize Advising?"
        message={
          <>
            You are about to finalize{" "}
            <strong>{data.totalCredits} credits</strong> across{" "}
            <strong>{selectedCourses.length} course{selectedCourses.length === 1 ? "" : "s"}</strong>{" "}
            for {data.advising.term}. You can modify later before the deadline.
          </>
        }
        confirmLabel="Confirm & Finalize"
      />
    </div>
  );
}
