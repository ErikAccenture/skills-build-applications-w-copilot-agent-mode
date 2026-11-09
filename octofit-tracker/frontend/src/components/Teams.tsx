import { CapabilityCard } from './CapabilityCard.js';
export default function Teams() {
  return <CapabilityCard title="Teams" description="Manage teams and members." path="/api/teams" collection="teams" emptyMessage="No teams yet." fields={['name', 'mascot', 'members']} />;
}
