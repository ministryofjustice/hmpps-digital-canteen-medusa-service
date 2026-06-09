import { Migration } from '@medusajs/framework/mikro-orm/migrations'

export class Migration202604291530 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "canteen_product" ("id" text not null, "title" text not null, "description" text null, "price" integer not null, "inventory" integer not null, "available" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "canteen_product_pkey" primary key ("id"));`,
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_canteen_product_deleted_at" ON "canteen_product" ("deleted_at") WHERE deleted_at IS NULL;`,
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "canteen_product" cascade;`)
  }
}
