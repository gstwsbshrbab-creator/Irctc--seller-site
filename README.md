# IRCTC-style ID Selling Web App

Full-stack demo project: users can buy IRCTC-style IDs, upload payment slips, and admins can verify orders and assign IDs.

## Tech Stack

- Backend: Node.js + Express + MongoDB (Mongoose)
- Frontend: React (Vite) + Tailwind CSS
- Auth: JWT-based admin login
- Storage: Local `uploads/` folder for slips (can be swapped to Cloudinary/Supabase)

## Folder Structure

- `/server` – Express app entry point and config
- `/models` – Mongoose models (Admin, Id, Order, Settings)
- `/controllers` – Route handlers
- `/routes` – Express route definitions
- `/uploads` – Stored payment slips (git-ignored in real repo)
- `/client` – React + Vite + Tailwind frontend

## Environment Variables

Copy `.env.example` to `.env` and fill:

```bash
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=long_random_secret
ADMIN_EMAIL=admin@test.com
ADMIN_PASS=YourSecurePass123
UPLOAD_PATH=./uploads
PORT=5000
ADMIN_PHONE=91XXXXXXXXXX
CLIENT_URL=http://localhost:5173
```

## Backend: Local Development

```bash
# In project root
npm install
npm run seed   # seeds admin + ~50 IDs
npm start      # or: npm run dev
```

Backend will start on `http://localhost:5000` by default.

## Frontend: Local Development

```bash
cd client
npm install
npm run dev
```

Vite dev server runs on `http://localhost:5173`.

## Basic Flow (User)

1. User selects an ID plan (1/2/5 etc.) on landing page.
2. App shows current *Remaining IDs* counter from `/ids/remaining`.
3. On **Pay**:
   - App fetches `/payment/upi?amount=...` for UPI URI + QR.
   - Shows QR image + UPI link.
4. After payment, user uploads a compressed slip image.
5. Client compresses slip (~150KB) and renames file to `ORD-XXXXXX.jpg` before upload.
6. Slip is uploaded to `/slip/upload`.
7. Then order is created via `/order/create` and returns `orderId`.
8. App opens `https://wa.me/<ADMIN_PHONE>?text=...` with pre-filled text including `orderId`.
9. User can later check status via `/order/status/:orderId`.

## Basic Flow (Admin)

1. Open `/admin/login` on frontend and log in with `ADMIN_EMAIL` / `ADMIN_PASS` from `.env`.
2. Dashboard shows counters: total orders, today, pending, verified, sold, remaining IDs.
3. Orders list page lets admin:
   - View order details and slip preview.
   - Verify an order (auto-assign next available ID and mark as sold).
   - Reject an order.
4. ID Management page:
   - Bulk-add IDs (paste list).
   - Mark IDs as sold/unused manually.
5. Settings page:
   - Update UPI ID, QR image URL, plan prices, admin WhatsApp phone.

## API Overview

Main API endpoints (all prefixed at backend root, e.g. `http://localhost:5000`):

- `POST /admin/login`
- `GET /admin/me`
- `GET /admin/stats`
- `POST /ids/add`
- `GET /ids/remaining`
- `GET /ids/getOne`
- `POST /ids/markSold`
- `POST /slip/upload`
- `POST /order/create`
- `GET /order/status/:orderId`
- `POST /order/verify`
- `GET /payment/upi?amount=...`
- `GET /settings/public`
- `GET /settings/admin`
- `POST /settings`
- `POST /whatsapp/send` (returns a `wa.me` link only, no auto-send)

## Curl Examples (quick testing)

Replace `http://localhost:5000` with your deployed backend URL.

### Admin login

```bash
curl -X POST http://localhost:5000/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"YourSecurePass123"}'
```

Copy the `token` from response and export it:

```bash
export ADMIN_TOKEN="<paste-token-here>"
```

### Remaining IDs

```bash
curl http://localhost:5000/ids/remaining
```

### Create order (without file, for quick test)

Normally the frontend uploads slip first, then calls this. For quick dev you can send any URL.

```bash
curl -X POST http://localhost:5000/order/create \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test User",
    "phone":"910000000000",
    "qty":1,
    "amount":99,
    "slipUrl":"https://example.com/test-slip.jpg"
  }'
```

### Check order status

```bash
curl http://localhost:5000/order/status/ORD-123456
```

### Verify an order (admin)

```bash
curl -X POST http://localhost:5000/order/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"orderId":"ORD-123456"}'
```

### Bulk add IDs (admin)

```bash
curl -X POST http://localhost:5000/ids/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"ids":["IRCTCUSER201","IRCTCUSER202"]}'
```

### Payment UPI info

```bash
curl "http://localhost:5000/payment/upi?amount=199"
```

### Generate WhatsApp link (admin helper)

```bash
curl -X POST http://localhost:5000/whatsapp/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"phone":"910000000000","message":"Test message"}'
```

## Manual Test Flow (end-to-end)

1. **Setup**
   - Create `.env` from `.env.example` (root) with valid `MONGO_URI`, strong `JWT_SECRET`, and phone/UPI details.
   - Run `npm install` in project root.
   - Run `npm run seed` to create admin + ~50 IDs.
   - Start backend: `npm start`.
   - In another terminal: `cd client && npm install && npm run dev`.

2. **Create order (user)**
   - Open `http://localhost:5173`.
   - Confirm **Remaining IDs** shows a positive number.
   - Select a plan (1, 2, or 5 IDs) and verify price.
   - Enter name + WhatsApp number.
   - Click **Pay via UPI & Upload Slip**.
   - In modal, verify UPI ID and amount.
   - (Optional) Click UPI link to test `upi://` behavior on mobile.
   - Click **I have paid, continue**.
   - Choose any image file as dummy slip.
   - Confirm preview is shown (client compression + rename).
   - Click **Upload & Generate Order ID**.
   - Check that:
     - A toast shows order created + Order ID.
     - WhatsApp web/app opens with prefilled message (no image attached automatically).

3. **Verify order (admin)**
   - Open `http://localhost:5173/admin/login`.
   - Login with email/password from `.env`.
   - On dashboard, check counters (Total, Pending, Remaining IDs etc.).
   - Go to **Orders** tab.
   - Find the created order by `Order ID`.
   - Open slip link to confirm upload.
   - Click **Verify**.
   - Confirm:
     - Order status becomes `VERIFIED`.
     - `Assigned ID` column is filled.
     - Dashboard **IDs sold** increased, **Remaining IDs** decreased.

4. **User checks status**
   - Go to `http://localhost:5173/status`.
   - Enter the same `Order ID`.
   - Status should show `VERIFIED` and the assigned ID.

5. **Sold-out behavior**
   - For testing, you can manually mark most IDs as sold from **IDs** tab.
   - When remaining reaches 0, landing page buy button shows **SOLD OUT** and is disabled.

## Deployment Notes (free-tier friendly)

### Backend (Render / Railway / similar)

- Push this folder as a Git repo.
- Create a new **Web Service** (Node) on Render/Railway.
- Set build command: `npm install`.
- Set start command: `npm start`.
- Configure env vars from `.env.example` (do **not** commit real `.env`).
- Ensure `UPLOAD_PATH=./uploads` and the platform allows persistent disk if you rely on local storage.

### Frontend (Vercel / Netlify)

- In `/client` folder, push code to Git.
- Create a new project in Vercel/Netlify from `/client`.
- Build command: `npm run build`.
- Output directory: `dist`.
- Set env var `VITE_API_BASE_URL` to your deployed backend URL.

## Using Cloud Storage (Cloudinary / Supabase) for slips

By default, slips are stored in local `uploads/` and served by Express. For a more robust setup:

1. **Cloudinary approach (example)**
   - Create free Cloudinary account.
   - Add env vars: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (do not commit).
   - In `server/routes/slipRoutes.js`, instead of `multer.diskStorage`, use `multer.memoryStorage()` to receive file buffer.
   - In `slipController.uploadSlip`, call Cloudinary SDK upload, get a secure URL, and return that as `url`.
   - Remove static `/uploads` serving if all new slips are remote.

2. **Supabase Storage (example)**
   - Create free Supabase project and bucket.
   - Use Supabase JS client in backend with service key (env var).
   - Upload `req.file.buffer` (with memory storage) to bucket.
   - Make bucket public or sign URLs on-demand and return `publicUrl` to the client.

> The frontend does not care where the slip is hosted as long as it gets a valid `slipUrl`.

## Notes & Limitations

- **WhatsApp**: Native `wa.me` links can only pre-fill text; image attachment **cannot** be auto-attached without WhatsApp Business API / paid third-party providers. User or admin must attach the slip image manually if needed.
- **Storage**: Default is local `uploads/`. For production, strongly consider Cloudinary/Supabase/S3 as outlined above.
- **Security**: Helmet, basic rate limiting, and server-side validation are enabled. Use HTTPS, strong `JWT_SECRET`, and locked-down MongoDB in production. CSRF protection is not enabled because auth uses Bearer tokens instead of cookies.

