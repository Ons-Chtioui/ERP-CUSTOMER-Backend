"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const typeorm_1 = require("@nestjs/typeorm");
const bcrypt = __importStar(require("bcrypt"));
const app_module_1 = require("../app.module");
const role_entity_1 = require("../roles/entities/role.entity");
const permission_entity_1 = require("../permissions/entities/permission.entity");
const user_entity_1 = require("../users/entities/user.entity");
const ALL_PERMISSIONS = [
    { nom: 'users.view', module: 'Utilisateurs', action: 'Consulter' },
    { nom: 'users.create', module: 'Utilisateurs', action: 'Créer compte' },
    { nom: 'users.edit', module: 'Utilisateurs', action: 'Modifier' },
    { nom: 'users.delete', module: 'Utilisateurs', action: 'Supprimer' },
    { nom: 'users.roles', module: 'Utilisateurs', action: 'Gérer rôles' },
    { nom: 'stock.view', module: 'Stock', action: 'Consulter' },
    { nom: 'stock.create', module: 'Stock', action: 'Créer entrée' },
    { nom: 'stock.edit', module: 'Stock', action: 'Modifier' },
    { nom: 'stock.delete', module: 'Stock', action: 'Supprimer' },
    { nom: 'stock.transfer', module: 'Stock', action: 'Transfert entrepôt' },
    { nom: 'bom.view', module: 'BOM', action: 'Consulter' },
    { nom: 'bom.create', module: 'BOM', action: 'Créer nomenclature' },
    { nom: 'bom.edit', module: 'BOM', action: 'Modifier' },
    { nom: 'orders.view', module: 'Commandes', action: 'Consulter' },
    { nom: 'orders.create', module: 'Commandes', action: 'Créer' },
    { nom: 'orders.validate', module: 'Commandes', action: 'Valider' },
    { nom: 'orders.cancel', module: 'Commandes', action: 'Annuler' },
    { nom: 'invoices.view', module: 'Commercial', action: 'Voir factures' },
    { nom: 'invoices.create', module: 'Commercial', action: 'Créer facture' },
    { nom: 'quotes.create', module: 'Commercial', action: 'Créer devis' },
    { nom: 'credits.create', module: 'Commercial', action: 'Émettre avoir' },
    { nom: 'reports.view', module: 'Rapports', action: 'Consulter' },
    { nom: 'reports.export', module: 'Rapports', action: 'Exporter' },
    { nom: 'stock.transfer', module: 'Stock', action: 'Transfert entrepôt' },
    { nom: 'stock.alert', module: 'Stock', action: 'Gérer alertes' },
    { nom: 'stock.inventory', module: 'Stock', action: 'Gérer inventaire' },
];
const ALL_NOMS = ALL_PERMISSIONS.map((p) => p.nom);
const ROLES_DEF = [
    { nom: 'super_admin', label: 'Super Admin', perms: ALL_NOMS },
    { nom: 'admin', label: 'Admin Société', perms: ALL_NOMS.filter(n => n !== 'users.delete') },
    { nom: 'resp_stock', label: 'Resp. Stock', perms: ['stock.view', 'stock.create', 'stock.edit', 'stock.delete', 'stock.transfer', 'bom.view', 'bom.create', 'bom.edit'] },
    { nom: 'resp_commercial', label: 'Resp. Commercial', perms: ['orders.view', 'orders.create', 'orders.validate', 'orders.cancel', 'invoices.view', 'invoices.create', 'quotes.create', 'bom.view', 'reports.view'] },
    { nom: 'comptable', label: 'Comptable', perms: ['invoices.view', 'credits.create', 'reports.view', 'reports.export'] },
    { nom: 'operateur', label: 'Opérateur', perms: ['stock.view', 'orders.view'] },
];
async function seed() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const permRepo = app.get((0, typeorm_1.getRepositoryToken)(permission_entity_1.Permission));
    const roleRepo = app.get((0, typeorm_1.getRepositoryToken)(role_entity_1.Role));
    const userRepo = app.get((0, typeorm_1.getRepositoryToken)(user_entity_1.User));
    console.log('🌱 Création des permissions...');
    const savedPerms = [];
    for (const p of ALL_PERMISSIONS) {
        let perm = await permRepo.findOne({ where: { nom: p.nom } });
        if (!perm)
            perm = await permRepo.save(permRepo.create(p));
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
        await userRepo.save(userRepo.create({
            nom: 'Admin',
            prenom: 'Super',
            email: 'admin@erp.com',
            password: hashedPwd,
            role: superRole,
            isActive: true,
            emailVerifiedAt: new Date(),
        }));
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
//# sourceMappingURL=seed.js.map