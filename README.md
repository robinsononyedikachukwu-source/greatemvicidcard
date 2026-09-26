# Great Emvic School – ID cards and gate attendance

Student **and teacher** ID cards with QR codes, a gate scanner, attendance reports and Excel export.
It runs on **Node.js 18 or newer** with **one dependency** (the official MongoDB driver), and stores
everything in **MongoDB Atlas** — a free, always-on database that lives outside this server, so the
app can sleep and restart on a free host (like Render's free plan) without ever losing your data.

## Who can do what

| Account | Created by | Can do |
|---|---|---|
| **Super account** (one, the owner) | First-run setup (or environment variables) | Everything an administrator can, plus create/disable administrators, restore backups, erase data |
| **Administrator** | Super account only | Students, teachers, photos, ID cards, QR codes, corrections, reports, exports, settings, and **create gate-operator accounts** |
| **Gate operator** | Super account or an administrator | Scanner only: scan, search a person, see today's activity |

Nobody can sign themselves up. The built-in super account is `admin` / `Harbor-Comet-1387!` (change this in `server.js`, in the `EMBEDDED_SUPER` line near the bottom, before the very first start — editing it after the account already exists does nothing).

## Classes

The standard classes are **Primary1–5, JSS1–3, and SS1–3**. Settings → Classes lets you add an extra group (like SS2A or Primary6) only if you ever need one.

## Teachers

**Teachers** in the menu registers teachers (staff ID, name, subject, phone, photo) or imports them from Excel. Teachers get ID cards with QR codes like students do, are scanned at the same gate, and appear in attendance, reports and Excel exports with their own opening time (Settings) for late detection.

## Set up MongoDB Atlas (one-time, about 5 minutes)

1. Go to **mongodb.com/cloud/atlas/register** and create a free account (email + password, no card needed).
2. It will offer to create a free cluster — accept the defaults ("M0", the free tier) and give it any name.
3. Under **Security → Database Access**, click **Add New Database User**. Choose a username and password (write these down — they go in your connection string, not your Atlas login).
4. Under **Security → Network Access**, click **Add IP Address → Allow Access From Anywhere** (`0.0.0.0/0`). This is fine here: the database still requires the username/password from step 3.
5. Go to **Database → Connect → Drivers**, and copy the connection string. It looks like:
   `mongodb+srv://theusername:thepassword@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   Replace `theusername`/`thepassword` with what you set in step 3.

That connection string is your `MONGODB_URI`.

## Try it on your PC

1. Install Node.js (LTS) from nodejs.org.
2. Open this folder, click the address bar, type `cmd`, press Enter.
3. Run:
   ```
   set MONGODB_URI=mongodb+srv://theusername:thepassword@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   npm install
   node server.js
   ```
4. Open http://localhost:3000, sign in with `admin` / `Harbor-Comet-1387!`.
5. **Settings → Load demo students** (adds 6 students and 3 teachers).

## Put it online (Render, free plan is fine now)

1. Push this folder to a GitHub repo (or update your existing one with these files).
2. On Render: **New + → Web Service**, connect the repo.
   - Runtime: **Docker** (it will auto-detect the `Dockerfile`)
   - Instance type: **Free** — no disk needed anymore, so this is safe to leave on free
3. Add one **Environment Variable**: `MONGODB_URI` = the connection string from above.
4. Click **Deploy Web Service**. Open the address it gives you and sign in.

The free plan still sleeps after inactivity and takes ~30–50 seconds to wake on the next visit — but your data is safe in Atlas either way, so this is now just a wait, not a data loss.

## If the QR scanner does not read a card

* Use **Chrome or Edge**; allow the camera when asked; on a phone open the site over **https**.
* Hold the card **flat, close, and well lit**, filling about half the frame. Avoid glare on laminated cards.
* Fallbacks in the scanner screen: **take a photo of the QR code**, search the person by name/ID, or type the code.
* Print cards at 100% scale (no "fit to page"). The QR is about 22 mm wide.

## Safety and limits

* Passwords are hashed (scrypt); sessions use HttpOnly SameSite cookies; logins are rate-limited; strict Content-Security-Policy.
* Entry/exit times are stamped by the server. The QR contains only a random identifier.
* There is no offline mode: if the connection drops the scanner says the scan was **not** confirmed.
* MongoDB Atlas's free tier (M0) gives about 512 MB of storage — plenty for one school's records and photos.

## Tests

Requires a `MONGODB_URI` pointing at a real (or test) Atlas cluster:
```
npm install
MONGODB_URI="..." PORT=3111 node server.js
```
then in another terminal: `node tests/api-test.js` (70+ checks: permissions, roles, 25 simultaneous scans → one entry, replaced QR, teachers, Primary classes, and more).
