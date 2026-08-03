import { PrismaClient, Role as PrismaRoleEnum } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du script de seed...');

  // 1. Création des Permissions
  const permissionsData = [
    { name: 'users.view', description: 'Voir la liste des utilisateurs' },
    { name: 'users.create', description: 'Créer un utilisateur' },
    { name: 'users.update', description: 'Modifier un utilisateur' },
    { name: 'users.delete', description: 'Supprimer un utilisateur' },
    { name: 'users.reset_pin', description: 'Réinitialiser le PIN' },
    
    { name: 'roles.view', description: 'Voir les rôles' },
    { name: 'roles.update', description: 'Modifier les rôles et permissions' },
    
    { name: 'logs.view', description: 'Voir les logs d\'audit et de connexion' },
    
    { name: 'agencies.manage', description: 'Gérer les agences' },
    { name: 'operations.manage', description: 'Gérer toutes les opérations' },
    { name: 'operations.create', description: 'Créer une opération' },
    { name: 'operations.validate', description: 'Valider une opération' },
  ];

  const permissions: Record<string, any> = {};
  for (const perm of permissionsData) {
    const p = await prisma.permission.upsert({
      where: { name: perm.name },
      update: { description: perm.description },
      create: perm,
    });
    permissions[p.name] = p;
  }
  console.log('✅ Permissions vérifiées/créées');

  // 2. Création des Rôles
  const rolesData = [
    { name: 'PDG', description: 'Super Administrateur avec tous les droits', enumValue: PrismaRoleEnum.PDG },
    { name: 'DGA', description: 'Directeur Général Adjoint', enumValue: PrismaRoleEnum.DGA },
    { name: 'CHEF_AGENCE', description: 'Chef d\'Agence', enumValue: PrismaRoleEnum.CHEF_AGENCE },
    { name: 'COMPTABLE', description: 'Comptable', enumValue: PrismaRoleEnum.COMPTABLE },
    { name: 'CAISSIER', description: 'Caissier', enumValue: PrismaRoleEnum.CAISSIER },
    { name: 'SECRETAIRE', description: 'Secrétaire', enumValue: PrismaRoleEnum.SECRETAIRE },
    { name: 'AGENT', description: 'Agent Standard', enumValue: PrismaRoleEnum.AUTRE },
  ];

  const roles: Record<string, any> = {};
  for (const r of rolesData) {
    const role = await prisma.appRole.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: { name: r.name, description: r.description },
    });
    roles[r.name] = role;
  }
  console.log('✅ Rôles vérifiés/créés');

  // 3. Assignation des permissions au PDG
  for (const permName of Object.keys(permissions)) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roles['PDG'].id,
          permissionId: permissions[permName].id,
        },
      },
      update: {},
      create: {
        roleId: roles['PDG'].id,
        permissionId: permissions[permName].id,
      },
    });
  }
  console.log('✅ Permissions assignées au PDG');

  // 4. Création du compte Super Administrateur (PDG)
  const pin = '250772';
  const saltRounds = 10;
  const pinHash = await bcrypt.hash(pin, saltRounds);

  const pdgUser = await prisma.user.upsert({
    where: { email: 'pdg@rex.com' }, // Utilisation d'un email fictif unique
    update: {
      nom: 'Harouna',
      prenom: 'Mamadou',
      role: PrismaRoleEnum.PDG,
      roleId: roles['PDG'].id,
      pinHash: pinHash,
      isActive: true,
    },
    create: {
      email: 'pdg@rex.com', // Pseudo email unique
      nom: 'Harouna',
      prenom: 'Mamadou',
      role: PrismaRoleEnum.PDG,
      roleId: roles['PDG'].id,
      pinHash: pinHash,
      isActive: true,
    },
  });
  console.log(`✅ Utilisateur Super Administrateur créé/mis à jour (ID: ${pdgUser.id})`);

  console.log('🎉 Seed terminé avec succès !');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
