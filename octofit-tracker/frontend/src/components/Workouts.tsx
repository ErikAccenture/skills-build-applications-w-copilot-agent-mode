import { CapabilityCard } from './CapabilityCard.js';
export default function Workouts() {
  return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." path="/api/workouts/suggestions/mona%40example.com" collection="suggestions" emptyMessage="No workout suggestions yet." fields={['title', 'focus', 'minutes', 'reason']} />;
}
