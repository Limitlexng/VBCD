import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions } from 'typeorm';
import { UserEntity } from '../../database/entities/user.entity';
import { WalletEntity } from '../../database/entities/wallet.entity';
import { UserStatus, UserTier, WalletCurrency, WalletType } from '@berry-x/types';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    @InjectRepository(WalletEntity)
    private readonly walletsRepo: Repository<WalletEntity>,
  ) {}

  async findById(id: string): Promise<UserEntity> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  async findByPhone(phone: string): Promise<UserEntity | null> {
    return this.usersRepo.findOne({ where: { phone } });
  }

  async findByWalletTag(tag: string): Promise<UserEntity | null> {
    const wallet = await this.walletsRepo.findOne({ where: { walletTag: tag } });
    if (!wallet) return null;
    return this.usersRepo.findOne({ where: { id: wallet.userId } });
  }

  async updateProfile(id: string, updates: Partial<UserEntity>): Promise<UserEntity> {
    const safe = { firstName: updates.firstName, lastName: updates.lastName, username: updates.username };
    if (safe.username) {
      const exists = await this.usersRepo.findOne({ where: { username: safe.username } });
      if (exists && exists.id !== id) throw new ConflictException('Username taken');
    }
    await this.usersRepo.update(id, safe);
    return this.findById(id);
  }

  async uploadAvatar(id: string, avatarUrl: string): Promise<UserEntity> {
    await this.usersRepo.update(id, { avatarUrl });
    return this.findById(id);
  }

  async upgradeTier(id: string, tier: UserTier): Promise<UserEntity> {
    await this.usersRepo.update(id, { tier });
    return this.findById(id);
  }

  async updateStatus(id: string, status: UserStatus): Promise<UserEntity> {
    await this.usersRepo.update(id, { status });
    return this.findById(id);
  }

  async searchUsers(query: string, page = 1, limit = 20): Promise<{ users: UserEntity[]; total: number }> {
    const [users, total] = await this.usersRepo.findAndCount({
      where: [
        { email: Like(`%${query}%`) },
        { phone: Like(`%${query}%`) },
        { firstName: Like(`%${query}%`) },
        { lastName: Like(`%${query}%`) },
      ],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { users, total };
  }

  async getUserStats(userId: string) {
    const user = await this.findById(userId);
    const wallets = await this.walletsRepo.find({ where: { userId } });
    return { user, wallets };
  }

  async initializeUserWallets(userId: string): Promise<WalletEntity[]> {
    const created = [];
    const defaultCurrencies = [{ currency: WalletCurrency.NGN, type: WalletType.FIAT }];

    for (const { currency, type } of defaultCurrencies) {
      const exists = await this.walletsRepo.findOne({ where: { userId, currency, type } });
      if (!exists) {
        const wallet = await this.walletsRepo.save({ userId, currency, type, isDefault: true });
        created.push(wallet);
      }
    }
    return created;
  }
}
