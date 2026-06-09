import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../app.module';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { User } from '../users/entities/user.entity';

const ALL_PERMISSIONS = [
  { nom: 'users.view',      module: 'Utilisateurs', action: 'Consulter' },
  { nom: 'users.create',    module: 'Utilisateurs', action: 'Créer compte' },
  { nom: 'users.edit',      module: 'Utilisateurs', action: 'Modifier' },
  { nom: 'users.delete',    module: 'Utilisateurs', action: 'Supprimer' },
  { nom: 'users.roles',     module: 'Utilisateurs', action: 'Gérer rôles' },
  { nom: 'stock.view',      module: 'Stock',        action: 'Consulter' },
  { nom: 'stock.create',    module: 'Stock',        action: 'Créer entrée' },
  { nom: 'stock.edit',      module: 'Stock',        action: 'Modifier' },
  { nom: 'stock.delete',    module: 'Stock',        action: 'Supprimer' },
  { nom: 'stock.transfer',  module: 'Stock',        action: 'Transfert entrepôt' },
  { nom: 'bom.view',        module: 'BOM',          action: 'Consulter' },
  { nom: 'bom.create',      module: 'BOM',          action: 'Créer nomenclature' },
  { nom: 'bom.edit',        module: 'BOM',          action: 'Modifier' },
  { nom: 'orders.view',     module: 'Commandes',    action: 'Consulter' },
  { nom: 'orders.create',   module: 'Commandes',    action: 'Créer' },
  { nom: 'orders.validate', module: 'Commandes',    action: 'Valider' },
  { nom: 'orders.cancel',   module: 'Commandes',    action: 'Annuler' },
  { nom: 'invoices.view',   module: 'Commercial',   action: 'Voir factures' },
  { nom: 'invoices.create', module: 'Commercial',   action: 'Créer facture' },
  { nom: 'quotes.create',   module: 'Commercial',   action: 'Créer devis' },
  { nom: 'credits.create',  module: 'Commercial',   action: 'Émettre avoir' },
  { nom: 'reports.view',    module: 'Rapports',     action: 'Consulter' },
  { nom: 'reports.export',  module: 'Rapports',     action: 'Exporter' },
  // Ajouter dans src/database/seed.ts — tableau ALL_PERMISSIONS :
{ nom: 'stock.transfer',  module: 'Stock', action: 'Transfert entrepôt' },
{ nom: 'stock.alert',     module: 'Stock', action: 'Gérer alertes' },
{ nom: 'stock.inventory', module: 'Stock', action: 'Gérer inventaire' },
];

const ALL_NOMS = ALL_PERMISSIONS.map((p) => p.nom);

const ROLES_DEF = [
  { nom: 'super_admin',     label: 'Super Admin',      perms: ALL_NOMS },
  { nom: 'admin',           label: 'Admin Société',    perms: ALL_NOMS.filter(n => n !== 'users.delete') },
  { nom: 'resp_stock',      label: 'Resp. Stock',      perms: ['stock.view','stock.create','stock.edit','stock.delete','stock.transfer','bom.view','bom.create','bom.edit'] },
  { nom: 'resp_commercial', label: 'Resp. Commercial', perms: ['orders.view','orders.create','orders.validate','orders.cancel','invoices.view','invoices.create','quotes.create','bom.view','reports.view'] },
  { nom: 'comptable',       label: 'Comptable',        perms: ['invoices.view','credits.create','reports.view','reports.export'] },
  { nom: 'operateur',       label: 'Opérateur',        perms: ['stock.view','orders.view'] },
];

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const permRepo = app.get(getRepositoryToken(Permission));
  const roleRepo = app.get(getRepositoryToken(Role));
  const userRepo = app.get(getRepositoryToken(User));

  console.log('🌱 Création des permissions...');
  const savedPerms: Permission[] = [];
  for (const p of ALL_PERMISSIONS) {
    let perm = await permRepo.findOne({ where: { nom: p.nom } });
    if (!perm) perm = await permRepo.save(permRepo.create(p));
    savedPerms.push(perm);
  }
  const permMap = Object.fromEntries(savedPerms.map((p) => [p.nom, p]));

  console.log('🌱 Création des rôles...');
  for (const r of ROLES_DEF) {
    let role = await roleRepo.findOne({ where: { nom: r.nom } });
    if (!role) {
      role = roleRepo.create({
        nom: r.nom,
        label: r.label,
        permissions: r.perms.map((n) => permMap[n]).filter(Boolean),
      });
      await roleRepo.save(role);
    }
  }

  console.log('🌱 Création du Super Admin...');
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
  }

  console.log('\n[OK] Seed termine avec succes !');
  console.log('   Email    : admin@erp.com');
  console.log('   Password : Admin@1234');
  console.log('   [!] Changez ce mot de passe apres le premier login !');

  await app.close();
}

seed().catch((err) => {
  console.error('[ERREUR] Seed :', err);
  process.exit(1);
});
