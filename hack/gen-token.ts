import authService from "../src/api/authService"
import dotenv from "dotenv"

dotenv.config()

const argID = process.argv[2]
if (!argID) {
  console.error("must specify arg: doctorID")
  process.exit(1)
}

console.log(authService().generateToken(argID))
