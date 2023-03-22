import { Entity, PrimaryColumn, Column, ManyToOne, Relation } from 'typeorm';
import { User } from './User';

@Entity()
export class Link {
  @PrimaryColumn('uuid')
  linkId: string;

  @Column()
  originalURL: string;

  @Column()
  lastAccessedOn: Date;

  @Column()
  numHits: number;

  @ManyToOne(() => User, (user) => user.link)
  user: Relation<User>[];
}
