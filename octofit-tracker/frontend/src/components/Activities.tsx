import { CapabilityCard } from './CapabilityCard.js';
export default function Activities() {
  return <CapabilityCard title="Activities" description="Track student activity minutes and points." path="/api/activities" collection="activities" emptyMessage="No activities yet." fields={['type', 'minutes', 'points']} />;
}
