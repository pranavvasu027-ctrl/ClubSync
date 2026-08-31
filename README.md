# ClubSync

ClubSync is a unified, multi-role platform designed to help colleges and universities manage their clubs, events, budgets, and members from a single dashboard. 

The application separates concerns across 5 distinct operational roles: **Secretary**, **Executive**, **President**, **Faculty**, and **Owner**.

## Architecture

- **Frontend**: React + Vite + TypeScript
- **Styling**: CSS Modules (Custom Dark/Light High-Density Themes)
- **Backend/Database**: Supabase (PostgreSQL)

## Getting Started

### 1. Database Setup
To collaborate on this project, you will need a [Supabase](https://supabase.com/) account.
1. Create a new project in Supabase.
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Copy the contents of `database/setup.sql` from this repository and run it in the SQL Editor. This will create all the necessary tables and seed them with dummy data.

### 2. Environment Variables
In the `web/` directory, create a `.env` file and add your Supabase connection details:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Installation & Running Locally
Make sure you have Node.js installed. Open your terminal and run:

```bash
cd web
npm install
npm run dev
```
Navigate to `http://localhost:5173` in your browser.

## Testing Different Roles
We have built a `RoleRouter` that automatically directs users to their specific dashboard based on their database profile.

To test the different layouts:
1. Sign up for an account via the local `/login` page.
2. Open your Supabase Dashboard -> **Table Editor** -> `users` table.
3. Find your user row and change the `user_type` column to one of the following:
   - `president`
   - `executive`
   - `secretary`
   - `faculty`
   - `owner`
4. Refresh your local React app to see the UI switch instantly!
