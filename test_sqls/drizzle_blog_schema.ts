// ============================================
// Drizzle Schema: Blog Platform
// ============================================
// Tables: users, roles, posts, comments, tags, post_tags
// FKs: posts → users, comments → posts, comments → users,
//      post_tags → posts, post_tags → tags, users → roles

import {
  pgTable,
  integer,
  serial,
  varchar,
  text,
  boolean,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  description: text('description'),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  roleId: integer('role_id').notNull().references(() => roles.id),
  bio: text('bio'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull(),
});

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  body: text('body'),
  authorId: integer('author_id').notNull().references(() => users.id),
  published: boolean('published').notNull().default(false),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').notNull(),
});

export const comments = pgTable('comments', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  postId: uuid('post_id').notNull().references(() => posts.id),
  authorId: integer('author_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull(),
});

export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  color: varchar('color', { length: 7 }),
});

export const postTags = pgTable('post_tags', {
  postId: uuid('post_id').notNull().references(() => posts.id),
  tagId: integer('tag_id').notNull().references(() => tags.id),
});
