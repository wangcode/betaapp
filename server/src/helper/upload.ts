import fs from 'fs'
import path from 'path'
import mkdirp from 'mkdirp'
import multer from 'koa-multer'

// @ts-ignore
import PkgReader from 'reiko-parser'

import config from '../config'

import Team, { ITeam } from '../model/team'
import App from '../model/app_model'
import Version from '../model/version'

const uploadDir = path.join(config.fileDir, 'upload')

const uploadPrefix = "upload"

const tempDir = path.join(config.fileDir, 'temp')

const storage = multer.diskStorage({
    destination: tempDir,
    filename: (req: any, file: any, cb: any) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({ storage });


interface IAppInfo extends IParseIpaInfo {
    downloadUrl?: string
    creator?: string
    creatorId?: string
    icon?: string
    fileName?: string
    shortUrl?: string
    uploader?: string
    uploaderId?: string
    size?: number
}

const parseAppAndInsertToDB = async (file: any, user: any, team: ITeam) => {

    let filePath = file.path
    let parser, platform

    if (path.extname(filePath) === ".ipa") {
        parser = parseIpa
        platform = 1
    } else if (path.extname(filePath) === ".apk") {
        parser = parseApk
        platform = 2
    } else {
        throw (new Error("文件类型有误,仅支持IPA或者APK文件的上传."))
    }

    let AppInfo: IAppInfo = await parser(filePath)

    let fileName = AppInfo.bundleId + "_" + AppInfo.versionStr + "_" + AppInfo.versionCode

    //移动文件到对应目录
    let fileRelatePath = path.join(team.id, AppInfo.platform)

    createFolderIfNeeded(path.join(uploadDir, fileRelatePath))

    let fileRealPath = path.join(uploadDir, fileRelatePath, fileName + path.extname(filePath))

    await fs.renameSync(filePath, fileRealPath)

    AppInfo.downloadUrl = path.join(uploadPrefix, fileRelatePath, fileName + path.extname(filePath))

    let iconData = AppInfo.icon.replace(/^data:image\/\w+;base64,/, "");

    let iconRealPath = path.join(team.id, "icon", platform===1?`/${fileName}_i.png`:`/${fileName}_a.png`)

    createFolderIfNeeded(path.join(uploadDir, team.id, "icon"))

    let imagePath = path.join(uploadDir, iconRealPath)

    try {

        fs.writeFileSync(imagePath, new Buffer(iconData, 'base64'))

    } catch {
        throw (new Error("保存失败！"))
    }


    let app = await App.findOne({ 'platform': AppInfo.platform, 'bundleId': AppInfo.bundleId, 'ownerId': team._id })

    if (!app) {

        AppInfo.creator = user.username
        AppInfo.creatorId = user._id
        AppInfo.icon = path.join(uploadPrefix, iconRealPath)
        AppInfo.shortUrl = Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5)

        app = new App(AppInfo)
        app.ownerId = team._id
        app.currentVersion = AppInfo.versionCode
        await app.save()

        AppInfo.uploader = user.username
        AppInfo.uploaderId = user._id
        AppInfo.size = fs.statSync(fileRealPath).size

        let version = new Version(AppInfo)
        version.appId = app._id

        if (app.platform == 'ios') {
            version.installUrl = mapInstallUrl(app.id, version.id)
        } else {
            version.installUrl = AppInfo.downloadUrl
        }

        await version.save()
        return { 'app': app, 'version': version }

    }

    let version = await Version.findOne({ appId: app.id, versionCode: AppInfo.versionCode })

    if (!version) {

        AppInfo.uploader = user.username
        AppInfo.uploaderId = user._id
        AppInfo.size = fs.statSync(fileRealPath).size

        let version = new Version(AppInfo)
        version.appId = app._id

        if (app.platform == 'ios') {
            version.installUrl = mapInstallUrl(app.id, version.id)
        } else {
            version.installUrl = `${config.baseUrl}/${AppInfo.downloadUrl}`
        }

        await version.save()

        return { 'app': app, 'version': version }

    } else {

        let err: NodeJS.ErrnoException = Error()
        err.code = '408'
        err.message = '当前版本已存在'

        throw err

    }



}


interface IParseIpaInfo {
    platform?: string
    bundleId?: string
    bundleName?: string
    appName?: string
    versionStr?: string
    versionCode?: number
    iconName?: string
    icon?: string
    appLevel?: 'appstore' | 'enterprise' | 'develop'
}

const parseIpa = async (filePath: string): Promise<IParseIpaInfo> => {

    const parser = new PkgReader(filePath, 'ipa', { withIcon: true });

    return new Promise((resolve, reject) => parser.parse((err: any, info: any) => {

        if (err) { reject(err) }

        let AppInfo: IParseIpaInfo = {
            platform: 'ios',
            bundleId: info.CFBundleIdentifier,
            bundleName: info.CFBundleName,
            appName: info.CFBundleDisplayName,
            versionStr: info.CFBundleShortVersionString,
            versionCode: info.CFBundleVersion,
            iconName: info.CFBundleIcons.CFBundlePrimaryIcon.CFBundleIconName,
            icon: info.icon,
            appLevel: 'enterprise'
        }

        try {

            let environment = info.mobileProvision.Entitlements['aps-environment']

            let active = info.mobileProvision.Entitlements['beta-reports-active']

            if (environment == 'production') {

                AppInfo.appLevel = active ? 'appstore' : 'enterprise'

            } else {

                AppInfo.appLevel = 'develop'

            }

        } catch (err) {

            AppInfo.appLevel = 'develop'

            // reject("应用未签名,暂不支持")
        }

        resolve(AppInfo)

    }))

}


const parseApk = (filePath: string): Promise<IParseIpaInfo> => {

    const parser = new PkgReader(filePath, 'apk', { withIcon: true });

    return new Promise((resolve, reject) => parser.parse((err: any, info: any) => {

        if (err) { reject(err) }

        let label = ''

        if (info.application && info.application.label && info.application.label.length > 0) {
            label = info.application.label[0]
        }

        if (label !== '') { label = label.replace(/'/g, '') }

        let appName = (info['application-label'] || info['application-label-zh-CN'] || info['application-label-es-US'] ||
            info['application-label-zh_CN'] || info['application-label-es_US'] || label || 'unknown')

        let AppInfo: IParseIpaInfo = {
            appName: appName.replace(/'/g, ''),
            versionCode: Number(info.versionCode),
            bundleId: info.package,
            versionStr: info.versionName,
            platform: 'android',
            icon: info.icon
        }

        resolve(AppInfo)

    }))

}

const createFolderIfNeeded = (path: string) => {
    if (!fs.existsSync(path)) {

        //   mkdirp.sync(path, err => {
        //     if (err) console.error(err)
        //   })

        mkdirp.sync(path)

    }
}

///映射可安装的app下载地址
const mapInstallUrl = (appId: string, versionId: string) => {
    return `itms-services://?action=download-manifest&url=${config.baseUrl}/api/plist/${appId}/${versionId}`
}

export { parseAppAndInsertToDB, upload }