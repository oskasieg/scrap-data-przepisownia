const mongoose = require('mongoose')

const connect = (
  url = 'mongodb+srv://admin:admin@cluster0.onmgs.mongodb.net/seminarium?retryWrites=true&w=majority',
  opts = {}
) => {
  return mongoose.connect(url, {
    ...opts,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
}

const close = () => {
  return mongoose.connection.close()
}

module.exports = { close, connect }
