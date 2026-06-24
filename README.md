# Traxer

Aplikasi personal tracker buat mengganti journaling/logging manual di spreadsheet.

## Cara pakai

1. Buka `index.html` di browser.
2. Pilih tanggal, isi berat, checklist habit, trading P/L, dan savings.
3. Klik **Simpan**.
4. Pakai **Copy Weekly Row** untuk paste langsung ke sheet, atau **Download CSV**.

Data disimpan di `localStorage` browser.

## Google Sheets auto-sync

1. Di Google Sheets, buka **Extensions > Apps Script**.
2. Paste isi `google-apps-script.js`.
3. Kalau Apps Script dibuat bukan dari spreadsheet itu, isi `CONFIG.SPREADSHEET_ID` dengan ID spreadsheet.
4. Klik **Deploy > New deployment > Web app**.
5. Set **Execute as** ke akun sendiri.
6. Set **Who has access** ke akun sendiri atau anyone with link sesuai kebutuhan.
7. Copy **Web App URL** ke field **Apps Script URL** di Traxer.
8. Buka Web App URL di browser. Kalau muncul `Traxer webhook is ready`, URL sudah benar.
9. Klik **Kirim ke Sheets** dari Traxer.

Kalau habis edit script, deploy ulang sebagai versi baru. URL lama kadang masih menunjuk versi lama.

Sheet yang dipakai:

- `Weekly Log`
- `Dashboard Weekly`
- `Daily Log`

Kalau sheet belum ada, script akan membuatnya.
