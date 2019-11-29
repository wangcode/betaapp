import Router from 'koa-router'

import Team from "../model/team"
import User from '../model/user'
import Mail from '../helper/mail'

import config from '../config'

import bcrypt from "bcryptjs"
import crypto from 'crypto'
import { responseWrapper } from "../helper/util"

// @ts-ignore
import Fawn from 'fawn'

import jwt from 'jsonwebtoken'

const router = new Router()

// 生成apiToken
router.post('/apitoken', async (ctx, next) => {

    let user = ctx.state.user.data

    user = await User.findOne({ _id: user._id })

    if (user) {

        let md5 = crypto.createHash('md5')

        let salt = user.email + Date()

        let key = md5.update(user.email + salt).digest('hex')

        await User.findByIdAndUpdate(user._id, { apiToken: key })

        ctx.body = responseWrapper(key)

    } else {
        throw new Error('授权失败，请重新登录后重试')
    }

})

router.post('/login', async (ctx, next) => {

    let { body } = ctx.request

    let user = await User.findOne({
        username: body.username
    })

    if (user) {

        let valide = await bcrypt.compare(body.password, user.password)

        if (!valide) {
            throw new Error('用户名或密码错误')
        }

    } else {
        throw new Error('用户名或密码错误')
    }

    user.token = jwt.sign({
        data: {
            _id: user._id,
            username: user.username,
            email: user.email
        },
        exp: Math.floor(Date.now() / 1000) + (60 * 60)
    }, config.secret)

    ctx.body = responseWrapper(user)

})


router.post('/register', async (ctx, next) => {

    if (!config.allowRegister) {
        throw new Error("不允许注册用户.")
    }

    let { body } = ctx.request


    body.password = await bcrypt.hash(body.password, config.hashLevel)

    let user = await User.find({ username: body.username })

    if (!user.length) {
        let newUser = new User(body)

        let team = new Team()

        team._id = newUser._id

        team.name = "我的团队"

        team.creatorId = newUser._id

        team.members = [{
            _id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            role: "owner"
        }]

        newUser.teams = [{
            _id: team._id,
            name: team.name,
            role: "owner"
        }]

        //@ts-ignore
        let task = Fawn.Task()

        let result = await task
            .save(team)
            .save(newUser)
            .run({ useMongoose: true })

        ctx.body = responseWrapper(newUser)

    } else {
        throw new Error("用户已存在")
    }

})

// 修改用户密码
router.post('/password/modify', async (ctx, next) => {

    let user = ctx.state.user.data

    let body = ctx.request.body

    let userData = await User.findById(user._id, "password")

    if (!userData) {
        throw new Error("用户不存在")
    }

    let valide = await bcrypt.compare(body.oldpwd, userData.password)

    if (!valide) {
        throw new Error("密码错误")
    }

    body.password = await bcrypt.hash(body.newpwd, config.hashLevel)

    await User.findByIdAndUpdate(user._id, { password: body.password })

    ctx.body = responseWrapper(true, "密码修改成功")

})


router.post('/modify', async (ctx, next) => {

    let user = ctx.state.user.data

    let body = ctx.request.body

    let userData = await User.findById(user._id, "username")

    if (!userData) {
        throw new Error("用户不存在")
    }

    await User.updateOne({
        username: user.username
    }, {
        mobile: body.mobile,
        qq: body.qq,
        company: body.company,
        career: body.career
    })

    ctx.body = responseWrapper(true, "用户资料修改成功")

})

// 获取用户资料
router.get('/info', async (ctx, next) => {

    let user = ctx.state.user.data

    user = await User.findById(user._id, "-teams -password")

    if (!user) {
        throw new Error("用户不存在")
    }

    ctx.body = responseWrapper(user)

})

// 获取用户团队列表
router.get('/teams', async (ctx, next) => {

    let user = ctx.state.user.data

    user = await User.findById(user._id, "teams")

    if (!user) {
        throw new Error("用户不存在")
    }

    ctx.body = responseWrapper(user)

})

// 通过邮箱重置密码
router.post('/resetPassword', async (ctx, next) => {

    let body = ctx.request.body

    let user = await User.findOne({
        email: body.email
    }, "-teams -password")

    if (!user) {
        throw new Error("邮箱有误,没有该用户")
    }

    let newPassword = Math
        .random()
        .toString(36)
        .substring(2, 5) + Math
        .random()
        .toString(36)
        .substring(2, 5)

    let hashPassword = await bcrypt.hash(newPassword, config.hashLevel)

    await User.findByIdAndUpdate(user._id, { password: hashPassword })

    Mail.send([body.email], "爱发布密码重置邮件", `您的密码已重置${newPassword}`)

    ctx.body = responseWrapper("密码已重置,并通过邮件发送到您的邮箱")

})

export default router