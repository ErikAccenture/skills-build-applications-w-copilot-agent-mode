import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Props = {
  title: string;
  description: string;
  path: string;
  collection: string;
  emptyMessage: string;
  fields: string[];
};

function displayValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(displayValue).join(', ');
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return String(record.name ?? record.email ?? JSON.stringify(value));
  }
  return value == null ? '' : String(value);
}

export function CapabilityCard({ title, description, path, collection, emptyMessage, fields }: Props) {
  const [items, setItems] = useState<unknown[]>();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;
    setItems(undefined);
    setHasError(false);
    getJson<Record<string, unknown>>(path)
      .then((data) => {
        const result = data[collection];
        if (!Array.isArray(result)) throw new Error(`Invalid ${collection} response`);
        if (active) setItems(result);
      })
      .catch(() => {
        if (active) setHasError(true);
      });
    return () => {
      active = false;
    };
  }, [collection, path]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {items === undefined && !hasError && <p role="status">Loading {title.toLowerCase()}…</p>}
        {hasError && <p role="alert">Unable to load {title.toLowerCase()}. Please try again.</p>}
        {items?.length === 0 && <p>{emptyMessage}</p>}
        {items && items.length > 0 && (
          <ul>
            {items.map((item, index) => {
              const record = item && typeof item === 'object' ? item as Record<string, unknown> : {};
              return (
                <li key={String(record._id ?? index)}>
                  {fields.map((field) => {
                    const value = displayValue(record[field]);
                    return value ? <span key={field}>{field}: {value} </span> : null;
                  })}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
