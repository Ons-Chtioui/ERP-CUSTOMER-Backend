import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../app.module';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { User } from '../users/entities/user.entity';

// ─── Liste complète des permissions ──────────────────────────────────────────
const ALL_PERMISSIONS = [
  // Utilisateurs
  { nom: 'users.view',        module: 'Utilisateurs', action: 'Consulter' },
  { nom: 'users.create',      module: 'Utilisateurs', action: 'Créer compte' },
  { nom: 'users.edit',        module: 'Utilisateurs', action: 'Modifier' },
  { nom: 'users.delete',      module: 'Utilisateurs', action: 'Supprimer' },
  { nom: 'users.roles',       module: 'Utilisateurs', action: 'Gérer rôles' },
  { nom: 'users.permissions', module: 'Utilisateurs', action: 'Gérer permissions' },

  // Stock / Composants
  { nom: 'stock.view',        module: 'Stock', action: 'Consulter' },
  { nom: 'stock.create',      module: 'Stock', action: 'Créer entrée' },
  { nom: 'stock.edit',        module: 'Stock', action: 'Modifier' },
  { nom: 'stock.delete',      module: 'Stock', action: 'Supprimer' },
  { nom: 'stock.transfer',    module: 'Stock', action: 'Transfert entrepôt' },
  { nom: 'stock.alert',       module: 'Stock', action: 'Gérer alertes' },
  { nom: 'stock.inventory',   module: 'Stock', action: 'Gérer inventaire' },

  // BOM
  { nom: 'bom.view',          module: 'BOM', action: 'Consulter' },
  { nom: 'bom.create',        module: 'BOM', action: 'Créer nomenclature' },
  { nom: 'bom.edit',          module: 'BOM', action: 'Modifier' },

  // Commandes
  { nom: 'orders.view',       module: 'Commandes', action: 'Consulter' },
  { nom: 'orders.create',     module: 'Commandes', action: 'Créer' },
  { nom: 'orders.validate',   module: 'Commandes', action: 'Valider' },
  { nom: 'orders.cancel',     module: 'Commandes', action: 'Annuler' },

  // Commercial
  { nom: 'invoices.view',     module: 'Commercial', action: 'Voir factures' },
  { nom: 'invoices.create',   module: 'Commercial', action: 'Créer facture' },
  { nom: 'quotes.create',     module: 'Commercial', action: 'Créer devis' },
  { nom: 'credits.create',    module: 'Commercial', action: 'Émettre avoir' },

  // Rapports
  { nom: 'reports.view',      module: 'Rapports', action: 'Consulter' },
  { nom: 'reports.export',    module: 'Rapports', action: 'Exporter' },
];

const ALL_NOMS = ALL_PERMISSIONS.map((p) => p.nom);

// ─── Permissions par rôle ─────────────────────────────────────────────────────
const ROLES_DEF = [
  {
    nom: 'super_admin',
    label: 'Super Admin',
    perms: ALL_NOMS, // toutes les permissions
  },
  {
    nom: 'admin',
    label: 'Admin Société',
    perms: ALL_NOMS.filter((n) => n !== 'users.delete'),
  },
  {
    nom: 'resp_stock',
    label: 'Resp. Stock',
    perms: [
      'stock.view', 'stock.create', 'stock.edit', 'stock.delete',
      'stock.transfer', 'stock.alert', 'stock.inventory',
      'bom.view', 'bom.create', 'bom.edit',
    ],
  },
  {
    nom: 'resp_commercial',
    label: 'Resp. Commercial',
    perms: [
      'orders.view', 'orders.create', 'orders.validate', 'orders.cancel',
      'invoices.view', 'invoices.create', 'quotes.create',
      'bom.view', 'reports.view',
      'stock.view',
    ],
  },
  {
    nom: 'comptable',
    label: 'Comptable',
    perms: [
      'invoices.view', 'credits.create',
      'reports.view', 'reports.export',
    ],
  },
  {
    nom: 'operateur',
    label: 'Opérateur',
    perms: [
      'stock.view', 'stock.inventory',
      'orders.view',
    ],
  },
];

// ─── Seed ─────────────────────────────────────────────────────────────────────
async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const permRepo = app.get(getRepositoryToken(Permission));
  const roleRepo = app.get(getRepositoryToken(Role));
  const userRepo = app.get(getRepositoryToken(User));

  // 1. Upsert des permissions (créer si absent)
  console.log('🌱 Création/mise à jour des permissions...');
  const savedPerms: Permission[] = [];
  for (const p of ALL_PERMISSIONS) {
    let perm = await permRepo.findOne({ where: { nom: p.nom } });
    if (!perm) {
      perm = await permRepo.save(permRepo.create(p));
      console.log(`   + ${p.nom}`);
    }
    savedPerms.push(perm);
  }
  const permMap = Object.fromEntries(savedPerms.map((p) => [p.nom, p]));

  // 2. Upsert des rôles (créer si absent, mettre à jour les permissions si existant)
  console.log('\n🌱 Création/mise à jour des rôles...');
  for (const r of ROLES_DEF) {
    const permsForRole = r.perms.map((n) => permMap[n]).filter(Boolean);

    let role = await roleRepo.findOne({
      where: { nom: r.nom },
      relations: { permissions: true },
    });

    if (!role) {
      role = roleRepo.create({ nom: r.nom, label: r.label, permissions: permsForRole });
      await roleRepo.save(role);
      console.log(`   + Rôle créé : ${r.label} (${permsForRole.length} permissions)`);
    } else {
      // Mettre à jour les permissions du rôle existant
      role.permissions = permsForRole;
      await roleRepo.save(role);
      console.log(`   ↺ Rôle mis à jour : ${r.label} (${permsForRole.length} permissions)`);
    }
  }

  // 3. Super Admin user
  console.log('\n🌱 Vérification du Super Admin...');
  const superRole = await roleRepo.findOne({
    where: { nom: 'super_admin' },
    relations: { permissions: true },
  });

  const existing = await userRepo.findOne({ where: { email: 'admin@erp.com' } });
  if (!existing) {
    const hashedPwd = await bcrypt.hash('Admin@1234', 12);
    await userRepo.save(
      userRepo.create({
        nom: 'Admin',
        prenom: 'Super',
        email: 'admin@erp.com',
        password: hashedPwd,
        role: superRole!,
        isActive: true,
        emailVerifiedAt: new Date(),
      }),
    );
    console.log('   + Super Admin créé : admin@erp.com / Admin@1234');
  } else {
    // S'assurer que le super_admin a bien le bon rôle
    await userRepo.update(existing.id, { role: superRole! });
    console.log('   ✓ Super Admin existant — rôle mis à jour');
  }

  console.log('\n✅ Seed terminé avec succès !');
  console.log('   Email    : admin@erp.com');
  console.log('   Password : Admin@1234');
  console.log('   ⚠️  Changez ce mot de passe après le premier login !');

  await app.close();
}

seed().catch((err) => {
  console.error('❌ Erreur seed :', err);
  process.exit(1);
});
