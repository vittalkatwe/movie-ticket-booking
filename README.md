# 🎬 Movie Seat Booking System

A movie ticket booking application with real-time seat selection, secure payment processing, and automatic seat hold management.

---

## ✨ Features

### User Features
-  **Interactive Seat Selection** - Visual seat map with real-time availability
-  **Secure Payment** - Razorpay integration for payments
-  **Seat Hold System** - Seats held for 6 minutes during checkout
-  **Email Confirmation** - Users receives confirmation upon successful booking

### Technical Features
-  **Concurrency Control** - Prevents double-booking using pessimistic locks
-  **Auto-expiry** - Background scheduler releases expired holds
-  **Transaction Management** - ACID compliance for data integrity
-  **State Management** - Clear seat and hold status tracking

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icon library
- **Fetch API** - HTTP requests
- **Razorpay SDK** - Payment integration

### Backend
- **Spring Boot 4.0.1** - Application framework
- **Java 17** - Programming language
- **Spring Data JPA** - Database operations
- **PostgreSQL** - Relational database
- **Hibernate** - ORM framework
- **Razorpay Java SDK** - Payment processing
- **Spring Scheduler** - Background jobs

---

### Razorpay Account
- Sign up at [Razorpay](https://razorpay.com/)
- Get your **Test API Key** and **Secret** from Dashboard → Settings → API Keys
- Keep these handy for configuration

---

## 🚀 Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/vittalkatwe/movie-ticket-booking.git
cd movie-ticket-booking
```

### Step 2: Database Setup

1. **Install PostgreSQL** (if not already installed)

2. **Create Database**
```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE moviebooking;

# Exit psql
\q
```

3. **The application will automatically create tables** when you run it (thanks to Hibernate)

### Step 3: Backend Configuration

1. **Navigate to backend folder**
```bash
cd backend
```

2. **Configure application properties**

Open `src/main/resources/application.properties` and update:

```properties
# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/moviebooking
spring.datasource.username=postgres
spring.datasource.password=your_postgres_password

# JPA/Hibernate Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.properties.hibernate.format_sql=true

# Razorpay Configuration (Test Mode)
razorpay.key=rzp_test_your_key_here
razorpay.secret=your_secret_here

# Email Configuration
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-email-app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true

# Server Configuration
server.port=8080

# Enable Scheduling
spring.task.scheduling.pool.size=2
```

3. **Install Dependencies**
```bash
mvn clean install
```

4. **Run the Backend**
```bash
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

### Step 4: Frontend Setup

1. **Open a new terminal and navigate to frontend**
```bash
cd frontend
```

2. **Install Dependencies**
```bash
npm install
```

4. **Run the Frontend**
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

### Step 5: Test the Application

1. Open browser: `http://localhost:5173`
2. Select seats
3. Review booking
4. Enter your details
5. Complete payment using Razorpay test cards:
   - **Card Number:** 5500 6700 0000 1002
   - **CVV:** Any 3 digits
   - **Expiry:** Any future date

---

## 🔍 Backend Deep Dive

**Pessimistic Locking**

Imagine two people trying to book the same seat
```
Without Lock:
Person A reads seat (available) ─┐
Person B reads seat (available) ─┤ Both see available!
Person A books seat             ─┤
Person B books seat             ─┘ Double booking! ❌

With Pessimistic Lock:
Person A locks and reads seat ──┐
Person B tries to read ────────┤ Wait... locked by A
Person A books seat            │
Person A releases lock         │
Person B now reads seat ───────┘ Already booked ✓
```

The `@Lock` annotation prevents two requests from reading/modifying the same seat simultaneously.

A transaction ensures **all-or-nothing** execution:
```
Booking 3 seats (A1, A2, A3):

Success Case:
  ✓ Hold A1
  ✓ Hold A2
  ✓ Hold A3
  → COMMIT (save all changes)

Failure Case:
  ✓ Hold A1
  ✓ Hold A2
  ✗ A3 is already booked
  → ROLLBACK (undo A1 and A2)
```

Without `@Transactional`, partial bookings could occur (A1 and A2 held, but A3 failed).


### Page Flow

1. **Seats Page**
   - Displays all available seats
   - User selects seats
   - Shows total price
   - "Continue" button

2. **Preview Page**
   - Shows selected seats
   - Displays total amount
   - Allows going back to modify selection
   - "Continue to Details" button

3. **Details Page**
   - Collects user information (name, email, phone)
   - Validates input
   - On submit: calls `/seats/hold` API
   - "Proceed to Payment" button

4. **Payment Page**
   - Opens Razorpay modal
   - Handles payment callbacks
   - On success: calls `/payment/confirm`
   - Returns to seats page


---

## 📡 API Documentation

### Base URL
```
http://localhost:8080
```

### Endpoints

#### 1. Get All Seats
```http
GET /seats

Response: 200 OK
[
  {
    "id": 1,
    "seatNumber": "A1",
    "price": 150.0,
    "status": "AVAILABLE"
  },
  ...
]
```

#### 2. Hold Seats
```http
POST /seats/hold
Content-Type: application/json

Request:
{
  "seatIds": [1, 2, 3],
  "userDetails": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+91-9876543210"
  }
}

Success Response: 200 OK
{
  "success": true,
  "holdIds": [101, 102, 103],
  "message": "Seats held successfully"
}

Error Response: 400 Bad Request
{
  "success": false,
  "message": "Seat A5 is not available"
}
```

#### 3. Create Seats (Bulk)
```http
POST /seats/bulk
Content-Type: application/json

Request:
{
  "seatNumbers": ["A1", "A2", "A3", ...]
}

Response: 200 OK
[
  { "id": 1, "seatNumber": "A1", "price": 150.0, "status": "AVAILABLE" },
  ...
]
```

#### 4. Create Payment Order
```http
POST /payment/create-order
Content-Type: application/json

Request:
{
  "amount": 450,
  "holdIds": [101, 102, 103]
}

Response: 200 OK
{
  "orderId": "order_xyz123",
  "amount": 45000,
  "currency": "INR",
  "key": "rzp_test_..."
}
```

#### 5. Confirm Payment
```http
POST /payment/confirm
Content-Type: application/json

Request:
{
  "holdIds": [101, 102, 103],
  "paymentId": "pay_abc123",
  "orderId": "order_xyz123",
  "signature": "signature_hash"
}

Response: 200 OK
{
  "success": true,
  "message": "Payment confirmed and seats booked"
}
```

---


## 🔄 How It Works

### Complete Booking Flow

```
Step 1: User selects seats
├─ Frontend: Add to selectedSeats array
└─ No backend call yet

Step 2: User clicks "Continue"
├─ Frontend: Navigate to preview page
└─ Shows summary

Step 3: User enters details and submits
├─ Frontend: POST /seats/hold
├─ Backend: Start transaction
│   ├─ Lock each seat (PESSIMISTIC_WRITE)
│   ├─ Check if AVAILABLE
│   ├─ Update status → HELD
│   ├─ Create Hold record (expiry = now + 6 min)
│   └─ Return holdIds
└─ Frontend: Store holdIds, navigate to payment

Step 4: Payment initiation
├─ Frontend: POST /payment/create-order
├─ Backend: Call Razorpay API
│   ├─ Create order with amount
│   └─ Return orderId and key
└─ Frontend: Open Razorpay modal

Step 5: User completes payment
├─ Razorpay: Process payment
├─ Razorpay: Send callback to frontend
├─ Frontend: POST /payment/confirm
└─ Backend: 
    ├─ Verify signature (HMAC)
    ├─ If valid:
    │   ├─ Update Hold status → COMPLETED
    │   ├─ Update Seat status → BOOKED
    │   └─ Return success
    └─ If invalid: Return error

Step 6: Background cleanup (every minute)
├─ Scheduler: Find expired holds
│   └─ WHERE expiry_time < NOW() AND status = 'ACTIVE'
├─ For each expired hold:
│   ├─ Update Hold status → EXPIRED
│   └─ Update Seat status → AVAILABLE
└─ Make seats available for others
```

### Preventing Double Booking

**The Problem:**
```
Time    User A              User B
t0      Read seat A1        
t1                          Read seat A1
t2      Book A1             
t3                          Book A1  ← Double booking!
```

**The Solution:**
```
Time    User A                      User B
t0      BEGIN TRANSACTION
t1      SELECT ... FOR UPDATE       
        (Lock acquired on A1)
t2                                  BEGIN TRANSACTION
t3                                  SELECT ... FOR UPDATE
                                    (Waiting for lock...)
t4      Check: AVAILABLE ✓
t5      Update: HELD
t6      COMMIT
        (Lock released)
t7                                  (Lock acquired)
t8                                  Check: HELD ✗
t9                                  ROLLBACK
```

---

## 📝 Environment Configuration

### Development
```properties
# application-dev.properties
spring.jpa.show-sql=true
logging.level.org.hibernate.SQL=DEBUG
razorpay.key=rzp_test_...
```

### Production
```properties
# application-prod.properties
spring.jpa.show-sql=false
logging.level.root=WARN
razorpay.key=rzp_live_...
server.port=80
```

**Happy Coding! 🚀**

If you found this project helpful, please give it a ⭐ on GitHub!
