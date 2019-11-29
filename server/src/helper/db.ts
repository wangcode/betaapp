import mongoose from 'mongoose'
// @ts-ignore
import Fawn from 'fawn'

import config from '../config'

const dbUrl = config.dbUser ?
  `mongodb://${config.dbHost}:${config.dbPort}/${config.dbName}`:
  `mongodb://${config.dbUser}:${config.dbPass}@${config.dbHost}:${config.dbPort}/${config.dbName}`;

mongoose.connect(dbUrl, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false}, err => {
  if (err) {
    console.log('Mongoose connection error: ' + err.message)
  } else {
    console.log('数据库连接成功')
  }
})

mongoose
  .connection
  .on('disconnected', () => {
    console.log('Mongoose connection disconnected')
  })

Fawn.init(mongoose)

export default mongoose