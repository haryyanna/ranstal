# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Supabase Sync

Untuk sinkron data lintas device (bukan localStorage per browser), lihat panduan di `SUPABASE_SETUP.md`.

## Deploy Vercel

Untuk checklist deploy lengkap (env + verifikasi), lihat `VERCEL_CHECKLIST.md`.

## Deploy GitHub Pages tanpa backend

Scan tetap dapat mengenali makanan tanpa Vercel melalui model klasifikasi ringan yang berjalan di browser. Pada pemakaian pertama, browser mengunduh model dari Hugging Face (sekitar 21,5 MB); koneksi internet diperlukan. Setelah itu, foto diproses di perangkat. Hasil otomatis ditampilkan sebagai prediksi visual agar pengguna dapat memastikan nama makanan sebelum membaca nutrisinya. Pengenalan cepat mencakup kelas umum yang dikenali model; untuk makanan yang tidak dikenali, pilih nama yang sesuai dari katalog.

Untuk menerbitkan ke URL GitHub Pages yang sama, buka `Settings -> Pages`, pilih `GitHub Actions` sebagai sumber deploy, lalu push ke branch `main`. Workflow `.github/workflows/pages.yml` akan build dan menerbitkan situs.
