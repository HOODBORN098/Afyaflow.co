# AfyaFlow - UML Diagram Prompts & Architecture

Use these Mermaid.js prompts to generate system diagrams for your presentation or final report.

## 1. Class Diagram (Data Model)
```mermaid
classDiagram
    class User {
        +Long id
        +String email
        +String role
        +String password
    }
    class Patient {
        +String nationalId
        +String firstName
        +String lastName
        +String status
        +String tokenId
    }
    class Doctor {
        +String specialization
        +String shift
        +Department department
    }
    class Appointment {
        +LocalDate appointmentDate
        +String timeSlot
        +String status
        +String queueNumber
    }
    class Department {
        +String name
        +List doctors
    }

    User <|-- Patient
    User <|-- Doctor
    Patient "1" -- "0..*" Appointment
    Doctor "1" -- "0..*" Appointment
    Department "1" -- "0..*" Doctor
```

## 2. Sequence Diagram (Booking Flow)
```mermaid
sequenceDiagram
    participant P as Patient (Frontend)
    participant B as Backend (API)
    participant DB as Database

    P->>B: GET /api/appointments/available-slots
    B->>DB: Query existing appointments
    DB-->>B: List of booked slots
    B-->>P: Return available HH:mm list
    P->>B: POST /api/appointments (Booking Request)
    B->>DB: Save new Appointment (Status: CONFIRMED)
    DB-->>B: Success
    B-->>P: 200 OK & Appointment Details
```

## 3. State Diagram (Queue Management)
```mermaid
stateDiagram-v2
    [*] --> Scheduled: Patient Books
    Scheduled --> Queued: Doctor Confirms/Patient Arrives
    Queued --> InProgress: Doctor Calls Patient
    InProgress --> Served: Consultation Complete
    Served --> [*]
    Scheduled --> Cancelled: Patient Cancels
    Queued --> Missed: No Show
```

## 4. Architecture Overview
- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Spring Boot 3.x + Spring Security (JWT)
- **Database**: MySQL (Persistence) / H2 (Development)
- **Styling**: Tailwind CSS 4.0
