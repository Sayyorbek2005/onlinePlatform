# AI Academy — React o‘quv platformasi

Create React App (react-scripts 5), React 18 va react-router-dom bilan tayyorlangan to‘liq loyiha. Har bir sahifaning JSX va CSS fayllari alohida. Admin sahifalari umumiy Admin.css dan foydalanadi.

## 1. Ishga tushirish

Node.js 22+ o‘rnating. ZIPni oching va loyiha katalogida:

```bash
npm install
npm start
```

Terminaldagi local manzilni brauzerda oching.

```bash
npm run build
npx serve -s build
```

Vercel: Build Command `npm run build`, Output Directory `build`. BrowserRouter sahifalarini yangilash uchun vercel.json ichida rewrite mavjud. Boshqa hostingda barcha route'larni index.html ga yo‘naltiring.

## 2. Demo hisoblar

| Rol | Email | Parol |
| --- | --- | --- |
| Admin | admin@academy.uz | Admin123! |
| O‘quvchi | student@academy.uz | Student123! |

Login sahifasida demo rol tugmasi maydonlarni to‘ldiradi. Kirish tugmasini bosing. Rolni foydalanuvchi o‘zi tanlab o‘zgartirmaydi; u hisobdan olinadi. Admin yangi o‘quvchilarni yaratadi.

## 3. Fayllarni o‘rganish tartibi

1. package.json — paketlar va buyruqlar.
2. src/index.jsx — React, BrowserRouter, AppProvider.
3. src/services/db.js — boshlang‘ich ma’lumot, progress qoidalari, IndexedDB videolar.
4. src/context/AppContext.jsx — sessiya va ma’lumotlar holati.
5. src/App.jsx — marshrutlar va rolga qarab yo‘naltirish.
6. src/components/Layout.jsx + Layout.css — sidebar, navigatsiya, umumiy layout.
7. src/pages/Login.jsx + Login.css — kirish.
8. src/pages/Course.jsx + Course.css — kurs va ketma-ket darslar.
9. src/pages/Lesson.jsx + Lesson.css — video, vazifa, test.
10. src/pages/Certificate.jsx + Certificate.css — sertifikat va PDFga chop etish.
11. src/pages/Support.jsx + Support.css — murojaatlar, javoblar, FAQ.
12. src/pages/Admin.jsx — statistika va o‘quvchilar progressi.
13. src/pages/AdminLessons.jsx — dars CRUD, tartiblash, e’lon qilish, video yuklash, test muharriri.
14. src/pages/AdminStudents.jsx — hisob yaratish, qidirish, tahrirlash, bloklash va o‘chirish.
15. src/pages/AdminReviews.jsx — vazifalarni tasdiqlash/qaytarish, izoh.
16. src/pages/AdminSupport.jsx — murojaatlarga javoblar.
17. src/pages/Admin.css — admin bo‘limlarining umumiy stili.
18. src/index.css — umumiy ranglar, tugmalar, formalar, responsive qoidalar.
19. src/services/supabase.js + .env.example — keyingi Supabase bosqichi uchun mijoz tayyorlash.

## 4. Ishlash tartibi

- Admin bilan kiring → Darslar va testlar → darsni tahrirlang → MP4/WebM yuklang yoki to‘g‘ridan-to‘g‘ri HTTPS video fayl URL kiriting. YouTube sahifa havolasi ishlatilmaydi.
- Demo bilan tayyor o‘quv videolari kelmaydi. Matnlar va testlar namuna; o‘z kurs materiallaringizni yuklang. Video yuklash chegarasi 200 MB; brauzer kvotasi kamroq bo‘lishi mumkin.
- Birinchi dars ochiq. Keyingi dars uchun oldingi barcha faol darslarda: testdan 70% dan yuqori natija talab qilinadi. Test bo‘lmasa keyingi dars yopiq qoladi; admin test kiritishi kerak.
- O‘quvchi javob yuboradi → chiqadi → admin vazifani tekshiradi → o‘quvchi qayta kirib yangilangan progressni ko‘radi.
- Barcha e’lon qilingan darslar yakunlangach, sertifikat ochiladi. PDF saqlash tizimning chop etish oynasi orqali bajariladi. Bu demo sertifikat, rasmiy verifikatsiya emas.
- Qo‘llab-quvvatlashda yuborilgan savol admin panelida ko‘rinadi; javob o‘quvchi sahifasida chiqadi.
- Hisob va dars o‘chirishdan oldin tasdiq so‘raladi. O‘chirishga tegishli natijalar ham o‘chiriladi.

## 5. Hozirgi demo chegaralari

Supabase hali ULANMAGAN. .env ni to‘ldirishning o‘zi demo repositoryni almashtirmaydi.

Matnlar localStorage, videolar IndexedDB, sessiya localStorage yoki sessionStorage da saqlanadi. Bu bir brauzer uchun funksional prototip; boshqa qurilmalar va ochiq tablar orasida sinxronlash yo‘q. Brauzer ma’lumotlarini tozalash saqlangan ma’lumotlarni yo‘qotadi.

Demo parollar ochiq ko‘rinishda clientda saqlanadi, test javoblari ham clientda bor. Frontend rol tekshiruvi server xavfsizligi emas. Haqiqiy parollar yoki maxfiy o‘quvchi ma’lumotlarini demo rejimiga kiritmang. Video yakuni oddiy playback hodisasi orqali belgilanadi; imtihon nazorati/DRM yo‘q.

## 6. Supabase ulash — keyingi bosqich

1. Supabase project yarating; Auth email/password yoqing.
2. `.env.example` ni `.env` ga ko‘chiring, URL va publishable key kiriting. Secret/service_role key frontendga qo‘yilmaydi.
3. profiles (Auth UUID, name, role, active), lessons, questions, progress, submissions, attempts, tickets jadvallarini yarating.
4. Barcha jadvallarda RLS: o‘quvchi faqat o‘z progress/vazifa/natija/murojaatlarini ko‘radi; admin boshqaradi. Rol o‘zgartirishni foydalanuvchiga ruxsat bermang.
5. Video uchun private Storage bucket, admin upload policy va authorized signed URL yarating.
6. Loginni signInWithPassword, sessiyani onAuthStateChange bilan almashtiring. Demo repository o‘rniga asinxron Supabase CRUD adapterini ulang.
7. O‘quvchi yaratish/parol tiklashni himoyalangan Edge Function yoki admin backend orqali bajaring.
8. Test javoblarini va baholashni serverda saqlang; sertifikat shartlarini serverda tekshiring.
9. Haqiqiy ikki hisob bilan RLS, rol, Storage va progressni alohida sinang.

API manbalari: https://reactrouter.com/start/declarative/routing va https://supabase.com/docs/reference/javascript/initializing

## 7. Tekshiruv

Production build muvaffaqiyatli o‘tdi. Progress talablari, qat’iy >70% chegarasi, dars ketma-ketligi, vazifa rad etilishi va o‘quvchilar ajratilishi Node assertion orqali tekshirildi. Ushbu muhitda interaktiv brauzer QA bajarilmadi; video yuklash/playback va responsive ko‘rinishni o‘z brauzeringizda tekshiring.

## GitHub va Vercel

GitHubda yangi bo‘sh repository yarating. Papkada terminal oching:

```bash
git init
git add .
git commit -m "Initial AI Academy CRA project"
git branch -M main
git remote add origin https://github.com/USERNAME/REPOSITORY.git
git push -u origin main
```

USERNAME/REPOSITORY qismini o‘zingiznikiga almashtiring. Vercelda Add New Project → GitHub repository → Import. Framework: Create React App; Build: npm run build; Output: build. Deploy tugmasini bosing. .env fayli GitHubga yuborilmaydi. Supabase keyingi bosqichda ulanadi.

ZIP ichida node_modules va build yo‘q — npm install va npm run build ularni yaratadi. Ushbu CRA nusxasini o‘zingiz deploy qilasiz.
