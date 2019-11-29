import Router from 'koa-router'

import App from '../model/app_model'
import Version from '../model/version'

import _ from 'lodash'
import { getIp, responseWrapper } from "../helper/util"

const router = new Router()

// 通过短链接获取应用最新版本
router.get('/:appShortUrl', async (ctx, next) => {

    let { appShortUrl } = ctx.params

    let app = await App.findOne({ shortUrl: appShortUrl })

    if (!app) {
        throw new Error("应用不存在")
    }
    // if (!app.releaseVersionId || app.releaseVersionId === '') {
    //     throw new Error("当前没有已发布的版本可供下载")
    // }
    // let version = await Version.findById(app.releaseVersionId)
    // if (!version) {
    //     throw new Error("当前没有已发布的版本可供下载")
    // }

    let lastestGrayVersion = await Version.findOne({ _id: app.grayReleaseVersionId })

    // let version = await Version.findOne({ appId: app._id })

    let normalVersion = await Version.findOne({ _id: app.releaseVersionId })

    let version = normalVersion
    let lastestGrayVersionCode: string | number = 0
    let normalVersionCode: string | number = 0

    if (version && version.versionCode) {

        normalVersionCode = version.versionCode

    }

    if (lastestGrayVersion && lastestGrayVersion.versionCode) {

        lastestGrayVersionCode = lastestGrayVersion.versionCode

    }

    if (app.grayReleaseVersionId && lastestGrayVersionCode > normalVersionCode) {

        let ipType = app.grayStrategy.ipType
        let ipList = app.grayStrategy.ipList

        let clientIp = await getIp(ctx.request)

        if (ipType == 'white' && _.includes(ipList, clientIp)) { //如果是white 则允许获得灰度版本

            if (!app.grayStrategy.downloadCountLimit || app.grayStrategy.downloadCountLimit > lastestGrayVersion.downloadCount) {

                version = lastestGrayVersion

            }

        }

    }

    if (!version) {
        ctx.body = responseWrapper(false, "当前没有可用版本可供下载")
    } else {
        ctx.body = responseWrapper({ app: app, version: version })
    }

    ctx.body = responseWrapper({ 'app': app, 'version': version })

})


// 取消发布版本
router.post('/:appId/:versionId', async (ctx, next) => {

    let { appId, versionId } = ctx.params

    let app = await App.findOne({ _id: appId })

    let version = await Version.findOne({ _id: versionId })

    if (!app) {
        throw new Error("应用不存在")
    }

    if (!version) {
        throw new Error("版本不存在")
    }

    if (versionId == app.releaseVersionId) {

        await App.updateOne({ _id: appId }, { releaseVersionId: null })

    }

    if (versionId == app.grayReleaseVersionId) {

        await App.updateOne({ _id: appId }, {
            grayReleaseVersionId: null,
            grayStrategy: null
        })

    }

    ctx.body = responseWrapper('取消版本的发布成功')

})


// 检查版本更新
router.get('/checkupdate/:teamId/:platform/:bundleId/:currentVersionCode', async (ctx, next) => {

    let { teamID, bundleID, currentVersionCode, platform } = ctx.params

    let app = await App.findOne({
        bundleId: bundleID,
        ownerId: teamID,
        platform: platform
    })

    if (!app) {
        throw new Error("应用不存在或您没有权限执行该操作")
    }
    // let lastVersionCode = app.currentVersion

    // if ( < lastVersionCode) {
    //1.拿出最新的version 最新的非灰度版本

    // 最新的灰度版本
    let lastestGrayVersion = await Version.findOne({
        _id: app.grayReleaseVersionId
    })

    // let version = await Version.findOne({ appId: app._id })
    let normalVersion = await Version.findOne({
        _id: app.releaseVersionId
    })

    let version = normalVersion

    let lastestGrayVersionCode: string | number = 0

    let normalVersionCode: string | number = 0

    if (version && version.versionCode) {

        normalVersionCode = version.versionCode

    }

    if (lastestGrayVersion && lastestGrayVersion.versionCode) {

        lastestGrayVersionCode = lastestGrayVersion.versionCode

    }

    if (app.grayReleaseVersionId && lastestGrayVersionCode > normalVersionCode) {

        let ipType = app.grayStrategy.ipType
        let ipList = app.grayStrategy.ipList

        let clientIp = await getIp(ctx.request)

        console.log(clientIp)

        if (ipType == 'white' && _.includes(ipList, clientIp)) { //如果是white 则允许获得灰度版本

            if (!app.grayStrategy.downloadCountLimit || app.grayStrategy.downloadCountLimit > lastestGrayVersion.downloadCount) {

                version = lastestGrayVersion

            }

        }
    }


    if (!version || version.versionCode <= currentVersionCode) {

        ctx.body = responseWrapper(false, "您已经是最新版本了")

    } else {

        ctx.body = responseWrapper({
            app: app,
            version: version
        })

    }

})


export default router