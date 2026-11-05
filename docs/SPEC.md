# Surf Scheduler — Spec

## Problem Statement

People who surf (SUP or waves) work fixed weekly schedules with some flexibility, and checking marine and wind forecasts for every nearby beach, then matching them to free time, is tedious. They miss good sessions or waste trips on bad ones. They want to know which beach is best, and when, given their own working week.

## Solution

A user signs up with only an email and fills in a short profile: surf type (SUP, waves or both), a weekly work schedule with per-day flexibility, and their beaches with a maximum radius. The app pulls marine, wind, daylight and holiday data and grades each beach from 1 to 10 for each 2-hour daylight window that fits the user's free time. The main page shows a map with a graded marker per beach and a timeline to look at future grades. A "Get suggestions" button returns a list of the best sessions for the next 3 days, ordered by grade. Email notification is deferred, but the suggestion list is built so it can be sent later.

## User Stories

1. As a new surfer, I want to sign up with only my email, so that I can start without creating a password.
2. As a returning surfer, I want to enter my email again and get my profile back, so that I don't need credentials.
3. As a surfer, I want to see a clear error if I enter a malformed email, so that I can fix it.
4. As a surfer, I want to be told if my email already exists, so that I know to sign in instead of registering.
5. As a surfer, I want to say whether I like SUP, waves or both, so that grades match what I actually surf.
6. As a surfer, I want to set start time, end time and flex hours for each weekday separately, so that my real week is modelled.
7. As a surfer, I want to mark a weekday as a non-working day, so that the whole day counts as free.
8. As a surfer, I want my flex to shift my whole work block earlier or later by up to N hours, so that a 8–18 day with 2h flex can become 6–16 or 10–20.
9. As a surfer, I want the system to choose the shift that opens the best session, so that I do not work it out myself.
10. As a surfer, I want to set a maximum radius in km, so that I never get a beach too far away.
11. As a surfer, I want to see the beaches linked to me, so that I know which are considered.
12. As a surfer, I want only beaches within my radius to be considered, so that suggestions are reachable.
13. As a surfer, I want a map with a marker for every beach showing its current grade, so that I can scan conditions at a glance.
14. As a surfer, I want a timeline control on the map, so that I can see grades at future times.
15. As a surfer, I want marker grades to update when I move the timeline, so that I can plan ahead.
16. As a surfer, I want to press a "Get suggestions" button, so that I get a list when I ask.
17. As a surfer, I want suggestions covering the next 3 days, so that I can plan the week.
18. As a surfer, I want suggestions sorted by grade, highest first, so that the best option is on top.
19. As a surfer, I want each suggestion to show beach, date, time window, type (SUP or wave) and grade, so that I can decide quickly.
20. As a SUP-only surfer, I want grades computed only for SUP, so that I never get a wave suggestion.
21. As a wave-only surfer, I want grades computed only for waves, so that I never get a SUP suggestion.
22. As a "both" surfer, I want the better of SUP or wave for each window, labelled with its type, so that I pick the best discipline.
23. As a surfer, I want sessions only in daylight, so that I never get a night suggestion.
24. As a surfer, I want sessions to be 2 hours long, so that they are worth the trip.
25. As a surfer, I want sessions to fit only inside my free time, so that they never clash with work.
26. As a surfer, I want Israeli holidays to count as free days automatically, so that I get all-day options on them without setting anything.
27. As a surfer, I want a beach to be either SUP or wave per window, never both, so that the label is unambiguous.
28. As a surfer, I want a friendly message when no window is good enough or none fits, so that an empty list is explained.
29. As a surfer, I want a clear message if the forecast data is unavailable, so that I know it is not my profile.
30. As a surfer, I want to edit my profile any time, so that new schedules are used on the next run.
31. As a developer, I want the grading logic to be a pure function of forecast and beach data, so that it is easy to test.
32. As a developer, I want external APIs behind adapters, so that they can be faked in tests.

## Implementation Decisions

- Stack: NestJS backend, React frontend. Shared types / API contract change only after telling the other developer.
- Scope: Israel only. All times use Asia/Jerusalem.
- Identity: email only, no password and no verification. Creating a user with an existing email returns a conflict (see the OpenAPI doc). Sign-in is entering the email again to look the user up. This lookup endpoint is not in the OpenAPI doc yet and must be added.
- Data model (details to be agreed after this spec): a beaches table that already exists with data; a users table; the user–beach relation is one user to many beaches. The user's preferences relate to the beaches. Beach rows hold the data the grading needs.
- User profile: surf type (SUP, WAVE, BOTH); weekly schedule with, per weekday, start, end and flex hours (or a non-working day); maximum radius in km.
- Candidate beaches: the user's linked beaches that fall within the radius by haversine distance. How the links are created is out of scope. The anchor point for the radius is to be settled in the data-model ticket.
- Free time per day: a work block keeps its length, and its start may move in [start − flex, start + flex] with the end moving the same amount. Free time is the day minus the chosen block. The best shift per day is chosen by the recommender.
- Holidays: Hebcal holidays always make the whole day free. There is no user toggle.
- Session: fixed 2 hours, entirely between sunrise and sunset (from the Open-Meteo Forecast API).
- Grading: computed at runtime, not stored. For each beach and window it returns a type (SUP or WAVE, never both) and an integer grade from 1 to 10. Inputs are wave height, period and swell from Open-Meteo Marine, plus wind speed, direction and gusts from Open-Meteo Forecast. A SUP-only or wave-only user is graded only for their own type. A "both" user gets the better of the two. Window grade is the average of its hourly grades. Wind direction is taken from the API. Whether to treat it as onshore or offshore relative to the beach is left to the grading ticket, so the formula is open.
- Recommendations: `GET /recommendation?userId=<id>` returns a list (read-only, no request body, so GET and not QUERY; the horizon and limit are optional query parameters), triggered by the React button. The horizon is the next 3 days. The list is sorted by grade, highest first. The maximum number shown is a configurable limit that is not decided yet. Whether results are grouped by day or one flat list is open.
- Frontend: signup / edit-profile form; after sign-in, a main page with a map, graded markers per beach and a timeline control; the "Get suggestions" button and list.
- External APIs (see APIS.md): Open-Meteo Marine, Open-Meteo Forecast (always pass the timezone), Hebcal. Overpass is not needed in v1 because beach data exists. Open-Meteo forecast horizon is up to 16 days.
- Email notification: deferred. The suggestion list must be reusable by a later email feature.

## Testing Decisions

- Good tests check external behavior only: given a profile and forecast data, assert the returned suggestions, not internal functions.
- Proposed seam, for you to confirm: one highest-level seam at the `GET /recommendation` endpoint, with the three external APIs faked behind adapters and the database real or in-memory. Grading, free-time and shift logic are covered through it. The signup and lookup endpoints get their own small HTTP-level tests. The frontend is checked in the running app.
- Prior art: none yet. The repo has only the OpenAPI doc.
- Every ticket is built test-first with `/tdd`. Nothing is called done before the tests pass and it works in the running app.

## Out of Scope

- Email notifications and any scheduler or cron.
- Email verification, passwords, and other auth.
- Creating the user–beach links, and loading beach data.
- Countries other than Israel.
- Choosing session length (fixed 2 hours).
- A user toggle for holidays.
- Overpass beach discovery.

## Further Notes

Open items to settle in tickets:
- Exact grading formula, including how to use wind direction against beach orientation.
- Limit on the number of suggestions, and grouped vs flat display.
- Anchor point for the radius, and the user–beach table shape.
- The sign-in-by-email endpoint, to be added to the OpenAPI doc.
- One shared decision still pending from the skill: where specs get published. The skill mentions an issue tracker, but this repo has none set up, so the spec is in this file as CLAUDE.md says.
