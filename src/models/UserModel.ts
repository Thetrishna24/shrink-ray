import { AppDataSource } from '../dataSource';
import { User } from '../entities/User';

const userRepository = AppDataSource.getRepository(User);

async function getUserByUserName(username: string): Promise<User | null> {
  return await userRepository.findOne({ where: { username } });
}

async function addNewUser(username: string, passwordHash: string): Promise<User | null> {
  let newUser = new User();
  newUser.username = username;
  newUser.passwordHash = passwordHash;

  newUser = await userRepository.save(newUser);

  return newUser;
}

async function getUserById(userId: string): Promise<User | null> {
  const user = await userRepository.findOne({
    where: { userId },
    relations: ['links'],
  });

  if (!user) {
    return null;
  }

  return user;
}

export { getUserByUserName, addNewUser, getUserById };
