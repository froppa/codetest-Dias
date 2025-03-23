import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authMiddleware } from './authMiddleware'
import { controllers } from './repository'

const prisma = new PrismaClient()
const router = Router()

const {
  doctor: doctorRepo,
  patient: patientRepo,
} = controllers(prisma)

// =================
// routes: /doctors
// =================
router.post(
  '/doctors',
  doctorRepo.create
)

router.get(
  '/doctors/patients',
  authMiddleware,
  doctorRepo.listPatients
)

// =================
// routes: /patients
// =================
router.post(
  '/patients',
  patientRepo.create
)
router.post(
  '/patients/:id/admission',
  patientRepo.admission
)

router.get(
  '/patients/:id',
  authMiddleware,
  patientRepo.findByID
)

export default router
