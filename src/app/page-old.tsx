import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-950 to-black text-zinc-100">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-900/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="Elora Logo"
              width={36}
              height={36}
              priority
            />
            <span className="text-lg font-semibold tracking-tight">Elora</span>
          </div>

          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-300 hover:text-white transition"
            >
              Login
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 transition"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-200px] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[120px]" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-28 sm:px-6 sm:py-36">
          <div className="max-w-3xl">
            <span className="inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-medium text-zinc-300">
              Elora · Operations Platform
            </span>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl">
              Build. Operate.
              <br />
              <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                Scale with Confidence.
              </span>
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-zinc-300">
              Elora is a unified operations platform for modern teams — managing
              users, roles, workflows, and execution without operational chaos.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition"
              >
                Get Started
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-base font-semibold text-zinc-100 hover:bg-white/10 transition"
              >
                Request Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Role & Access Control",
              desc: "Granular permission systems built for real operational complexity.",
            },
            {
              title: "Workflow Orchestration",
              desc: "Design, monitor, and execute workflows without bottlenecks.",
            },
            {
              title: "Operational Visibility",
              desc: "Clear insights into execution, ownership, and system health.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:bg-white/10 hover:shadow-xl"
            >
              <h3 className="text-lg font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm text-zinc-300">{f.desc}</p>
              <div className="mt-4 h-1 w-10 rounded-full bg-blue-500 opacity-0 transition group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Designed for teams that operate at scale
          </h2>
          <p className="mt-4 text-zinc-400">
            Elora brings structure, clarity, and control to complex systems.
          </p>
          <div className="mt-8">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-3 text-base font-semibold text-zinc-900 hover:bg-zinc-200 transition"
            >
              Login to Elora
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-black">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-zinc-500">
            © {new Date().getFullYear()} Elora. All rights reserved.
          </span>
          <span className="text-sm text-zinc-500">
            Built for modern operations.
          </span>
        </div>
      </footer>
    </div>
  );
}
