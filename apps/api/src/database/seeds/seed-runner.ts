import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { ALL_ENTITIES } from '../database.module';
import { seedFeatureFlags } from './feature-flags.seed';
import { seedProviders } from './providers.seed';
import { seedAdminUser } from './admin-user.seed';

config();

const configService = new ConfigService();

const dataSource = new DataSource({
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get<number>('DB_PORT', 5432),
  username: configService.get('DB_USERNAME', 'berryx'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_NAME', 'berryx_db'),
  entities: ALL_ENTITIES,
  synchronize: false,
  ssl: configService.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
});

async function runSeeds() {
  console.log('🌱 Connecting to database...');
  await dataSource.initialize();
  console.log('✅ Connected\n');

  try {
    await seedFeatureFlags(dataSource);
    await seedProviders(dataSource);
    await seedAdminUser(dataSource);
    console.log('\n✅ All seeds completed successfully');
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

runSeeds();
