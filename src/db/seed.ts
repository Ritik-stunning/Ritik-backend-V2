import "reflect-metadata";
import { AppDataSource } from "../data-source";
import { Branch } from "../entities/Branch";
import { User, UserRole, UserTeam } from "../entities/User";
import { Doctor } from "../entities/Doctor";
import { AssignmentCursor } from "../entities/AssignmentCursor";
import { logger } from "../utils/logger";

export async function seed() {
  await AppDataSource.initialize();
  logger.info("Database initialized for seeding");

  const branchRepo = AppDataSource.getRepository(Branch);
  const userRepo = AppDataSource.getRepository(User);
  const doctorRepo = AppDataSource.getRepository(Doctor);
  const cursorRepo = AppDataSource.getRepository(AssignmentCursor);

  // 1. Seed Branches
  const branchesData = [
    {
      name: "South Extension",
      code: "SOUTH_EXT",
      address: "South Extension Part 2, New Delhi",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110049",
      phone: "+911140001000",
      timezone: "Asia/Kolkata",
      isActive: true,
    },
    {
      name: "Greater Kailash",
      code: "GK",
      address: "M-Block Market, Greater Kailash 1, New Delhi",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110048",
      phone: "+911140002000",
      timezone: "Asia/Kolkata",
      isActive: true,
    },
  ];

  const branches: Branch[] = [];
  for (const b of branchesData) {
    let branch = await branchRepo.findOne({ where: { code: b.code } });
    if (!branch) {
      branch = await branchRepo.save(branchRepo.create(b));
      logger.info(`Created branch: ${branch.name}`);
    }
    branches.push(branch);
  }

  // 2. Seed Staff Users
  const usersData = [
    {
      email: "harshit@stunningdentistry.in",
      name: "Harshit Raizada",
      role: UserRole.ADMIN,
      team: UserTeam.BOTH,
      branchId: branches[0]?.id,
      isActive: true,
    },
    {
      email: "hod@stunningdentistry.in",
      name: "HOD Lead",
      role: UserRole.HOD,
      team: UserTeam.BOTH,
      branchId: branches[0]?.id,
      isActive: true,
    },
    {
      email: "crm.domestic@stunningdentistry.in",
      name: "CRM Domestic Lead",
      role: UserRole.CRM,
      team: UserTeam.DOMESTIC,
      branchId: branches[0]?.id,
      isActive: true,
    },
    {
      email: "crm.intl@stunningdentistry.in",
      name: "CRM International Lead",
      role: UserRole.CRM,
      team: UserTeam.INTERNATIONAL,
      branchId: branches[1]?.id,
      isActive: true,
    },
  ];

  const users: User[] = [];
  for (const u of usersData) {
    let user = await userRepo.findOne({ where: { email: u.email } });
    if (!user) {
      user = await userRepo.save(userRepo.create(u));
      logger.info(`Created user: ${user.email} (${user.role})`);
    }
    users.push(user);
  }

  // 3. Seed Doctors
  const doctorsData = [
    {
      name: "Dr. Priyank Sethi",
      specialty: "Implantologist & Prosthodontist",
      email: "dr.priyank@stunningdentistry.in",
      phone: "+919876543210",
      primaryBranchId: branches[0]?.id,
      isActive: true,
    },
    {
      name: "Dr. Ananya Sharma",
      specialty: "Orthodontist & Smile Designer",
      email: "dr.ananya@stunningdentistry.in",
      phone: "+919876543211",
      primaryBranchId: branches[1]?.id,
      isActive: true,
    },
  ];

  for (const d of doctorsData) {
    const existing = await doctorRepo.findOne({ where: { email: d.email } });
    if (!existing) {
      const doctor = await doctorRepo.save(doctorRepo.create(d));
      logger.info(`Created doctor: ${doctor.name}`);
    }
  }

  // 4. Seed Assignment Cursors
  const teams = ["domestic", "international"];
  for (const team of teams) {
    const cursor = await cursorRepo.findOne({ where: { team } });
    if (!cursor) {
      await cursorRepo.save(
        cursorRepo.create({ team, lastAssignedUserId: null }),
      );
      logger.info(`Created assignment cursor for team: ${team}`);
    }
  }

  logger.info("Seeding completed successfully");
}

if (require.main === module) {
  seed()
    .then(async () => {
      await AppDataSource.destroy();
      process.exit(0);
    })
    .catch((err) => {
      logger.error({ err }, "Seeding failed");
      process.exit(1);
    });
}
