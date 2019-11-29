import fs from 'fs'
import cp from 'child_process'

const readFile = (path: any, opts = 'utf8') => new Promise((res, rej) => {
  fs.readFile(path, opts, (err, data) => {
    if (err)
      rej(err)
    else
      res(data)
  })
})

const writeFile = (path: any, data: any, opts = 'utf8') => new Promise((res, rej) => {
  fs.writeFile(path, data, opts, (err) => {
    if (err)
      rej(err)
    else
      res()
  })
})

const responseWrapper = function wrapper(success: any, message?: any, data?: any) {
  if (arguments.length === 3) {
    return { 'success': success, 'message': message, 'data': data };
  }
  //只传2个参数,必须传是否成功 和 返回的提示信息
  if (arguments.length === 2) {
    return { 'success': success, 'message': message };
  };
  //如果只传一个参数 则默认当作请求成功 返回正常数据
  if (arguments.length === 1) {
    return { 'success': true, 'data': arguments[0] };
  }
  return {}
}

function exec(command: any, options = {
  log: false,
  cwd: process.cwd()
}) {
  if (options.log)
    console.log(command)

  return new Promise((done, failed) => {
    // @ts-ignore
    cp.exec(command, { options }, (err: any, stdout: any, stderr: any) => {
      if (err) {
        err.stdout = stdout
        err.stderr = stderr
        failed(err)
        return
      }
      done({ stdout, stderr })
    })
  })
}

const getIp = (req: any) => new Promise((resolve) => {
  var ip = req.headers['x-forwarded-for'] ||
    req.headers['Proxy-Client-IP'] ||
    req.headers['WL-Proxy-Client-IP'] ||
    req.headers['HTTP_CLIENT_IP'] ||
    req.headers['HTTP_X_FORWARDED_FOR'] ||
    req.remoteAddress ||
    req.ip.match(/\d+.\d+.\d+.\d+/)[0]
  resolve(ip)
})

export {
  responseWrapper,
  readFile,
  writeFile,
  exec,
  getIp
}