import { User, type IUser } from '../models/User';

let cachedUserId: string | null = null;

export async function getOrCreateDefaultInspector(): Promise<IUser> {
  if (cachedUserId) {
    const existing = await User.findById(cachedUserId);
    if (existing) return existing;
  }

  let user = await User.findOne({ email: 'inspector@onionq.agri.gov.in' });
  if (!user) {
    user = await User.create({
      name: 'Rajesh Patil',
      email: 'inspector@onionq.agri.gov.in',
      passwordHash: 'seeded_local_dev_hash',
      role: 'inspector',
      isActive: true,
    });
  }

  cachedUserId = user._id.toString();
  return user;
}
