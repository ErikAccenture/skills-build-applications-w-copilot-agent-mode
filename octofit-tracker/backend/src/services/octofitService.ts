import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const invalidInput = () => Object.assign(new Error('Invalid activity input'), { status: 400 });
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw invalidInput();

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (
    typeof userId !== 'string' ||
    !/^[a-f\d]{24}$/i.test(userId) ||
    typeof teamId !== 'string' ||
    !/^[a-f\d]{24}$/i.test(teamId) ||
    typeof type !== 'string' ||
    !type.trim() ||
    typeof minutes !== 'number' ||
    !Number.isFinite(minutes) ||
    minutes <= 0
  ) {
    throw invalidInput();
  }

  const [user, team] = await Promise.all([
    User.findById(new mongoose.Types.ObjectId(userId)).select('_id').lean(),
    Team.findById(new mongoose.Types.ObjectId(teamId)).select('_id').lean(),
  ]);
  if (!user || !team) throw invalidInput();

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const invalidInput = () => Object.assign(new Error('Invalid team input'), { status: 400 });
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw invalidInput();

  const { name, mascot, members = [] } = input as Record<string, unknown>;
  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof mascot !== 'string' ||
    !mascot.trim() ||
    !Array.isArray(members) ||
    members.some((member) => typeof member !== 'string' || !/^[a-f\d]{24}$/i.test(member))
  ) {
    throw invalidInput();
  }

  const memberIds = [...new Set(members as string[])];
  if (memberIds.length > 0) {
    const existingMembers = await User.countDocuments({ _id: { $in: memberIds } });
    if (existingMembers !== memberIds.length) throw invalidInput();
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
}

export async function getLeaderboard() {
  const teams = await Team.aggregate<{
    teamName: string;
    totalPoints: number;
  }>([
    {
      $lookup: {
        from: Activity.collection.name,
        localField: '_id',
        foreignField: 'team',
        as: 'activities',
      },
    },
    {
      $addFields: {
        totalPoints: { $sum: '$activities.points' },
      },
    },
    { $sort: { totalPoints: -1, name: 1 } },
    { $project: { _id: 0, teamName: '$name', totalPoints: 1 } },
  ]);
  return teams.map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() })
    .select('_id fitnessGoal')
    .lean();
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  const recentActivity = await Activity.findOne({ user: user._id })
    .sort({ occurredAt: -1 })
    .select('type')
    .lean();
  const activityFocusByType: Record<string, string> = {
    cycle: 'endurance',
    run: 'endurance',
    swim: 'endurance',
    walk: 'endurance',
    strength: 'strength',
    weights: 'strength',
    mobility: 'mobility',
    yoga: 'mobility',
  };
  const activityFocus = recentActivity
    ? activityFocusByType[recentActivity.type.toLowerCase()] ?? recentActivity.type.toLowerCase()
    : undefined;
  const focusPreferences = [...new Set([user.fitnessGoal.toLowerCase(), activityFocus].filter(
    (focus): focus is string => Boolean(focus),
  ))];
  if (focusPreferences.length === 0) return [];

  const workouts = await Workout.find({ focus: { $in: focusPreferences } }).lean();
  workouts.sort(
    (left, right) =>
      focusPreferences.indexOf(left.focus.toLowerCase()) -
      focusPreferences.indexOf(right.focus.toLowerCase()),
  );
  return workouts.map((workout) => ({
    ...workout,
    reason:
      activityFocus && workout.focus.toLowerCase() === activityFocus
        ? `Recommended based on your recent ${recentActivity?.type} activity.`
        : `Recommended to support your ${user.fitnessGoal} fitness goal.`,
  }));
}

export { User };
