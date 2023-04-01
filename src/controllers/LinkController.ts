import { Request, Response } from 'express';
import {
  createLinkId,
  createNewLink,
  deleteLinkById,
  getLinkById,
  getLinksByUserId,
  getLinksByUserIdForOwnAccount,
  updateLinkVisits,
} from '../models/LinkModel';
import { parseDatabaseError } from '../utils/db-utils';
import { getUserById } from '../models/UserModel';

async function shortenUrl(req: Request, res: Response): Promise<void> {
  // Check if user is logged in
  if (!req.session.isLoggedIn) {
    res.sendStatus(401);
    return;
  }
  const { userId, isPro, isAdmin } = req.session.authenticatedUser;
  const user = await getUserById(userId);
  if (!user) {
    res.sendStatus(404);
    return;
  }
  // Check if the user is neither a "pro" nor an "admin" account
  if (!(isPro || isAdmin)) {
    const numLinks = user.link.length;
    if (numLinks >= 5) {
      res.sendStatus(403);
      return;
    }
  }

  // Generate a `linkId`
  const { originalUrl } = req.body;
  const linkId = createLinkId(originalUrl, userId);

  // Add the new link to the database
  try {
    const newLink = await createNewLink(originalUrl, linkId, user);
    res.status(201).json(newLink);
  } catch (err) {
    console.error(err);
    const databaseErrorMessage = parseDatabaseError(err);
    res.status(500).json(databaseErrorMessage);
  }
}

async function getOriginalUrl(req: Request, res: Response): Promise<void> {
  // Retrieve the link data using the targetLinkId from the path parameter
  const { targetLinkId } = req.params;
  const link = await getLinkById(targetLinkId);

  // Check if you got back `null`
  if (!link) {
    res.status(404).send('Link not found');
    return;
  }

  // Call the appropriate function to increment the number of hits and the last accessed date
  await updateLinkVisits(link);

  // Redirect the client to the original URL
  res.redirect(301, link.originalURL);
}

async function getLinksByUser(req: Request, res: Response): Promise<void> {
  const { userId } = req.params;
  const user = req.session.authenticatedUser;

  try {
    if (user && (user.isAdmin || user.userId === userId)) {
      const links = await getLinksByUserIdForOwnAccount(userId);
      res.json(links);
    } else {
      const links = await getLinksByUserId(userId);
      res.json(links);
    }
  } catch (err) {
    console.error(err);
    const databaseErrorMessage = parseDatabaseError(err);
    res.status(500).json(databaseErrorMessage);
  }
}

async function deleteLink(req: Request, res: Response): Promise<void> {
  const { linkId } = req.params;
  const { userId, isAdmin } = req.session.authenticatedUser;

  // Get the link from the database
  const link = await getLinkById(linkId);
  if (!link) {
    res.sendStatus(404);
    return;
  }

  // Check if the user is authorized to delete the link
  if (!isAdmin || linkId !== userId) {
    res.status(403).json({ message: 'You are not authorized to delete this link' });
    return;
  }

  // Delete the link from the database
  await deleteLinkById(linkId);

  res.json({ message: 'Link deleted successfully' });
}

export default { shortenUrl, getOriginalUrl, getLinksByUser, deleteLink };
