import { CapabilityCard } from './CapabilityCard.js';
export default function Leaderboard() {
  return <CapabilityCard title="Leaderboard" description="Compare team point totals." path="/api/leaderboard" collection="leaderboard" emptyMessage="No leaderboard rankings yet." fields={['rank', 'teamName', 'totalPoints']} />;
}
