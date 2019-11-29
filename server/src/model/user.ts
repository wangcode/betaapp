import mongoose from '../helper/db';

let Schema = mongoose.Schema
let ObjectId = Schema.Types.ObjectId

// https://github.com/Automattic/mongoose/issues/5046#issuecomment-412114160
interface IUser extends mongoose.Document {
    username: string,
    password: string,
    email: string,
    token: string,
    apiToken: string,
    teams: {
        _id: string,
        name: string,
        icon?: string,
        role: "owner"|"manager"|"guest"
    }[],
    mobile: string,
    qq: string,
    company: string,
    career: string
}

const userSchema = {
    username: {
        type: String,
        index: true
    },
    password: {
        type: String
    },
    email: {
        type: String,
        index: true
    },
    token: {
        type: String
    },
    apiToken: {
        type: String
    },
    teams: [{
        _id: ObjectId,
        name: String,
        icon: String,
        role: {
            type: String,
            enum: ["owner", "manager", "guest"]
        }
    }],
    mobile: String,
    qq: String,
    company: String,
    career: String
}

export { userSchema }

export default mongoose.model<IUser>('User', new Schema(userSchema))