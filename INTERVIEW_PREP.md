# Tour Management System - Interview Prep Guide

This guide contains file-by-file explanations and potential interview questions to help you ace your 20+ LPA interviews.

---

## 1. backend/server.js (The Application Entry Point)

### Explanation
The `server.js` file is the central hub of your backend. It initializes the Express application, connects to the MongoDB database using Mongoose, and sets up essential middleware like `cors` for cross-origin requests and `express.json()` for parsing JSON bodies. It also defines the API routes (auth, bookings, vehicles, etc.) and includes a global error handler to catch any unhandled exceptions, ensuring the server doesn't crash on small errors.

### Top 10 Interview Questions
1. Why is `dotenv.config()` called at the very top of the file?
2. What is the role of `cors()` middleware in a MERN application?
3. How does `express.static('uploads')` help in serving driver documents?
4. What is the purpose of the `/api/health` route?
5. If the frontend and backend are on different domains, how do you allow specific origins in CORS?
6. Why do we use `process.env.PORT || 5000` instead of just a hardcoded port?
7. Explain the signature of the error handling middleware: `(err, req, res, next)`.
8. What is the difference between `app.use()` and `app.get()`?
9. Why is the WhatsApp cron job started inside the `app.listen()` callback?
10. How would you add a new route `/api/drivers` to this file?

---

## 2. backend/models/Booking.js (The Data Contract)

### Explanation
This file defines the schema for how a Booking is stored in MongoDB. It uses Mongoose to enforce types (String, Date, Number) and mandatory fields via `required`. A key feature is the `pre('save')` hook which automatically generates a unique booking number (e.g., BK202400001) before the document is saved and validates that the `endDate` is not before the `startDate`.

### Top 10 Interview Questions
1. What is a Schema in Mongoose and why do we need it in a NoSQL database?
2. Why did you use `ObjectId` for the `createdBy` and `vehicle` fields?
3. What is the benefit of setting `unique: true` for the `bookingNumber`?
4. Explain the logic inside the `pre('save')` hook for generating the booking number.
5. What does the `trim: true` property do for string fields?
6. How does Mongoose handle validation errors if the user skips a required field?
7. What is the purpose of the `enum` in the `status` field?
8. How would you calculate the total number of bookings for a specific vehicle using this model?
9. What are Mongoose Virtuals? Did you use any here? (Hint: Good for full names or calculated profit).
10. If you wanted to search bookings by a date range, which fields would you index for performance?

---

## 3. backend/utils/reminderCron.js (The Automation Engine)

### Explanation
This utility file handles automated tasks. Using the `node-cron` library, it schedules a job to run every day at a specific time (e.g., 9:00 AM). The job queries the database for 'confirmed' bookings happening within the next 48 hours and sends a WhatsApp reminder to the customer using a dedicated service. It marks the booking as `reminderSent: true` to avoid duplicate messages.

### Top 10 Interview Questions
1. How does the cron syntax `0 9 * * *` work?
2. Why is it important to filter by `status: 'confirmed'` before sending reminders?
3. Explain how the "48-hour window" logic is calculated in JavaScript.
4. What happens if the WhatsApp API is down? How does your code handle that failure?
5. Why do we use `.populate('vehicle', 'vehicleNumber')` in the cron job?
6. How do you prevent sending the same reminder twice if the cron job runs again?
7. Why is the `timezone: 'Asia/Kolkata'` setting crucial?
8. What is the difference between `node-cron` and a standard `setInterval`?
9. How would you scale this if you had 100,000 bookings to check every day?
10. Why do we run an initial check using `setTimeout` when the server starts?

---

## 4. backend/models/User.js (Identity & Authentication)

### Explanation
This model handles user profiles, passwords, and permissions. It uses `bcryptjs` to hash passwords before saving them, ensuring that even if the database is leaked, passwords remain secure. It also defines user roles like 'SuperAdmin', 'Admin', and 'Manager' to control access levels within the application.

### Top 10 Interview Questions
1. Why should we never store passwords in plain text in a database?
2. What is the difference between `bcrypt.hash()` and `bcrypt.compare()`?
3. Explain the logic of `this.isModified('password')` in the `pre('save')` hook.
4. Why did you use `select: false` for the password field in the schema?
5. What are User Roles (RBAC) and why are they important for this project?
6. How do you handle email uniqueness at the database level?
7. What is "Salt" in the context of password hashing?
8. How would you add a 'profileImage' field that stores a URL to this schema?
9. What is the benefit of using `lowercase: true` for the email field?
10. How do you verify if a user has 'Admin' privileges before allowing them to delete a car?

---

## 5. backend/routes/auth.js (The Gatekeeper)

### Explanation
This route file contains the endpoints for user registration, login, OTP verification, and password resets. It coordinates between the incoming request, the User model, and third-party services like email (for OTPs). Upon successful login, it signs and returns a JWT (JSON Web Token) to the client.

### Top 10 Interview Questions
1. What are the three parts of a JSON Web Token (JWT)?
2. How do you sign a JWT with a secret key in Node.js?
3. Explain the flow of your Forgot Password system (from OTP request to update).
4. Why do we send a 401 status code for failed logins instead of 404?
5. What is the purpose of an OTP (One-Time Password) in terms of security?
6. How do you handle session expiry on the backend?
7. What is a "Payload" in a JWT, and what data did you include in it?
8. How do you prevent multiple accounts from being created with the same phone number?
9. What happens to the JWT when a user logs out?
10. Why is it better to use a secret key for signing tokens instead of a simple unique ID?

---

## 6. frontend/src/pages/Login.jsx (User Entry Point)

### Explanation
The Login page is a React component that captures user credentials. It uses `useState` to manage input fields and `axios` to send data to the backend. It also handles UI states like 'Loading' (to prevent multiple clicks) and 'Error' (to show toast notifications). Once logged in, it stores the token in `localStorage` and redirects the user to the Dashboard.

### Top 10 Interview Questions
1. Why do we use `e.preventDefault()` in the form's `onSubmit` handler?
2. How do you manage the "Loading..." state while the API request is in progress?
3. Where do you store the JWT token on the frontend, and why?
4. What is `useNavigate` and how do you use it after a successful login?
5. How do you display backend error messages (like "Invalid Credentials") to the user?
6. What is a "Controlled Component" in React (in the context of input fields)?
7. How would you implement a "Remember Me" checkbox?
8. Why is frontend validation (e.g., checking if email is valid) still useful if the backend also validates it?
9. How do you style this page to be responsive for mobile screens?
10. If a user is already logged in, should they be able to access the Login page again? How do you prevent it?

---

## 7. backend/middleware/authMiddleware.js (The Security Guard)

### Explanation
This middleware is a dedicated function that runs before protected API routes. It retrieves the JWT from the request headers, verifies its authenticity using the secret key, and then fetches the corresponding user from the database. If the token is missing or invalid, it returns a 401 Unauthorized error, preventing access to the route.

### Top 10 Interview Questions
1. Why is middleware used in Express, and what does the `next()` function do?
2. What is the "Bearer" token scheme, and why do we use it in headers?
3. What happens if the `jwt.verify()` function fails? (How do you handle the error?).
4. Why is it better to store the user object in `req.user` instead of passing it in the URL?
5. How would you create a second middleware specifically for 'Admin only' routes?
6. Can you apply multiple middlewares to a single route? Provide an example.
7. What is the security risk of not using an auth middleware for a 'Delete User' route?
8. How do you handle JWT expiration (e.g., TokenExpiredError)?
9. Why is the SECRET_KEY kept in the `.env` file instead of the code?
10. If a token is valid but the user has been banned in the database, how should the middleware respond?

---

## 8. frontend/src/pages/BookingManagement.jsx (Core Feature UI)

### Explanation
This is the most feature-rich page in the frontend. It manages the lifecycle of a booking: viewing lists, filtering/searching, and creating new bookings. It relies heavily on React hooks like `useState` (for managing the list and form data) and `useEffect` (for fetching data from the API as soon as the page loads).

### Top 10 Interview Questions
1. How do you fetch and display a list of bookings when the component first mounts?
2. Explain how the "Search" functionality filters bookings in real-time.
3. Why is it important to use a "Key" prop when mapping over the bookings list?
4. How do you handle a "Delete Booking" action so the UI updates without a page refresh?
5. What is the benefit of breaking down this large page into smaller components like `BookingCard` or `BookingForm`?
6. How do you manage the state of a complex form with 10+ input fields?
7. What happens if the backend API returns an error? How does the UI show this to the user?
8. Why use a Modal for adding a booking instead of a separate page?
9. How do you handle "Pagination" or "Infinite Scroll" if there are thousands of bookings?
10. Explain the logic of changing a booking's status (e.g., from Pending to Confirmed) from the UI.

---

## 9. backend/routes/reports.js (Data & Analytics)

### Explanation
The Reports route provides high-level business insights. It uses MongoDB aggregation pipelines to calculate metrics like total earnings, number of trips, and most used vehicles. This allows the admin to filter data by date ranges and monitor the fleet's performance.

### Top 10 Interview Questions
1. What is the difference between `.find()` and `.aggregate()` in MongoDB?
2. How do you calculate the SUM of all booking amounts for the current month?
3. How does the backend handle date range filters (e.g., StartDate and EndDate)?
4. What kind of data structure should the backend return for a "Monthly Revenue" chart?
5. How would you restrict the Reports route so only 'SuperAdmin' can access it?
6. Explain a simple aggregation pipeline with `$match` and `$group` stages.
7. How would you implement an "Export to CSV" feature for reports?
8. Why are reports usually fetched separately from the main bookings list?
9. How do you handle "No data found" scenarios in your analytics charts?
10. What is the most expensive database operation in your reports, and how can you optimize it (e.g., indexing)?

---

## 10. Behavioral & Project HR Questions (The Final Step)

### Top 10 Questions
1. **"Tell me about this project."** (Focus on the problem it solves, not just the code).
2. **"What was the most difficult bug you faced in this project?"** (Talk about a logic error, not a typo).
3. **"Why did you choose MERN stack for this?"**
4. **"If you had 2 more weeks, what feature would you add?"** (Hint: Payment Gateway or GPS tracking).
5. **"How do you handle conflict in your code? (e.g., two people editing the same file)"**
6. **"How did you test your APIs? (Postman, Jest, etc.)"**
7. **"Explain your project's architecture to a non-technical person."**
8. **"How do you ensure your code is readable for other developers?"**
9. **"What is the one thing you are most proud of in this project?"**
10. **"How would you scale this to handle 10,000 bookings per hour?"**

---
**ALL THE BEST FOR YOUR INTERVIEW! YOU GOT THIS!**
