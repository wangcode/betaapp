const APIError = (code: string, message: string) => {
    // @ts-ignore
    this.code = code || 'internal:unknown_error'
    // @ts-ignore
    this.message = message || ''
}

const restify = (pathPrefix?: string) => {
    pathPrefix = pathPrefix || '/api/'

    return async (ctx: any, next: any) => {
        if (ctx.request.path.startsWith(pathPrefix)) {

            console.log(`Process API ${ctx.request.method} ${ctx.request.url}...`)

            ctx.rest = (data: any) => {
                ctx.response.type = 'application/json'
                ctx.response.body = data
            }

            try {

                await next()

            } catch (e) {

                console.log('Process API error...')
                ctx.response.type = 'application/json'
                ctx.response.body = {
                    success: false,
                    message: e.message || ''
                }
                console.log(e)

            }

        } else {

            await next()

        }
    }
}

export { APIError, restify }