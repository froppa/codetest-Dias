import express from "express"
import router from "./api/routes"
import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local' })

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())
app.use("/api/v1/", router)

app.listen(port, () => console.log(`Service running on port ${port}`))
