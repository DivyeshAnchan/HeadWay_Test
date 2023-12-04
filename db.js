import mongoose from 'mongoose'
export let connectdb = () => {
  mongoose
    .connect('mongodb://localhost:27017/test')
    .then((e) => {
      console.log('connected')
    })
    .catch((err) => {
      console.log(err)
    })
}
let schema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
})
let schema2 = mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  code: {
    type: String,
    required: true,
  },
})

export let model1 = mongoose.model('Forgot', schema2)
export let model = mongoose.model('UserReg', schema)
