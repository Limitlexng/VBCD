import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env['DB_HOST'] || 'localhost',
    port: parseInt(process.env['DB_PORT'] || '5432', 10),
    username: process.env['DB_USERNAME'] || 'berryx',
    password: process.env['DB_PASSWORD'] || 'berryx_password',
    database: process.env['DB_NAME'] || 'berryx_db',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    migrationsRun: false,
    synchronize: process.env['NODE_ENV'] === 'development',
    logging: process.env['DB_LOGGING'] === 'true',
    ssl:
      process.env['DB_SSL'] === 'true'
        ? { rejectUnauthorized: false }
        : false,
    poolSize: parseInt(process.env['DB_POOL_SIZE'] || '20', 10),
    connectTimeoutMS: 10000,
    extra: {
      max: parseInt(process.env['DB_POOL_SIZE'] || '20', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    },
  }),
);
