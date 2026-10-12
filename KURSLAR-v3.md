# Kurslar va talabalar — v3

Admin bosh sahifasi va Darslar sahifasida Yangi dars yonida Yangi kurs mavjud. Kurs nomi, butun so‘mdagi narxi va tavsifini kiriting. Kurslar ro‘yxatidan tahrirlash mumkin. Yangi dars yaratishda kursni tanlang.

O‘quvchi qo‘shishda kursni tanlang: uning kurs narxi shaxsiy to‘lov hisobiga ko‘chadi. Saqlashdan so‘ng /admin/students/:id sahifasi avtomatik ochiladi. Keyin ro‘yxatdagi ismni bosib kirasiz. O‘quvchilar soniga dasturiy limit yo‘q; demo saqlash hajmi brauzer kvotasiga bog‘liq.

Bu versiyada har bir talaba bitta kursga biriktiriladi. Kursdagi darslar va 70% dan yuqori test orqali keyingi darsni ochish boshqa kurslardan ajratilgan. Kurs narxini o‘zgartirish avvalgi talabalar bilan kelishilgan narxni o‘zgartirmaydi. To‘lov yozuvi mavjud talabaning kursini almashtirish bloklangan — to‘lov boshqa kursga tasodifan o‘tmaydi. Shaxsiy sahifada kelishilgan narxni tahrirlash mumkin.

Avvalgi o‘quvchi/darslar avtomatik AI kursiga biriktiriladi, ma’lumotlar o‘chmaydi. Supabase hali ulanmagan, brauzer demo rejimi.

ZIPdagi src papkasini loyihangizdagi src o‘rniga qo‘ying. npm start; deploy: npm run build. Paketlar o‘zgarmagan.

Tekshiruv: CRA production build, no-undef tekshiruvi, kursga kirishni ajratish va eski ma’lumot migratsiyasi. Interaktiv browser QA bajarilmadi.
