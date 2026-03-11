# Batch Party Ticket Management System

A custom QR-code based ticketing system built for a batch party of ~100 people. This application handles guest list management, automated e-ticket dispatch via email, printable physical ticket generation, and features a mobile-friendly door scanner to prevent double-entry.

## 🛠 Tech Stack
* **Frontend/Backend:** Next.js (App Router)
* **Database & Auth:** Supabase (PostgreSQL)
* **Styling:** Tailwind CSS
* **Emails:** Resend
* **QR Generation:** `qrcode` (Node.js)
* **QR Scanning:** `html5-qrcode` (Client-side)

---

## 🚀 Getting Started for Developers

Follow these steps to get the project running locally.

### 1. Prerequisites
* Node.js (v18 or higher)
* A Supabase account and project
* A Resend account and API key

### 2. Clone and Install
```bash
git clone <your-repository-url>
cd batch-party-tickets
npm install

```

### 3. Environment Variables

Create a `.env.local` file in the root directory and add the following keys. **Do not commit this file to GitHub.**

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
RESEND_API_KEY=re_your_resend_api_key

```

*(Note: If using Resend's free tier, you can only send emails to your verified domain or the email address registered with Resend.)*

### 4. Database Setup (Supabase)

Navigate to the SQL Editor in your Supabase dashboard and run the following script to create the required table:

```sql
create table guests (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  email text,
  notes text,
  payment_status boolean default false,
  ticket_id uuid,
  is_used boolean default false
);

-- Note: RLS is disabled for rapid development. API routes are secured via token validation.
alter table guests disable row level security;

```

### 5. Authentication Setup

The application routes (`/admin`, `/admin/print`, `/scanner`) and API endpoints are protected. You must create a user manually in the Supabase Auth dashboard to access the system.

**Test Credentials:**
Because this is a private repo, use the following credentials for local testing:

* **Email:** `admin@party.com`
* **Password:** `admin`

*(Make sure you create this user in your Supabase Auth dashboard before trying to log in!)*

### 6. Run the Development Server

```bash
npm run dev

```

Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) with your browser to see the result. You will automatically be redirected to `/login`.

---

## 📂 Project Structure

* `/src/app/login` - Login screen for admin/door staff.
* `/src/app/admin` - Main dashboard to add guests and trigger tickets.
* `/src/app/admin/print` - Print-optimized page for generating physical ticket hard copies.
* `/src/app/scanner` - Mobile-optimized camera scanner for the door.
* `/src/app/api/guests` - Protected endpoint to add guests.
* `/src/app/api/tickets` - Protected endpoint that generates the QR UUID, updates the DB, and fires the Resend email.
* `/src/app/api/validate` - Protected endpoint that checks the scanned QR code against the database.



