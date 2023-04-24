import { createHash } from 'crypto';
import { AppDataSource } from '../dataSource';
import { Link } from '../entities/Link';
import { User } from '../entities/User';

const linkRepository = AppDataSource.getRepository(Link);

async function getLinkById(linkId: string): Promise<Link | null> {
  const link = await linkRepository.findOne({
    where: { linkId },
    relations: ['user'],
  });

  if (!link) {
    return null;
  }

  return link;
}

function createLinkId(originalUrl: string, userId: string): string {
  const md5 = createHash('md5');
  md5.update(originalUrl + userId);
  const urlHash = md5.digest('base64url');
  const linkId = urlHash.substring(0, 9);

  return linkId;
}

async function createNewLink(originalUrl: string, linkId: string, creator: User): Promise<Link> {
  let newLink = new Link();
  newLink.linkId = linkId;
  newLink.originalURL = originalUrl;
  newLink.numHits = 0;
  newLink.user = [creator];

  newLink = await linkRepository.save(newLink);

  return newLink;
}

async function updateLinkVisits(link: Link): Promise<Link> {
  // Increment the link's number of hits property
  const updatedLink = link;
  updatedLink.numHits += 1;

  // Create a new date object and assign it to the link's `lastAccessedOn` property.
  const now = new Date();
  updatedLink.lastAccessedOn = now;
  return await linkRepository.save(updatedLink);
}

async function getLinksByUserId(userId: string): Promise<Link[]> {
  const links = await linkRepository
    .createQueryBuilder('link')
    .where({ user: { userId } })
    .leftJoin('link.user', 'user')
    .select(['link.linkId', 'link.originalUrl', 'user.userId', 'user.username', 'user.isAdmin'])
    .getMany();

  return links;
}

async function getLinksByUserIdForOwnAccount(userId: string): Promise<Link[]> {
  const links = await linkRepository
    .createQueryBuilder('link')
    .where({ user: { userId } })
    .leftJoin('link.user', 'user')
    .select([
      'link.linkId',
      'link.originalUrl',
      'link.numHits',
      'link.lastAccessedOn',
      'user.userId',
      'user.username',
      'user.isPro',
      'user.isAdmin',
    ])
    .getMany();

  return links;
}

async function deleteLinkById(linkId: string): Promise<void> {
  await linkRepository.delete({ linkId });
}

export {
  getLinkById,
  createLinkId,
  createNewLink,
  updateLinkVisits,
  getLinksByUserId,
  getLinksByUserIdForOwnAccount,
  deleteLinkById,
};
