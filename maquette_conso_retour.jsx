import React, { useMemo, useState } from "react";

const clampNonNeg = (value) => {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, value);
};

const percentDeviation = (value, reference) => {
  if (!reference) {
    return 0;
  }
  return ((value - reference) / reference) * 100;
};

const fmt = (value) =>
  new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(value);

const InfoTile = ({ label, value, tone = "default" }) => {
  const toneStyles = {
    default: "bg-white border-gray-200",
    accent: "bg-indigo-50 border-indigo-200",
  };

  return (
    <div
      className={`rounded-xl border ${toneStyles[tone] ?? toneStyles.default} p-4 shadow-sm`}
    >
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
};

const initialMaterials = [
  {
    id: "000123451",
    desc: "CARTON SECONDARY 1",
    uom: "EA",
    planned: 16530,
    assigned: 2160,
    issued: 100,
    total: 2060,
    retour: 100,
  },
  {
    id: "000123452",
    desc: "ETIQUETTES PRIMAIRES",
    uom: "EA",
    planned: 10000,
    assigned: 9800,
    issued: 0,
    total: 9800,
    retour: 0,
  },
  {
    id: "000123453",
    desc: "BOUTEILLES VERRE 0.6",
    uom: "EA",
    planned: 16530,
    assigned: 16200,
    issued: 0,
    total: 16200,
    retour: 0,
  },
];

const MaquetteConsoRetour = () => {
  const [materials, setMaterials] = useState(initialMaterials);

  const computedRows = useMemo(() => {
    return materials.map((item) => {
      const retour = clampNonNeg(Number(item.retour));
      const consomme = clampNonNeg(item.assigned - retour);
      const delta = percentDeviation(consomme, item.assigned);

      return {
        ...item,
        retour,
        consomme,
        delta,
      };
    });
  }, [materials]);

  const totals = useMemo(() => {
    return computedRows.reduce(
      (acc, item) => {
        acc.planned += item.planned;
        acc.assigned += item.assigned;
        acc.issued += item.issued;
        acc.total += item.total;
        acc.retour += item.retour;
        acc.consomme += item.consomme;
        return acc;
      },
      { planned: 0, assigned: 0, issued: 0, total: 0, retour: 0, consomme: 0 }
    );
  }, [computedRows]);

  const updateRetour = (id, newValue) => {
    setMaterials((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              retour: clampNonNeg(newValue),
            }
          : item
      )
    );
  };

  const handleRetourChange = (id, value) => {
    const numericValue = Number(value);
    updateRetour(id, Number.isNaN(numericValue) ? 0 : numericValue);
  };

  const handleQuickSet = (id, mode) => {
    const material = materials.find((row) => row.id === id);
    if (!material) return;

    if (mode === "zero") {
      updateRetour(id, 0);
    } else if (mode === "half") {
      updateRetour(id, Math.round(material.assigned / 2));
    } else if (mode === "assigned") {
      updateRetour(id, material.assigned);
    }
  };

  const downloadBlob = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const payload = computedRows.map(({ delta, ...rest }) => ({
      ...rest,
      consomme: rest.consomme,
    }));
    downloadBlob(JSON.stringify(payload, null, 2), "conso-retour.json", "application/json");
  };

  const exportCSV = () => {
    const headers = [
      "Material",
      "Description",
      "UoM",
      "Planned",
      "Assigned",
      "Issued",
      "Total",
      "Retour",
      "Consomme",
      "Delta (%)",
    ];

    const rows = computedRows.map((item) => [
      item.id,
      item.desc,
      item.uom,
      item.planned,
      item.assigned,
      item.issued,
      item.total,
      item.retour,
      item.consomme,
      item.delta.toFixed(2),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
      .join("\n");

    downloadBlob(csvContent, "conso-retour.csv", "text/csv;charset=utf-8;");
  };

  const deltaBadgeClass = (delta) => {
    const isWithinTolerance = Math.abs(delta) <= 2;
    return isWithinTolerance ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700";
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-6">
          <header className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-wide text-indigo-500">Suivi de production</p>
                <h1 className="text-2xl font-semibold text-slate-900">Conso / Retour – Fin de PO</h1>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                <div className="rounded-lg bg-slate-50 px-4 py-2 shadow-inner">
                  <span className="font-semibold text-slate-800">PO:</span> 1048956
                </div>
                <div className="rounded-lg bg-slate-50 px-4 py-2 shadow-inner">
                  <span className="font-semibold text-slate-800">Produit:</span> FRAXIPARINE 0.6 ML
                </div>
                <div className="rounded-lg bg-slate-50 px-4 py-2 shadow-inner">
                  <span className="font-semibold text-slate-800">Batch:</span> 8564
                </div>
              </div>
            </div>
          </header>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Import fichier TXT</h2>
            <p className="mt-1 text-sm text-slate-500">
              Glissez un fichier TXT issu de SAP ou cliquez sur le bouton ci-dessous pour le sélectionner.
            </p>
            <div className="mt-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <p className="text-sm text-slate-500">Déposez votre fichier ici</p>
              <button
                type="button"
                className="mt-3 inline-flex items-center rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-medium text-indigo-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700"
              >
                Choisir un fichier
              </button>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Vue opérateur</h2>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={exportCSV}
                  className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800"
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={exportJSON}
                  className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800"
                >
                  Export JSON
                </button>
                <button
                  type="button"
                  className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
                >
                  Valider le PO
                </button>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Material</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">UoM</th>
                    <th className="px-4 py-3">Assigned</th>
                    <th className="px-4 py-3">Issued</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Retour saisi</th>
                    <th className="px-4 py-3">Consommé (auto)</th>
                    <th className="px-4 py-3">Δ vs Assigned</th>
                    <th className="px-4 py-3 text-center">Raccourcis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {computedRows.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.id}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{item.desc}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-500">{item.uom}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{fmt(item.assigned)}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{fmt(item.issued)}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{fmt(item.total)}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          value={item.retour}
                          onChange={(event) => handleRetourChange(item.id, event.target.value)}
                          className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{fmt(item.consomme)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${deltaBadgeClass(item.delta)}`}>
                          {item.delta.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleQuickSet(item.id, "zero")}
                            className="rounded-full border border-slate-200 px-2 py-1 text-xs font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                          >
                            0
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickSet(item.id, "half")}
                            className="rounded-full border border-slate-200 px-2 py-1 text-xs font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                          >
                            ½
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickSet(item.id, "assigned")}
                            className="rounded-full border border-slate-200 px-2 py-1 text-xs font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                          >
                            =Assigned
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 text-sm">
                  <tr>
                    <th className="px-4 py-3 text-left" colSpan={3}>
                      Totaux
                    </th>
                    <td className="px-4 py-3 font-semibold text-slate-900">{fmt(totals.assigned)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{fmt(totals.issued)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{fmt(totals.total)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{fmt(totals.retour)}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{fmt(totals.consomme)}</td>
                    <td className="px-4 py-3" colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </div>

        <aside className="w-full max-w-xs space-y-6">
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Synthèse PO</h2>
            <div className="mt-4 grid grid-cols-1 gap-4">
              <InfoTile label="Planifié" value={`${fmt(totals.planned)} EA`} tone="accent" />
              <InfoTile label="Assigné" value={`${fmt(totals.assigned)} EA`} />
              <InfoTile label="Consommé" value={`${fmt(totals.consomme)} EA`} />
              <InfoTile label="Retour" value={`${fmt(totals.retour)} EA`} />
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Règles d'affichage</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-600">
              <li>Δ vs Assigned en vert si l'écart est inférieur ou égal à ±2%.</li>
              <li>Consommé calculé automatiquement : Assigned − Retour.</li>
              <li>Les raccourcis facilitent la saisie opérateur (0, moitié, assigné).</li>
              <li>Exportez les données en CSV ou JSON pour intégration SAP.</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default MaquetteConsoRetour;
