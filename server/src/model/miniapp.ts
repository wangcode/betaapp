import mongoose from '../helper/db'

const Schema = mongoose.Schema

interface IVersion extends mongoose.Document {
    platform: string
    appName: string
    appId: string
    appSecret: string
    currentVersion: string
    creatorId: string
    creator: string
    createAt: Date
    icon: string
    describe: string
    updateAt: string
    ownerId: string
    changelog: string
    downloadCodeImage: {
        remark: string,
        image: string,
        param: string,
        page: string
    }[]
    releaseVersionId: string
    totalDownloadCount: number
    todayDownloadCount: {
        date: Date
        count: number
    }
}


const miniappSchema = {
    platform: {
        type: String,
        default: 'weixin'
    },
    appName: String,
    appId: String,
    appSecret: String,
    currentVersion: {
        type: String
    },
    creatorId: String,
    creator: String,
    createAt: {
        type: Date,
        default: Date.now
    },
    icon: {
        type: String
    },
    describe: {
        type: String
    },
    updateAt: {
        type: Date
    },
    ownerId: String,
    changelog: String,
    downloadCodeImage: [{ remark: String, image: String, param: String, page: String }],
    releaseVersionId: String, //当前对外发布的最新版本号
    totalDownloadCount: { type: Number, default: 0 },
    todayDownloadCount: {
        date: { type: Date, default: Date.now },
        count: { type: Number, default: 0 }
    }
}

export default mongoose.model<IVersion>('Miniapp', new Schema(miniappSchema))