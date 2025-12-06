# 🇲🇳 Нутгийн Дэлгүүр - Nutgiin Delguur

**Монголын үндэсний үйлдвэрлэгчдийн дэлхийд түгээх платформ**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.x-black)](https://nextjs.org/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)](https://vercel.com)

---

## 📖 Тойм (Overview)

**Нутгийн Дэлгүүр** нь Монгол орны 21 аймаг, 330+ сум/тосгоны үндэсний үйлдвэрлэгчдийг шууд худалдан авагчидтай холбож, орон нутгийн эдийн засгийг бэхжүүлэх зорилготой Next.js дээр суурилсан модерн вэб платформ юм.

### ✨ Онцлог Шинж Чанарууд

- 🗺️ **330+ Байршил** - 21 аймаг, 330+ сум/тосгоны иргэд бараагаа зарж чадна
- 📦 **15 Категори** - Хүнс, гар урлал, тариалан гэх мэт
- 🔒 **Аюулгүй** - 7-layer security, content moderation
- 🌙 **Dark Mode** - CSS variables ашигласан systemic dark theme
- 🌍 **i18n** - Монгол 🇲🇳 + Киргиз 🇰🇬 дэмжлэг
- 📱 **PWA** - Offline дэмжлэг бүхий Progressive Web App
- ⚡ **Performance** - Next.js 16 + React 19 + TypeScript 5
- 📊 **Real-time** - Supabase Realtime messaging

---

## 🚀 Эхлэх (Quick Start)

### Prerequisites

- Node.js 20+ эсвэл 22+
- npm, yarn эсвэл pnpm
- Supabase Project
- Cloudflare R2 Account (images)

### 1. Repository Clone

```bash
git clone https://github.com/eerdenee/nutgiin-delguur.git
cd nutgiin-delguur
```

### 2. Dependencies Install

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Variables

`.env.local` файл үүсгээд дараах утгуудыг бөглө:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Cloudflare R2 (for production images)
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=your_bucket_name
NEXT_PUBLIC_R2_PUBLIC_URL=https://your-r2-public-url.com

# Sentry (optional - error tracking)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your_org
SENTRY_PROJECT=your_project

# Super Admin Emails (comma-separated)
NEXT_PUBLIC_SUPER_ADMIN_EMAILS=your@email.com

# Site URL (for metadata)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Дэлгэрэнгүй: [`ENV_SETUP.md`](./ENV_SETUP.md)

### 4. Database Setup

Supabase Studio дээр [`supabase/schema.sql`](./supabase/schema.sql) ажиллуулаад migration файлуудыг импортлоорой:

```bash
# supabase/migrations/ folder-д байгаа бүх .sql файлуудыг дарааллаар
```

### 5. Run Development Server

```bash
npm run dev
```

Браузер дээр [http://localhost:3000](http://localhost:3000) нээнэ.

---

## 🏗️ Project Structure

```
nutgiin-delguur/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth group routes
│   │   ├── admin/             # Admin dashboard
│   │   ├── dashboard/         # User dashboard
│   │   ├── messages/          # Chat system
│   │   ├── product/           # Product pages
│   │   ├── api/               # API routes
│   │   └── ...
│   ├── components/            # Reusable UI components
│   ├── lib/                   # Business logic & utilities
│   │   ├── auth.ts           # Authentication
│   │   ├── products.ts       # Product CRUD
│   │   ├── moderation.ts     # Content moderation
│   │   └── ...
│   ├── hooks/                # Custom React hooks
│   ├── context/              # React Context providers
│   └── locales/              # i18n JSON files
├── supabase/
│   ├── schema.sql            # Database schema
│   └── migrations/           # SQL migrations
├── public/
│   ├── site.webmanifest      # PWA manifest
│   ├── sw.js                 # Service Worker
│   └── icons...
└── ...config files
```

---

## 💡 Core Features

### 🔐 Authentication
- Phone-based auth (via email pattern for Supabase Free tier)
- Google OAuth support
- Session management
- Role-based access (buyer, producer, admin)

### 📦 Product Management
- CRUD operations with Supabase RLS
- Image upload to Cloudflare R2
- Magic bytes validation
- 3-tier visibility system (Soum → Aimag → National)

### 💬 Real-time Messaging
- Supabase Realtime subscriptions
- Direct chat between buyers and sellers
- Read receipts

### 🛡️ Trust & Safety
- Content moderation with blacklist keywords
- Community reporting system
- User verification
- Admin moderation panel

### 💳 Subscription Plans
| Tier | Price | Ads/Month | Duration |
|------|-------|-----------|----------|
| 🆓 ЭХЛЭЛ | ₮0 | 3 | 7 days |
| 💪 ИДЭВХТЭЙ | ₮9,900 | 10 | 14 days |
| 🏢 БИЗНЕС | ₮49,000 | 100 | 30 days |

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

Current test coverage: ~15% (auth, subscription modules)

---

## 📊 Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Framework** | Next.js | 16.0.7 |
| **UI Library** | React | 19.2.0 |
| **Styling** | Tailwind CSS | 4.x |
| **Language** | TypeScript | 5.x |
| **Database** | Supabase/PostgreSQL | Latest |
| **Auth** | Supabase Auth | Latest |
| **Storage** | Cloudflare R2 | Latest |
| **Monitoring** | Sentry | 10.x |
| **Icons** | Lucide React | 0.555 |
| **Testing** | Jest + React Testing Library | Latest |

---

## 🛠️ Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm test` | Run tests |
| `npm run lint` | Run ESLint |
| `npm run ouroboros` | 🐍 Run full system validation cycle |

---

## 📝 Documentation

- [Env Setup Guide](./ENV_SETUP.md)
- [Database Schema](./supabase/schema.sql)

### 📚 The Akashic Records (Audit History)
Full transparency of the system's evolution through 14 Levels of Enlightenment:

1. [Entropy (Chaos)](./ENTROPY_AUDIT_REPORT.md)
2. [Multiverse (Dimensions)](./MULTIVERSE_AUDIT_REPORT.md)
3. [Singularity (Optimizations)](./SINGULARITY_AUDIT_REPORT.md)
4. [Time Dilation (Performance)](./TIME_DILATION_AUDIT_REPORT.md)
5. [Event Horizon (Security)](./EVENT_HORIZON_AUDIT_REPORT.md)
6. [Consciousness (Architecture)](./CONSCIOUSNESS_AUDIT_REPORT.md)
7. [Genesis (Philosophy)](./GENESIS_AUDIT_REPORT.md)
8. [The Void (Deep Logic)](./THE_VOID_AUDIT_REPORT.md)
9. [The Potentiality (Future)](./THE_POTENTIALITY_AUDIT_REPORT.md)
10. [The Simulation (Chaos Test)](./THE_SIMULATION_AUDIT_REPORT.md)
11. [The Archetype (Identity)](./THE_ARCHETYPE_AUDIT_REPORT.md)
12. [The Ethereal (Flow)](./THE_ETHEREAL_AUDIT_REPORT.md)
13. [The Ouroboros (Cycle)](./THE_OUROBOROS_AUDIT_REPORT.md)
14. [The Nirvana (Release)](./THE_NIRVANA_AUDIT_REPORT.md)

---

## 🌍 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/eerdenee/nutgiin-delguur)

### Manual Deployment

```bash
npm run build
npm start
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m '✨ Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License.

---

## 👤 Author

**Eerdenee**
- Email: eerdenee320@gmail.com
- GitHub: [@eerdenee](https://github.com/eerdenee)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [Cloudflare R2](https://www.cloudflare.com/products/r2/) - Object storage
- [Vercel](https://vercel.com/) - Deployment platform
- [Lucide](https://lucide.dev/) - Beautiful icons

---

<div align="center">

**🇲🇳 Нутгийн Дэлгүүр - Монголын үйлдвэрлэлийг дэлхийд түгээнэ 🇲🇳**

Made with ❤️ in Mongolia

</div>
