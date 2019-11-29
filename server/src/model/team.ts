import mongoose from '../helper/db'

let Schema = mongoose.Schema
let ObjectId = Schema.Types.ObjectId

export interface ITeam extends mongoose.Document {
    name: string
    icon: string
    creatorId: string
    createAt: Date
    members:{
        _id: string,
        username: String,
        email: String,
        role: "owner"|"manager"|"guest"
    }[]
}

const teamSchema ={
  name: {
    type: String,
    required: true,
  },
  icon: String,
  creatorId: {
    type: String,
    required: true
  },
  createAt: {
    type: Date,
    default: Date.now
  },
  members: [
    {
      _id: ObjectId,
      username: String,
      email:String,
      role: {
        type: String,
        enum: ["owner", "manager", "guest"]
      }
    }
  ]
}

export default mongoose.model<ITeam>('Team', new Schema(teamSchema));