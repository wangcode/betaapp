import mongoose from '../helper/db'
const Schema = mongoose.Schema

interface IVersion extends mongoose.Document {
    appId: string
    bundleId: string
    icon: string
    versionStr: string
    versionCode: string
    uploadAt: Date
    uploader: string
    uploaderId: string
    size: number
    active: boolean
    downloadUrl: string
    downloadCount: number
    fileDownloadUrl: string
    installUrl: string
    showOnDownloadPage: boolean
    appLevel: string
    changelog: string
    hidden: boolean
    updateMode: 'silent'|'normal'|'force'
}


const versionSchema ={
    appId: String, //该版本的应用的id
    bundleId: {
        type: String,
        index: true
    },
    icon: String,
    versionStr: String,
    versionCode: String,
    uploadAt: {
        type: Date,
        default: Date.now
    },
    uploader: String,
    uploaderId: String,
    size: Number,
    active: Boolean,
    downloadUrl: String,
    downloadCount: { type: Number, default: 0 },
    fileDownloadUrl: String, //源文件下载地址
    installUrl: String, //应用包安装地址
    showOnDownloadPage: { type: Boolean, default: false },
    appLevel: String,
    changelog: String,
    hidden: { type: Boolean, default: false },
    updateMode: { type: String, default: 'normal', enum: ['silent', 'normal', 'force'] }
}

export default mongoose.model<IVersion>('Version', new Schema(versionSchema))