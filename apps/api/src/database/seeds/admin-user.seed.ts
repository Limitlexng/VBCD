import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../../modules/users/entities/user.entity';
import { UserRole, UserStatus, UserTier } from '@berry-x/types';

export async function seedAdminUser(dataSource: DataSource) {
  const repo = dataSource.getRepository(UserEntity);
  console.log('👤 Seeding admin user...');

  const email = process.env.ADMIN_SEED_EMAIL || 'admin@berryx.app';
  const existing = await repo.findOne({ where: { email } });

  if (existing) {
    console.log('   ⏭️  Admin user already exists, skipping');
    return;
  }

  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!password) {
    console.warn('   ⚠️  ADMIN_SEED_PASSWORD not set, skipping admin user seed');
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  await repo.save(repo.create({
    email,
    phone: process.env.ADMIN_SEED_PHONE || '+2340000000000',
    firstName: 'Berry',
    lastName: 'Admin',
    passwordHash: hash,
    role: UserRole.SUPER_ADMIN,
    status: UserStatus.ACTIVE,
    tier: UserTier.TIER_3,
    isEmailVerified: true,
    isPhoneVerified: true,
  }));

  console.log(`   ✅ Admin user created: ${email}`);
  console.log('   ⚠️  Change the password immediately after first login!');
}
