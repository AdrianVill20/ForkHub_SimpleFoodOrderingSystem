# Group 5 – Review Fixes (due Tue 11/24 EOD)

Text in <mark>yellow</mark> is new or changed: copy it into the real file. ~~Struck-out~~ text is what it replaces.

Files in this folder:
- `WBS_Group5_ForkHub_v4_HIGHLIGHTED.xlsx` – every changed cell is yellow, plus a **What Changed** sheet with the old and new lists side by side. Use it to see or copy the changes.
- `WBS_Group5_ForkHub_v4_CLEAN.xlsx` – the same content with no yellow. Ready to submit.
- This sheet – Project Plan and HLD changes to type in by hand.

---

## 1. Project Plan – Slide 16 (Control & Monitoring → Project Templates)

**Comment:** the Template column must show the file names in the **Templates folder**, not your actual file names.

| Document | Template (File Name) | Actual File (Naming Convention) |
|---|---|---|
| Project Plan | <mark>‹exact file name of the Project Plan template in the Templates folder›</mark> ~~Project Plan_[ForkHub][SimpleFoodOrderingSystem].pptx~~ | <mark>Project Plan_[ForkHub][SimpleFoodOrderingSystem].pptx</mark> |
| WBS | <mark>‹WBS template file name›</mark> ~~WBS_Group5_ForkHub.xls~~ | <mark>WBS_Group5_ForkHub.xlsx</mark> |
| HLD | <mark>‹HLD template file name›</mark> ~~HLD-ForkHub~~ | <mark>HLD_ForkHub.pptx</mark> ~~HLD-ForkHub~~ |
| Unit Test Cases | <mark>‹Unit Test Cases template file name›</mark> | <mark>UTC_Group5_ForkHub.xlsx</mark> (or your real file name) |
| Unit Test Results | <mark>‹Unit Test Results template file name›</mark> | <mark>UTR_Group5_ForkHub.xlsx</mark> (or your real file name) |

The Templates folder was not in the zip, so I could not read the template names. Open the folder and copy each name exactly, with its extension (for example `.pptx` or `.xlsx`).
Also fixed: the HLD actual name was written `HLD-ForkHub`, but the real file is `HLD_ForkHub.pptx`, and the WBS is `.xlsx`, not `.xls`.

**Also wrong in the Project Plan (not in the comments, but the panel may see it):**
- Slide 6, item 3 – DB: ~~Json~~ → <mark>SQLite (Entity Framework Core)</mark>
- Slide 7, Scope bullet 1 – built with React (frontend) and ~~PHP~~ → <mark>C# ASP.NET Core</mark> (backend)
- Slide 2, Revision History – add: <mark>1.40 | Villarte, Adrian T. | 2026/11/24 | Updated Project Templates (Template file names); DB and backend corrected</mark>
- Slide 1 – version ~~1.30~~ → <mark>1.40</mark>

---

## 2. WBS – Function List sheet (done in the v4 files)

**Comment:** list the actual functions and screens, not technical / dev work. Use the format the coordinator sent.

- Columns: **MODULE | FUNCTION / DESCRIPTION / ASSUMPTIONS | Type (Web) | Estimate (MD) | Remarks**.
- **9 modules, 30 functions**, named after the screens like the sample (Login Page, Signup Page, Menu Management – List …). Descriptions are full sentences.
- **Removed the technical rows:** UI / Design (layout, fonts), C# project setup, connect website to backend and Daily Account Cleanup. That work is now counted inside each function's estimate. The daily cleanup is mentioned under Delete Account.
- **Kept one data row:** <mark>Data Management → Database Migration (JSON to SQLite)</mark>, 2.5 MD. The template's Function List Guide lists **Data Migration** under OTHERS, so it belongs in the list.
- Total: ~~43.97 MD~~ → <mark>46.5 MD</mark> (2.33 MM). <mark>Details!H20</mark> now points to `'Function List'!E47`.

| Module | Functions |
|---|---|
| Public Module | Home Page |
| User Authentication | Login Page · Signup Page · Logout |
| Menu Browsing | View Menu · View Category Items · Customize Item |
| Cart Management | Add to Cart · View/Update Cart |
| Order Processing | Checkout Page · Place Order · Order History · Cancel Order |
| Order Tracking | Order Tracking Page |
| User Profile | Profile Page · Edit Profile · Delete Account · Restore Account |
| Data Management | <mark>Database Migration (JSON to SQLite)</mark> |
| Admin Panel | Menu Management – List / Add / Edit / Mark Unavailable / Enable / Upload Image · Order Management – List / Update Status / Delete · User Management – List / Restore / Force Delete |

Not listed because the app doesn't have them: Forgot Password, Admin Login (admins use the same Login Page), Payment, Reviews, Reports.

---

## 3. WBS – SE Certificate Program Schedule (done in v4)

**Comment:** use the same items as the Function List.

- **Same names, same order** as the Function List: 9 modules and 30 functions, numbered 4.0 – 12.1 (checked by script).
- Kept around them, like Groups 3 and 4: 2.0 Project Management, 3.0 Planning and Design, 13.0 Testing, 14.0 Finishing.
- Each function inherits the dates and X marks of the old task it came from. Days = the function's estimate. Dates are real dates in dd/mm/yyyy.
- **X marks = the major contributor of each function only**, from the git history of the C# conversion (11/02 – 11/22). Styling-only changes and the system-wide SQLite move are not counted.

| Functions | X mark | From |
|---|---|---|
| Home Page · Login Page · Signup Page · Logout · Profile Page · Edit Profile | Lyka | New look and Home (11/18, 11/22); login, register and profile in C# (11/05) |
| View Menu · View Category Items · Menu Management (all 5) | Nj | Menu in C# and menu fixes (11/07, 11/14) |
| Checkout Page · Place Order · Order History · Cancel Order · Order Tracking Page · Order Management (all 3) | Nj | Orders in C# (11/19) |
| View/Update Cart | Nj | Sign-in pop-up on Checkout (11/07) |
| Customize Item · Add to Cart | Nj | No commits (browser only); follows the group's old assignment "Move Menu, Cart and Orders" |
| Database Migration (JSON to SQLite) | <mark>John Christian</mark> | JSON to SQLite commits (20/11); the old schedule also had him on "Move Data to SQL". Actual date set to 20/11 from git |
| Delete Account · Restore Account · User Management (all 3) | Dave | Account deletion, restore and user management in C# (11/16) |

  **Adrian** (C# project setup) is not on a function row; he stays on Project Management, Planning (3.4) and Testing.
  <mark>Confirm with the group:</mark> the GitHub names luhykie = Lyka Mae and ScobberWasTaken = John Christian were matched by me, and git doesn't show pair work.

## 4. HLD – is it up to date? **No.** Fix these.

The HLD (rev 1.00, 11/18) still describes the **JSON-file backend on branch feature/react**. The app now runs on **SQLite + EF Core on branch feature/csharp**, and several "Known issues" it lists are already fixed in the code.

### Slide 2 – Revision History (add a row)
<mark>1.10 | Villarte, Adrian | 2026/11/24 | Updated to SQLite database, new screenshots, fixed known issues, Sign In update</mark>

### Slide 4 – Architectural Diagram
| Box | Old | New |
|---|---|---|
| 3 Controllers | AuthController, MenuController, ~~OrdersController (in progress)~~ | <mark>AuthController · MenuController · OrdersController · HealthController</mark> |
| 4 (data layer) | ~~JsonStore – Reads and saves JSON – One save at a time – Temp file, then swap~~ | <mark>ForkHubDbContext (EF Core) – Reads and saves with LINQ – Imports the old JSON data once at startup</mark> |
| Used by controllers | BCrypt · image upload (max 5 MB) | keep, and add <mark>AccountDeletionCleanupService – runs once a day, removes accounts after the 5-day wait</mark> |
| STORAGE box title | ~~files on disk~~ | <mark>SQLite database · App_Data/forkhub.db</mark> |
| STORAGE items | ~~data/users.json · data/menu.json · data/orders.json~~ | <mark>Users table · MenuItems table · Orders table · OrderItems table</mark> (keep public/images/) |
| Arrow label | ~~read / write · System.Text.Json~~ | <mark>read / write · Entity Framework Core (SQLite)</mark> |
| Footer | branch ~~feature/react~~ | <mark>feature/csharp</mark> |

### Slide 5 – ERD
- Box titles: USER ~~data/users.json~~ → <mark>Users table</mark>; ORDER ~~data/orders.json~~ → <mark>Orders table</mark>; MENU_ITEM ~~data/menu.json~~ → <mark>MenuItems table</mark>.
- ORDER_ITEM is ~~embedded in ORDER.items~~ → <mark>OrderItems table – its own table</mark>. Make its header red like the others and add:
  <mark>PK id</mark> · <mark>FK orderId → ORDER.id</mark> · <mark>itemId</mark> (the menu item id + option). Keep name, category, subcategory, description, image, price, note, quantity.
- ORDER: remove the field ~~items  ORDER_ITEM[ ]~~ (the items are now rows in OrderItems).
- Relationship ORDER → ORDER_ITEM: <mark>1 : N  contains (FK orderId)</mark>.
- Notation box: ~~Red header: its own JSON file~~ → <mark>Red header: its own SQLite table</mark>. CART stays grey and dashed (still in the browser).

### Slide 7 – Modal List
- M1 Sign In, Description: ~~Email, password, Remember me~~ → <mark>Email, password (show / hide eye button); Enter key signs in</mark> (Remember me was removed in commit fa8f6d5, 11/22)
- M2 Register: <mark>Enter key submits the form</mark>
- M6 Cancel Order, Remarks: ~~Server allows admins only (bug)~~ → <mark>Customer can cancel own order while Pending only</mark>

### Slide 19 – 4.0 Checkout / Orders Logic
- Cancel: ~~Only Pending, Preparing, Out for delivery, Ready for pickup~~ → <mark>Only while the order is Pending</mark>
- Delete these two **Known issues** (fixed in the code):
  ~~Server lets only admins change status, so customer cancel fails~~
  ~~Reason is sent as "reason"; the server reads "cancelReason"~~ (the server now reads both)
- Keep the other two (not rechecked; looks unchanged): failed order shows no error; Pick Up chosen on Home sends a placeholder address.

### Slide 20 – 4.0 Fields
- Row 10 Cancel (history), Remarks: ~~Allowed statuses only; shows M6.~~ → <mark>Pending orders only; shows M6.</mark>

### Slide 31 – 8.0 Admin Logic
- Delete Known issue: ~~Server checks login only, not the admin role, for menu changes~~ (menu add / edit / delete / upload are now **admin only** on the server).
- Orders: add <mark>Shows each item's note (from M4 Customize) on the order card</mark>.

### Screenshots (slides 9, 12, 15, 18, 21, 24, 27, 30)
- All captions say ~~branch feature/react~~ → <mark>branch feature/csharp</mark>.
- **Retake every screenshot** from the running app on feature/csharp. The big UI restyle (Gourmet Ember) went in on 11/18, the same day as the HLD, and the Admin orders view changed on 11/19 (item notes). Slide 30 (Admin) changed for sure.

### Still true, keep as is
Dashboard badge always "Customer"; Profile badge typo "Costumer"; Profile completion bar fixed at 75%; place-order button labelled "Add to Cart"; phone tracking returns the oldest match.

### Mock Defense comments: status on branch feature/csharp
Checked on 11/24 against local `feature/csharp` and `origin/feature/csharp` (both now at fa8f6d5, 11/22). I also searched every other branch, the uncommitted files and the stash.

The HLD describes the app **as it is now**. The fixes below are not built yet; the group will do them later. They stay out of the HLD for now.

| # | Mock defense comment | Now in the code | Later, when it is built |
|---|---|---|---|
| 1 | "Place Order" instead of "Add to Cart" | Button still says "Add to Cart" | Slide 19 / 20 row 8 |
| 2 | Track goes straight to the order details | Opens an empty Tracking search | Slides 19, 22 |
| 3 | Pagination | None | Slides 19/20, 31/32 |
| 4 | Category / subcategory alignment | Not changed | Slide 12 screenshot |
| 5 | Expanded order view: no scrolling | Not changed | Slide 30 screenshot |
| 6 | Orders: sort by status | Not sorted | Slide 31 |
| 7 | Orders: remove Delete | Delete still there | Slides 31, 32 (row 12) |

When the fixes land, add a new HLD revision (1.20) and update the WBS: add rows for Pagination and Sort by Status, and remove Order Management – Delete.

**Watch out:** your uncommitted change in `src/components/CustomizeModal.jsx` turned the `{/* Special note */}` comment into plain text, so the words "Special note" show up inside the Customize pop-up. Undo it before taking the screenshots, or the slide 12 / M4 screenshot will show it.
