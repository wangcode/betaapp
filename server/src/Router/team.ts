import _ from 'lodash'
import Router from 'koa-router'

import User from '../model/user'
import Team from '../model/team'
import Message from '../model/message'

import Mail from '../helper/mail'
import config from '../config'

// @ts-ignore
import Fawn from 'fawn'

import { responseWrapper } from "../helper/util"
import { userInTeamIsManager, userInTeam } from "../helper/validator"

const router = new Router()

// 创建一个团队
router.post('/create', async (ctx, next) => {

    let user = ctx.state.user.data

    let { body } = ctx.request

    let team = new Team(body)

    team.creatorId = user._id

    team.members = [{
        _id: user._id,
        username: user.username,
        email: user.email,
        role: "owner"
    }]

    // @ts-ignore
    let task = Fawn.Task()

    let result = await task
        .save(team)
        .update(User, {
            _id: user._id
        }, {
            $push: {
                teams: {
                    _id: team._id,
                    name: team.name,
                    icon: team.icon,
                    role: "owner"
                }
            }
        })
        .run({ useMongoose: true })

    ctx.body = responseWrapper(true, "团队创建成功", team)

})

// 解散一个团队
router.delete('/dissolve/:id', async ctx => {

    const { id } = ctx.params

    let user = ctx.state.user.data

    let team = await Team.findOne({ '_id': id, 'members.username': user.username, 'members.role': 'owner' })

    if (!team) {
        throw new Error("该团队不存在或者您没有权限解散该团队")
    }

    if (team._id == user._id) {
        throw new Error("用户默认团队无法解散")
    }

    let membersId = []
    if (team.members.length > 0) {
        for (let m of team.members) {
            membersId.push(m._id)
        }
    }

    if (membersId.length > 0) {
        await User.update({ _id: { $in: membersId } }, {
            $pull: {
                teams: { _id: team._id }
            }
        })
    }

    await Team.deleteOne({ _id: team._id })

    ctx.body = responseWrapper(true, "团队已解散")

})

// 修改用户角色
router.get('/:teamId/role', async ctx => {

    let { teamId } = ctx.params

    let user = ctx.state.user.data

    let body = ctx.request.body

    let team = userInTeamIsManager(user._id, teamId)

    if (!team) {
        throw new Error("没有权限修改该用户角色")
    }

    if (body.role != 'manager' && body.role != 'guest') {
        throw new Error("请传入正确的角色参数")
    }

    await User.updateOne({ _id: body.memberId, 'teams._id': teamId }, {
        $set: {
            'teams.$.role': body.role
        }
    })

    await Team.updateOne({ _id: teamId, 'members._id': body.memberId }, {
        $set: {
            'members.$.role': body.role
        }
    })

    ctx.body = responseWrapper(true, "用户角色已更新")

})


// 邀请某成员加入团队
router.get('/:teamId/invite', async ctx => {

    let { teamId } = ctx.params

    let user = ctx.state.user.data

    let emailList = ctx.request.body.emailList

    let body = ctx.request.body

    if (!(body.role === 'manager' || body.role === 'guest')) {
        throw new Error("请传入正确的用户角色")
    }

    let team = await Team.findOne({
        _id: teamId,
        members: {
            $elemMatch: {
                _id: user._id,
                $or: [
                    { role: 'owner' },
                    { role: 'manager' }
                ]
            }
        },
    }, "_id name members")

    if (!team) {
        throw new Error("团队不存在,或者您没有权限邀请用户加入")
    }

    let userList = await User.find({
        email: { $in: emailList }
    }, "username email")

    // 如果用户不存在则发送邮件邀请
    let dif = _.difference(emailList, _.map(userList, 'email'))

    if (dif.length != 0) {
        Mail.send(dif, `${user.username}邀请您加入`, `${user.username}邀请您加入${team.name}"团队.如果您还没有注册，请点击${config.baseUrl}注册`)
    }

    let teamList = []
    for (let u of userList) {
        if (!(_.find(team.members, function(o) {
                return o.email == u.email
            }))) {
            teamList.push({
                _id: u.id,
                username: u.username,
                email: u.email,
                role: body.role
            })
        }
    }

    if (teamList.length <= 0) {
        if (dif.length > 0) {
            ctx.body = responseWrapper(true, "已发送邀请")
        } else {
            ctx.body = responseWrapper(true, "用户已加入该团队")
        }
        return
    }

    // @ts-ignore
    let task = Fawn.Task()

    let result = await task
        .update(Team, { _id: teamId }, {
            $addToSet: { members: { $each: teamList } }
        })
        .update(User, { email: { $in: emailList } }, {
            $push: {
                teams: {
                    _id: teamId,
                    name: team.name,
                    icon: team.icon,
                    role: body.role
                }
            }
        })
        .run({ useMongoose: true })


    for (let u of userList) {
        let message = new Message()
        message.category = "INVITE"
        message.content = user.username + "邀请您加入" + team.name + "团队."
        message.sender = user._id
        message.receiver = u._id
        // message.data = jwt.sign({
        //     data: {
        //         teamId: team._id,
        //         invited: userIdentifier
        //     },
        //     exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7)
        // }, 'jwt-secret')
        message.save()
    }

    ctx.body = responseWrapper(true, "已发送邀请")

})


// 移除某个成员,或者自己离开团队
router.delete('/:id/member/:userId', async ctx => {

    let { id, userId } = ctx.params

    let user = ctx.state.user.data

    //如果传入的id和当前登录用户的id相等 表示是自己离开团队
    let team

    if (userId === user._id) {
        team = await userInTeam(user._id, id)
    } else {
        team = await userInTeamIsManager(user._id, id)
    }

    if (!team) {
        throw new Error("团队不存在或该用户没有权限删除用户")
    }

    // @ts-ignore
    let task = Fawn.Task()

    let result = await task
        .update(team, { $pull: { members: { _id: userId } } })
        .update(User, {
            _id: userId
        }, {
            $pull: {
                teams: {
                    _id: team._id,
                }
            }
        }).run({ useMongoose: true })

    ctx.body = responseWrapper(true, "请求成功")

})

// 获取团队成员列表
router.get('/:teamId/members', async ctx => {

    let { teamId } = ctx.params

    let user = ctx.state.user.data

    //如果传入的id和当前登录用户的id相等 表示是自己离开团队
    let team = await Team.findOne({
        _id: teamId,
    })

    if (!team) {
        throw new Error("团队不存在")
    }

    ctx.body = responseWrapper(team)

})


router.post('/:teamId/profile', async ctx => {

    let { teamId } = ctx.params

    let user = ctx.state.user.data

    let body = ctx.request.body

    let team = await Team.findOne({
        _id: teamId,
        members: {
            $elemMatch: {
                _id: user._id,
                $or: [
                    { role: 'owner' },
                    { role: 'manager' }
                ]
            }
        },
    }, "_id members")

    if (!team) {
        throw new Error("团队不存在或者您没有权限修改该信息")
    }

    await Team.updateOne({
        _id: teamId,
    }, { name: body.name })

    let membersId = []

    if (team.members.length > 0) {
        for (let m of team.members) {
            membersId.push(m._id)
        }
    }

    if (membersId.length > 0) {
        await User.updateMany({ _id: { $in: membersId }, 'teams._id': teamId }, {
            $set: {
                'teams.$.name': body.name
            }
        })
    }

    ctx.body = responseWrapper(true, "团队名称已修改")

})


export default router