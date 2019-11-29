import mongoose from '../helper/db'

const Schema = mongoose.Schema

interface IMessage extends mongoose.Document {
    category: string
    content: string
    sender: String
    receiver: string
    sendAt: Date
    status: 'unread'|'hasread'
    data: string
}

const messageSchema = {
    category: {
        type: String,
        required: true //消息类型  //INVITE 邀请
    },
    content: {
        type: String,
        required: true  //消息内容
    },
    sender: String, //发送者的id
    receiver: {
        type: String,  //接受者的id 必填
        required: true
    },
    sendAt: {
        type: Date,
        default: Date.now()
    },
    status: {
        type: String,
        default: 'unread',
        enum: ['unread', 'hasread']
    },
    data: String     //消息中带有的data字段

}

export default mongoose.model<IMessage>('Message', new Schema(messageSchema))
