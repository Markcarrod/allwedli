# Course MCQ Quiz

## Run locally

```bash
npm start
```

Open `http://localhost:3000`.

## Deploy to Vercel

Import this folder as a Vercel project. The `.txt` files must remain in the project root because the API reads them at runtime. No build command is required; Vercel detects `vercel.json`.

The app keeps used and completed question IDs in the browser's local storage. The admin panel can release a course's completed pool, and the app automatically resets a course when its entire question bank has been used. For shared multi-user progress, replace localStorage with a database such as Vercel KV/Redis.
