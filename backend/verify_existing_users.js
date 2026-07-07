const dotenv = require('dotenv')
const connectDB = require('./config/database')
const User = require('./models/User')

dotenv.config()

async function run() {
  await connectDB()
  console.log("Updating existing users...")
  const result = await User.updateMany(
    { isEmailVerified: { $ne: true } },
    { $set: { isEmailVerified: true } }
  )
  console.log(`Updated ${result.modifiedCount} users to verified status.`)
  process.exit(0)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
