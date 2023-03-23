import { Request, Response } from 'express';
import argon2 from 'argon2';
import { parseDatabaseError } from '../utils/db-utils';
import { addNewUser, getUserByUserName } from '../models/UserModel';

async function registerUser(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body as NewUserRequest;

  // Check if the user with the given username already exists in the database
  const existingUser = await getUserByUserName(username);
  if (existingUser) {
    res.status(409).send('Username already exists');
    return;
  }
  // Hash the password before storing it in the database
  const passwordHash = await argon2.hash(password);
  try {
    // Add the user to the database
    const newUser = await addNewUser(username, passwordHash);
    console.log(newUser);
    // Return a success message
    res.status(201).send('User registered successfully');
  } catch (err) {
    console.error(err);
    const databaseErrorMessage = parseDatabaseError(err);
    res.status(500).json(databaseErrorMessage);
  }
}

// verifying user's password
async function logIn(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body as NewUserRequest;
  const user = await getUserByUserName(username);

  if (!user) {
    res.sendStatus(404);
    return;
  }
  const { passwordHash } = user;

  if (!(await argon2.verify(passwordHash, password))) {
    res.sendStatus(403);
    return;
  }

  await req.session.clearSession();
  req.session.authenticatedUser = {
    userId: user.userId,
    username: user.username,
    isPro: user.isPro,
    isAdmin: user.isAdmin,
  };
  req.session.isLoggedIn = true;

  res.sendStatus(200);
}

export default { registerUser, logIn };
