# Kids Bible Quiz --- Full-Stack Build Specification for Claude

## 1. Purpose

Build a mobile **Kids Bible Quiz** application from the client's
handwritten requirements.

The original client notes describe: - Project title: **Kids Bible
Quiz** - Project type: **iOS compatible application** - A **database
storage system** - Login and signup interfaces - Children registering
with personal information - A quiz/question system with grading -
Persistent quiz status such as `finished` / `continue` - A time limit
for quiz questions - Age restriction of **5--12** - Positive feedback
for correct answers - Retry feedback for incorrect answers - A
**cheers/claps sound** when the final grade is above 70% - The database
must be possible to populate/manage with questions

The client's notes do not specify every technical or UX detail. Where
this document labels something as a **Developer Decision**, treat it as
the implementation direction unless the client later changes the
requirement. Do not present developer decisions as if they were
explicitly stated by the client.

------------------------------------------------------------------------

# 2. Core Technical Direction

## Required architecture

Use a conventional full-stack architecture:

``` text
React Native / Expo mobile app
            |
            | HTTPS / JSON
            v
Node.js + Express API
            |
            | Prisma ORM
            v
PostgreSQL database
            ^
            |
React web Admin Dashboard
```

### Do NOT use

-   Firebase
-   Supabase
-   Firebase Authentication
-   Supabase Authentication
-   Firebase Realtime Database
-   Supabase Realtime

The project should use a conventional backend API and PostgreSQL
database.

### Recommended stack

-   Mobile: React Native
-   Mobile framework/tooling: Expo
-   Language: TypeScript
-   Navigation: Expo Router
-   Backend: Node.js + Express
-   Backend language: TypeScript
-   Database: PostgreSQL
-   ORM: Prisma
-   Validation: Zod
-   Authentication: backend-managed authentication with secure password
    hashing and HTTP-only authentication/session cookies where practical
-   Admin dashboard: React + TypeScript web application
-   Database administration: PostgreSQL/pgAdmin
-   API testing: Postman
-   Version control: Git/GitHub

Keep the architecture simple and appropriate for a final-year software
project. Do not introduce microservices, GraphQL, Redis, Kubernetes, or
other unnecessary infrastructure.

------------------------------------------------------------------------

# 3. Users / Roles

There are two application roles.

## Student

The student is the child using the mobile application.

Students can: - Register - Log in - View their home screen - Start a
quiz - Answer questions - Receive answer feedback - Continue an
unfinished quiz - Finish a quiz - View their quiz result

## Admin

The admin manages the quiz system.

The admin should have a separate web dashboard.

Admins can: - Log in - Add questions - Edit questions -
Delete/deactivate questions - View questions - Populate the database -
View registered students - View quiz attempts/results - Manage quiz
settings such as the configured time limit if this is exposed by the
requirements

The admin dashboard is a developer-recommended feature intended to make
the database/question system manageable after handover. The original
notes specifically state that populating the database should be
possible, but they do not explicitly specify an admin UI.

------------------------------------------------------------------------

# 4. Student Registration

The registration interface must collect the fields explicitly listed in
the client's notes.

Required fields:

-   First name
-   Middle name
-   Last name
-   Age
-   Mobile number
-   Favourite colour
-   Favourite animal
-   Password

The notes also contain the phrase **"Hobbies"** in the registration
information. Therefore include:

-   Hobbies

The password requirement in the notes is:

**"Set password: Alpha numeric"**

Interpret this as requiring an alphanumeric password.

Do not store raw passwords. Store a secure password hash.

## Registration flow

``` text
Open app
   |
   v
Sign Up
   |
   v
Enter registration details
   |
   v
Validate fields
   |
   +---- age < 5 or age > 12 ----> Reject registration
   |
   +---- invalid data -----------> Show validation error
   |
   v
Hash password
   |
   v
Create user
   |
   v
Login / authenticated home
```

------------------------------------------------------------------------

# 5. Age Restriction

The client's notes explicitly state:

> 5--12

and:

> If age is above 12, get a message saying "oops the age is too high"
> with a smiley face.

The intended valid age range is therefore **5 through 12 inclusive**.

Reject ages: - Below 5 - Above 12

For age above 12, display the client's requested message:

**"Oops, the age is too high 🙂"**

The exact wording should remain close to the client's wording.

Because this is a child-focused app, do not make the error screen harsh
or technical.

Developer recommendation: use the same age validation on the backend.
Client-side validation alone is not sufficient.

------------------------------------------------------------------------

# 6. Login

The client's notes state:

> After signup / login --- first name and password

Therefore the login UI should initially use:

-   First name
-   Password

Example:

``` text
First name
[________________]

Password
[________________]

[ Log In ]
```

### Important implementation note

First names are not inherently unique.

Do not create a database design that assumes every first name is unique
unless the client explicitly requires this.

Developer recommendation: - Keep the requested first-name login
experience if required. - Internally use a unique user ID. - If a unique
login identifier becomes necessary, flag this as a requirement
clarification rather than silently changing the client's UI.

------------------------------------------------------------------------

# 7. Home Screen

After successful authentication, take the student to the home page.

The exact visual design is not specified in the client notes, so keep it
simple, friendly, and child-appropriate.

The home page should at minimum provide access to:

-   Start/continue quiz
-   Current quiz status
-   Student's first name

If an unfinished quiz exists:

``` text
Welcome, [First Name]!

[ Continue Quiz ]
```

If there is no unfinished quiz:

``` text
Welcome, [First Name]!

[ Start Quiz ]
```

Do not invent unnecessary features such as social profiles, chat,
purchases, advertisements, or parental dashboards unless explicitly
requested later.

------------------------------------------------------------------------

# 8. Quiz System

The application must display Bible quiz questions retrieved from the
PostgreSQL database.

The client's notes state that the question content will be provided by
the client and that the database should be populated.

Do NOT hard-code the final question set into the mobile application.

Questions must come from the backend/database.

## Question data

At minimum each question should contain:

-   Question text
-   Answer options
-   Correct answer
-   Age range

Developer recommendation: Use four multiple-choice options unless the
client later specifies another number. The original notes do not
explicitly state the number of answer choices, so this is a provisional
implementation decision.

Recommended question model:

``` text
Question
- id
- questionText
- optionA
- optionB
- optionC
- optionD
- correctOption
- ageMin
- ageMax
- isActive
- createdAt
- updatedAt
```

------------------------------------------------------------------------

# 9. Age-Appropriate Question Selection

The client's notes state that an age range should be included.

Use the student's age to determine which questions are eligible.

Example:

``` text
Student age = 7

Eligible questions:
ageMin <= 7 <= ageMax
```

Do not show questions outside the student's configured age range.

The exact age bands have NOT been specified by the client. Do not invent
fixed bands such as 5--7, 8--10, and 11--12 unless the client provides
them.

The admin question form should therefore allow the administrator to
specify:

-   Minimum age
-   Maximum age

------------------------------------------------------------------------

# 10. Quiz Question Limit

The client's notes refer to a maximum of **70 questions**.

Treat 70 as the maximum number of questions in one quiz unless the
client later specifies that every quiz must contain exactly 70.

Developer recommendation:

-   Never return more than 70 questions for a single quiz attempt.
-   Allow the quiz configuration to specify a question count from 1 to
    70.
-   If fewer eligible questions exist, return the available number
    rather than inventing questions.

This avoids hard-coding the assumption that every quiz must always
contain exactly 70 questions.

------------------------------------------------------------------------

# 11. Populating the Database

The client explicitly states that:

> Populating of the database should be possible.

The system therefore needs a practical way to add questions.

Implement an Admin Dashboard with:

``` text
Questions
    |
    +-- View questions
    +-- Add question
    +-- Edit question
    +-- Delete/deactivate question
```

### Add question form

``` text
Question
[________________________________]

Option A
[________________________________]

Option B
[________________________________]

Option C
[________________________________]

Option D
[________________________________]

Correct Answer
[________________ ▼]

Minimum Age
[____]

Maximum Age
[____]

[ Save Question ]
```

Also support editing existing questions.

Do not require the client to edit source code to change quiz questions.

The underlying PostgreSQL database should also remain accessible to the
owner/administrator through normal PostgreSQL administration tools.

------------------------------------------------------------------------

# 12. Quiz Timing

The client's notes specify that:

-   The question will be sent/displayed when the time is set.
-   A time limit should be included.
-   The exact time value is not supplied.

Therefore the implementation must support a configurable quiz/question
time limit without inventing a final value.

Developer recommendation:

Store the configured time limit in seconds.

For example:

``` text
timeLimitSeconds = 30
```

but **do not assume 30 seconds is the client's final requirement**.

The UI should display a visible countdown.

Example:

``` text
Question 4 / 20

00:24

Who built the ark?

[ Noah ]
[ Moses ]
[ David ]
[ Peter ]
```

### Timer integrity

The server should record the quiz attempt's start time and the relevant
timing information.

Do not rely solely on a client-side countdown for score/timing
integrity.

------------------------------------------------------------------------

# 13. Answering a Question

When the student selects an answer, the app should provide immediate
feedback according to the client's notes.

## Correct answer

The client explicitly requests:

> Every correct answer should get a message saying: "Well done" with a
> Star.

Display:

``` text
⭐
Well done!
```

Use a proper star graphic/SVG supplied by the developer/client rather
than relying on a platform emoji if a custom asset is provided.

Then allow the student to proceed to the next question.

Example:

``` text
⭐ Well done!

[ Next Question ]
```

## Incorrect answer

The client explicitly requests:

> "Whoops! That is the wrong answer let's try again."

Display:

``` text
Whoops! That is the wrong answer,
let's try again.
```

The exact retry/scoring behavior is not completely defined in the
handwritten notes.

### Provisional implementation

Until the client specifies otherwise:

-   Keep the student on the current question.
-   Allow another attempt.
-   Do not move to the next question immediately.
-   The backend should prevent a client from manipulating the final
    score.

If the client later specifies that a wrong answer should count
immediately and move forward, adjust this behavior.

------------------------------------------------------------------------

# 14. Scoring

The system must grade the quiz.

The backend should calculate the authoritative score.

At minimum store:

-   Number of correct answers
-   Number of questions
-   Percentage
-   Completion status

Percentage:

``` text
(correct answers / total questions) × 100
```

Do not trust a score sent by the mobile client.

The server should determine correctness using the answer stored in the
database.

------------------------------------------------------------------------

# 15. 70% Cheers / Claps Requirement

The client's notes state:

> Grades above 70 gets a cheers sounds or claps.

Interpret this literally as:

``` text
score > 70%
```

Therefore:

``` text
70%      -> no cheers based on the written "above 70"
70.1%+   -> cheers/claps
```

However, because the notes do not clarify rounding, implement the
threshold against the actual calculated percentage rather than a
prematurely rounded display value.

Example:

``` text
correct = 15
total = 20

percentage = 75%

=> play cheers/claps
```

At quiz completion:

``` text
Quiz Complete!

Score: 75%

[cheers/claps audio]
```

The audio should only play after the final result is known.

------------------------------------------------------------------------

# 16. Quiz Progress / Status

The client's notes explicitly mention:

> Realtime status: finished / continue

Treat this as persistent quiz progress rather than assuming a real-time
networking feature.

The database should track whether an attempt is:

``` text
in_progress
finished
```

When a student exits an unfinished quiz, preserve enough state to resume
it.

Developer recommendation:

Store:

-   attempt ID
-   user ID
-   quiz/configuration ID if used
-   current question position
-   selected answers
-   score/progress
-   started time
-   last activity time
-   completion time
-   status

Example:

``` text
Quiz attempt

Status: in_progress
Current question: 7
Correct answers: 5
Answered questions: 6
```

When the student returns:

``` text
Welcome back!

[ Continue Quiz ]
```

Continue from the saved position.

------------------------------------------------------------------------

# 17. Quiz Completion

When the student reaches the end:

``` text
Quiz
  |
  v
All questions answered
  |
  v
Submit / complete
  |
  v
Backend calculates final score
  |
  v
Save attempt as "finished"
  |
  v
Return result
  |
  +---- >70% ----> Play cheers/claps
  |
  v
Show result
```

The result screen should display at minimum:

-   Score
-   Percentage
-   Completion state

The exact visual layout can be designed after the core functionality is
working.

------------------------------------------------------------------------

# 18. Database Design

Use PostgreSQL.

Recommended relational structure:

## users

``` text
id
first_name
middle_name
last_name
age
mobile_number
hobbies
favorite_color
favorite_animal
password_hash
role
created_at
updated_at
```

## questions

``` text
id
question_text
option_a
option_b
option_c
option_d
correct_option
age_min
age_max
is_active
created_at
updated_at
```

## quiz_attempts

``` text
id
user_id
status
current_question_index
score
total_questions
percentage
started_at
last_activity_at
completed_at
created_at
updated_at
```

## answers

``` text
id
attempt_id
question_id
selected_option
is_correct
answered_at
```

Relationships:

``` text
User
  |
  | 1-to-many
  v
QuizAttempt
  |
  | 1-to-many
  v
Answer
  |
  | many-to-1
  v
Question
```

Do not expose `correct_option` to the mobile client when sending
questions. The backend should use it to validate submitted answers.

------------------------------------------------------------------------

# 19. API Structure

Build a REST API.

Suggested endpoints:

## Authentication

``` http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

## Student

``` http
GET /api/me
GET /api/me/attempts
```

## Quiz

``` http
POST /api/quiz/start
GET  /api/quiz/:attemptId
POST /api/quiz/:attemptId/answer
POST /api/quiz/:attemptId/complete
GET  /api/quiz/:attemptId/result
```

## Admin

``` http
POST   /api/admin/questions
GET    /api/admin/questions
GET    /api/admin/questions/:id
PATCH  /api/admin/questions/:id
DELETE /api/admin/questions/:id

GET /api/admin/users
GET /api/admin/attempts
GET /api/admin/results
```

These endpoints are the proposed technical implementation, not
client-provided requirements.

Use: - Authentication middleware - Admin authorization middleware - Zod
validation - Consistent error responses - Appropriate HTTP status codes

------------------------------------------------------------------------

# 20. Security Requirements

Implement the following:

-   Never store plaintext passwords.
-   Hash passwords securely.
-   Validate registration data on both client and server.
-   Validate age on the server.
-   Never expose correct answers through the question API.
-   Never accept a client-supplied final score as authoritative.
-   Verify that the authenticated student owns the quiz attempt they are
    accessing.
-   Protect admin endpoints with admin authorization.
-   Keep database credentials in environment variables.
-   Do not commit `.env` files containing secrets.
-   Validate/sanitize incoming data.
-   Use HTTPS in production.

Because the app is intended for children, avoid collecting extra
personal information that is not required by the supplied requirements.

------------------------------------------------------------------------

# 21. Admin Dashboard

Create a separate web application for administration.

Suggested sections:

``` text
Dashboard
Questions
Students
Quiz Attempts
Results
Settings
```

## Dashboard

Show basic system information such as:

``` text
Total Students
Total Questions
Total Quiz Attempts
Completed Attempts
```

Do not add unnecessary analytics unless requested.

## Questions

The admin can:

-   Search questions
-   Add questions
-   Edit questions
-   Deactivate/delete questions
-   Set age range
-   Set correct answer

## Students

Allow the admin to view registered students.

Do not display password hashes or sensitive authentication information.

## Attempts / Results

Allow the admin to inspect:

-   Student
-   Score
-   Percentage
-   Status
-   Start time
-   Completion time

------------------------------------------------------------------------

# 22. Mobile Screen Flow

Build approximately this flow:

``` text
Launch
  |
  v
Welcome / Landing
  |
  +------ Sign Up
  |          |
  |          v
  |     Registration
  |          |
  |          v
  |       Login
  |
  +------ Login
             |
             v
           Home
             |
       +-----+------+
       |            |
       v            v
  Start Quiz    Continue Quiz
       |            |
       +-----+------+
             |
             v
        Quiz Question
             |
        +----+----+
        |         |
      Correct   Wrong
        |         |
        v         v
   Well done   Try again
        |         |
        +----+----+
             |
             v
       Next Question
             |
             v
        Quiz Complete
             |
             v
          Result
             |
        >70%? ---- Yes ---> Cheers/Claps
             |
             v
           Home
```

The exact visual design is intentionally left open unless the client
provides mockups.

------------------------------------------------------------------------

# 23. UX Direction

The application is for children aged 5--12.

Use: - Clear typography - Large touch targets - Simple navigation -
Friendly feedback - Minimal text per screen - Obvious answer buttons -
Clear countdown timer - Positive feedback - Accessible contrast

Avoid: - Dense dashboards in the child app - Tiny buttons - Complicated
navigation - Technical error messages - Excessive animation -
Unnecessary features

The admin dashboard can have a more conventional professional interface.

------------------------------------------------------------------------

# 24. Audio and Visual Assets

The client requirements specifically mention:

### Required visual feedback

-   Star for correct answer
-   Smiley face for the age-too-high message

### Required audio

-   Cheers and/or clapping sound for a final grade above 70%

Do not use random stock icons or emojis if custom assets are supplied.

The developer will personally provide SVG assets/icons to Claude after
Claude identifies exactly what assets are needed.

## IMPORTANT ASSET WORKFLOW

Before finalizing the UI:

1.  Inspect the requirements.
2.  Identify every icon, illustration, SVG, animation asset, and audio
    asset that would improve or is required for the specified
    experience.
3.  Give the developer a concise **Asset Request List**.
4.  For each asset, specify:
    -   Asset name
    -   What it is used for
    -   Suggested visual characteristics
    -   SVG/PNG/audio format required
    -   Approximate intended size/aspect ratio where relevant
5.  Do not invent final custom SVG artwork when the developer has said
    they will provide the assets.
6.  If an asset is optional rather than required, label it **Optional**.
7.  Wait for the developer to provide the assets before wiring custom
    assets into the final UI where practical.

At minimum, identify: - Correct-answer star - Age validation smiley -
Cheers/claps audio - App logo/branding asset if one is supplied later -
Any navigation icons you intend to use if custom SVGs are desired

For ordinary UI controls, use a consistent icon library only if the
developer has not supplied custom assets.

Do not replace requested custom assets with emojis merely because an
emoji is convenient.

------------------------------------------------------------------------

# 25. Database Population

Create a seed mechanism for development.

For example:

``` text
prisma/seed.ts
```

The seed script may contain sample questions for development/testing.

However, distinguish sample/demo questions from the client's real Bible
questions.

The real question content will be supplied by the client/developer
later.

The admin dashboard should remain the main mechanism for ongoing
question management.

------------------------------------------------------------------------

# 26. Environment Configuration

Use environment variables.

Example:

``` env
DATABASE_URL=
SESSION_SECRET=
API_URL=
```

Do not hard-code credentials.

Provide:

``` text
.env.example
```

containing placeholder values.

------------------------------------------------------------------------

# 27. Project Structure

A clean monorepo structure is recommended:

``` text
kids-bible-quiz/
│
├── mobile/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── assets/
│   ├── constants/
│   └── types/
│
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── validators/
│   │   └── utils/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── ...
│
├── admin/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/
│   │   └── ...
│   └── ...
│
├── .env.example
├── README.md
└── package.json
```

The exact folder organization may be adjusted if the implementation has
a strong reason to do so.

------------------------------------------------------------------------

# 28. Development Order

Do not attempt to build everything simultaneously.

Implement in this order:

## Phase 1 --- Foundation

-   Create repository
-   Set up TypeScript
-   Set up Expo mobile project
-   Set up Express server
-   Set up PostgreSQL
-   Set up Prisma
-   Create initial database schema
-   Create migrations
-   Create seed system

## Phase 2 --- Authentication

-   Registration screen
-   Registration validation
-   Age validation
-   Password hashing
-   Login
-   Logout
-   Authentication persistence

## Phase 3 --- Student home

-   Home screen
-   Student name
-   Start quiz
-   Continue quiz status

## Phase 4 --- Quiz engine

-   Retrieve eligible questions
-   Create quiz attempt
-   Timer
-   Display question
-   Submit answer
-   Validate answer on server
-   Correct feedback
-   Wrong feedback
-   Progress persistence

## Phase 5 --- Results

-   Finish quiz

-   Calculate score

-   Save result

-   Result screen

-   70% cheers/claps behavior

## Phase 6 --- Admin

-   Admin login
-   Admin dashboard
-   Question CRUD
-   Student list
-   Attempts/results

## Phase 7 --- Polish

-   Custom SVG assets
-   Audio
-   Animations
-   Responsive layouts
-   Error states
-   Loading states
-   Empty states
-   Accessibility
-   Final UI polish

## Phase 8 --- Testing

Test: - Registration - Invalid age - Duplicate/edge-case users -
Login/logout - Wrong password - Starting quiz - Timer expiration -
Correct answers - Wrong answers - Retry behavior - Closing/reopening
app - Continue behavior - Quiz completion - Scores - \>70% audio - Admin
question creation - Admin editing - Admin deletion/deactivation -
Unauthorized admin access - Database failures - Network failures

------------------------------------------------------------------------

# 29. Important Requirements vs Assumptions

## Explicitly supplied by client

-   Kids Bible Quiz
-   iOS-compatible application
-   Database storage system
-   Login/signup
-   Registration information listed above
-   Alphanumeric password requirement
-   First name + password login
-   Quiz questions
-   Grading
-   `finished` / `continue` status
-   Grade above 70% triggers cheers/claps
-   Database should be possible to populate
-   Questions will be supplied by the client
-   Time limit must be included
-   Age range 5--12
-   Above 12 should receive the specified age-too-high message
-   Correct answer receives "Well done" + star
-   Wrong answer receives the specified "Whoops..." message

## Developer decisions / provisional interpretations

These should NOT be described as if they came directly from the client:

-   React Native + Expo
-   Node.js + Express
-   PostgreSQL
-   Prisma
-   React admin dashboard
-   Four multiple-choice options
-   Question CRUD dashboard
-   Age filtering using `ageMin`/`ageMax`
-   Maximum of 70 rather than exactly 70 questions
-   Saving the current question index
-   Wrong-answer retry staying on the same question
-   HTTP-only authentication/session strategy
-   Exact API endpoint names
-   Exact database table structure
-   Exact visual design
-   Exact timer duration
-   Exact age bands
-   Exact result-screen layout

If the client later provides contradictory requirements, follow the
client's updated requirements and update the technical specification.

------------------------------------------------------------------------

# 30. What Claude Must NOT Do

Do not:

-   Add Firebase.
-   Add Supabase.
-   Store quiz questions only in frontend source code.
-   Store plaintext passwords.
-   Expose correct answers in the public question response.
-   Let the mobile app determine the authoritative final score.
-   Hard-code a timer duration that the client did not provide.
-   Invent age bands that the client did not provide.
-   Invent a final set of Bible questions.
-   Add unnecessary AI features.
-   Add unnecessary real-time infrastructure.
-   Build the entire application as one giant component.
-   Use fake/mock data as if it were production data.
-   Remove the admin/database management requirement.
-   Replace custom supplied SVG assets with unrelated artwork.
-   Hide important business logic inside the UI when it belongs on the
    backend.

------------------------------------------------------------------------

# 31. Expected Claude Workflow

Before writing substantial application code:

### Step 1

Read this specification completely.

### Step 2

Inspect the existing repository/project files if a repository already
exists.

### Step 3

Produce a short implementation plan showing: - Architecture - Database
models - API modules - Mobile screens - Admin screens - Authentication
approach - Quiz state flow

### Step 4

Identify missing assets.

Provide an **Asset Request List** containing only the
icons/graphics/audio that you actually need.

Example:

``` text
ASSET REQUEST LIST

1. Correct Answer Star
   Format: SVG
   Use: Correct-answer feedback
   Style: Friendly, child-appropriate
   Suggested display size: ~48–64px

2. Age Error Smiley
   Format: SVG
   Use: Age > 12 error state
   Suggested display size: ~48px

3. Cheers/Claps Audio
   Format: MP3 or WAV
   Use: Final score >70%
   Duration: short celebratory sound
```

Do not ask for assets that can be handled cleanly with normal UI
components.

### Step 5

After assets are supplied, implement the application in phases.

### Step 6

After each major phase, verify the implementation against this document.

### Step 7

Do not silently make major requirement decisions. If a missing decision
materially changes the architecture or user experience, flag it clearly
as an **Open Requirement**.

------------------------------------------------------------------------

# 32. Definition of Done

The project is functionally complete when:

-   A valid child aged 5--12 can register.
-   An invalid age is rejected appropriately.
-   Passwords are securely stored as hashes.
-   A registered student can log in.
-   The home screen displays the student's first name.
-   The student can start a quiz.
-   Questions are loaded from PostgreSQL through the backend API.
-   Questions respect the configured age range.
-   The quiz respects the configured question limit, never exceeding 70.
-   The quiz has a configurable time limit.
-   Answers are validated by the backend.
-   Correct answers produce the required "Well done" + star feedback.
-   Incorrect answers produce the required retry feedback.
-   Quiz progress persists.
-   An unfinished quiz can be continued.
-   Completed quizzes are marked `finished`.
-   Final scores are calculated server-side.
-   A score above 70% triggers the cheers/claps sound.
-   Results are stored.
-   An administrator can populate and manage questions through the admin
    dashboard.
-   PostgreSQL remains directly manageable through standard database
    administration tools.
-   Authentication and authorization are enforced.
-   The mobile app handles loading, error, and network-failure states.
-   The project has a clear README and setup instructions.
-   The student/developer can explain the architecture and major
    implementation decisions.

------------------------------------------------------------------------

# 33. Final Instruction to Claude

Treat this document as the **source of truth for the current
implementation**.

Where the document says "client requirement", preserve that behavior.

Where it says "developer decision" or "provisional", treat it as an
implementation proposal and keep the code structured so it can be
changed easily if the client clarifies the requirement.

Prioritize: 1. Correct functionality 2. Clear architecture 3.
Maintainability 4. Security 5. Child-friendly UX 6. Database
accessibility 7. Simple, explainable engineering choices

Do not optimize for unnecessary complexity. Do not add features merely
to make the application look more sophisticated.

The goal is a complete, understandable, conventional full-stack Kids
Bible Quiz application that the project owner can continue managing
after development.
