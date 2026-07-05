# ✒ InkDrop — MEAN Stack Blog Website

A beautifully designed, full-stack blog platform built with **MongoDB, Express.js, Angular, and Node.js**.

---

## 🖼 Design Theme

- **Style:** Dark editorial with warm gold accents
- **Fonts:** Playfair Display (headings) + DM Sans (body)
- **Colors:** `#0F0F0F` background · `#D4A853` gold accent · `#F5F0E8` text
- **Aesthetic:** Magazine-quality layout with hover animations, glassmorphism navbar, and smooth transitions

---

## 📁 Full Project Structure

```
blog-app/
│
├── 📦 backend/                             ← Node.js + Express + MongoDB
│   ├── server.js                           ← Main server entry point
│   ├── seed.js                             ← DB seeding script
│   ├── fix-images.js                       ← Upload utility script
│   ├── package.json
│   ├── .env.example                        ← Copy to .env and fill in values
│   │
│   ├── config/
│   │   └── mailer.js                       ← SMTP mail service utility
│   │
│   ├── middleware/
│   │   └── auth.js                         ← JWT verification & adminOnly guard
│   │
│   ├── models/
│   │   ├── User.js                         ← User schema (bcrypt passwords, roles)
│   │   ├── Post.js                         ← Post schema (slug, views, likes, readTime)
│   │   ├── Comment.js                      ← Comment schema
│   │   ├── Category.js                     ← Category schema (icon, color)
│   │   ├── Message.js                      ← Contact message schema
│   │   └── Settings.js                     ← Global settings schema
│   │
│   └── routes/
│       ├── auth.js                         ← auth routes (register, login, me, etc.)
│       ├── posts.js                        ← post routes (CRUD, category filter, likes)
│       ├── comments.js                     ← comment routes (get/create/delete)
│       ├── categories.js                   ← category routes (get/create/delete)
│       ├── messages.js                     ← message routes (create/get/delete)
│       ├── settings.js                     ← settings configuration routes
│       └── stats.js                        ← dashboard stats/metrics routes
│
└── 🅰️ frontend/                            ← Angular 16
    ├── angular.json
    ├── package.json
    ├── tsconfig.json
    │
    └── src/
        ├── index.html                      ← Main HTML page (Google Fonts included)
        ├── main.ts
        ├── styles.css                      ← 🎨 Global design system
        │
        └── app/
            ├── app.module.ts               ← Root NgModule
            ├── app-routing.module.ts       ← Routing definitions
            ├── app.component.ts            ← Root layout component (conditional footer)
            │
            ├── models/
            │   └── index.ts                ← TypeScript interfaces (User, Post, Comment...)
            │
            ├── services/
            │   ├── auth.service.ts         ← User authentication & JWT management
            │   ├── auth.interceptor.ts     ← Attaches JWT header automatically
            │   ├── post.service.ts         ← Core HTTP API calls for blog posts
            │   ├── message.service.ts      ← Core HTTP API calls for messages
            │   ├── settings.service.ts     ← Global application settings management
            │   └── scroll-to-top.service.ts ← Auto-scroll helpers on navigation
            │
            ├── guards/
            │   ├── auth.guard.ts           ← Route guard to protect authentications
            │   ├── admin.guard.ts          ← Route guard for admin access
            │   └── author.guard.ts         ← Route guard for author access
            │
            ├── pipes/
            │   └── role-filter.pipe.ts     ← Custom filtering pipe for user roles
            │
            └── components/
                ├── navbar/                 ← Blurry fixed header, user menu
                ├── footer/                 ← Responsive 4-column footer
                ├── home/                   ← Hero, categories, latest posts grid
                ├── blog-post/              ← Full-article viewer, comments, likes
                ├── about/                  ← Editorial overview, core values
                ├── contact/                ← Interactive contact form, FAQ accordion
                ├── login/                  ← Switchable tabbed Auth forms (Login & Register)
                ├── reset-password/         ← OTP recovery & password update
                ├── category/               ← Category-filtered post viewports
                ├── tag/                    ← Tag-filtered post viewports
                ├── legal/                  ← Terms & Conditions & Privacy tabs
                ├── admin/                  ← Dashboard control center (CRUD admin views)
                └── profile/                ← Static sidebar & custom-scroll right panel 🌟
                    ├── profile.component.html
                    ├── profile.component.css
                    └── profile.component.ts

```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas)
- Angular CLI: `npm install -g @angular/cli`

### 1. Start the Backend

```bash
cd blog-app/backend
npm install

# Set up environment
cp .env.example .env
# Edit .env and set:
#   MONGODB_URI=mongodb://localhost:27017/blogdb
#   JWT_SECRET=your_random_secret_here

npm run dev
# → Server running on http://localhost:5000
```

### 2. Start the Frontend

```bash
cd blog-app/frontend
npm install
ng serve
# → App running on http://localhost:4200
```

### 3. Create First Admin User

After registering via the UI, manually set your user as admin in MongoDB:

```javascript
// In MongoDB shell or Compass:
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "admin" } }
)
```

Then log in again — you'll see the ⚙ Dashboard link in the navbar.

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint              | Access  | Description           |
|--------|-----------------------|---------|-----------------------|
| POST   | /api/auth/register    | Public  | Register new user     |
| POST   | /api/auth/login       | Public  | Login + get JWT       |
| GET    | /api/auth/me          | Private | Get current user      |
| PUT    | /api/auth/profile     | Private | Update profile        |

### Posts
| Method | Endpoint                  | Access | Description                  |
|--------|---------------------------|--------|------------------------------|
| GET    | /api/posts                | Public | All published posts (paginated, searchable) |
| GET    | /api/posts/featured       | Public | Top 3 featured posts         |
| GET    | /api/posts/:slug          | Public | Single post (increments view)|
| POST   | /api/posts                | Admin  | Create post (with image)     |
| PUT    | /api/posts/:id            | Admin  | Update post                  |
| DELETE | /api/posts/:id            | Admin  | Delete post                  |
| POST   | /api/posts/:id/like       | User   | Toggle like                  |
| GET    | /api/posts/admin/all      | Admin  | All posts (including drafts) |

### Comments
| Method | Endpoint              | Access | Description        |
|--------|-----------------------|--------|--------------------|
| GET    | /api/comments/:postId | Public | Get post comments  |
| POST   | /api/comments         | User   | Add comment        |
| DELETE | /api/comments/:id     | User/Admin | Delete comment |

### Categories
| Method | Endpoint              | Access | Description          |
|--------|-----------------------|--------|----------------------|
| GET    | /api/categories       | Public | All categories       |
| POST   | /api/categories       | Admin  | Create category      |
| DELETE | /api/categories/:id   | Admin  | Delete category      |

---

## 🎨 Key Features

| Feature | Details |
|---------|---------|
| 🔐 Auth | JWT-based login/register with role management (admin/user) |
| 📝 CRUD Posts | Create, edit, delete, publish/draft with cover image upload |
| 💬 Comments | Add/delete comments on any post |
| ❤ Likes | Toggle like on posts (requires login) |
| 🔍 Search | Full-text search across title, content, tags |
| 🗂 Categories | Filter posts by category with color-coded chips |
| 📄 Pagination | Server-side pagination with page controls |
| 📱 Responsive | Fully mobile-friendly with collapsible nav |
| ⏱ Read Time | Auto-calculated from word count |
| 🖼 Image Upload | Multer-powered image upload for cover photos |

---

## 📦 Tech Stack

| Layer     | Technology        | Purpose                         |
|-----------|-------------------|---------------------------------|
| Frontend  | Angular 16        | SPA framework                   |
| Backend   | Node.js + Express | REST API server                 |
| Database  | MongoDB + Mongoose| Document database               |
| Auth      | JWT + bcryptjs    | Secure authentication           |
| Uploads   | Multer            | Image file uploads              |
| HTTP      | Angular HttpClient| API communication               |
| Forms     | Reactive Forms    | Form validation                 |
| Routing   | Angular Router    | Client-side navigation          |

---

## 💡 Tips for Beginners

1. **Start MongoDB** before running the backend (`mongod` in terminal)
2. **Check CORS** — backend allows `localhost:4200` by default
3. **Use MongoDB Compass** to view/edit your database visually
4. **Admin posts** can include HTML in the content field (e.g. `<h2>`, `<strong>`, `<blockquote>`)
5. **JWT expires** in 7 days — users need to re-login after that

---

Made with ❤ — MEAN Stack Blog by InkDrop
