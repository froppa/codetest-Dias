# Codetest @ Dias

A hospital needs a new medical journal system to manage doctor-patient relations. Doctors in one department **must not be able to access the medical journal of a patient admitted to another department**.

This project implements a REST API service in **TypeScript**, using **Express**, **Prisma**, and **PostgreSQL**, with authentication handled via simple JWT tokens.

---

## Models

### `Doctor`
- `id` (Int)
- `name`
- `departmentId`

### `Patient`
- `id` (Int)
- `name`
- `socialSecurity`

### `MedicalJournal`
- `id` (UUID)
- `patientId` (unique)
- `notes`

### `Admission`
- `id` (UUID)
- `patientId` (unique)
- `departmentId`
- `doctors[]`

### `Department`
- `id` (Int)
- `name`

---

## Business Rules

- A **patient must always have a medical journal**
- A **doctor may only access a patient** if:
  - They are **assigned to that patient’s admission**
  - They are in the **same department** as the admission

---

## API Endpoints

> Doctor identity is assumed via **JWT in the `Authorization` header**  
> (`Authorization: Bearer <token>`)

### Doctor
| Method | Route                         | Description                         |
|--------|-------------------------------|-------------------------------------|
| POST   | `/api/doctors`                | Create new doctor                   |
| GET    | `/api/doctors/:id/patients`   | Get patients assigned to doctor     |

### Patient
| Method | Route                              | Description                                 |
|--------|-------------------------------------|---------------------------------------------|
| POST   | `/api/patients`                     | Create new patient + journal                |
| GET    | `/api/patients/:id`                 | Get patient (if doctor has access)          |
| POST   | `/api/patients/:id/admission`          | Assign doctors to a patient (via admission) |

---

## Authentication

```http
Authorization: Bearer <token>
```

### Usage
- Create a doctor via `/api/v1/doctor`
- Generate token using newly created `doctor.id`
  - e.g: doctor.id: `1`
  - `npm run hack:gen:token 1`
---

## Setup & Usage

### Install & Run
```bash
npm install
npx prisma migrate dev
npm run dev
```

### Seed database (optional)
```bash
npm run hack:gen:seed
```

### Run tests
```bash
npm run test
```
---

## Improvements

- Add unit tests
- Proper Validation
- Sepparation of concerns / DDD 
- Error handling and logging
- Access control logic into reusable guards/policies
---
