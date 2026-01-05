# König Fogászat - Időpontkezelő

A König Fogászat online időpontkezelő rendszere. Az alkalmazás teljes mértékben önálló, IndexedDB-t használ a helyi adattároláshoz, nincs szükség háttérszerverre.

**Orvos:** id. dr. König János  
**Rendelési hely:** 5600 Békéscsaba, Kolozsvári utca 3

## Features

### Dentist/Admin View
- **Calendar Views**: Month, Week, and Day views with appointment display
- **Time Slot Management**: Create, edit, and delete available time slots
- **Appointment Booking**: Book appointments by selecting patient and time slot
- **Appointment Management**: Edit, cancel, and update appointment status
- **Patient Management**: View and manage patient list
- **Simple Authentication**: Password-based authentication (default: `admin`)

### Patient Portal
- **Email + TAJ Authentication**: Secure login using email and TAJ number
- **Patient Registration**: New patients can register with their information
- **Dashboard**: Overview of upcoming appointments and patient information
- **Appointment Viewing**: View all appointments (upcoming and past)
- **Appointment Booking**: Book appointments from available time slots
- **Document Viewing**: Placeholder for patient documents

## Technology Stack

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **IndexedDB**: Client-side database for data persistence
- **date-fns**: Date manipulation library
- **lucide-react**: Icon library
- **crypto-js**: Password hashing and token generation

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Default Credentials

**Dentist/Admin Login:**
- Password: `admin` (change on first login)

**Patient Portal:**
- Patients register/login using their email and TAJ number
- Magic link tokens are generated and stored locally (simulated)

## Usage

### Dentist/Admin View

1. Navigate to `/login` and enter the password (default: `admin`)
2. You'll be redirected to the main scheduler page with three views:
   - **Calendar**: View appointments in month/week/day views
   - **Time Slots**: Manage available time slots
   - **Appointments**: Book and manage appointments

### Patient Portal

1. Navigate to `/patient-portal`
2. Enter your email and TAJ number
3. If you're a new patient, complete the registration form
4. You'll receive a magic link (simulated - redirects automatically)
5. After verification, you can:
   - View your dashboard
   - Book appointments from available slots
   - View your appointment history

## Data Storage

All data is stored locally in the browser using IndexedDB:
- **Time Slots**: Available appointment slots
- **Appointments**: Booked appointments
- **Patients**: Patient information
- **Tokens & Sessions**: Patient portal authentication data
- **Settings**: Application settings (e.g., dentist password)

Data persists across browser sessions and is specific to each browser/device.

## Project Structure

```
/
├── app/
│   ├── page.tsx                      # Dentist/Admin main scheduler page
│   ├── login/
│   │   └── page.tsx                  # Dentist login page
│   ├── patient-portal/
│   │   ├── page.tsx                  # Patient portal login
│   │   ├── verify/
│   │   │   └── page.tsx              # Token verification
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Patient dashboard
│   │   ├── appointments/
│   │   │   └── page.tsx              # Patient appointments
│   │   └── documents/
│   │       └── page.tsx              # Patient documents
│   ├── layout.tsx                    # Root layout
│   └── globals.css                   # Global styles
├── components/
│   ├── CalendarView.tsx              # Main calendar container
│   ├── MonthView.tsx                  # Month calendar view
│   ├── WeekView.tsx                   # Week calendar view
│   ├── DayView.tsx                    # Day calendar view
│   ├── CalendarEvent.tsx              # Appointment event component
│   ├── CalendarFilters.tsx           # Filter controls
│   ├── TimeSlotsManager.tsx          # Time slot management
│   ├── AppointmentBooking.tsx         # Appointment booking & management
│   ├── DateTimePicker.tsx            # Date/time picker
│   ├── Logo.tsx                      # Logo component
│   └── patient-portal/
│       ├── PortalLogin.tsx           # Patient login/registration
│       ├── PortalDashboard.tsx       # Patient dashboard
│       ├── PatientAppointmentsList.tsx # Patient appointments list
│       ├── BookingModal.tsx          # Booking confirmation modal
│       ├── PortalLayout.tsx          # Portal navigation layout
│       └── PatientProfileView.tsx    # Patient profile
├── contexts/
│   └── ToastContext.tsx              # Toast notification context
├── lib/
│   ├── storage.ts                    # IndexedDB wrapper & operations
│   ├── types.ts                      # TypeScript type definitions
│   ├── auth.ts                       # Authentication utilities
│   └── init.ts                       # Database initialization
└── package.json                      # Dependencies
```

## Building for Production

```bash
npm run build
npm start
```

## Notes

- **Self-Contained**: No backend server required - all data stored locally
- **Browser-Specific**: Data is stored per browser/device
- **Magic Links**: Patient portal tokens are simulated locally (in a real implementation, these would be sent via email)
- **Default Password**: Change the default password (`admin`) after first login for security
- **Data Persistence**: All data persists in IndexedDB across browser sessions

## License

Private project for maxillofacial rehabilitation practices.

