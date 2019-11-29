import Router from 'koa-router'

import App from '../model/app_model'
import Team from '../model/team'
import Version from '../model/version'

import _ from 'lodash'
import {  responseWrapper } from "../helper/util"

import { parseAppAndInsertToDB, upload } from '../helper/upload'

const router = new Router()

const appInTeamAndUserIsManager = async (appId: string, teamId: number, userId: number) => {
    let team = await Team.findOne({
        _id: teamId,
        members: {
            $elemMatch: {
                _id: userId,
                $or: [
                    { role: 'owner' },
                    { role: 'manager' }
                ]
            }
        },
    }, "_id")

    if (!team) throw new Error("应用不存在或您没有权限执行该操作")

    let app = await App.findOne({ _id: appId, ownerId: team._id })

    if (!app) {
        throw new Error("应用不存在或您没有权限执行该操作")
    } else {
        return app
    }
}


// 获取团队下App列表
router.get('/:teamId/', async (ctx, next) => {

    let user = ctx.state.user.data

    let { teamId } = ctx.params

    let result = await App.find({ ownerId: teamId || user.id })

    ctx.body = responseWrapper(result)

})

// 获取某个应用详情
router.get('/:teamId/:id', async (ctx, next) => {

    let user = ctx.state.user.data

    let { teamId, id } = ctx.params
    //todo: 这里其实还要判断该用户在不在team中
    //且该应用也在team中,才有权限查看
    let app = await App.findById(id)

    ctx.body = responseWrapper(app)
})

// 删除某个应用
router.delete('/:teamId/:id', async (ctx, next) => {

    let user = ctx.state.user.data

    let { teamId, id } = ctx.params

    let team = await Team.findOne({
        _id: teamId,
        members: {
            $elemMatch: {
                username: user.username,
                $or: [
                    { role: 'owner' },
                    { role: 'manager' }
                ]
            }
        }
    })

    let app = await App.findOne({
        _id: id,
        ownerId: team._id
    })

    if (!app) {
        throw new Error('应用不存在或您没有权限查询该应用')
    }

    await Version.deleteMany({
        appId: app.id
    })

    await App.deleteOne({
        _id: app.id
    })

    ctx.body = responseWrapper(true, "应用已删除")

})

// 获取某个应用的版本列表(分页)
router.get('/:teamId/:id/versions', async (ctx, next) => {

    let user = ctx.state.user.data

    let { teamId, id } = ctx.params

    let { page, size } = ctx.query

    let team = await Team.findOne({
        _id: teamId,
        members: {
            $elemMatch: {
                username: user.username
            }
        }
    })

    let app = await App.find({
        _id: id,
        ownerId: team._id
    })

    if (!app) {
        throw new Error("应用不存在或您没有权限查询该应用")
    }

    let versions = await Version.find({
        appId: id
    }).limit(parseInt(size)).skip(page * size)

    ctx.body = responseWrapper(versions)

})

// 获取某个应用的某个版本详情
router.get('/:teamId/:id/versions/:versionId', async (ctx, next) => {

    //todo: 好像暂时用不上
    let user = ctx.state.user.data
    let { teamId, id, versionId } = ctx.params

    let team = await Team.find({
        _id: teamId,
        members: {
            $elemMatch: {
                username: user.username
            }
        }
    })

    if (!team) {
        throw new Error("没有权限查看该应用")
    }

    let version = await Version.findById(versionId)

    if (!version) {
        throw new Error("应用不存在")
    }

    ctx.body = responseWrapper(version)

})

// 删除某个版本
router.delete('/:teamId/:id/versions/:versionId', async (ctx, next) => {

    let user = ctx.state.user.data

    let { teamId, id, versionId } = ctx.params

    let app = await appInTeamAndUserIsManager(id, teamId, user._id)

    let result = await Version.deleteOne({ _id: versionId })

    if (versionId == app.releaseVersionId) {
        await App.updateOne({ _id: app._id }, {
            releaseVersionId: null
        })
    }

    if (versionId == app.grayReleaseVersionId) {
        await App.updateOne({ _id: app._id }, {
            grayReleaseVersionId: null,
            grayStrategy: null
        })
    }

    ctx.body = responseWrapper(true, "版本已删除")

})

// 设置应用或版发布更新方式/静默/强制/普通
router.post('/:teamId/:id/updateMode', async (ctx, next) => {

    let user = ctx.state.user.data

    let body = ctx.body

    let { teamId, id } = ctx.params

    let app = await appInTeamAndUserIsManager(id, teamId, user._id)

    if (body.versionId) {

        //更新版本策略
        await Version.findByIdAndUpdate(body.versionId, { updateMode: body.updateMode })

    } else {

        await App.findByIdAndUpdate(id, { updateMode: body.updateMode })

    }

    ctx.body = responseWrapper(true, "版本发布策略设置成功")

})

// 更新应用设置
router.post('/:teamId/:id/profile', async (ctx, next) => {

    let user = ctx.state.user.data

    let body = ctx.request.body

    let { teamId, id } = ctx.params

    let app = await appInTeamAndUserIsManager(id, teamId, user._id)

    if (!app) {
        throw new Error("应用不存在或您没有权限执行该操作")
    }

    await App.findByIdAndUpdate(id, body)

    ctx.body = responseWrapper(true, "应用设置已更新")

})

// 更新版本设置设置
router.post('/:teamId/:id/:versionId/profile', async (ctx, next) => {

    let user = ctx.state.user.data

    let body = ctx.request.body

    let { teamId, id, versionId } = ctx.params

    let app = await appInTeamAndUserIsManager(id, teamId, user._id)

    if (!app) {
        throw new Error("应用不存在或您没有权限执行该操作")
    }

    await Version.findByIdAndUpdate(versionId, body)

    ctx.body = responseWrapper(true, "版本设置已更新")

})

// 灰度发布一个版本
router.post('/:teamId/:id/grayPublish', async (ctx, next) => {

    let user = ctx.state.user.data

    let { body } = ctx.request

    let { teamId, id } = ctx.params

    let app = await appInTeamAndUserIsManager(id, teamId, user._id)

    if (!app) {
        throw new Error("应用不存在或您没有权限执行该操作")
    }

    let version = await Version.findById(body.version.versionId, "versionStr")

    await App.updateOne({ _id: app.id }, {
        grayReleaseVersionId: version.id,
        grayStrategy: body.strategy
    })

    ctx.body = responseWrapper(true, "版本已灰度发布")

})

// 发布或者取消发布某个版本
router.post('/:teamId/:id/release', async (ctx, next) => {

    let user = ctx.state.user.data

    let { body } = ctx.request

    let { teamId, id } = ctx.params

    let app = await appInTeamAndUserIsManager(id, teamId, user._id)

    if (!app) {
        throw new Error("应用不存在或您没有权限执行该操作")
    }

    let version: any = await Version.findById(body.versionId)

    if (!version) {
        throw new Error("版本不存在")
    }

    if (body.release) {

        await App.updateOne({ _id: app.id }, {
            releaseVersionId: version._id,
            releaseVersionCode: version.versionCode
        })

    } else {

        await App.updateOne({ _id: app.id }, {
            releaseVersionId: '',
            releaseVersionCode: ''
        })

    }

    ctx.body = responseWrapper(true, body.release ? "版本已发布" : "版本已关闭")

})


// 上传apk或者ipa文件到服务器
router.post('/:teamId/upload', upload.single('file'), async (ctx) => {

    // @ts-ignore
    let file = ctx.req.file

    const { teamId } = ctx.params

    let team = await Team.findById(teamId)

    if (!team) {
        throw new Error("没有找到该团队")
    }

    let result = await parseAppAndInsertToDB(file, ctx.state.user.data, team);

    await Version.updateOne({ _id: result.version._id }, {
        released: result.app.autoPublish
    })

    if (result.app.autoPublish) {
        await App.updateOne({ _id: result.app._id }, {
            releaseVersionId: result.version._id,
            releaseVersionCode: result.version.versionCode
        })
    }


    ctx.body = responseWrapper(result);

})

export default router