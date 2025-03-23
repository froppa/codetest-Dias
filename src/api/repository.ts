import find from 'lodash-es/find'
import type { PrismaClient } from "@prisma/client"
import type { AuthedRequest } from './authMiddleware'

export const controllers = (prisma: PrismaClient) => {
  return {
    doctor: doctorRepository(prisma),
    patient: patientRepository(prisma),
  }
}

export const doctorRepository = (prisma: PrismaClient) => {
  const create = async (req, res) => {
    const doctor = await prisma.doctor.create({ data: req.body })
    if (!doctor) {
      return res.status(422).json({ error: 'failed to create doctor' })
    }
    return res.json(doctor)
  }

  const listPatients = async (req: AuthedRequest, res) => {
    const doctorID = Number.parseInt(req.doctorID, 10)
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorID } })

    if (!doctor) {
      return res.status(404).json({ error: "doctor not found" })
    }

    const patients = await prisma.patient.findMany({
      where: {
        admission: {
          doctors: {
            some: { id: doctorID },
          },
          departmentId: doctor.departmentId,
        },
      },
      include: { journal: true },
    })
    return res.json(patients)
  }

  return {
    create,
    listPatients,
  }
}

export const patientRepository = (prisma: PrismaClient) => {
  const create = async (req, res) => {
    const { name, socialSecurity, journal } = req.body
    const patient = await prisma.patient.create({
      data: {
        name,
        socialSecurity,
        journal: {
          create: {
            notes: journal?.notes || "",
          },
        },
      },
      include: { journal: true },
    })
    if (!patient) {
      return res.status(422).json({ error: "failed to create patient" })
    }

    return res.json(patient)
  }

  const admission = async (req, res) => {
    const patientID = Number.parseInt(req.params.id, 10)
    const { doctorIds, departmentId } = req.body

    const patient = await prisma.patient.findUnique({ where: { id: patientID } })
    if (!patient) {
      return res.status(404).json({ error: "patient not found" })
    }

    const doctors = await prisma.doctor.findMany({ where: { id: { in: doctorIds } } })
    if (doctors.length !== doctorIds.length) {
      return res.status(400).json({ error: "one or more doctors not found" })
    }

    const admission = await prisma.admission.create({
      data: {
        patientId: patientID,
        departmentId,
        doctors: {
          connect: doctorIds.map((id) => ({ id })),
        },
      },
      include: { doctors: true },
    })

    if (!admission) {
      return res.status(422).json({ error: "failed to admit patient" })
    }

    return res.json(admission)
  }

  const findByID = async (req: AuthedRequest, res) => {
    const patientID = Number.parseInt(req.params.id, 10)
    const doctorID = Number.parseInt(req.doctorID)

    const admission = await prisma.admission.findUnique({
      where: { patientId: patientID },
      include: {
        doctors: true,
        patient: {
          include: { journal: true },
        },
      },
    })

    if (!admission) {
      return res.status(404).json({ error: "patient not found" })
    }

    const hasAccess = find(admission.doctors, doctorID)
    if (!hasAccess) {
      return res.status(403).json({ error: "doctor not allowed to view patient" })
    }

    return res.json(admission.patient)
  }

  return {
    create,
    admission,
    findByID,
  }
}
