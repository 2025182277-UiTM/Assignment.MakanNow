# MakanNow - Retort Ready-to-Eat and Cooking Paste Shop

A front-end prototype for **MakanNow**, an SME that makes retort-pouch ready-to-eat meals, cooking pastes, and sambal (24-month shelf life). It has two roles: the owner manages stock and orders, and customers browse live stock and place or cancel orders.
Built for **IMS566 Advanced Web Design Development and Content Management** (Individual Project).

- **Web Live Link :** (https://2025182277-uitm.github.io/Assignment-MakanNow/)
- **Repository :** (https://github.com/2025182277-UiTM/Assignment.MakanNow.git))

## How to test login
| Role | Username | Password | Lands on |
|---|---|---|---|
| Admin | admin | admin123 | dashboard.html |
| Customer | customer | customer123 | home.html |

You can also click the **Register** tab and create a customer account. Try a taken username or mismatched passwords to see the error messages, and a wrong password on the login form. Each role can only open its own pages: logged in as customer, try `dashboard.html` and you are sent back to `home.html`.

**Tip for testing live updates:** open two browser tabs, log in as admin in one and customer in the other, then restock a product (admin) and watch the Shop (customer) change without refreshing.

## Features
**Products:** 3 categories (Ready to Eat, Cooking Paste, Sambal) and 16 products, each with pack size, production date and a best-before date 24 months later.

**Admin (owner)**
- Dashboard: summary cards, revenue by month, revenue by category, best sellers, restock list, latest orders
- Orders: all customer orders with search and status filter; update status (Preparing, Out for delivery, Delivered). A tracking number is issued when an order goes out for delivery, and clicking it copies it
- Products: add a product (with optional ingredients), add stock, edit price, delete a product, search and filter. Each product can hold at most 2000 units
- New-order notice: when a customer places an order, a pop-up and a badge on Orders appear without refreshing, and the new order is marked NEW in the list
- Categories: add, edit (rename) and delete categories (deleting a category deletes its products after confirmation)
- Customers: registered accounts, orders placed and total spent

**Customer**
- Home: personal summary cards, spending by month, what I buy by category, recent orders
- Shop: stock that updates live, search, category filter and sorting (best selling, price, name). Tap a product for its details: ingredients, how to use, storage and best-before date. Each product shows how many you picked (x2) with + and - buttons, so you do not need to open the basket to check
- My orders: order history with click-to-copy tracking numbers; cancel an order while it is still Preparing (stock goes back on the shelf)

**Shared:** Light and dark mode (saved in the browser, follows the device setting on the first visit). Login and Register with validation, responsive navbar (hamburger on mobile), footer, page titles, meta descriptions and semantic HTML on every page.

## Design
A packaging-label look: flat colour, square corners, condensed uppercase headings and ruled lists instead of boxed cards. Colours are chilli red (navbar and login), turmeric gold and ink black; buttons are ink and each Shop product is a small retort pouch drawn in CSS in its category colour, sitting on a pale tint, so the page is colourful but calm. No icon fonts or images are used. Each category has its own colour, shown on the labels and in the charts.

Order lists show the first two items and fold the rest behind "+N more", with a colour dot for each item's category. Status labels are centred and tinted (gold for Preparing, blue for Out for delivery, green for Delivered), and the same list style is used on the admin Orders, customer My orders, dashboard and Home pages.

## How the data works (no database)
- Products, categories, orders and new accounts are saved in the browser's `localStorage`, shared by admin and customer logins in the same browser.
- Each order stores the product name and price at the time of purchase, so history stays correct if a product is later deleted.
- Sample order history is generated with a fixed seed in `js/data.js` (same result every time). Tracking numbers are generated from the order date and number (format MNW + date + order no. + MY).
- To restore the original demo data, clear this site's data in Chrome (F12 > Application > Local Storage > clear).
- Passwords are stored as plain text because this is a prototype. A real system would use a server and hashed passwords.

## Frameworks and libraries
- Bootstrap 5.3 (grid, navbar, forms, modals, basket drawer)
- Chart.js 4
- Google Fonts (Barlow Condensed, Barlow)

## Project structure
```
index.html            Login and Register
dashboard.html        Admin dashboard
admin-orders.html     Admin: customer orders
products.html        Admin: products and stock
categories.html       Admin: categories
customers.html        Admin: customers
home.html             Customer home (dashboard)
shop.html             Customer shop
orders.html           Customer order history
css/style.css         Styles
js/data.js            Seed data
js/app.js             Role guard, storage, orders, basket, navbar, footer, live update
js/auth.js            Login and register logic
js/*.js               One script per page
```

## Deploy
Push the project to GitHub, then go to Settings > Pages and deploy from the `main` branch, root folder.
