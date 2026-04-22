"use client";

import { useAuth } from "@/context/auth-context";
import Link from "next/link";

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)]">{title}</h1>
      <p className="max-w-2xl text-sm leading-relaxed text-[var(--muted)]">{subtitle}</p>
    </div>
  );
}

function Card({
  title,
  body,
  href,
  tone = "neutral",
}: {
  title: string;
  body: string;
  href: string;
  tone?: "neutral" | "accent";
}) {
  return (
    <Link
      href={href}
      className={`group block rounded-2xl border bg-[var(--surface)] p-5 shadow-sm transition hover:-translate-y-0.5 ${
        tone === "accent"
          ? "border-[var(--accent)]/25 hover:border-[var(--accent)]/45 hover:bg-[var(--accent-soft)]"
          : "border-[var(--border)] hover:border-[var(--accent)]/35"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--text)] group-hover:text-[var(--accent)]">
            {title}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{body}</p>
        </div>
        <span
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] transition group-hover:border-[var(--accent)]/25 group-hover:text-[var(--accent)]"
          aria-hidden="true"
        >
          →
        </span>
      </div>
    </Link>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--faint)]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-[var(--text)]">{value}</p>
    </div>
  );
}

function Placeholder({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--muted)]">
      <p className="font-semibold text-[var(--text)]">{title}</p>
      <p className="mt-1">{body}</p>
    </div>
  );
}

function StudentOverview({ name }: { name: string }) {
  return (
    <div className="space-y-8">
      <SectionHeader
        title={`Welcome, ${name}`}
        subtitle="Choose a program, continue assignments, and keep your practice consistent."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Digital SAT" body="Math + Reading & Writing practice." href="/dashboard/dsat" tone="accent" />
        <Card title="IELTS" body="Listening, Reading, Writing, Speaking." href="/dashboard/ielts" />
        <Card title="General English" body="Vocabulary, grammar, and lessons." href="/dashboard/general-english" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Placeholder title="Up next" body="Your next assignment / lesson will appear here." />
        </div>
        <div className="space-y-4">
          <MiniStat label="This week" value="0 sessions" />
          <MiniStat label="Streak" value="0 days" />
        </div>
      </div>
    </div>
  );
}

function ParentOverview({ name }: { name: string }) {
  return (
    <div className="space-y-8">
      <SectionHeader
        title={`Parent overview`}
        subtitle="See your student’s progress, assignments, and teacher notes in one place."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <MiniStat label="Active students" value="1" />
        <MiniStat label="Assignments due" value="0" />
        <MiniStat label="Messages" value="0" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm lg:col-span-2">
          <p className="text-sm font-semibold text-[var(--text)]">Student snapshot</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Next: link parent accounts to a student record and show real data.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--faint)]">Current focus</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text)]">Digital SAT</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--faint)]">Last activity</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text)]">—</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Card title="Assignments" body="See what’s due and what’s completed." href="/dashboard/assignments" />
          <Card title="Gradebook" body="View scores and progress over time." href="/dashboard/gradebook" />
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <p className="text-sm font-semibold text-[var(--text)]">Account</p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Signed in as <span className="font-medium text-[var(--text)]">{name}</span>. Manage details in{" "}
          <Link className="font-semibold text-[var(--accent)] hover:underline" href="/dashboard/account">
            Account
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function AdminOverview() {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="Admin overview"
        subtitle="Manage users, review reports, and keep operations clean."
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <MiniStat label="Users" value="—" />
        <MiniStat label="Active" value="—" />
        <MiniStat label="Disabled" value="—" />
        <MiniStat label="New this week" value="—" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Users & roles" body="Create accounts, disable access, reset passwords." href="/dashboard/users" tone="accent" />
        <Card title="Reports" body="Overview of usage, performance, and issues." href="/dashboard/reports" />
        <Card title="Manage lessons" body="Review and organize learning content." href="/dashboard/manage-lessons" />
      </div>

      <Placeholder title="System alerts" body="Surface errors, failed jobs, and important notices here." />
    </div>
  );
}

function CreatorOverview() {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="Creator overview"
        subtitle="Build content, iterate fast, and track what students are using."
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <MiniStat label="Lessons" value="—" />
        <MiniStat label="Assignments" value="—" />
        <MiniStat label="Exams" value="—" />
        <MiniStat label="Active exams" value="—" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Manage lessons" body="Create, edit, and organize lesson content." href="/dashboard/manage-lessons" tone="accent" />
        <Card title="Exams" body="Build exam content and manage question sets." href="/dashboard/exams" />
        <Card title="Reports" body="See what content performs best." href="/dashboard/reports" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Placeholder title="Content queue" body="Drafts, reviews, and rollout notes will appear here." />
        </div>
        <Placeholder title="Notes" body="Quick creator notes / reminders." />
      </div>
    </div>
  );
}

export function DashboardHome() {
  const { user } = useAuth();
  if (!user) return null;

  switch (user.role) {
    case "student":
      return <StudentOverview name={user.name} />;
    case "parent":
      return <ParentOverview name={user.name} />;
    case "admin":
      return <AdminOverview />;
    case "creator":
      return <CreatorOverview />;
    case "teacher":
      return (
        <div className="space-y-8">
          <SectionHeader
            title="Teaching overview"
            subtitle="Jump into your classes, roster, and lesson management."
          />
          <div className="grid gap-4 lg:grid-cols-3">
            <Card title="My classes" body="Schedules & groups." href="/dashboard/classes" tone="accent" />
            <Card title="Roster" body="Students, notes, and parent contacts." href="/dashboard/roster" />
            <Card title="Manage lessons" body="Create and organize lessons." href="/dashboard/manage-lessons" />
          </div>
          <Placeholder title="Today" body="Today’s sessions / reminders will appear here." />
        </div>
      );
    default:
      return (
        <div className="space-y-6">
          <SectionHeader title="Overview" subtitle="Dashboard overview." />
          <Placeholder title="No role dashboard yet" body="This role doesn’t have a dashboard layout yet." />
        </div>
      );
  }
}
