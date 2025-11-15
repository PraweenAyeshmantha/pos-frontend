import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';
import ToastContainer from '../../../components/common/ToastContainer';
import Alert, { type AlertType } from '../../../components/common/Alert';
import { reportService } from '../../../services/reportService';
import { cashierService } from '../../../services/cashierService';
import { outletService } from '../../../services/outletService';
import { useOutlet } from '../../../contexts/OutletContext';
import type { ReportDefinition, ReportFormat, ReportParameter } from '../../../types/report';
import type { Cashier } from '../../../types/cashier';

interface ToastMessage {
  type: AlertType;
  title: string;
  message: string;
}

const toDateTimeInputValue = (value?: string | null) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const pad = (input: number) => input.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toIsoString = (value: string) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString();
};

const ReportsPage: React.FC = () => {
  const [definitions, setDefinitions] = useState<ReportDefinition[]>([]);
  const [formValues, setFormValues] = useState<Record<string, Record<string, string>>>({});
  const [formatSelections, setFormatSelections] = useState<Record<string, ReportFormat>>({});
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [pageMessage, setPageMessage] = useState<{ type: AlertType; text: string } | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [outletOptions, setOutletOptions] = useState<{ id: number | null; name: string }[]>([]);
  const { assignedOutlets } = useOutlet();

  const assignedOutletOptions = useMemo(
    () => assignedOutlets.map((outlet) => ({ id: outlet.id, name: outlet.name ?? `Outlet #${outlet.id}` })),
    [assignedOutlets],
  );

  useEffect(() => {
    if (assignedOutletOptions.length > 0) {
      setOutletOptions(assignedOutletOptions);
    }
  }, [assignedOutletOptions]);

  useEffect(() => {
    if (assignedOutletOptions.length > 0 || outletOptions.length > 0) {
      return;
    }
    let isMounted = true;
    const fetchOutlets = async () => {
      try {
        const outlets = await outletService.getAll();
        if (!isMounted) {
          return;
        }
        setOutletOptions(outlets.map((outlet) => ({ id: outlet.id ?? null, name: outlet.name ?? `Outlet #${outlet.id}` })));
      } catch (error) {
        console.warn('Unable to load outlet options for reports', error);
      }
    };
    fetchOutlets();
    return () => {
      isMounted = false;
    };
  }, [assignedOutletOptions.length, outletOptions.length]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      setPageMessage(null);
      try {
        const reportDefs = await reportService.getDefinitions();
        let cashierList: Cashier[] = [];
        try {
          cashierList = await cashierService.getAll();
        } catch (cashierError) {
          console.warn('Failed to load cashier list for filtering', cashierError);
        }
        if (!isMounted) {
          return;
        }
        setDefinitions(reportDefs);
        setCashiers(cashierList);
        setFormValues(buildDefaultFormValues(reportDefs));
        setFormatSelections(buildDefaultFormats(reportDefs));
      } catch (error) {
        console.error('Failed to load report definitions', error);
        if (isMounted) {
          setPageMessage({ type: 'error', text: 'Unable to load report definitions. Please try again later.' });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const groupedDefinitions = useMemo(() => {
    const groups = new Map<string, ReportDefinition[]>();
    definitions.forEach((definition) => {
      const section = definition.section ?? 'General';
      if (!groups.has(section)) {
        groups.set(section, []);
      }
      groups.get(section)?.push(definition);
    });
    return Array.from(groups.entries()).map(([section, defs]) => ({
      section,
      items: defs.sort((a, b) => a.title.localeCompare(b.title)),
    }));
  }, [definitions]);

  const handleParamChange = useCallback((type: string, code: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [type]: {
        ...(prev[type] ?? {}),
        [code]: value,
      },
    }));
  }, []);

  const handleFormatChange = useCallback((type: string, format: ReportFormat) => {
    setFormatSelections((prev) => ({
      ...prev,
      [type]: format,
    }));
  }, []);

  const buildPayloadParameters = (definition: ReportDefinition) => {
    const current = formValues[definition.type] ?? {};
    return definition.parameters.reduce<Record<string, string>>((acc, parameter) => {
      const rawValue = current[parameter.code];
      if (!rawValue) {
        return acc;
      }
      if (parameter.type === 'DATETIME') {
        acc[parameter.code] = toIsoString(rawValue);
      } else {
        acc[parameter.code] = rawValue;
      }
      return acc;
    }, {});
  };

  const triggerDownload = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleGenerate = async (definition: ReportDefinition) => {
    const format = formatSelections[definition.type] ?? definition.formats[0];
    setGenerating((prev) => ({ ...prev, [definition.type]: true }));
    try {
      const payload = {
        type: definition.type,
        format,
        parameters: buildPayloadParameters(definition),
      };
      const result = await reportService.generate(payload);
      triggerDownload(result.blob, result.fileName);
      setToast({ type: 'success', title: 'Report Ready', message: `${definition.title} downloaded as ${format}.` });
    } catch (error) {
      console.error('Failed to generate report', error);
      setToast({ type: 'error', title: 'Generation Failed', message: 'Unable to generate this report. Please try again.' });
    } finally {
      setGenerating((prev) => ({ ...prev, [definition.type]: false }));
    }
  };

  const renderParameterInput = (definition: ReportDefinition, parameter: ReportParameter) => {
    const value = formValues[definition.type]?.[parameter.code] ?? '';
    const commonProps = {
      id: `${definition.type}-${parameter.code}`,
      value,
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        handleParamChange(definition.type, parameter.code, event.target.value),
      className:
        'mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200',
    };

    switch (parameter.type) {
      case 'DATE':
        return <input type="date" {...commonProps} />;
      case 'DATETIME':
        return <input type="datetime-local" {...commonProps} />;
      case 'NUMBER':
        return <input type="number" {...commonProps} />;
      case 'TEXT':
        return <input type="text" {...commonProps} />;
      case 'OUTLET':
        return (
          <select {...commonProps}>
            <option value="">{parameter.required ? 'Select an outlet' : 'All accessible outlets'}</option>
            {outletOptions.map((outlet) => (
              <option key={outlet.id} value={outlet.id ?? ''}>
                {outlet.name}
              </option>
            ))}
          </select>
        );
      case 'CASHIER':
        return (
          <select {...commonProps}>
            <option value="">{parameter.required ? 'Select a cashier' : 'All cashiers'}</option>
            {cashiers.map((cashier) => (
              <option key={cashier.id} value={cashier.id}>
                {cashier.name}
              </option>
            ))}
          </select>
        );
      default:
        return <input type="text" {...commonProps} />;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <AdminPageHeader
          title="Reports & Exports"
          description="Generate reconciled PDFs or spreadsheets across outlets, sales analytics, and loyalty insights."
        />

        {pageMessage ? (
          <Alert type={pageMessage.type} title="Heads up" message={pageMessage.text} />
        ) : null}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="animate-pulse rounded-2xl bg-white p-6 shadow-sm">
                <div className="h-4 w-1/4 rounded bg-slate-200" />
                <div className="mt-4 h-4 w-3/4 rounded bg-slate-100" />
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="h-10 rounded bg-slate-100" />
                  <div className="h-10 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!loading && groupedDefinitions.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-base text-slate-500">No reports are available for your role yet.</p>
          </div>
        ) : null}

        {!loading
          ? groupedDefinitions.map((group) => (
              <section key={group.section} className="space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{group.section}</p>
                  <div className="mt-1 h-1 w-10 rounded-full bg-blue-100" />
                </div>
                <div className="space-y-5">
                  {group.items.map((definition) => (
                    <article key={definition.type} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h2 className="text-xl font-semibold text-slate-900">{definition.title}</h2>
                          <p className="mt-1 text-sm text-slate-600">{definition.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {definition.formats.map((format) => (
                            <button
                              key={format}
                              type="button"
                              onClick={() => handleFormatChange(definition.type, format)}
                              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                                (formatSelections[definition.type] ?? definition.formats[0]) === format
                                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                                  : 'border-slate-200 text-slate-600 hover:border-blue-200'
                              }`}
                            >
                              {format === 'PDF' ? 'PDF' : 'Excel'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {definition.parameters.length > 0 ? (
                        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                          {definition.parameters.map((parameter) => (
                            <label key={parameter.code} className="block text-sm font-medium text-slate-700">
                              {parameter.label}
                              {parameter.required ? <span className="text-rose-500"> *</span> : null}
                              {parameter.description ? (
                                <span className="mt-1 block text-xs font-normal text-slate-500">{parameter.description}</span>
                              ) : null}
                              {renderParameterInput(definition, parameter)}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-6 text-sm text-slate-500">No filters required for this report.</p>
                      )}

                      <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-4 md:flex-row md:items-center md:justify-between">
                        <p className="text-sm text-slate-500">
                          Use the controls above to tailor the output before downloading.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleGenerate(definition)}
                          disabled={generating[definition.type]}
                          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          {generating[definition.type] ? 'Preparing…' : 'Generate report'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))
          : null}
      </div>

      <ToastContainer>
        {toast ? (
          <Alert type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} />
        ) : null}
      </ToastContainer>
    </AdminLayout>
  );
};

const buildDefaultFormValues = (definitions: ReportDefinition[]) => {
  return definitions.reduce<Record<string, Record<string, string>>>((acc, definition) => {
    const parameters = definition.parameters.reduce<Record<string, string>>((paramAcc, parameter) => {
      if (parameter.defaultValue) {
        paramAcc[parameter.code] = parameter.type === 'DATETIME'
          ? toDateTimeInputValue(parameter.defaultValue)
          : parameter.defaultValue;
      } else {
        paramAcc[parameter.code] = '';
      }
      return paramAcc;
    }, {});
    acc[definition.type] = parameters;
    return acc;
  }, {});
};

const buildDefaultFormats = (definitions: ReportDefinition[]) => {
  return definitions.reduce<Record<string, ReportFormat>>((acc, definition) => {
    acc[definition.type] = definition.formats[0];
    return acc;
  }, {});
};

export default ReportsPage;
