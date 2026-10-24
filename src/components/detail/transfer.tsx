"use client";

// Move recce / installation jobs to another person (one store, several, or
// everything a person still has pending). Same rules as POST /stores/transfer.

import React, { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, History, Search, UserX } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/src/lib/api";
import { Btn, Dialog, Field, Section, cx, useInputClass, useSurface } from "./kit";
import { formatDateTime } from "./format";

export type TransferStage = "RECCE" | "INSTALLATION";

const TRANSFERABLE: Record<TransferStage, string[]> = {
  RECCE: ["RECCE_ASSIGNED", "RECCE_REJECTED"],
  INSTALLATION: ["INSTALLATION_ASSIGNED", "INSTALLATION_REJECTED", "RECCE_APPROVED"],
};
const assigneeOf = (store: any, stage: TransferStage) =>
  stage === "RECCE" ? store?.workflow?.recceAssignedTo : store?.workflow?.installationAssignedTo;
const nameOf = (v: any) => (v && typeof v === "object" ? v.name || "" : "");

/** Can this store's job move to someone else right now? (nobody has submitted work yet) */
export const canTransfer = (store: any, stage: TransferStage) =>
  !!assigneeOf(store, stage) && TRANSFERABLE[stage].includes(String(store?.currentStatus));

/** Can the person be taken off without a replacement? (only before they started) */
export const canUnassign = (store: any, stage: TransferStage) =>
  !!assigneeOf(store, stage) &&
  (stage === "RECCE" ? ["RECCE_ASSIGNED"] : ["INSTALLATION_ASSIGNED", "RECCE_APPROVED"]).includes(String(store?.currentStatus));

type Person = { _id: string; name: string; email?: string };

export const usePeople = (stage: TransferStage | null, open: boolean) => {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!open || !stage) return;
    setLoading(true);
    api
      .get(`/users/role/${stage}`)
      .then((r) => setPeople((r.data?.users || []).sort((a: Person, b: Person) => a.name.localeCompare(b.name))))
      .catch(() => setPeople([]))
      .finally(() => setLoading(false));
  }, [stage, open]);
  return { people, loading };
};

export const PersonPicker = ({
  people,
  loading,
  value,
  onChange,
  exclude = [],
}: {
  people: Person[];
  loading: boolean;
  value: string;
  onChange: (id: string) => void;
  exclude?: string[];
}) => {
  const s = useSurface();
  const inputClass = useInputClass();
  const [q, setQ] = useState("");
  const list = people.filter((p) => !exclude.includes(p._id) && `${p.name} ${p.email || ""}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div className="relative">
        <Search className={cx("pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", s.faint)} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people…" className={cx(inputClass, "pl-9")} aria-label="Search people" />
      </div>
      <div className={cx("mt-2 max-h-56 overflow-y-auto rounded-lg border", s.dark ? "border-gray-800" : "border-gray-200")} role="listbox">
        {loading ? (
          <p className={cx("px-3 py-3 text-sm", s.muted)}>Loading…</p>
        ) : list.length === 0 ? (
          <p className={cx("px-3 py-3 text-sm", s.muted)}>No one found</p>
        ) : (
          list.map((p) => (
            <button
              key={p._id}
              type="button"
              role="option"
              aria-selected={value === p._id}
              onClick={() => onChange(p._id)}
              className={cx(
                "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm",
                value === p._id ? (s.dark ? "bg-yellow-500/15" : "bg-yellow-50") : s.hover
              )}
            >
              <span className={cx("font-medium", s.text)}>{p.name}</span>
              <span className={cx("truncate text-xs", s.muted)}>{p.email}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

/** Transfer one or several stores' recce or installation job to another person. */
export const TransferDialog = ({
  open,
  onClose,
  stage,
  stores,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  stage: TransferStage;
  stores: any[];
  onDone?: () => void;
}) => {
  const s = useSurface();
  const inputClass = useInputClass();
  const { people, loading } = usePeople(stage, open);
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setTo("");
      setReason("");
    }
  }, [open]);

  const eligible = useMemo(() => stores.filter((st) => canTransfer(st, stage)), [stores, stage]);
  const notEligible = stores.length - eligible.length;
  const currentNames = Array.from(new Set(eligible.map((st) => nameOf(assigneeOf(st, stage))).filter(Boolean)));
  const currentIds = eligible.length === 1 ? [String(assigneeOf(eligible[0], stage)?._id || assigneeOf(eligible[0], stage) || "")] : [];
  const what = stage === "RECCE" ? "recce" : "installation";

  const submit = async () => {
    if (!to) return toast.error("Pick who takes over");
    setBusy(true);
    try {
      const { data } = await api.post("/stores/transfer", { storeIds: eligible.map((st) => st._id), userId: to, stage, reason });
      toast.success(data.message || "Transferred");
      if (data.skipped?.length) toast(data.skipped.map((x: any) => `${x.dealerCode}: ${x.reason}`).join("\n"), { duration: 6000 });
      onDone?.();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Transfer failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => !busy && onClose()}
      title={`Transfer ${what}`}
      description={
        eligible.length === 1
          ? `${eligible[0].storeName || eligible[0].dealerCode} · now with ${currentNames[0] || "—"}`
          : `${eligible.length} store${eligible.length === 1 ? "" : "s"}${currentNames.length ? ` · now with ${currentNames.slice(0, 3).join(", ")}${currentNames.length > 3 ? "…" : ""}` : ""}`
      }
      icon={<ArrowRightLeft className="h-5 w-5 text-yellow-500" />}
      footer={
        <>
          <Btn onClick={onClose} disabled={busy}>
            Cancel
          </Btn>
          <Btn variant="primary" className="ml-auto" loading={busy} disabled={!to || eligible.length === 0} onClick={submit}>
            Transfer {eligible.length > 1 ? `${eligible.length} stores` : ""}
          </Btn>
        </>
      }
    >
      <div className="space-y-3">
        {notEligible > 0 && (
          <p className={cx("rounded-lg px-3 py-2 text-xs", s.dark ? "bg-amber-950/50 text-amber-200" : "bg-amber-50 text-amber-900")}>
            {notEligible} selected store{notEligible === 1 ? " is" : "s are"} skipped: no {what} person yet, or the {what} was already submitted.
          </p>
        )}
        <Field label="New person" required>
          <PersonPicker people={people} loading={loading} value={to} onChange={setTo} exclude={currentIds} />
        </Field>
        <Field label="Reason" hint="Optional. Kept in the store's history.">
          <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="e.g. on leave" className={inputClass} />
        </Field>
        <p className={cx("text-xs", s.muted)}>
          Status and any saved work stay as they are. The job leaves the old person&apos;s list and shows up in the new person&apos;s app on their next refresh.
        </p>
      </div>
    </Dialog>
  );
};

/** Move everything a person still has pending (recce and/or installation). */
export const TransferAllDialog = ({
  open,
  onClose,
  user,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  user: { _id: string; name: string } | null;
  onDone?: () => void;
}) => {
  const s = useSurface();
  const inputClass = useInputClass();
  const [counts, setCounts] = useState<{ recce: number; installation: number } | null>(null);
  const [recceTo, setRecceTo] = useState("");
  const [installTo, setInstallTo] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const recce = usePeople("RECCE", open && !!counts?.recce);
  const install = usePeople("INSTALLATION", open && !!counts?.installation);

  useEffect(() => {
    if (!open || !user) return;
    setCounts(null);
    setRecceTo("");
    setInstallTo("");
    setReason("");
    api
      .get(`/stores/pending-work/${user._id}`)
      .then((r) => setCounts(r.data?.counts || { recce: 0, installation: 0 }))
      .catch(() => setCounts({ recce: 0, installation: 0 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?._id]);

  const submit = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const { data } = await api.post("/stores/transfer-user-work", {
        fromUserId: user._id,
        recceToUserId: counts?.recce ? recceTo || undefined : undefined,
        installationToUserId: counts?.installation ? installTo || undefined : undefined,
        reason,
      });
      toast.success(data.message || "Moved");
      onDone?.();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Transfer failed");
    } finally {
      setBusy(false);
    }
  };

  const nothing = counts && !counts.recce && !counts.installation;
  return (
    <Dialog
      open={open}
      onClose={() => !busy && onClose()}
      title="Transfer pending work"
      description={user ? `Everything ${user.name} hasn't submitted yet` : undefined}
      icon={<UserX className="h-5 w-5 text-yellow-500" />}
      footer={
        <>
          <Btn onClick={onClose} disabled={busy}>
            {nothing ? "Close" : "Cancel"}
          </Btn>
          {!nothing && (
            <Btn variant="primary" className="ml-auto" loading={busy} disabled={!counts || (!recceTo && !installTo)} onClick={submit}>
              Transfer
            </Btn>
          )}
        </>
      }
    >
      {!counts ? (
        <p className={cx("text-sm", s.muted)}>Checking pending work…</p>
      ) : nothing ? (
        <p className={cx("text-sm", s.body)}>{user?.name} has no pending recce or installation jobs.</p>
      ) : (
        <div className="space-y-4">
          {counts.recce > 0 && (
            <Field label={`${counts.recce} recce job${counts.recce === 1 ? "" : "s"} → move to`}>
              <PersonPicker people={recce.people} loading={recce.loading} value={recceTo} onChange={setRecceTo} exclude={user ? [user._id] : []} />
            </Field>
          )}
          {counts.installation > 0 && (
            <Field label={`${counts.installation} installation job${counts.installation === 1 ? "" : "s"} → move to`}>
              <PersonPicker people={install.people} loading={install.loading} value={installTo} onChange={setInstallTo} exclude={user ? [user._id] : []} />
            </Field>
          )}
          <Field label="Reason" hint="Optional. Kept in each store's history.">
            <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="e.g. on leave this week" className={inputClass} />
          </Field>
          <p className={cx("text-xs", s.muted)}>Leave a person empty to keep that kind of work with {user?.name}.</p>
        </div>
      )}
    </Dialog>
  );
};

/** Who had each job, newest first. */
export const TransferHistoryCard = ({ history }: { history?: any[] }) => {
  const s = useSurface();
  if (!history?.length) return null;
  const items = [...history].reverse();
  return (
    <Section title="Assignment history" icon={<History className="h-4 w-4" />}>
      <ul className="space-y-3 text-sm">
        {items.map((h, i) => (
          <li key={i} className="flex gap-3">
            <span className={cx("mt-1.5 h-2 w-2 shrink-0 rounded-full", h.action === "UNASSIGN" ? "bg-red-500" : "bg-yellow-500")} />
            <div className="min-w-0">
              <p className={s.body}>
                <span className="font-semibold">{h.stage === "RECCE" ? "Recce" : "Installation"}</span>{" "}
                {h.action === "UNASSIGN" ? (
                  <>taken off {h.fromName || "—"}</>
                ) : (
                  <>
                    moved from {h.fromName || "—"} to <span className="font-semibold">{h.toName || "—"}</span>
                  </>
                )}
              </p>
              <p className={cx("text-xs", s.muted)}>
                {formatDateTime(h.at)} · by {h.byName || "—"}
                {h.reason && <> · “{h.reason}”</>}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
};
