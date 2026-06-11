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
const product_category_entity_1 = require("../product-categories/entities/product-category.entity");
const product_entity_1 = require("../products/entities/product.entity");
const bom_line_entity_1 = require("../products/entities/bom-line.entity");
const component_entity_1 = require("../components/entities/component.entity");
const ALL_PERMISSIONS = [
    { nom: 'users.view', module: 'Utilisateurs', action: 'Consulter' },
    { nom: 'users.create', module: 'Utilisateurs', action: 'Créer compte' },
    { nom: 'users.edit', module: 'Utilisateurs', action: 'Modifier' },
    { nom: 'users.delete', module: 'Utilisateurs', action: 'Supprimer' },
    { nom: 'users.roles', module: 'Utilisateurs', action: 'Gérer rôles' },
    { nom: 'users.permissions', module: 'Utilisateurs', action: 'Gérer permissions' },
    { nom: 'stock.view', module: 'Stock', action: 'Consulter' },
    { nom: 'stock.create', module: 'Stock', action: 'Créer entrée' },
    { nom: 'stock.edit', module: 'Stock', action: 'Modifier' },
    { nom: 'stock.delete', module: 'Stock', action: 'Supprimer' },
    { nom: 'stock.transfer', module: 'Stock', action: 'Transfert entrepôt' },
    { nom: 'stock.alert', module: 'Stock', action: 'Gérer alertes' },
    { nom: 'stock.inventory', module: 'Stock', action: 'Gérer inventaire' },
    { nom: 'bom.view', module: 'BOM', action: 'Consulter' },
    { nom: 'bom.create', module: 'BOM', action: 'Créer nomenclature' },
    { nom: 'bom.edit', module: 'BOM', action: 'Modifier' },
    { nom: 'bom.delete', module: 'BOM', action: 'Supprimer' },
    { nom: 'bom.produce', module: 'BOM', action: 'Lancer production' },
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
];
const ALL_NOMS = ALL_PERMISSIONS.map((p) => p.nom);
const ROLES_DEF = [
    {
        nom: 'super_admin',
        label: 'Super Admin',
        perms: ALL_NOMS,
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
            'bom.view', 'bom.create', 'bom.edit', 'bom.produce',
        ],
    },
    {
        nom: 'resp_commercial',
        label: 'Resp. Commercial',
        perms: [
            'orders.view', 'orders.create', 'orders.validate', 'orders.cancel',
            'invoices.view', 'invoices.create', 'quotes.create',
            'bom.view', 'reports.view', 'stock.view',
        ],
    },
    {
        nom: 'comptable',
        label: 'Comptable',
        perms: ['invoices.view', 'credits.create', 'reports.view', 'reports.export'],
    },
    {
        nom: 'operateur',
        label: 'Opérateur',
        perms: ['stock.view', 'stock.inventory', 'orders.view', 'bom.view'],
    },
];
const PRODUCT_CATEGORIES = [
    { nom: 'Mobilier bureau', couleur: '#3B82F6', description: 'Bureaux, chaises, rangements' },
    { nom: 'Sièges', couleur: '#10B981', description: 'Chaises, fauteuils, tabourets' },
    { nom: 'Rangement', couleur: '#F59E0B', description: 'Armoires, étagères, tiroirs' },
];
async function seed() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const permRepo = app.get((0, typeorm_1.getRepositoryToken)(permission_entity_1.Permission));
    const roleRepo = app.get((0, typeorm_1.getRepositoryToken)(role_entity_1.Role));
    const userRepo = app.get((0, typeorm_1.getRepositoryToken)(user_entity_1.User));
    const catProdRepo = app.get((0, typeorm_1.getRepositoryToken)(product_category_entity_1.ProductCategory));
    const productRepo = app.get((0, typeorm_1.getRepositoryToken)(product_entity_1.Product));
    const bomRepo = app.get((0, typeorm_1.getRepositoryToken)(bom_line_entity_1.BomLine));
    const compRepo = app.get((0, typeorm_1.getRepositoryToken)(component_entity_1.Component));
    console.log('\n🌱 Permissions...');
    const savedPerms = [];
    for (const p of ALL_PERMISSIONS) {
        let perm = await permRepo.findOne({ where: { nom: p.nom } });
        if (!perm) {
            perm = await permRepo.save(permRepo.create(p));
            console.log(`   + ${p.nom}`);
        }
        savedPerms.push(perm);
    }
    const permMap = Object.fromEntries(savedPerms.map((p) => [p.nom, p]));
    console.log('\n🌱 Rôles...');
    for (const r of ROLES_DEF) {
        const permsForRole = r.perms.map((n) => permMap[n]).filter(Boolean);
        let role = await roleRepo.findOne({ where: { nom: r.nom }, relations: { permissions: true } });
        if (!role) {
            role = roleRepo.create({ nom: r.nom, label: r.label, permissions: permsForRole });
            await roleRepo.save(role);
            console.log(`   + ${r.label}`);
        }
        else {
            role.permissions = permsForRole;
            await roleRepo.save(role);
            console.log(`   ↺ ${r.label} (${permsForRole.length} permissions)`);
        }
    }
    console.log('\n🌱 Super Admin...');
    const superRole = await roleRepo.findOne({ where: { nom: 'super_admin' }, relations: { permissions: true } });
    const existing = await userRepo.findOne({ where: { email: 'admin@erp.com' } });
    if (!existing) {
        const hashed = await bcrypt.hash('Admin@1234', 12);
        await userRepo.save(userRepo.create({
            nom: 'Admin', prenom: 'Super', email: 'admin@erp.com',
            password: hashed, role: superRole, isActive: true, emailVerifiedAt: new Date(),
        }));
        console.log('   + admin@erp.com créé');
    }
    else {
        await userRepo.update(existing.id, { role: superRole });
        console.log('   ✓ Super Admin existant mis à jour');
    }
    console.log('\n🌱 Catégories produits...');
    const catMap = {};
    for (const c of PRODUCT_CATEGORIES) {
        let cat = await catProdRepo.findOne({ where: { nom: c.nom } });
        if (!cat) {
            cat = await catProdRepo.save(catProdRepo.create(c));
            console.log(`   + ${c.nom}`);
        }
        catMap[c.nom] = cat;
    }
    console.log('\n🌱 Produits exemples...');
    const components = await compRepo.find({ take: 5 });
    if (components.length >= 3) {
        let chaise = await productRepo.findOne({ where: { reference: 'CHAISE-001' } });
        if (!chaise) {
            chaise = await productRepo.save(productRepo.create({
                nom: 'Chaise de bureau',
                reference: 'CHAISE-001',
                description: 'Chaise ergonomique avec assise rembourrée',
                unite: 'unité',
                prixVente: 89.900,
                coutMO: 5.000,
                seuilAlerte: 10,
                category: catMap['Sièges'],
            }));
            console.log('   + Chaise de bureau (CHAISE-001)');
        }
        let chaiseRouge = await productRepo.findOne({ where: { reference: 'CHAISE-001-R' } });
        if (!chaiseRouge) {
            chaiseRouge = await productRepo.save(productRepo.create({
                nom: 'Chaise de bureau - Rouge',
                reference: 'CHAISE-001-R',
                unite: 'unité',
                prixVente: 94.900,
                coutMO: 5.000,
                category: catMap['Sièges'],
                parent: chaise,
            }));
            console.log('   + Chaise de bureau - Rouge (CHAISE-001-R)');
        }
        const existingBom = await bomRepo.find({ where: { product: { id: chaise.id } } });
        if (existingBom.length === 0) {
            const bomLines = [
                { product: chaise, component: components[0], quantity: 4 },
                { product: chaise, component: components[1], quantity: 1 },
                { product: chaise, component: components[2], quantity: 8 },
            ];
            for (const line of bomLines) {
                await bomRepo.save(bomRepo.create(line));
            }
            console.log(`   + BOM Chaise (${bomLines.length} composants)`);
            const bom = await bomRepo.find({ where: { product: { id: chaise.id } }, relations: { component: true } });
            const cout = bom.reduce((s, l) => s + Number(l.quantity) * Number(l.component.prixAchat), 0);
            await productRepo.update(chaise.id, { coutRevient: cout + Number(chaise.coutMO) });
            console.log(`   ✓ Coût de revient recalculé : ${(cout + Number(chaise.coutMO)).toFixed(3)} DTN`);
        }
    }
    else {
        console.log('   ⚠ Pas assez de composants pour créer la BOM exemple — exécutez d\'abord des entrées de stock');
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
//# sourceMappingURL=seed.js.map