import mongoose from '../helper/db'
import Version from './version'

const Schema = mongoose.Schema

interface IApp extends mongoose.Document {
    platform: string
    bundleId: string
    bundleName: string
    appName: string,
    currentVersion: number
    creatorId: string,
    creator: string,
    createAt: Date
    icon: string
    describe: string
    updateAt: Date
    shortUrl: string
    autoPublish: boolean
    installWithPwd: boolean
    installPwd: string
    appLevel: string,
    ownerId: string,
    changelog: string,
    updateMode: 'silent'|'normal'|'force'
    releaseVersionCode: string
    releaseVersionId: string
    grayReleaseVersionId: string,
    totalDownloadCount: number
    todayDownloadCount: {
        date: Date
        count: number
    },
    grayStrategy: {
        ipType: 'black'|'white'
        ipList: string[],
        downloadCountLimit: number,
        updateMode: 'silent'|'normal'|'force'
    }
}

const appSchema = {
    platform: {
        type: String
    },
    bundleId: {
        type: String,
        index: true
    },
    bundleName: {
        type: String
    },
    appName: String,
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
    shortUrl: {
        type: String,
        unique: true
    },
    autoPublish: { //是否自动发布
        type: Boolean,
        default: false
    },
    installWithPwd: {
        Boolean,
        default: false
    },
    installPwd: {
        type: String
    },
    appLevel: String,
    ownerId: String,
    changelog: String,
    updateMode: {
        type: String,
        default: 'silent',
        enum: ['silent', 'normal', 'force']
    },
    releaseVersionCode: String, //当前对外发布的code号
    releaseVersionId: String, //当前对外发布的最新版本号
    grayReleaseVersionId: String,
    totalDownloadCount: {
        type: Number,
        default: 0
    },
    todayDownloadCount: {
        date: { type: Date, default: Date.now },
        count: { type: Number, default: 0 }
    },
    grayStrategy: {
        ipType: {
            type: String,
            enum: ['black', 'white'],
            default: 'black'
        },
        ipList: [String],
        downloadCountLimit: Number,
        updateMode: {
            type: String,
            default: 'silent',
            enum: ['silent', 'normal', 'force']
        }
    }
}

export default mongoose.model<IApp>('App', new Schema(appSchema))