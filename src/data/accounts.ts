// Placeholder accounts so the prototype can show the sign-in path. Any other email signs up.
import type { ImageSourcePropType } from 'react-native';
import { PLACEHOLDER } from './placeholders';

export type Account = {
  email: string;
  name: string;
  password: string;
  /** A bundled image. */
  photo?: ImageSourcePropType;
};

export const DEMO_ACCOUNTS: Account[] = [
  {
    email: 'demo@borp.org',
    name: 'Jesslyn Ruswan',
    password: 'Trails2026!',
    photo: PLACEHOLDER.avatar,
  },
];

export const findAccount = (email: string) =>
  DEMO_ACCOUNTS.find(a => a.email.toLowerCase() === email.trim().toLowerCase());
