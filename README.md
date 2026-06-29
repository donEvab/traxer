# Traxer

Aplikasi personal tracker buat mengganti journaling/logging manual di spreadsheet.

## Cara pakai

1. Buka `index.html` di browser atau link GitHub Pages.
2. Pakai screen **Home** untuk daily check-in.
3. Pakai **Database Preview** untuk lihat row spreadsheet.
4. Pakai **Goals & Targets** untuk ubah target mingguan.
5. Pakai **Database Settings** untuk isi Spreadsheet ID dan Apps Script URL.
6. Pakai **Data Visualisation** untuk lihat grafik weight, savings, habit, dan overall score.

Data disimpan di `localStorage` browser.

## Install sebagai app

Traxer sudah dibuat sebagai PWA. Dari Chrome/Edge desktop bisa pakai tombol **Install App** kalau muncul. Dari HP, buka link Traxer lalu pilih **Add to Home Screen** dari menu browser.

## Google Sheets auto-sync

1. Di Google Sheets, buka **Extensions > Apps Script**.
2. Paste isi `google-apps-script.js`.
3. Kalau Apps Script dibuat bukan dari spreadsheet itu, isi `CONFIG.SPREADSHEET_ID` dengan ID spreadsheet.
4. Klik **Deploy > New deployment > Web app**.
5. Set **Execute as** ke akun sendiri.
6. Set **Who has access** ke akun sendiri atau anyone with link sesuai kebutuhan.
7. Copy **Web App URL** ke **Database Settings > Apps Script Web App URL** di Traxer.
8. Copy Spreadsheet ID ke **Database Settings > Spreadsheet ID**.
9. Buka Web App URL di browser. Kalau muncul `Traxer webhook is ready`, URL sudah benar.
10. Klik **Kirim ke Sheets** dari Traxer.

Kalau habis edit script, deploy ulang sebagai versi baru. URL lama kadang masih menunjuk versi lama.

Sheet yang dipakai:

- `Weekly Log`
- `Dashboard Weekly`
- `Daily Log`

Kalau sheet belum ada, script akan membuatnya.
