import Role from "../modules/role/role.model";
import User from "../modules/user/user.model";

export const seedSuperAdmin = async () => {
  let superAdminRole = await Role.findOne({ code: "SUPER_ADMIN" });

  if (!superAdminRole) {
    superAdminRole = await Role.create({
      name: "Super Admin",
      code: "SUPER_ADMIN",
      permissions: {
        dashboard: { view: true },
        user: { view: true, create: true, edit: true, delete: true },
        role: { view: true, create: true, edit: true, delete: true },
      },
    });
    console.log("Super Admin role created");
  }

  const existingUser = await User.findOne({ email: "admin@elora.com" });
  if (existingUser) {
    console.log("ℹSuper Admin user already exists");
    return;
  }

  await User.create({
    name: "Super Admin",
    email: "admin@elora.com",
    password: "Admin@123",
    role: superAdminRole._id,
  });

  console.log("Super Admin user seeded");
};
