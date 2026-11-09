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
  return [];
}

export async function suggestWorkouts(_userEmail: string) {
  return Workout.find().limit(1).lean();
}

export { User };
