"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/src/lib/api";
import toast from "react-hot-toast";
import { usePermissions } from "@/src/hooks/usePermissions";
import {
  Building2,
  MapPin,
  Phone,
  Wrench,
  ClipboardList,
  Camera,
  Plus,
  Trash2,
  Save,
  Search,
  CheckSquare,
  LocateFixed,
  X,
  Info,
  Ruler,
} from "lucide-react";
import { Btn, DetailHeader, Dialog, Field, NotFound, Section, StickyBar, cx, formatINR, useInputClass, useSurface } from "@/src/components/detail";
import { Skeleton } from "@/src/components/ui/Skeleton";

type Board = { elementId: string; elementName: string; quantity: number; customRate: number; width: string; height: string; unit: string };

const emptyBoard = (): Board => ({ elementId: "", elementName: "", quantity: 1, customRate: 0, width: "", height: "", unit: "ft" });

const initialFormState = {
  zone: "",
  state: "",
  district: "",
  city: "",
  vendorCode: "",
  dealerCode: "",
  dealerName: "",
  dealerAddress: "",
  mobile: "",
  clientCode: "",
  latitude: "",
  longitude: "",
  directInstallation: false,
  installationAssignedTo: "",
  boards: [] as Board[],
};
type FormState = typeof initialFormState;

/** Board area in square feet (inches are converted). */
const boardSqft = (b: Board) => {
  const wv = Number(b.width || 0);
  const hv = Number(b.height || 0);
  const f = b.unit === "in" ? 1 / 12 : 1;
  return wv * f * (hv * f);
};

export default function AddStorePage() {
  const router = useRouter();
  const s = useSurface();
  const inputClass = useInputClass();
  const { hasPermission } = usePermissions();

  const [form, setForm] = useState<FormState>(initialFormState);
  const [clients, setClients] = useState<any[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [installUsers, setInstallUsers] = useState<any[]>([]);
  const [installUsersLoading, setInstallUsersLoading] = useState(false);
  const [installSearch, setInstallSearch] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [locating, setLocating] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  const dirty = JSON.stringify(form) !== JSON.stringify(initialFormState) || photos.length > 0;

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/clients");
        setClients(data.clients || data || []);
      } catch {
        toast.error("Failed to load clients");
      } finally {
        setClientsLoading(false);
      }
    })();
  }, []);

  // Warn before closing the tab with unsaved work.
  useEffect(() => {
    if (!dirty) return;
    const onBefore = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBefore);
    return () => window.removeEventListener("beforeunload", onBefore);
  }, [dirty]);

  // Free photo previews when leaving the page.
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p)), []); // eslint-disable-line react-hooks/exhaustive-deps

  const clientsMap = useMemo(() => {
    const m = new Map<string, any>();
    clients.forEach((c) => c.clientCode && m.set(c.clientCode, c));
    return m;
  }, [clients]);
  const selectedClient = clientsMap.get(form.clientCode);
  const clientElements: any[] = selectedClient?.elements || [];

  const set = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }));
  const onInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => set({ [e.target.name]: e.target.value } as Partial<FormState>);
  const setBoard = (index: number, patch: Partial<Board>) =>
    setForm((prev) => ({ ...prev, boards: prev.boards.map((b, i) => (i === index ? { ...b, ...patch } : b)) }));

  const loadInstallUsers = async () => {
    setInstallUsersLoading(true);
    try {
      const { data } = await api.get(`/users/role/INSTALLATION`);
      setInstallUsers(data.users || []);
    } catch {
      setInstallUsers([]);
      toast.error("Failed to load installation users");
    } finally {
      setInstallUsersLoading(false);
    }
  };

  const setDirect = (direct: boolean) => {
    if (direct === form.directInstallation) return;
    set({
      directInstallation: direct,
      installationAssignedTo: "",
      boards: direct && form.boards.length === 0 ? [emptyBoard()] : form.boards,
    });
    if (direct) {
      if (!installUsers.length) loadInstallUsers();
    } else {
      setInstallSearch("");
      previews.forEach((p) => URL.revokeObjectURL(p));
      setPhotos([]);
      setPreviews([]);
    }
  };

  const addPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).slice(0, 10 - photos.length);
    setPhotos((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  };
  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  /**
   * Address for a GPS point, from OpenStreetMap (the same fallback the mobile
   * app uses). The mobile app's Google key is locked to the Android app, so the
   * browser can't use it.
   */
  const reverseGeocode = async (lat: number, lng: number) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=en`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) throw new Error(`Address lookup failed (${res.status})`);
    const data = await res.json();
    const a = data?.address || {};
    const clean = (v?: string) => (v || "").replace(/\s+(District|Tehsil)$/i, "").trim();
    const street = [a.house_number, a.building, a.road].filter(Boolean).join(", ");
    const area = [a.neighbourhood, a.suburb, a.quarter].filter(Boolean).filter((v: string, i: number, arr: string[]) => arr.indexOf(v) === i).join(", ");
    const city = a.city || a.town || a.village || a.municipality || a.suburb || "";
    const district = clean(a.state_district || a.county || "");
    const state = a.state || "";
    const postcode = a.postcode || "";
    const seen = new Set<string>();
    const address = [street, area, city, district, state, postcode]
      .filter((p) => {
        const k = String(p || "").trim().toLowerCase();
        if (!k || seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .join(", ");
    return { address: address || data?.display_name || "", city, district, state };
  };

  const locateMe = () => {
    if (!navigator.geolocation) return toast.error("Location is not available in this browser");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        set({ latitude: latitude.toFixed(6), longitude: longitude.toFixed(6) });
        try {
          const geo = await reverseGeocode(latitude, longitude);
          if (geo.address || geo.city || geo.state) {
            // Same as the mobile app: the GPS result replaces what's typed
            setForm((prev) => ({
              ...prev,
              dealerAddress: geo.address || prev.dealerAddress,
              city: geo.city || prev.city,
              district: geo.district || prev.district,
              state: geo.state || prev.state,
            }));
            toast.success("Location and address filled in");
          } else {
            toast("Coordinates added. Couldn't find the address, please type it in.");
          }
        } catch {
          toast("Coordinates added. Couldn't look up the address, please type it in.");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        toast.error(
          err?.code === 1
            ? "Location permission is blocked. Allow location for this site in your browser."
            : "Could not get your location"
        );
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  /* ---------------- validation (same rules as before, shown inline) ---------------- */
  const errors: Record<string, string> = {};
  if (!form.clientCode) errors.clientCode = "Client code is required";
  if (!form.dealerCode) errors.dealerCode = "Dealer code is required";
  if (!form.dealerName) errors.dealerName = "Dealer name is required";
  if (!form.district) errors.district = "District is required";
  if (!form.city) errors.city = "City is required";
  if (form.mobile && form.mobile.length !== 10) errors.mobile = "Mobile number must be exactly 10 digits";
  if (form.directInstallation) {
    if (form.boards.length === 0) errors.boards = "Add at least one board";
    form.boards.forEach((b, i) => {
      if (!b.width) errors[`b${i}w`] = "Required";
      if (!b.height) errors[`b${i}h`] = "Required";
      if (!b.elementId) errors[`b${i}e`] = "Pick an element";
    });
    if (!form.installationAssignedTo) errors.installer = "Pick the installation user";
  }
  const err = (k: string) => (triedSubmit ? errors[k] : undefined);
  const errorCount = Object.keys(errors).length;

  const totalArea = form.boards.reduce((sum, b) => sum + boardSqft(b) * (b.quantity || 1), 0);
  const totalCost = form.boards.reduce((sum, b) => sum + boardSqft(b) * (b.quantity || 1) * (b.customRate || 0), 0);
  const installer = installUsers.find((u) => u._id === form.installationAssignedTo);
  const filteredInstallers = installUsers.filter((u) => {
    const q = installSearch.trim().toLowerCase();
    return !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  /* ---------------- save (same payload as the old Add Store popup) ---------------- */
  const save = async (addAnother: boolean) => {
    setTriedSubmit(true);
    if (errorCount > 0) {
      toast.error(errors.mobile || (errorCount === 1 ? Object.values(errors)[0] : `Fix ${errorCount} fields marked in red`));
      // Scroll to the first field with a problem.
      setTimeout(() => document.querySelector("[data-invalid='true']")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
      return;
    }
    setSaving(true);
    try {
      const location = {
        zone: form.zone,
        state: form.state,
        district: form.district,
        city: form.city,
        address: form.dealerAddress,
        ...(form.latitude &&
          form.longitude && {
            coordinates: { lat: Number(form.latitude), lng: Number(form.longitude) },
          }),
      };
      const contact = { personName: form.dealerName, mobile: form.mobile };
      let res: any;
      if (form.directInstallation && photos.length > 0) {
        const fd = new FormData();
        fd.append("dealerCode", form.dealerCode);
        fd.append("storeName", form.dealerName);
        if (form.vendorCode) fd.append("vendorCode", form.vendorCode);
        if (form.clientCode) fd.append("clientCode", form.clientCode);
        fd.append("location", JSON.stringify(location));
        fd.append("contact", JSON.stringify(contact));
        fd.append("directInstallation", "true");
        fd.append("boards", JSON.stringify(form.boards));
        fd.append("installationAssignedTo", form.installationAssignedTo);
        photos.forEach((file) => fd.append("initialPhotos", file));
        res = await api.post("/stores", fd);
      } else {
        res = await api.post("/stores", {
          dealerCode: form.dealerCode,
          storeName: form.dealerName,
          vendorCode: form.vendorCode,
          clientCode: form.clientCode,
          location,
          contact,
          directInstallation: form.directInstallation,
          ...(form.directInstallation && {
            boards: form.boards,
            installationAssignedTo: form.installationAssignedTo,
          }),
        });
      }
      toast.success("Store added successfully");
      if (addAnother) {
        // Keep the client, clear the rest.
        previews.forEach((p) => URL.revokeObjectURL(p));
        setPhotos([]);
        setPreviews([]);
        setForm({ ...initialFormState, clientCode: form.clientCode });
        setTriedSubmit(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const newId = res?.data?.store?._id || res?.data?._id;
        router.push(newId ? `/store/${newId}` : "/stores");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add store");
    } finally {
      setSaving(false);
    }
  };

  const leave = () => (dirty ? setDiscardOpen(true) : router.push("/stores"));

  if (!hasPermission("stores", "create")) {
    return <NotFound title="You cannot add stores" hint="Ask an admin for the 'create stores' permission." backHref="/stores" backLabel="Back to stores" />;
  }

  const fieldInput = (k: string) => cx(inputClass, err(k) && "border-red-500 focus:border-red-500 focus:ring-red-500/30");
  const labelSm = cx("mb-1 block text-xs font-medium", s.muted);

  return (
    <div className="mx-auto max-w-7xl pb-32">
      <DetailHeader
        backHref="/stores"
        eyebrow="Stores"
        title="Add new store"
        meta={<span>Fields marked * are required.</span>}
        actions={
          <Btn variant="secondary" onClick={leave}>
            Cancel
          </Btn>
        }
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(false);
        }}
        className="grid items-start gap-4 lg:grid-cols-3"
        noValidate
      >
        <div className="space-y-4 lg:col-span-2">
          {/* ---------------- client & dealer ---------------- */}
          <Section title="Client & dealer" icon={<Building2 className="h-4 w-4" />} subtitle="Who the store belongs to">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Client" hint="Picking a client fills in the client code and its elements.">
                {clientsLoading ? (
                  <Skeleton className="h-10 w-full rounded-lg" />
                ) : (
                  <select
                    value={selectedClient?._id || ""}
                    onChange={(e) => {
                      const c = clients.find((x) => x._id === e.target.value);
                      // A new client has different elements, so clear picked elements.
                      set({ clientCode: c?.clientCode || "", boards: form.boards.map((b) => ({ ...b, elementId: "", elementName: "", customRate: 0 })) });
                    }}
                    className={inputClass}
                  >
                    <option value="">Select a client...</option>
                    {clients.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.clientName} ({c.clientCode})
                      </option>
                    ))}
                  </select>
                )}
              </Field>
              <div data-invalid={!!err("clientCode")}>
                <Field label="Client code" required error={err("clientCode")}>
                  <input name="clientCode" value={form.clientCode} onChange={onInput} className={fieldInput("clientCode")} placeholder="e.g. CLI001" />
                </Field>
              </div>
              <div data-invalid={!!err("dealerCode")}>
                <Field label="Dealer code" required error={err("dealerCode")}>
                  <input name="dealerCode" value={form.dealerCode} onChange={onInput} className={fieldInput("dealerCode")} autoFocus />
                </Field>
              </div>
              <div data-invalid={!!err("dealerName")}>
                <Field label="Dealer / store name" required error={err("dealerName")}>
                  <input name="dealerName" value={form.dealerName} onChange={onInput} className={fieldInput("dealerName")} />
                </Field>
              </div>
              <Field label="Vendor code">
                <input name="vendorCode" value={form.vendorCode} onChange={onInput} className={inputClass} />
              </Field>
            </div>
          </Section>

          {/* ---------------- location ---------------- */}
          <Section
            title="Location"
            icon={<MapPin className="h-4 w-4" />}
            subtitle="Where the recce or installation team has to go"
            action={
              <Btn type="button" variant="secondary" size="sm" loading={locating} icon={<LocateFixed className="h-4 w-4" />} onClick={locateMe}>
                <span className="hidden sm:inline">Use my location</span>
              </Btn>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Address">
                  <textarea name="dealerAddress" value={form.dealerAddress} onChange={onInput} rows={2} className={cx(inputClass, "resize-none")} />
                </Field>
              </div>
              <div data-invalid={!!err("city")}>
                <Field label="City" required error={err("city")}>
                  <input name="city" value={form.city} onChange={onInput} className={fieldInput("city")} />
                </Field>
              </div>
              <div data-invalid={!!err("district")}>
                <Field label="District" required error={err("district")}>
                  <input name="district" value={form.district} onChange={onInput} className={fieldInput("district")} />
                </Field>
              </div>
              <Field label="State">
                <input name="state" value={form.state} onChange={onInput} className={inputClass} />
              </Field>
              <Field label="Zone">
                <input name="zone" value={form.zone} onChange={onInput} className={inputClass} />
              </Field>
              <Field label="Latitude">
                <input type="number" step="any" name="latitude" value={form.latitude} onChange={onInput} className={inputClass} placeholder="e.g. 28.7041" />
              </Field>
              <Field label="Longitude">
                <input type="number" step="any" name="longitude" value={form.longitude} onChange={onInput} className={inputClass} placeholder="e.g. 77.1025" />
              </Field>
            </div>
          </Section>

          {/* ---------------- contact ---------------- */}
          <Section title="Contact" icon={<Phone className="h-4 w-4" />} subtitle="The dealer name above is saved as the contact person">
            <div className="grid gap-4 sm:grid-cols-2">
              <div data-invalid={!!err("mobile")}>
                <Field label="Mobile number" error={err("mobile")} hint="10 digits, no country code.">
                  <input
                    name="mobile"
                    inputMode="numeric"
                    value={form.mobile}
                    onChange={(e) => set({ mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                    maxLength={10}
                    className={fieldInput("mobile")}
                    placeholder="e.g. 9876543210"
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* ---------------- how work starts ---------------- */}
          <Section title="How work starts" icon={<Wrench className="h-4 w-4" />}>
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="How work starts">
              {[
                { direct: false, title: "Send for recce", desc: "A recce user visits, measures the boards and takes photos. Normal flow.", icon: <ClipboardList className="h-5 w-5" /> },
                { direct: true, title: "Direct installation", desc: "Skip recce. You enter the boards now and assign an installer.", icon: <Wrench className="h-5 w-5" /> },
              ].map((o) => {
                const on = form.directInstallation === o.direct;
                return (
                  <button
                    key={o.title}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setDirect(o.direct)}
                    className={cx(
                      "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                      on ? (s.dark ? "border-yellow-500 bg-yellow-500/10" : "border-yellow-500 bg-yellow-50") : cx(s.sunken, s.hover)
                    )}
                  >
                    <span className={cx("mt-0.5", on ? "text-yellow-600" : s.muted)}>{o.icon}</span>
                    <span>
                      <span className={cx("block text-sm font-semibold", s.text)}>{o.title}</span>
                      <span className={cx("mt-0.5 block text-xs", s.muted)}>{o.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            {form.directInstallation && (
              <div className="mt-5 space-y-6">
                {/* boards */}
                <div data-invalid={!!err("boards")}>
                  <div className="mb-3 flex items-center justify-between">
                    <p className={cx("text-sm font-semibold", s.text)}>
                      Boards <span className="text-red-500">*</span>
                    </p>
                    <Btn type="button" size="sm" variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={() => set({ boards: [...form.boards, emptyBoard()] })}>
                      Add board
                    </Btn>
                  </div>
                  {!form.clientCode && (
                    <p className={cx("mb-3 flex items-center gap-2 text-xs", s.muted)}>
                      <Info className="h-3.5 w-3.5" /> Pick a client first to see its elements.
                    </p>
                  )}
                  {err("boards") && <p className="mb-2 text-sm text-red-500">{err("boards")}</p>}
                  <div className="space-y-3">
                    {form.boards.map((b, i) => {
                      const area = boardSqft(b) * (b.quantity || 1);
                      return (
                        <div key={i} className={cx("rounded-xl border p-3", s.sunken)} data-invalid={!!(err(`b${i}w`) || err(`b${i}h`) || err(`b${i}e`))}>
                          <div className="mb-2 flex items-center justify-between">
                            <span className={cx("text-xs font-bold uppercase tracking-wide", s.muted)}>Board {i + 1}</span>
                            <div className="flex items-center gap-3">
                              {area > 0 && (
                                <span className={cx("text-xs tabular-nums", s.muted)}>
                                  {area.toFixed(1)} sq.ft{b.customRate ? ` · ${formatINR(area * b.customRate)}` : ""}
                                </span>
                              )}
                              <button
                                type="button"
                                aria-label={`Remove board ${i + 1}`}
                                onClick={() => set({ boards: form.boards.filter((_, j) => j !== i) })}
                                className={cx("rounded-lg p-1.5", s.dark ? "text-red-400 hover:bg-red-900/30" : "text-red-500 hover:bg-red-50")}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-12">
                            <div className="col-span-2 sm:col-span-5">
                              <label className={labelSm}>Element *</label>
                              <select
                                value={b.elementId}
                                disabled={!form.clientCode}
                                onChange={(e) => {
                                  const el = clientElements.find((x: any) => x.elementId === e.target.value);
                                  setBoard(i, el ? { elementId: el.elementId, elementName: el.elementName, customRate: el.customRate } : { elementId: e.target.value });
                                }}
                                className={cx(fieldInput(`b${i}e`), "disabled:opacity-60")}
                              >
                                <option value="">{form.clientCode ? (clientElements.length ? "Select element" : "This client has no elements") : "Pick a client first"}</option>
                                {clientElements.map((el: any) => (
                                  <option key={el.elementId} value={el.elementId}>
                                    {el.elementName} (₹{el.customRate}/sq.unit)
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="sm:col-span-2">
                              <label className={labelSm}>Width *</label>
                              <input type="number" min="0" value={b.width} onChange={(e) => setBoard(i, { width: e.target.value })} className={fieldInput(`b${i}w`)} placeholder="W" />
                            </div>
                            <div className="sm:col-span-2">
                              <label className={labelSm}>Height *</label>
                              <input type="number" min="0" value={b.height} onChange={(e) => setBoard(i, { height: e.target.value })} className={fieldInput(`b${i}h`)} placeholder="H" />
                            </div>
                            <div className="sm:col-span-1">
                              <label className={labelSm}>Unit</label>
                              <select value={b.unit} onChange={(e) => setBoard(i, { unit: e.target.value })} className={inputClass}>
                                <option value="ft">ft</option>
                                <option value="in">in</option>
                              </select>
                            </div>
                            <div className="sm:col-span-2">
                              <label className={labelSm}>Qty</label>
                              <input type="number" min="1" value={b.quantity} onChange={(e) => setBoard(i, { quantity: Number(e.target.value) })} className={inputClass} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* photos */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className={cx("text-sm font-semibold", s.text)}>Store photos (optional)</p>
                    <span className={cx("text-xs", s.muted)}>{photos.length}/10</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {previews.map((p, i) => (
                      <div key={p} className={cx("group relative aspect-square overflow-hidden rounded-lg border", s.dark ? "border-gray-800" : "border-gray-200")}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p} alt={`Store photo ${i + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-red-600"
                          aria-label={`Remove photo ${i + 1}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    {photos.length < 10 && (
                      <label
                        className={cx(
                          "flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-center text-xs",
                          s.dark ? "border-gray-700 text-gray-400 hover:border-yellow-500/60" : "border-gray-300 text-gray-500 hover:border-yellow-500/60 hover:bg-yellow-50/40"
                        )}
                      >
                        <input type="file" accept="image/*" multiple className="hidden" onChange={addPhotos} />
                        <Camera className="h-6 w-6" />
                        Add photos
                      </label>
                    )}
                  </div>
                </div>

                {/* installer */}
                <div data-invalid={!!err("installer")}>
                  <p className={cx("mb-2 text-sm font-semibold", s.text)}>
                    Assign installation to <span className="text-red-500">*</span>
                  </p>
                  {err("installer") && <p className="mb-2 text-sm text-red-500">{err("installer")}</p>}
                  <div className="relative mb-2">
                    <Search className={cx("pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2", s.muted)} />
                    <input value={installSearch} onChange={(e) => setInstallSearch(e.target.value)} placeholder="Search by name or email..." className={cx(inputClass, "pl-9")} />
                  </div>
                  <div className="grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
                    {installUsersLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className={cx("flex items-center gap-3 rounded-lg border p-3", s.sunken)}>
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-3.5 w-28" />
                            <Skeleton className="h-3 w-36" soft />
                          </div>
                        </div>
                      ))
                    ) : filteredInstallers.length === 0 ? (
                      <p className={cx("py-4 text-sm sm:col-span-2", s.muted)}>
                        {installUsers.length ? "No one matches your search." : "No installation users found. Add one under Users first."}
                      </p>
                    ) : (
                      filteredInstallers.map((u: any) => {
                        const on = form.installationAssignedTo === u._id;
                        return (
                          <button
                            key={u._id}
                            type="button"
                            onClick={() => set({ installationAssignedTo: on ? "" : u._id })}
                            className={cx(
                              "flex items-center rounded-lg border p-3 text-left transition-colors",
                              on ? (s.dark ? "border-yellow-500 bg-yellow-500/10" : "border-yellow-500 bg-yellow-50") : cx(s.dark ? "border-gray-800" : "border-gray-200", s.hover)
                            )}
                          >
                            <span className={cx("mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold", on ? "bg-yellow-500 text-white" : s.dark ? "bg-gray-800 text-gray-200" : "bg-gray-200 text-gray-700")}>
                              {u.name?.charAt(0).toUpperCase()}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className={cx("block truncate text-sm font-medium", s.text)}>{u.name}</span>
                              <span className={cx("block truncate text-xs", s.muted)}>{u.email}</span>
                            </span>
                            {on && <CheckSquare className="h-4 w-4 shrink-0 text-yellow-500" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </Section>
        </div>

        {/* ---------------- summary ---------------- */}
        <aside className="space-y-4 lg:sticky lg:top-40">
          <Section title="Summary" icon={<Ruler className="h-4 w-4" />}>
            <dl className="space-y-3 text-sm">
              {[
                ["Client", selectedClient ? `${selectedClient.clientName} (${selectedClient.clientCode})` : form.clientCode],
                ["Store", [form.dealerName, form.dealerCode].filter(Boolean).join(" · ")],
                ["Location", [form.city, form.district, form.state].filter(Boolean).join(", ")],
                ["Mobile", form.mobile],
                ["Work starts with", form.directInstallation ? "Direct installation" : "Recce visit"],
                ...(form.directInstallation
                  ? [
                      ["Boards", form.boards.length ? `${form.boards.length} · ${totalArea.toFixed(1)} sq.ft` : ""],
                      ["Estimated cost", totalCost ? formatINR(totalCost) : ""],
                      ["Installer", installer?.name || ""],
                      ["Store photos", photos.length ? String(photos.length) : ""],
                    ]
                  : []),
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <dt className={s.muted}>{k}</dt>
                  <dd className={cx("text-right font-medium", v ? s.text : s.faint)}>{v || "Not set"}</dd>
                </div>
              ))}
            </dl>
          </Section>
          <div className={cx("flex gap-3 rounded-xl border p-4 text-sm", s.sunken)}>
            <Info className={cx("mt-0.5 h-4 w-4 shrink-0", s.muted)} />
            <p className={s.body}>
              {form.directInstallation
                ? "After saving, the store goes straight to the installer you picked."
                : "After saving, the store waits in Store Operations until you assign a recce user."}
            </p>
          </div>
        </aside>

        <StickyBar>
          <p className={cx("flex-1 text-sm", triedSubmit && errorCount ? "text-red-500" : s.muted)}>
            {triedSubmit && errorCount ? `${errorCount} field${errorCount > 1 ? "s need" : " needs"} attention` : dirty ? "Unsaved changes" : "Fill in the store details"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Btn type="button" variant="secondary" onClick={leave} disabled={saving}>
              Cancel
            </Btn>
            <Btn type="button" variant="secondary" icon={<Plus className="h-4 w-4" />} disabled={saving} onClick={() => save(true)}>
              Save & add another
            </Btn>
            <Btn type="submit" variant="primary" loading={saving} icon={<Save className="h-4 w-4" />}>
              Save store
            </Btn>
          </div>
        </StickyBar>
      </form>

      <Dialog
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        title="Discard this store?"
        description="What you have typed will be lost."
        footer={
          <>
            <Btn variant="secondary" className="flex-1" onClick={() => setDiscardOpen(false)}>
              Keep editing
            </Btn>
            <Btn variant="danger" className="flex-1" onClick={() => router.push("/stores")}>
              Discard
            </Btn>
          </>
        }
      />
    </div>
  );
}
