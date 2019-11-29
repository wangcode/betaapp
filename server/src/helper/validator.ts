import Team from '../model/team'
import App from '../model/app_model'

const isEmail = async (str: string) => {

    let re = /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/

    if (re.test(str) != true) {
        return false
    } else {
        return true
    }
}


const appAndUserInTeam = async (appId: string, teamId: string, userId: string) => {

    let team = await Team.findOne({
        _id: teamId, members: {
            $elemMatch: {
                id: userId
            }
        },
    }, "_id")

    let app = await App.find({ _id: appId, ownerId: team._id })

    if (!app) {
        throw new Error("应用不存在或您不在该团队中")
    } else {
        return app
    }

}

const userInTeamIsManager = async (userId: string, teamId: string) => {

    let team = await Team.findOne({
        _id: teamId, members: {
            $elemMatch: {
                _id: userId,
                $or: [
                    { role: 'owner' },
                    { role: 'manager' }
                ]
            }
        },
    }, "_id")

    return team

}

const userInTeam = async (userId: string, teamId: string) => {

    let team = await Team.findOne({
        _id: teamId, members: {
            $elemMatch: {
                _id: userId
            }
        },
    }, "_id")

    return team
}


export { isEmail, userInTeamIsManager, userInTeam, appAndUserInTeam }