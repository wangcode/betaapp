import Router from 'koa-router'

import AppRouter from './app'
import AppsRouter from './apps'
import AuthRouter from './auth'
import TeamRouter from './team'
import PlistRouter from './plist'
import CountRouter from './count'
import MessageRouter from './message'

const router = new Router()

router.use('/api/app', AppRouter.routes(), AppRouter.allowedMethods())
router.use('/api/apps', AppsRouter.routes(), AppsRouter.allowedMethods())
router.use('/api/user', AuthRouter.routes(), AuthRouter.allowedMethods())
router.use('/api/team', TeamRouter.routes(), TeamRouter.allowedMethods())
router.use('/api/plist', PlistRouter.routes(), PlistRouter.allowedMethods())
router.use('/api/count', CountRouter.routes(), CountRouter.allowedMethods())
router.use('/api/message', MessageRouter.routes(), MessageRouter.allowedMethods())

export default router