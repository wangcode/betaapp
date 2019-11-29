// @ts-nocheck
import compose from 'koa-compose';

export default class Middle {

    skip(...middle: any[]) {
        return Object.create(
            Object.prototype, {
                'if': {
                    value: (fn) => {
                        return (ctx, next) => {
                            return fn(ctx) ? next() : compose(middle)(ctx, next)
                        }
                    }
                },
                'unless': {
                    value: (fn) => {
                        return (ctx, next) => {
                            return fn(ctx) ? compose(middle)(ctx, next) : next()
                        }
                    }
                }
            }
        )
    }

}