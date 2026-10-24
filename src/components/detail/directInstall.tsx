"use client";

// Send new stores straight to an installer, skipping the recce
// (POST /stores/direct-install). One store: pick its boards here. Several:
// each store's own size and board type become its board.

import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Zap } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/src/lib/api";
import { Btn, Dialog, Field, cx, useInputClass, useSurface } from "./kit";
import { formatINR } from "./format";
import { PersonPicker, usePeople } from "./transfer";

const DIRECT_ASSIGNABLE = ["UPLOADED", "MANUALLY_ADDED", "RECCE_ASSIGNED"];

/** New store (or recce not started) that can go straight to installation. */
export const canDirectInstall = (store: any) => DIRECT_ASSIGNABLE.includes(String(store?.currentStatus)) && !store?.recce?.submittedDate;

type ClientElement = { elementId: string; elementName: string; customRate: number };
type BoardRow = { elementId: string; width: string; height: string; unit: "ft" | "in"; quantity: string };

const boardSqft = (b: BoardRow) => {
  const f = b.unit === "in" ? 1 / 12 : 1;
  return (Number(b.width) || 0) * f * ((Number(b.height) || 0) * f);
};

export const DirectInstallDialog = ({
  open,
  onClose,
  stores,
  onDone,
  showMoney = true,
}: {
  open: boolean;
  onClose: () => void;
  stores: any[];
  onDone?: () => void;
  showMoney?: boolean;
}) => {
  const s = useSurface();
  const inputClass = useInputClass();
  const { people, loading } = usePeople("INSTALLATION", open);
  const eligible = useMemo(() => stores.filter(canDirectInstall), [stores]);
  const single = eligible.length === 1 ? eligible[0] : null;

  const [installer, setInstaller] = useState("");
  const [elements, setElements] = useState<ClientElement[]>([]);
  const [boards, setBoards] = useState<BoardRow[]>([]);
  const [busy, setBusy] = useState(false);

  // One store: load its client's elements and start from the store's own size
  useEffect(() => {
    if (!open) return;
    setInstaller("");
    setElements([]);
    setBoards([]);
    if (!single) return;
    const clientId = single.clientId?._id || single.clientId;
    if (!clientId) return;
    api
      .get(`/clients/${clientId}`)
      .then((r) => {
        const els: ClientElement[] = (r.data?.elements || []).map((e: any) => ({ elementId: String(e.elementId), elementName: e.elementName, customRate: Number(e.customRate) || 0 }));
        setElements(els);
        const type = String(single.specs?.type || "").trim().toLowerCase();
        const match = els.find((e) => e.elementName.trim().toLowerCase() === type);
        setBoards([
          {
            elementId: match?.elementId || "",
            width: single.specs?.width ? String(single.specs.width) : "",
            height: single.specs?.height ? String(single.specs.height) : "",
            unit: "ft",
            quantity: String(single.specs?.qty || 1),
          },
        ]);
      })
      .catch(() => toast.error("Could not load the client's elements"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, single?._id]);

  const setBoard = (i: number, patch: Partial<BoardRow>) => setBoards((prev) => prev.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const rateOf = (id: string) => elements.find((e) => e.elementId === id)?.customRate || 0;
  const total = boards.reduce((a, b) => a + boardSqft(b) * rateOf(b.elementId) * (Number(b.quantity) || 1), 0);
  const boardsValid = boards.length > 0 && boards.every((b) => b.elementId && Number(b.width) > 0 && Number(b.height) > 0 && Number(b.quantity) >= 1);
  const noClient = !!single && !(single.clientId?._id || single.clientId);

  const submit = async () => {
    if (!installer) return toast.error("Pick an installer");
    if (single && !boardsValid) return toast.error("Every board needs an element, width and height");
    setBusy(true);
    try {
      const items = single
        ? [{ storeId: single._id, boards: boards.map((b) => ({ elementId: b.elementId, width: Number(b.width), height: Number(b.height), unit: b.unit, quantity: Number(b.quantity) || 1 })) }]
        : eligible.map((st) => ({ storeId: st._id }));
      const { data } = await api.post("/stores/direct-install", { userId: installer, items });
      toast.success(data.message || "Sent to installer");
      if (data.skipped?.length) toast(data.skipped.map((x: any) => `${x.dealerCode}: ${x.reason}`).join("\n"), { duration: 8000 });
      onDone?.();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Direct installation failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => !busy && onClose()}
      title="Direct installation"
      description={single ? `${single.storeName || single.dealerCode} · skip the recce and send it to an installer` : `${eligible.length} stores · skip the recce and send them to an installer`}
      icon={<Zap className="h-5 w-5 text-yellow-500" />}
      footer={
        <>
          <Btn onClick={onClose} disabled={busy}>
            Cancel
          </Btn>
          <Btn variant="primary" className="ml-auto" loading={busy} disabled={!installer || eligible.length === 0 || (!!single && (!boardsValid || noClient))} onClick={submit}>
            Send to installer
          </Btn>
        </>
      }
    >
      <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
        {stores.length > eligible.length && (
          <p className={cx("rounded-lg px-3 py-2 text-xs", s.dark ? "bg-amber-950/50 text-amber-200" : "bg-amber-50 text-amber-900")}>
            {stores.length - eligible.length} selected store{stores.length - eligible.length === 1 ? " is" : "s are"} skipped: the recce already started or finished.
          </p>
        )}

        {single ? (
          noClient ? (
            <p className="text-sm text-red-600">This store has no client, so element rates are unknown. Edit the store and set its client first.</p>
          ) : (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className={cx("text-xs font-semibold", s.body)}>
                  Boards<span className="ml-0.5 text-red-500">*</span>
                </p>
                <Btn size="sm" variant="ghost" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setBoards((p) => [...p, { elementId: "", width: "", height: "", unit: "ft", quantity: "1" }])}>
                  Add board
                </Btn>
              </div>
              <div className="space-y-2">
                {boards.map((b, i) => (
                  <div key={i} className={cx("rounded-lg border p-2", s.dark ? "border-gray-800" : "border-gray-200")}>
                    <div className="flex items-center gap-2">
                      <span className={cx("w-6 shrink-0 text-xs font-bold", s.muted)}>{i + 1}</span>
                      <select value={b.elementId} onChange={(e) => setBoard(i, { elementId: e.target.value })} className={cx(inputClass, "py-1.5")} aria-label={`Board ${i + 1} element`}>
                        <option value="">Element…</option>
                        {elements.map((el) => (
                          <option key={el.elementId} value={el.elementId}>
                            {el.elementName}
                            {showMoney ? ` · ${formatINR(el.customRate)}/sq.ft` : ""}
                          </option>
                        ))}
                      </select>
                      {boards.length > 1 && (
                        <button type="button" onClick={() => setBoards((p) => p.filter((_, j) => j !== i))} className="p-1.5 text-red-500" aria-label={`Remove board ${i + 1}`}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-2 pl-8">
                      <input type="number" min="0" step="any" value={b.width} onChange={(e) => setBoard(i, { width: e.target.value })} placeholder="Width" className={cx(inputClass, "py-1.5")} aria-label="Width" />
                      <input type="number" min="0" step="any" value={b.height} onChange={(e) => setBoard(i, { height: e.target.value })} placeholder="Height" className={cx(inputClass, "py-1.5")} aria-label="Height" />
                      <select value={b.unit} onChange={(e) => setBoard(i, { unit: e.target.value as "ft" | "in" })} className={cx(inputClass, "py-1.5")} aria-label="Unit">
                        <option value="ft">ft</option>
                        <option value="in">in</option>
                      </select>
                      <input type="number" min="1" step="1" value={b.quantity} onChange={(e) => setBoard(i, { quantity: e.target.value })} placeholder="Qty" className={cx(inputClass, "py-1.5")} aria-label="Quantity" />
                    </div>
                    <p className={cx("mt-1 pl-8 text-xs", s.muted)}>
                      {boardSqft(b).toFixed(2)} sq.ft each
                      {showMoney && b.elementId ? ` · ${formatINR(boardSqft(b) * rateOf(b.elementId) * (Number(b.quantity) || 1))}` : ""}
                    </p>
                  </div>
                ))}
              </div>
              {showMoney && boards.length > 0 && <p className={cx("mt-2 text-right text-sm font-semibold", s.text)}>Total {formatINR(total)}</p>}
            </div>
          )
        ) : (
          <p className={cx("text-sm", s.body)}>
            Each store gets one board from its own size and board type. Stores without a size, or whose board type isn&apos;t one of the client&apos;s elements, are skipped. Open those one at a time to enter boards.
          </p>
        )}

        <Field label="Installer" required>
          <PersonPicker people={people} loading={loading} value={installer} onChange={setInstaller} />
        </Field>
        <p className={cx("text-xs", s.muted)}>
          The recce is marked done and approved, and the store shows up in the installer&apos;s app. Recce photos can be added later from Direct Installation.
        </p>
      </div>
    </Dialog>
  );
};
