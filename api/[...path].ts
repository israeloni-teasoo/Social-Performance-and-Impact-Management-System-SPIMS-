import { app } from '../server/app';

/**
 * The whole API, as a single Vercel function.
 *
 * Vercel turns every file under `api/` into its own function, and this project has 41
 * routes. That is over the Hobby plan's twelve-function ceiling, so a deployment with
 * one wrapper per route is rejected before it builds. Routing them all through one
 * catch-all keeps the count at one on any plan.
 *
 * It also removes a class of bug rather than just a limit. There used to be two route
 * tables — the Express app for self-hosting and a wrapper per route for Vercel — and a
 * route added to one but not the other did not fail loudly: Vercel answers an unmatched
 * `/api` path with the single-page application's HTML, which `isApiAvailable()` reads as
 * "no API here", so the interface silently fell back to bundled sample data and looked
 * like it was working. One adapter cannot drift from itself.
 *
 * Express is mounted directly because Vercel's Node runtime hands the function an
 * unmodified `IncomingMessage` with the original URL intact, and defines `req.body` as a
 * lazy getter. Nothing here touches that getter, so the request stream reaches
 * `express.json()` unread.
 */
export default app;
