This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Contact form

To send contact messages automatically, create an EmailJS service and template, then add these values to `.env.local`:

```env
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
```

The EmailJS template should accept `to_email`, `from_name`, `from_email`, `reply_to`, and `message`. Without these values, the form opens a prefilled email in the visitor's mail application instead.

## Persistent comments and likes

To share comments between all visitors and keep them after a server restart, connect the app to Supabase by adding these values to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run [supabase/comments_likes.sql](supabase/comments_likes.sql) once in the Supabase SQL Editor, then enable **Anonymous sign-ins** in Supabase Authentication → Providers. Each visitor receives an anonymous account, so they can like a comment once and remove only their own like. The database stores both comments and likes, making them persistent across deployments and restarts.

## Certificates database

Run [supabase/certificates.sql](supabase/certificates.sql) in the Supabase SQL Editor before opening the certificates dashboard. It creates the required `public.certificates` table and the public read policy.

For secure certificate-image uploads, run [supabase/certificates_storage.sql](supabase/certificates_storage.sql) after creating a public `certificates` Storage bucket. The policy only permits the configured admin account to manage files.

For the admin certificate manager, run [supabase/certificates.sql](supabase/certificates.sql) once in the Supabase SQL Editor. This creates the certificates table, storage bucket, and required access policies.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
