"use client";

import { useEffect, useState } from "react";
import api from "@/src/lib/api";
import FilterDropdown from "./FilterDropdown";

interface Personnel { _id: string; name: string; email: string }

export default function AssignedPersonnelFilter({ stage, selected, onChange }: {
  stage: "RECCE" | "INSTALLATION";
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const label = stage === "RECCE" ? "Recce personnel" : "Installation personnel";

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    api.get("/stores/personnel", { params: { stage } })
      .then(({ data }) => { if (active) setPersonnel(data.personnel); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [stage, attempt]);

  // Names are for display; IDs keep people with the same name distinct.
  const options = personnel.map((person) => ({
    id: person._id,
    label: personnel.filter((other) => other.name === person.name).length > 1
      ? `${person.name} (${person.email || person._id})` : person.name,
  }));

  if (error) return (
    <button type="button" onClick={() => setAttempt((value) => value + 1)}
      className="px-3 py-2 text-sm text-red-500 border border-red-300 rounded-lg">
      Retry loading {label.toLowerCase()}
    </button>
  );
  if (loading) return <span role="status" className="px-3 py-2 text-sm text-gray-500">Loading personnel...</span>;

  return <FilterDropdown
    label={label}
    allLabel={`All ${label.toLowerCase()}`}
    options={options.map((option) => option.label)}
    selected={options.filter((option) => selected.includes(option.id)).map((option) => option.label)}
    onChange={(labels) => onChange(options.filter((option) => labels.includes(option.label)).map((option) => option.id))}
    className="w-full sm:w-[240px]"
  />;
}
