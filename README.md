# AI Academy — CRA v4.1

React 18, Create React App, react-router-dom. Admin va o‘quvchi platformasi. JSX va CSS alohida.

## Ishga tushirish

Node.js 22+ bilan papkada:

```bash
npm install
npm start
```

Build: `npm run build`. Vercel framework: Create React App. Build command: `npm run build`. Output: `build`. `vercel.json` ichida SPA rewrite bor.

Avvalgi loyiha bo‘lsa, zaxiralang. Ushbu ZIPdagi `src`, `public`, `package.json`, `package-lock.json` va `vercel.json` bilan yangilang; keyin `npm install`. Faqat src almashtirish yetarli emas: PDF uchun jspdf qo‘shildi. O‘z .env faylingizni saqlang. node_modules/build ZIPda yo‘q, buyruqlar ularni yaratadi.

## Hisoblar

- Admin: admin@academy.uz / Admin123!
- O‘quvchi: student@academy.uz / Student123!

Log out yuqorida, ikkala rolda ham. “Ha, chiqish” tasdiq bo‘lsa sessiya o‘chadi. Refresh sessiyani saqlaydi. “Meni eslab qolish” belgilanmasa sessiya faqat shu tab muddati uchun.

## Kurslar va talabalar

Admin → Kurslar va darslar → Yangi kurs: nom, butun so‘mdagi narx, tavsif. Narx o‘zgarsa avval sotilgan kurslar narxi o‘zgarmaydi.

Talabalar → Talaba qo‘shish yoki Tahrirlash: bir nechta kursni CHECKBOX bilan tanlang. Har bir talaba–kurs uchun alohida kelishilgan narx saqlanadi. Talaba ismi uning alohida sahifasiga olib kiradi. U yerda kurslar, to‘lovlar, qarz, videolar, barcha test urinishlari, amaliy natijalar va berilgan sertifikatlar bor.

Tarixi yoki to‘lovi bor kursni talaba hisobidan olib tashlash bloklangan. Kursni almashtirish o‘rniga qo‘shimcha kurs biriktiring. Bunday cheklov tarix va to‘lovlar yo‘qolishining oldini oladi. Hisobni bloklash mumkin. Talabalarni doimiy o‘chirish tugmasi bu versiyada olib tashlangan.

O‘quvchi → Mening kurslarim: barcha sotib olingan kurslar kartalari va menyu ostidagi kurslar. Har bir kursning darslari, progressi va sertifikati mustaqil.

## Moliya

- Jami talabalar, shartnoma qiymati, qilingan to‘lov, qarzdorlar soni, qarz va eski ortiqcha to‘lov.
- Qarzdorlar kartasi barcha qarzdorlarni ko‘rsatadi; ism bosilsa shaxsiy sahifa ochiladi.
- Kurs bo‘yicha sotuv, to‘lov va qarz statistikasi.
- Sanalar bo‘yicha to‘lovlar tarixi va davr summasi.
- To‘lovda talaba VA kurs tanlanadi. Miqdor musbat butun so‘m, sanasi bugundan keyin emas, qolgan qarzdan oshmasligi kerak.
- To‘lovni talabalar sahifasida sabab bilan BEKOR qilish mumkin. Yozuv tarixda qoladi, moliyaviy summadan chiqariladi. Bu bank orqali pul qaytarish emas.
- Bir kursdagi ortiqcha to‘lov boshqa kursning qarzini avtomatik yopmaydi.
- Yozuvlar qo‘lda kiritiladi. Click/Payme yoki bank integratsiyasi yo‘q.

## Darslar va tarix

Darsda uchta tab: Test, Amaliy, Qo‘shimcha materiallar.

Admin video (200 MB gacha) yoki HTTPS MP4/WebM URL kiritadi. Qo‘shimcha materiallar: PDF, XLS, XLSX; har biri 20 MB gacha, bir nechta tanlash mumkin. O‘quvchi ularni materiallar tabidan yuklab oladi. Brauzer kvotasi fayllar umumiy hajmini cheklashi mumkin.

Keyingi dars shu kursdagi oldingi faol darslarning testidan qat’iy 70% DAN YUQORI natijada ochiladi. Aynan 70% yetmaydi. Boshqa kurs progressi aralashmaydi.

Test topshirilgach natija/javoblar tahrirlanmaydi. Boshidan qayta boshlash yangi urinish yaratadi; barcha urinishlar tarixda qoladi. Boshlangan testdagi savollar nusxasi va tanlovlar refreshdan keyin saqlanadi. Admin testni o‘zgartirsa eski natijalar o‘zgarmaydi.

Amaliy topshiriq matni va ixtiyoriy PDF/Excel/rasm ilova (20 MB gacha). Tekshirish kutilayotgan vaqtda takror topshirish bloklanadi. Admin 0–100 baho, tasdiqlash/qaytarish va izoh beradi. Tekshirilgan natija o‘zgartirilmaydi. Yangi topshirish eski natijani almashtirmaydi.

Darsni o‘chirish amali arxivlaydi, faolligini o‘chiradi; test, amaliy va video tarixi qoladi. Faollash arxivdan qaytaradi. Saqlangan darsni boshqa kursga ko‘chirish bloklangan, chunki natijalar kursga tegishli.

## Sertifikat

Har bir kurs bo‘yicha barcha faol dars videolari yakunlangan, testlar >70% va amaliy ishlar tasdiqlangan bo‘lsa ochiladi. Yakuniy baho — kursdagi har bir darsning eng yaxshi test natijalarining oddiy o‘rtachasi. PDF birinchi yuklanganda ism, kurs nomi, yakuniy baho, sana va ID bilan berilgan sertifikat saqlanadi. Keyingi yuklashlar aynan shu natijani beradi. Admin talaba sahifasida ham ko‘radi/yuklaydi. Bu ta’lim platformasining sertifikati, davlat akkreditatsiyasi yoki tashqi verifikatsiya emas.

## Dizayn

`src/index.css` ning `:root` qismida barcha ranglar, fonlar, shrift o‘lchamlari bor. `--primary: #080acd`. Eng kichik matn — 18px. PDF typography tokenlari ham shu yerda. Header panelda fixed, mobil menyu alohida ochiladi. Sahifaviy CSS fayllari saqlangan, umumiy komponent stillari index.css da.

## Saqlash va cheklovlar

Supabase HALI ULANMAGAN. Matnli ma’lumotlar localStorage, fayllar IndexedDBda. Eski v1–v3 hisoblar bir martalik moslashtirish orqali enrollment modeliga o‘tadi; bir xil brauzer va saytda ma’lumotlar saqlanadi. Yangi domen/brauzerga avtomatik ko‘chmaydi. Eski natijalarda savol nusxalari yoki amaliy baho saqlanmagan bo‘lsa, tafsilot “—” bo‘lishi mumkin. O‘tmishdagi, avval o‘chirilgan tarix tiklanmaydi.

Bu demo: parollar va test javoblari clientda; rollar va baholash server xavfsizligiga ega emas. Haqiqiy o‘quvchilar va to‘lovlar uchun Supabase Auth/RLS, serverda baholash va private Storage ulanishi kerak. .env ni to‘ldirishning o‘zi backendni ulab bermaydi.

Video download tugmasi/PiP cheklangan va ism/email watermark bor. Oddiy brauzerda screenshot, screen recording yoki faylni texnik vositalar bilan olishni mutlaq bloklab bo‘lmaydi. PDF/Excel uchun yuklash ruxsat etilgan.

## Tekshiruv

```bash
npm run test:domain
npm test -- --watch=false --runInBand
npm run build
```

46 domen tekshiruvi: ko‘p kurs, to‘lovlar, qarzdorlik, izolyatsiya, o‘zgarmas test/amaliy tarix, sertifikat va migratsiya.
7 React komponent testi: chiqishni tasdiqlash/inkor, ikki kursli talaba yaratish va shaxsiy sahifaga o‘tish, darsdagi 3 tab, qarzdorlar ro‘yxati, admin logout.
Production build tekshirildi. Haqiqiy browser/device vizual QA, video playback, IndexedDB upload/download va PDF yuklashni brauzerda tekshirish bu muhitda bajarilmadi. “100% xatosiz” kafolati berilmaydi.

`TOLIQ-KODLAR.md` ichida barcha src fayllari to‘liq, alohida sarlavhalar bilan berilgan.

## Dashboard yangilanishi (v4.1)

Dashboardda To‘lov qo‘shish tugmasi modal ochadi. Talaba, kurs, summa, sana va usulni tanlang. Saqlangach oyna yopiladi, dashboard va moliya summalari yangilanadi. Bu to‘lovni qayd etish, bankdan pul yechish emas.

Kurslar tugmasi va dashboarddagi Kurslar kartasi qidiruvli modal ochadi. Kurs nomi, narxi, talabalar va darslar soni kartalarda ko‘rinadi. Shu oynada kurs yaratish va tahrirlash mumkin.

V4 dan o‘tishda faqat quyidagi fayllar yangilanadi:
- src/pages/Admin.jsx
- src/components/CourseManager.jsx
- src/components/CourseManager.css (yangi fayl)

Qo‘shimcha paket kerak emas. Build va 7 interfeys testi muvaffaqiyatli o‘tgan.
