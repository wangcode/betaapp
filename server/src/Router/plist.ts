import Router from 'koa-router'

import App from '../model/app_model'
import Version from '../model/version'

import _ from 'lodash'
import mustache from 'mustache';

import config from '../config'

const router = new Router()

const PlistTemplateString = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>items</key>
  <array>
    <dict>
      <key>assets</key>
      <array>
        <dict>
          <key>kind</key>
          <string>software-package</string>
          <key>url</key>
          <string>{{{ downloadUrl }}}</string>
          <key>md5-size</key>
          <integer>{{{ fileSize }}}</integer>
        </dict>
         <dict>
         <key>kind</key>
         <string>display-image</string>
         <!-- optional. indicates if icon needs shine effect applied. -->
         <key>needs-shine</key>
         <true/>
         <key>url</key>
         <string>{{{ iconUrl }}}</string>
        </dict>
      </array>
      <key>metadata</key>
      <dict>
        <key>bundle-identifier</key>
        <string>{{{ bundleID }}}</string>
        <key>bundle-version</key>
        <string>{{{ versionStr }}}</string>
        <key>kind</key>
        <string>software</string>
        <key>title</key>
        <string>{{{ appName }}}</string>
      </dict>
    </dict>
  </array>
</dict>
</plist>`


// 获取应用的plist文件
router.get('/:appid/:versionId', async (ctx, next) => {

    let { appid, versionId } = ctx.params

    let app = await App.findOne({ _id: appid })

    let version = await Version.findOne({ _id: versionId })


    if (!app) {
        throw new Error("应用不存在")
    }

    if (!version) {
        throw new Error("版本不存在")
    }

    let url = `${config.baseUrl}/${version.downloadUrl}`

    // let result = fs.readFileSync(fpath.join(__dirname, "..", 'templates') + '/template.plist')

    // let template = result.toString();

    let rendered = mustache.render(PlistTemplateString, {
        appName: app.appName,
        bundleID: app.bundleId,
        versionStr: version.versionStr,
        downloadUrl: url,
        fileSize: version.size,
        iconUrl: `${config.baseUrl}/${app.icon}`
    });

    ctx.set('Content-Type', 'text/xml; charset=utf-8');

    ctx.set('Access-Control-Allow-Origin', '*');

    ctx.body = rendered

})


export default router