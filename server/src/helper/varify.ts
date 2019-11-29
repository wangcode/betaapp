import User from '../model/user';

export default class Varify {
  static async auth(key: string) {

    if (key) {

      let user = await User.findOne({ apiToken: key});

      if (!user) throw new Error('api token is not exist');

      return user

    } else {

      throw new Error('api token is not exist');

    }

  }
}
