# E-Ticaret Yönetim Paneli - Frontend

Next.js 16 tabanlı modern admin dashboard.

## Kurulum

```bash
npm install
```

## Geliştirme

```bash
npm run dev
```

## Kullanılan Teknolojiler

### UI Framework
- **shadcn/ui** - Modern, erişilebilir UI bileşenleri
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Erişilebilir primitif bileşenler
- **Lucide React** - Modern ikon kütüphanesi

### State Management & Data Fetching
- **TanStack Query (React Query)** - Server state yönetimi
- **Zustand** - Client state yönetimi (hafif ve performanslı)

### Form Yönetimi
- **React Hook Form** - Performanslı form yönetimi
- **Zod** - TypeScript-first schema validation
- **@hookform/resolvers** - Zod entegrasyonu

### Tablo & Veri Görselleştirme
- **TanStack Table** - Güçlü tablo yönetimi
- **Recharts** - Grafik ve chart kütüphanesi

### Diğer
- **next-themes** - Dark mode desteği
- **date-fns** - Tarih işlemleri
- **react-day-picker** - Date picker bileşeni
- **axios** - HTTP client

## Klasör Yapısı

```
frontend/
├── app/                    # Next.js App Router
├── components/             # React bileşenleri
│   └── ui/                 # shadcn/ui bileşenleri
├── lib/                    # Yardımcı fonksiyonlar
│   ├── api.ts             # Axios instance ve interceptors
│   ├── store.ts           # Zustand store'ları
│   └── utils.ts           # Utility fonksiyonları
├── providers/             # React context provider'ları
│   ├── query-provider.tsx # TanStack Query provider
│   └── theme-provider.tsx # Theme provider
├── hooks/                 # Custom React hooks
└── services/              # API service fonksiyonları
```

## Ortam Değişkenleri

1. `.env.example` dosyasını `.env.local` olarak kopyalayın:
```bash
cp .env.example .env.local
```

2. `.env.local` dosyasını düzenleyip backend API URL'inizi girin:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Not:** `.env.local` dosyası git'e commit edilmez (güvenlik için). `.env.example` dosyası template olarak kullanılır.

## shadcn/ui Bileşenleri Ekleme

Yeni bileşen eklemek için:

```bash
npx shadcn@latest add [component-name]
```

Örnek:
```bash
npx shadcn@latest add button
npx shadcn@latest add table
npx shadcn@latest add dialog
```

## Özellikler

- ✅ TypeScript desteği
- ✅ Dark mode desteği
- ✅ Responsive tasarım
- ✅ JWT token yönetimi (otomatik refresh)
- ✅ Form validation (Zod + React Hook Form)
- ✅ Tablo yönetimi (TanStack Table)
- ✅ Grafik desteği (Recharts)
- ✅ Modern UI bileşenleri (shadcn/ui)
