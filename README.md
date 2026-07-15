# @averildwi/nest-prisma

[![npm version](https://img.shields.io/npm/v/@averildwi/nest-prisma.svg)](https://www.npmjs.com/package/@averildwi/nest-prisma)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![NestJS](https://img.shields.io/badge/NestJS-v11-red)](https://nestjs.com)

A CLI scaffolder that sets up [Prisma ORM](https://www.prisma.io/) 7 with Driver
Adapter inside a [NestJS](https://nestjs.com/) project in a single interactive command.
Built to avoid the repetitive manual setup (install client, driver adapter, run
`prisma init`, write `PrismaModule`/`PrismaService`, register into `AppModule`)
every time you start a new backend.

## Installation

```bash
npx @averildwi/nest-prisma
```

### Peer dependencies

This package doesn't bundle its dependencies — the CLI installs them into
your project automatically based on the database you choose:

```bash
# installed automatically depending on your choice
npm install @prisma/client prisma
npm install @prisma/adapter-pg pg          # if PostgreSQL
npm install @prisma/adapter-mysql2 mysql2  # if MySQL/MariaDB
```

> You just need Node.js ≥ 18 and an existing NestJS project (must have a
> `src/` folder) — no other setup required beforehand.

## Package Contents

| Folder/File | Contents | Purpose |
|---|---|---|
| `templates/prisma/prisma.service.ts` | `PrismaService` | Extends `PrismaClient`, wires the chosen driver adapter, connects on `onModuleInit` |
| `templates/prisma/prisma.module.ts` | `PrismaModule` | Exposes `PrismaService` for dependency injection across your app |
| `generate.js` | CLI entrypoint | Interactive prompts, installs deps, patches `schema.prisma`, injects files, registers module |

## Quick Start

### 1. Run the scaffolder

```bash
npx @averildwi/nest-prisma
```

You'll be prompted for:

| Prompt | Options |
|---|---|
| Prisma ORM version | Stable (7.8.0) — Production Ready with Driver Adapter |
| Database provider | PostgreSQL / MySQL, Percona, MariaDB |
| Auto-run `prisma generate`? | Yes / No |

### 2. Fill in your `.env`

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
```

### 3. Use in a service

```typescript
// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
// Generated automatically in src/prisma
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany();
  }
}
```

`PrismaModule` is already auto-registered into `src/app.module.ts`, so
`PrismaService` is injectable anywhere without extra wiring.

## What Gets Generated

```typescript
// src/prisma/prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

```typescript
// Automatically added to src/app.module.ts
@Module({
  imports: [
    PrismaModule,
    // ...your other modules
  ],
})
export class AppModule {}
```

## Scaffold Flow

```
npx @averildwi/nest-prisma
   │
   ▼
[1/5] Install @prisma/client + prisma + matching driver adapter
   │
   ▼
[2/5] Run "prisma init" → patch schema.prisma for Driver Adapter
   │
   ▼
[3/5] Generate src/prisma/prisma.service.ts + prisma.module.ts
   │
   ▼
[4/5] Register PrismaModule into src/app.module.ts
   │
   ▼
[5/5] (optional) Run "prisma generate"
   │
   ▼
Done — inject PrismaService anywhere via DI
```

## Important Notes

- **Idempotent by design.** If `prisma/`, `src/prisma/*`, or `PrismaModule`
  already exist, the related step is skipped with a warning instead of
  overwriting your files.
- **`schema.prisma` patching** uses a whitespace-tolerant regex. If it can't
  find the expected pattern (e.g. you're on a very different Prisma
  version), it leaves the file untouched and warns you to check manually.
- **`app.module.ts` auto-registration** expects a standard `imports: [...]`
  array. If your module structure is nonstandard, the CLI prints manual
  instructions instead of guessing.
- Currently only supports **PostgreSQL** and **MySQL/MariaDB** as providers.
- Not yet tested with `pnpm`/`yarn` — NPM is assumed.

## License

MIT License