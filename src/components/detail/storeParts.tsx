"use client";

// Store-specific pieces built on the detail kit: workflow steps, the store facts sidebar and the cost card.

import React from "react";
import { Building2, IndianRupee, MapPin, Package, Phone, FileSpreadsheet } from "lucide-react";
import { Store } from "@/src/types/store";
import { InfoGrid, MapLink, mapsUrl, ContactActions, Section, MoneyRows, Step } from "./kit";
import { formatDate, formatINR, nameOf, sqft } from "./format";

const ORDER: Record<string, number> = {
  UPLOADED: 0,
  MANUALLY_ADDED: 0,
  RECCE_ASSIGNED: 1,
  RECCE_SUBMITTED: 2,
  RECCE_REJECTED: 2,
  RECCE_APPROVED: 3,
  INSTALLATION_ASSIGNED: 4,
  INSTALLATION_REJECTED: 4,
  INSTALLATION_SUBMITTED: 5,
  COMPLETED: 6,
};

const looksLikeId = (v?: string) => !!v && /^[a-f0-9]{24}$/i.test(v);
export const personName = (v?: unknown) => {
  const n = nameOf(v);
  return looksLikeId(n) ? "" : n;
};

/** The six workflow steps of a store, worked out from fields the store already carries. */
export const buildSteps = (store: Store): Step[] => {
  const idx = ORDER[store.currentStatus] ?? 0;
  const photos = store.recce?.reccePhotos || [];
  const approved = photos.filter((p) => p.approvalStatus === "APPROVED").length;
  const directInstall = !store.workflow?.recceAssignedTo && !store.recce?.submittedDate && idx >= 4;

  const defs: Array<Omit<Step, "state"> & { at: number }> = [
    { key: "created", label: "Store created", at: 0, who: personName(store.createdBy), when: formatDate(store.createdAt) },
    { key: "recceAssigned", label: "Recce assigned", at: 1, who: personName(store.workflow?.recceAssignedTo), when: formatDate(store.recce?.assignedDate) },
    { key: "recceSubmitted", label: "Recce submitted", at: 2, who: personName(store.recce?.submittedBy), when: formatDate(store.recce?.submittedDate) },
    {
      key: "recceApproved",
      label: store.currentStatus === "RECCE_REJECTED" ? "Recce rejected" : "Recce approved",
      at: 3,
      who: photos.length ? `${approved}/${photos.length} boards approved` : undefined,
    },
    { key: "installAssigned", label: "Installer assigned", at: 4, who: personName(store.workflow?.installationAssignedTo), when: formatDate(store.installation?.assignedDate) },
    {
      key: "installed",
      label: store.currentStatus === "COMPLETED" ? "Completed" : store.currentStatus === "INSTALLATION_REJECTED" ? "Installation rejected" : "Installed",
      at: 5,
      who: personName(store.installation?.submittedBy),
      when: formatDate(store.installation?.submittedDate),
    },
  ];

  // A rejected status marks the step after the last one reached as failed.
  const errorAt = store.currentStatus === "RECCE_REJECTED" ? 3 : store.currentStatus === "INSTALLATION_REJECTED" ? 5 : -1;
  let currentSet = false;
  return defs.map(({ at, ...d }) => {
    let state: Step["state"];
    if (directInstall && at >= 1 && at <= 3) state = "skipped";
    else if (idx >= at) state = "done";
    else if (!currentSet) {
      state = at === errorAt ? "error" : "current";
      currentSet = true;
    } else state = "todo";
    return { ...d, state };
  });
};

/* ------------------------------------------------------------------ */

export const DealerCard = ({ store }: { store: Store }) => (
  <Section title="Store & dealer" icon={<Building2 className="h-4 w-4" />}>
    <InfoGrid
      items={[
        { label: "Store ID", value: store.storeId, copy: store.storeId, mono: true },
        { label: "Dealer code", value: store.dealerCode, copy: store.dealerCode, mono: true },
        { label: "Client code", value: store.clientCode, mono: true },
        { label: "Vendor code", value: store.vendorCode, mono: true },
        { label: "Store code", value: store.storeCode, mono: true, hideIfEmpty: true },
        { label: "Added", value: formatDate(store.createdAt) },
      ]}
    />
  </Section>
);

export const ContactCard = ({ store }: { store: Store }) => (
  <Section title="Contact" icon={<Phone className="h-4 w-4" />} action={<ContactActions mobile={store.contact?.mobile} />}>
    <InfoGrid
      items={[
        { label: "Contact person", value: store.contact?.personName },
        { label: "Mobile", value: store.contact?.mobile, copy: store.contact?.mobile, mono: true },
      ]}
    />
  </Section>
);

export const LocationCard = ({ store }: { store: Store }) => {
  const loc = store.location || ({} as Store["location"]);
  return (
    <Section title="Location" icon={<MapPin className="h-4 w-4" />} action={<MapLink href={mapsUrl(loc)} />}>
      <InfoGrid
        items={[
          { label: "Address", value: loc.address, full: true },
          { label: "City", value: loc.city },
          { label: "District", value: loc.district },
          { label: "State", value: loc.state },
          { label: "Zone", value: loc.zone },
          { label: "Pincode", value: loc.pincode, hideIfEmpty: true },
          { label: "Area", value: loc.area, hideIfEmpty: true },
        ]}
      />
    </Section>
  );
};

export const SpecsCard = ({ store }: { store: Store }) => (
  <Section title="Board specs (from upload)" icon={<Package className="h-4 w-4" />}>
    <InfoGrid
      cols={2}
      items={[
        { label: "Type", value: store.specs?.type },
        { label: "Quantity", value: String(store.specs?.qty || 1) },
        { label: "Width", value: store.specs?.width ? `${store.specs.width} ft` : "" },
        { label: "Height", value: store.specs?.height ? `${store.specs.height} ft` : "" },
        { label: "Board size", value: store.specs?.boardSize ? `${store.specs.boardSize} sq.ft` : "", hideIfEmpty: true },
      ]}
    />
  </Section>
);

export const CommercialCard = ({ store }: { store: Store }) => {
  const c = store.commercials || {};
  return (
    <Section title="Commercial" icon={<FileSpreadsheet className="h-4 w-4" />}>
      <InfoGrid
        items={[
          { label: "PO number", value: c.poNumber, copy: c.poNumber, mono: true },
          { label: "PO month", value: c.poMonth },
          { label: "Invoice", value: c.invoiceNumber, mono: true },
          { label: "Total cost", value: c.totalCost ? formatINR(c.totalCost) : "" },
          { label: "Invoice remarks", value: c.invoiceRemarks, full: true, hideIfEmpty: true },
        ]}
      />
    </Section>
  );
};

/** Board cost from recce when rates exist (same maths as before), else the uploaded rate, plus extra charges. */
export const CostCard = ({ store }: { store: Store }) => {
  const photos = (store.recce?.reccePhotos || []) as Array<any>;
  const rated = photos
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.elements && p.elements.length > 0 && p.elements[0].customRate);
  const rows: Array<{ label: React.ReactNode; value: React.ReactNode; hint?: React.ReactNode }> = [];
  let boardTotal = 0;
  if (rated.length > 0) {
    rated.forEach(({ p, i }) => {
      const area = sqft(p.measurements);
      const qty = p.elements[0].quantity || 1;
      const cost = area * p.elements[0].customRate * qty;
      boardTotal += cost;
      rows.push({
        label: `Board ${i + 1} · ${p.elements[0].elementName}`,
        hint: `${area.toFixed(2)} sq.ft × ₹${p.elements[0].customRate}/sq.ft × ${qty}`,
        value: formatINR(cost),
      });
    });
    rows.push({ label: <strong>Total board cost</strong>, value: formatINR(boardTotal) });
  } else {
    rows.push({ label: "Board rate", value: `${formatINR(store.costDetails?.boardRate)}/sq.ft` });
    rows.push({ label: "Board cost", value: formatINR(store.costDetails?.totalBoardCost) });
  }
  const extras: Array<[string, number | undefined]> = [
    ["Angle charges", store.costDetails?.angleCharges],
    ["Scaffolding", store.costDetails?.scaffoldingCharges],
    ["Transportation", store.costDetails?.transportation],
    ["Flanges", store.costDetails?.flanges],
    ["Lollipop", store.costDetails?.lollipop],
    ["One-way vision", store.costDetails?.oneWayVision],
    ["Sunboard", store.costDetails?.sunboard],
  ];
  extras.forEach(([label, v]) => {
    if (v) rows.push({ label, value: formatINR(v) });
  });
  return (
    <Section title="Cost" icon={<IndianRupee className="h-4 w-4" />}>
      <MoneyRows rows={rows} total={store.commercials?.totalCost ? { label: "Total cost (PO)", value: formatINR(store.commercials.totalCost) } : undefined} />
    </Section>
  );
};

/** The standard read-only sidebar used by the Recce and Installation pages. */
export const StoreFacts = ({ store, showMoney }: { store: Store; showMoney: boolean }) => (
  <div className="space-y-4">
    <LocationCard store={store} />
    <ContactCard store={store} />
    <DealerCard store={store} />
    <SpecsCard store={store} />
    {showMoney && <CommercialCard store={store} />}
    {showMoney && <CostCard store={store} />}
  </div>
);
