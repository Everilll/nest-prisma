import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '__CLIENT_IMPORT_PATH__';
import { __ADAPTER_CLASS__ } from '__ADAPTER_IMPORT__';
import { __POOL_CLASS__ } from '__POOL_IMPORT__';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const pool = new __POOL_CLASS__({ 
      connectionString: process.env.DATABASE_URL 
    });
    const adapter = new __ADAPTER_CLASS__(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
