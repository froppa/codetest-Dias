import times from 'lodash-es/times'
import forEach from 'lodash-es/foreach'
import map from 'lodash-es/map'
import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'
import { format } from 'date-fns'

const prisma = new PrismaClient()

const PATIENT_COUNT = 5
const DOCTOR_COUNT = 3

const departments = ['Cardiology', 'Neurology', 'Oncology']

const creator = <T>(
  amount: number,
  generator: () => Promise<T>
) => Promise.all(times(amount, generator))

const seedInit = async () => {
  const createDeparments = await Promise.all(map(
    departments,
    (name) => prisma.department.create({
      data: { name },
    })
  ))

  const createPatients = await creator(PATIENT_COUNT, () =>
    prisma.patient.create({
      data: {
        name: faker.person.fullName(),
        socialSecurity:
          format(faker.date.birthdate(), 'ddMMyy') +
          Math.floor(1000 + Math.random() * 9000).toString(),
      },
    })
  )

  map(createPatients, (patient) =>
    prisma.medicalJournal.create({
      data: {
        notes: faker.lorem.sentence(),
        patientId: patient.id,
      },
    })
  )

  const createDoctors = await creator(DOCTOR_COUNT, () => {
    const dept = faker.helpers.arrayElement(createDeparments)
    return prisma.doctor.create({
      data: {
        name: faker.person.fullName(),
        departmentId: dept.id,
      },
    })
  })

  forEach(createPatients, async (patient) => {
    const department = faker.helpers.arrayElement(createDeparments)
    const assignedDoctors = faker.helpers.shuffle(createDoctors).slice(0, 2)
    await prisma.admission.create({
      data: {
        departmentId: department.id,
        patientId: patient.id,
        doctors: { connect: assignedDoctors.map((d) => ({ id: d.id })) },
      }
    })
  })

  console.log('✅ Seed complete')
  await prisma.$disconnect()
}

seedInit()
