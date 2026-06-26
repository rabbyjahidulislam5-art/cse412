/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Smart Campus App — Database Seed Script
 * Run with: npx prisma db seed
 *
 * Creates:
 *  - 4 roles of demo users (Student, Admin, Library, Shop Owner)
 *  - Wallets for each user
 *  - Sample books
 *  - A sample merchant
 *  - Sample notification
 */
import { PrismaClient, UserRole, UserStatus, KYCStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const P = (paisa: number) => BigInt(paisa);

async function main() {
  console.log('🌱 Seeding Smart Campus database...');

  // ── Hash passwords ────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // ── Create Users ──────────────────────────────────────────
  const [student, admin, librarian, shopOwner] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'student@ewubd.edu' },
      update: {},
      create: {
        email: 'student@ewubd.edu',
        fullName: 'Tanvir Ahmed',
        studentId: '2023-2-60-001',
        passwordHash,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        kycStatus: KYCStatus.APPROVED,
        phone: '+8801711111111',
        department: 'CSE',
        program: 'BSc in Computer Science',
      },
    }),
    prisma.user.upsert({
      where: { email: 'admin@ewubd.edu' },
      update: {},
      create: {
        email: 'admin@ewubd.edu',
        fullName: 'Dr. Rahman Chowdhury',
        studentId: 'ADMIN-001',
        passwordHash,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        kycStatus: KYCStatus.APPROVED,
        phone: '+8801722222222',
        department: 'Administration',
      },
    }),
    prisma.user.upsert({
      where: { email: 'library@ewubd.edu' },
      update: {},
      create: {
        email: 'library@ewubd.edu',
        fullName: 'Nusrat Jahan',
        studentId: 'LIB-001',
        passwordHash,
        role: UserRole.LIBRARY_STAFF,
        status: UserStatus.ACTIVE,
        kycStatus: KYCStatus.APPROVED,
        phone: '+8801733333333',
        department: 'Library',
      },
    }),
    prisma.user.upsert({
      where: { email: 'shop@ewubd.edu' },
      update: {},
      create: {
        email: 'shop@ewubd.edu',
        fullName: 'Karim Uddin',
        studentId: 'SHOP-001',
        passwordHash,
        role: UserRole.SHOP_OWNER,
        status: UserStatus.ACTIVE,
        kycStatus: KYCStatus.APPROVED,
        phone: '+8801744444444',
        department: 'Cafeteria',
      },
    }),
  ]);

  console.log('✅ Users created');

  // ── Create Wallets ────────────────────────────────────────
  const wallets = await Promise.all([
    prisma.wallet.upsert({
      where: { userId: student.id },
      update: {},
      create: { userId: student.id, balance: P(500000), dailyTopupUsed: P(0), dailyTransferUsed: P(0) },
    }),
    prisma.wallet.upsert({
      where: { userId: shopOwner.id },
      update: {},
      create: { userId: shopOwner.id, balance: P(0), dailyTopupUsed: P(0), dailyTransferUsed: P(0) },
    }),
  ]);
  console.log('✅ Wallets created');

  // ── Create Merchant ───────────────────────────────────────
  const merchant = await prisma.merchant.upsert({
    where: { userId: shopOwner.id },
    update: {},
    create: {
      userId: shopOwner.id,
      walletId: wallets[1].id,
      shopName: 'EWU Central Cafeteria',
      category: 'CAFETERIA',
      contactPhone: '+8801744444444',
      location: 'Campus Ground Floor, Bhaban A',
      merchantCode: 'EWU-CAF-001',
      status: 'ACTIVE',
      settlementBalance: P(0),
      pendingBalance: P(0),
      lifetimeRevenue: P(0),
      commissionRate: P(0), // commission stored in basis points; 0 = no commission
    },
  });
  console.log('✅ Merchant created');

  // ── Create Sample Books ───────────────────────────────────
  const books = [
    { isbn: '9780132350884', title: 'Clean Code', author: 'Robert C. Martin', copies: 5, category: 'Software Engineering' },
    { isbn: '9780201616224', title: 'The Pragmatic Programmer', author: 'Andrew Hunt', copies: 3, category: 'Software Engineering' },
    { isbn: '9780134494166', title: 'Clean Architecture', author: 'Robert C. Martin', copies: 4, category: 'Software Engineering' },
    { isbn: '9781449331818', title: 'Learning React', author: 'Alex Banks', copies: 6, category: 'Web Development' },
    { isbn: '9781491950357', title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', copies: 2, category: 'Databases' },
    { isbn: '9780321125217', title: 'Domain-Driven Design', author: 'Eric Evans', copies: 3, category: 'Software Architecture' },
    { isbn: '9780596007126', title: 'Head First Design Patterns', author: 'Eric Freeman', copies: 4, category: 'Software Engineering' },
    { isbn: '9780135957059', title: 'The Clean Coder', author: 'Robert C. Martin', copies: 2, category: 'Professional Development' },
  ];

  for (const b of books) {
    await prisma.book.upsert({
      where: { isbn: b.isbn },
      update: {},
      create: {
        isbn: b.isbn,
        title: b.title,
        author: b.author,
        totalCopies: b.copies,
        availableCopies: b.copies,
        category: b.category,
        shelfLocation: `A-${Math.floor(Math.random() * 20) + 1}`,
      },
    });
  }
  console.log(`✅ ${books.length} Books created`);

  // ── Welcome Notification ──────────────────────────────────
  await prisma.notification.upsert({
    where: { id: 'seed-notif-001' },
    update: {},
    create: {
      id: 'seed-notif-001',
      userId: student.id,
      type: 'SYSTEM',
      channel: 'IN_APP',
      status: 'SENT',
      title: 'Welcome to Smart Campus! 🎉',
      message: 'Your wallet has been credited with ৳5,000 as a welcome bonus. Start exploring the app!',
    },
  });
  console.log('✅ Notifications created');

  console.log('\n─────────────────────────────────────────');
  console.log('🌱 Seed complete! Demo credentials:');
  console.log('─────────────────────────────────────────');
  console.log('👨‍🎓 Student:   student@ewubd.edu / Password123!');
  console.log('👨‍💼 Admin:     admin@ewubd.edu   / Password123!');
  console.log('📚 Library:  library@ewubd.edu / Password123!');
  console.log('🏪 Shop:     shop@ewubd.edu    / Password123!');
  console.log('─────────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
