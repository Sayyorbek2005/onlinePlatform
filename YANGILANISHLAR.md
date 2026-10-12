# Yangilangan CRA loyiha

## O‘rnatish

Mavjud loyihangizni zaxiralang. ZIPdagi `src` papkasini almashtiring. Paketlar o‘zgarmagan. `npm start` bilan oching; deploy uchun `npm run build`.

## Qoidalar

- Admin darsni Faollash/Nofaollash tugmasi bilan boshqaradi. Faol darsga kamida bitta test savoli kerak. Nofaol darslar ketma-ketlikda hisoblanmaydi.
- Keyingi dars oldingi faol darslar testidan qat’iy 70% dan YUQORI olinsa ochiladi. Aynan 70% ochmaydi. Qaror yaxlitlangan raqam emas, haqiqiy to‘g‘ri javoblar nisbatidan olinadi.
- Testni topshirgach javoblar/natija tahrirlanmaydi. Qayta boshlash alohida yangi urinish yaratadi. Avvalgi o‘tgan natija keyingi muvaffaqiyatsiz urinish bilan bekor qilinmaydi.
- Boshlangan test savollari nusxasi va tanlovlar refreshdan keyin saqlanadi. Admin savollarni keyin tahrirlasa, boshlangan test va tarix o‘zgarmaydi.
- Admin o‘quvchi ismini bosib alohida sahifaga kiradi: ma’lumotlar, kurs narxi, to‘lov qo‘shish/o‘chirish, qarz, ortiqcha to‘lov, video yakunlari, test va vazifalar. To‘lov bu qo‘lda yozuv, haqiqiy pul tranzaksiyasi emas.
- Sertifikat uchun barcha faol dars testlaridan o‘tish, videolarni yakunlash va vazifalarni tasdiqlatish talab qilinadi.
- Oldingi demo ma’lumotlar o‘chirilmaydi. Eski testlarda faqat foiz bo‘lgani uchun javoblar tafsiloti ko‘rinmaydi.
- Sign out ikkala rol uchun mavjud. Refresh sessiyani saqlaydi.

## Video himoyasining chegarasi

Yuklab olish va masofaviy ijro tugmalari yashirilgan, Picture-in-Picture va video ustidagi kontekst menyusi cheklangan; video ustida ism/email watermark bor. Bu cheklovlar brauzerga bog‘liq, yuklab olishni texnik jihatdan imkonsiz qilmaydi. Screenshot, tizim orqali screen recording, tashqi kamera va developer toolsni oddiy React saytida to‘liq bloklab bo‘lmaydi. Watermark ham DRM emas, fullscreen rejimida brauzer uni ko‘rsatmasligi mumkin.

Supabase hali ulanmagan. Rollar, test javoblari, to‘lov va natijalar brauzerdagi DEMO ma’lumotlari. Production uchun Supabase Auth + RLS, test baholashning server tomoni, private Storage va qisqa muddatli signed URL kerak.

## Tekshiruv

`CI=true npm run build`: Compiled successfully. >70% chegara, nofaol dars, foydalanuvchi ajratilishi, takror topshirishga qarshi tekshiruv, javobsiz savol, to‘lov summalari va eski ma’lumot migratsiyasi tekshirildi. Interaktiv browser QA bu muhitda bajarilmadi.
