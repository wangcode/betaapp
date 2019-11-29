import Router from 'koa-router'

import App from '../model/app_model'
import Version from '../model/version'
import Message from '../model/message'

import _ from 'lodash'
import {  responseWrapper } from "../helper/util"

const router = new Router()

// 获取消息总条数和未读条数
router.get('/count', async (ctx, next) => {

    let user = ctx.state.user.data

    let count = await Message.count({ receiver: user._id })

    let unread = await Message.count({ receiver: user._id, status: "unread" })

    ctx.body = responseWrapper({ total: count, unread: unread })

})

router.get('/count/:appid/:versionId', async (ctx, next) => {

    let { appid, versionId } = ctx.params

    let app = await App.findOne({ _id: appid }, "totalDownloadCount todayDownloadCount")

    let version = await Version.findOne({ _id: versionId }, "downloadCount ")

    if (!app) {
        throw new Error("应用不存在")
    }

    if (!version) {
        throw new Error("版本不存在")
    }

    let todayCount = 1;
    let nowDate = new Date()

    if (app.todayDownloadCount.date.toDateString() == nowDate.toDateString()) {

        todayCount = app.todayDownloadCount.count + 1

    }

    let appTotalCount = 1;

    if (app.totalDownloadCount) {

        appTotalCount = app.totalDownloadCount + 1

    }

    await App.updateOne({ _id: appid }, {
        totalDownloadCount: appTotalCount,
        todayDownloadCount: {
            count: app.totalDownloadCount + 1,
            date: nowDate
        }
    })

    let versionCount = 1;

    if (version.downloadCount) {

        versionCount = version.downloadCount + 1

    }

    await Version.updateOne({ _id: versionId }, {
        downloadCount: versionCount
    })

    ctx.body = responseWrapper(true, '下载次数已更新')

})

export default router