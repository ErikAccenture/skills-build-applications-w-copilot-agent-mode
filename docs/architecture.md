# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep route components responsible for rendering and user-visible loading, empty, and error states; use the shared API client for all relative `/api` requests. Do not move API or persistence logic into the frontend.
- Logic tier decision: Keep HTTP validation and response shaping in the Express routes, and put reusable data/query behavior in backend services. Return deliberate 4xx responses for invalid or unknown input rather than allowing cast or validation errors to become 500 responses.
- Data tier decision: Use Mongoose models as the source of persisted data contracts, with required fields, sensible defaults, and references represented by ObjectIds. Keep seed operations idempotent and preserve unrelated existing records.
- Activity tracking approach: Validate the submitted user and team IDs and confirm both records exist before creating an activity. Store the references, activity type, minutes, computed points, and occurrence date; expose persisted activities through the API.
- Team management approach: Require a team name, retain its name and mascot, default members to an empty array, and expose members consistently in create and list responses.
- Leaderboard approach: Aggregate activity points by team, sort by total points descending, and assign ranks starting at 1.
- Workout suggestions approach: Find the requested user by email, consider their fitness goal and recent activity when choosing matching persisted workouts, and include a concise reason for the recommendation. Return a 4xx response when the user does not exist.

## Test plan

Record the commands you run and what each failure means.

- Data tier: `npm run test:data --prefix octofit-tracker/backend` checks required model fields, defaults, and idempotent seeding. A failure indicates a persisted model contract or seed behavior regression.
- API logic: `npm run test:api --prefix octofit-tracker/backend` checks request validation, reference handling, response shapes, leaderboard ordering, and workout recommendations. A failure indicates an API contract or service behavior regression.
- Presentation: `npm test --prefix octofit-tracker/frontend` checks API-backed rendering and accessible loading, empty, and error states. A failure indicates a UI/API integration or presentation-state regression.
- Backend build: `npm run build --prefix octofit-tracker/backend` checks backend TypeScript types.
- Frontend build: `npm run build --prefix octofit-tracker/frontend` checks frontend TypeScript types and the Vite production build.
- Baseline run before implementation: `npm test --prefix octofit-tracker/backend` completed with 8 failures and 1 pass. Four data-contract tests failed on missing model validation; three API tests failed on invalid-input responses or an empty leaderboard, and one failed on workout selection. The idempotent seed test passed.
- Baseline run before implementation: `npm test --prefix octofit-tracker/frontend` completed with 15 failures. Failures covered populated API content, the user-specific workout request, and loading, empty, and accessible error states across the capability routes.
- Run the data contract first, then the API contract, then the frontend tests; finish with both builds. Keep each tier's failure localized to its corresponding contract before moving to the next tier.
