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
const warehouse_entity_1 = require("../warehouses/entities/warehouse.entity");
const category_entity_1 = require("../components/entities/category.entity");
const supplier_entity_1 = require("../components/entities/supplier.entity");
const inventory_item_entity_1 = require("../components/entities/inventory-item.entity");
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
    { nom: 'components.view', module: 'Composants', action: 'Consulter' },
    { nom: 'components.create', module: 'Composants', action: 'Créer' },
    { nom: 'components.edit', module: 'Composants', action: 'Modifier' },
    { nom: 'components.delete', module: 'Composants', action: 'Supprimer' },
    { nom: 'bom.view', module: 'BOM', action: 'Consulter' },
    { nom: 'bom.create', module: 'BOM', action: 'Créer nomenclature' },
    { nom: 'bom.edit', module: 'BOM', action: 'Modifier' },
    { nom: 'bom.delete', module: 'BOM', action: 'Supprimer' },
    { nom: 'bom.produce', module: 'BOM', action: 'Lancer production' },
    { nom: 'clients.view', module: 'Clients', action: 'Consulter clients' },
    { nom: 'clients.create', module: 'Clients', action: 'Créer client' },
    { nom: 'clients.edit', module: 'Clients', action: 'Modifier client' },
    { nom: 'clients.delete', module: 'Clients', action: 'Supprimer client' },
    { nom: 'orders.view', module: 'Commandes', action: 'Consulter commandes' },
    { nom: 'orders.create', module: 'Commandes', action: 'Créer commande' },
    { nom: 'orders.edit', module: 'Commandes', action: 'Modifier commande' },
    { nom: 'orders.confirm', module: 'Commandes', action: 'Confirmer commande' },
    { nom: 'orders.process', module: 'Commandes', action: 'Traiter commande' },
    { nom: 'orders.cancel', module: 'Commandes', action: 'Annuler commande' },
    { nom: 'orders.delete', module: 'Commandes', action: 'Supprimer commande' },
    { nom: 'quotes.view', module: 'Commercial', action: 'Consulter devis' },
    { nom: 'quotes.create', module: 'Commercial', action: 'Créer devis' },
    { nom: 'quotes.edit', module: 'Commercial', action: 'Modifier devis' },
    { nom: 'quotes.delete', module: 'Commercial', action: 'Supprimer devis' },
    { nom: 'quotes.convert', module: 'Commercial', action: 'Convertir devis en facture' },
    { nom: 'invoices.view', module: 'Commercial', action: 'Consulter factures' },
    { nom: 'invoices.create', module: 'Commercial', action: 'Créer facture' },
    { nom: 'invoices.edit', module: 'Commercial', action: 'Modifier facture' },
    { nom: 'invoices.pay', module: 'Commercial', action: 'Enregistrer paiement' },
    { nom: 'invoices.cancel', module: 'Commercial', action: 'Annuler facture' },
    { nom: 'credits.create', module: 'Commercial', action: 'Créer avoir' },
    { nom: 'credits.view', module: 'Commercial', action: 'Consulter avoirs' },
    { nom: 'delivery.view', module: 'Commercial', action: 'Consulter bons de livraison' },
    { nom: 'delivery.create', module: 'Commercial', action: 'Créer bon de livraison' },
    { nom: 'delivery.edit', module: 'Commercial', action: 'Modifier bon de livraison' },
    { nom: 'delivery.delete', module: 'Commercial', action: 'Supprimer bon de livraison' },
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
        perms: [
            'users.view', 'users.create', 'users.edit', 'users.roles',
            'stock.view', 'stock.create', 'stock.edit', 'stock.transfer', 'stock.inventory',
            'components.view', 'components.create', 'components.edit',
            'bom.view', 'bom.create', 'bom.edit', 'bom.produce',
            'clients.view', 'clients.create', 'clients.edit',
            'orders.view', 'orders.create', 'orders.edit', 'orders.confirm', 'orders.process', 'orders.cancel',
            'quotes.view', 'quotes.create', 'quotes.edit', 'quotes.convert', 'quotes.delete',
            'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.pay', 'invoices.cancel',
            'credits.create', 'credits.view',
            'delivery.view', 'delivery.create', 'delivery.edit', 'delivery.delete',
            'reports.view', 'reports.export',
        ],
    },
    {
        nom: 'resp_stock',
        label: 'Responsable Stock',
        perms: [
            'stock.view', 'stock.create', 'stock.edit', 'stock.delete',
            'stock.transfer', 'stock.alert', 'stock.inventory',
            'components.view', 'components.create', 'components.edit',
            'bom.view', 'bom.create', 'bom.edit', 'bom.produce',
            'clients.view',
            'orders.view', 'orders.process',
            'delivery.view', 'delivery.edit',
        ],
    },
    {
        nom: 'resp_commercial',
        label: 'Responsable Commercial',
        perms: [
            'stock.view',
            'components.view',
            'bom.view',
            'clients.view', 'clients.create', 'clients.edit',
            'orders.view', 'orders.create', 'orders.confirm', 'orders.cancel',
            'quotes.view', 'quotes.create', 'quotes.edit', 'quotes.convert', 'quotes.delete',
            'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.pay', 'invoices.cancel',
            'credits.create', 'credits.view',
            'delivery.view', 'delivery.create', 'delivery.edit', 'delivery.delete',
            'reports.view',
        ],
    },
    {
        nom: 'comptable',
        label: 'Comptable',
        perms: [
            'stock.view',
            'clients.view', 'orders.view',
            'invoices.view', 'invoices.pay',
            'credits.view',
            'reports.view', 'reports.export',
        ],
    },
    {
        nom: 'operateur',
        label: 'Opérateur',
        perms: [
            'stock.view',
            'bom.view',
            'clients.view', 'orders.view',
            'delivery.view',
        ],
    },
];
const WAREHOUSES = [
    { nom: 'Entrepôt Sousse', code: 'WH-SOUSSE-01', ville: 'Sousse', pays: 'Tunisie' },
    { nom: 'Entrepôt Tunis', code: 'WH-TUNIS-02', ville: 'Tunis', pays: 'Tunisie' },
    { nom: 'Entrepôt Sfax', code: 'WH-SFAX-03', ville: 'Sfax', pays: 'Tunisie' },
];
const CATEGORIES = [
    { nom: 'Mobilier', description: 'Pièces pour mobilier' },
    { nom: 'Tissage', description: 'Produits textiles' },
    { nom: 'Plasturgie', description: 'Pièces plastiques' },
    { nom: 'Quincaillerie', description: 'Vis, écrous, rondelles' },
];
const SUPPLIERS = [
    { nom: 'Délice Textile SARL', code: 'DELICE-001', email: 'contact@delicetextile.tn', pays: 'Tunisie' },
    { nom: 'Plastico Tunis SA', code: 'PLASTICO-001', email: 'commercial@plasticotunis.tn', pays: 'Tunisie' },
    { nom: 'MécaSud Industries', code: 'MECASUD-001', email: 'contact@mecasud.com.tn', pays: 'Tunisie' },
];
const COMPONENTS = [
    { nom: 'Pied de chaise', reference: 'PIED-001', unite: 'unité', prixAchat: 2500, prixVente: 3250, seuilAlerte: 50 },
    { nom: 'Assise rembourrée', reference: 'ASSISE-001', unite: 'unité', prixAchat: 12000, prixVente: 15600, seuilAlerte: 30 },
    { nom: 'Dossier ergonomique', reference: 'DOSSIER-001', unite: 'unité', prixAchat: 18000, prixVente: 23400, seuilAlerte: 25 },
    { nom: 'Vis inox M6', reference: 'VIS-INOX-001', unite: 'unité', prixAchat: 150, prixVente: 200, seuilAlerte: 5000 },
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
    const warehouseRepo = app.get((0, typeorm_1.getRepositoryToken)(warehouse_entity_1.Warehouse));
    const categoryRepo = app.get((0, typeorm_1.getRepositoryToken)(category_entity_1.Category));
    const supplierRepo = app.get((0, typeorm_1.getRepositoryToken)(supplier_entity_1.Supplier));
    const inventoryRepo = app.get((0, typeorm_1.getRepositoryToken)(inventory_item_entity_1.InventoryItem));
    console.log('\n🌱 Création des permissions...');
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
    console.log('\n🌱 Création des rôles...');
    for (const r of ROLES_DEF) {
        const permsForRole = r.perms.map((n) => permMap[n]).filter(Boolean);
        let role = await roleRepo.findOne({ where: { nom: r.nom }, relations: { permissions: true } });
        if (!role) {
            role = roleRepo.create({ nom: r.nom, label: r.label, permissions: permsForRole });
            await roleRepo.save(role);
            console.log(`   + ${r.label} (${permsForRole.length} permissions)`);
        }
        else {
            role.permissions = permsForRole;
            await roleRepo.save(role);
            console.log(`   ↺ ${r.label} (${permsForRole.length} permissions)`);
        }
    }
    console.log('\n🌱 Création du Super Admin...');
    const superRole = await roleRepo.findOne({ where: { nom: 'super_admin' }, relations: { permissions: true } });
    const existing = await userRepo.findOne({ where: { email: 'admin@erp.com' } });
    if (!existing) {
        const hashed = await bcrypt.hash('Admin@1234', 12);
        await userRepo.save(userRepo.create({
            nom: 'Admin',
            prenom: 'Super',
            email: 'admin@erp.com',
            password: hashed,
            role: superRole,
            isActive: true,
            emailVerifiedAt: new Date(),
        }));
        console.log('   + admin@erp.com créé');
    }
    else {
        await userRepo.update(existing.id, { role: superRole });
        console.log('   ✓ Super Admin existant mis à jour');
    }
    console.log('\n🌱 Création des entrepôts...');
    for (const w of WAREHOUSES) {
        let warehouse = await warehouseRepo.findOne({ where: { code: w.code } });
        if (!warehouse) {
            warehouse = await warehouseRepo.save(warehouseRepo.create(w));
            console.log(`   + ${w.nom} (${w.code})`);
        }
    }
    console.log('\n🌱 Création des catégories...');
    for (const c of CATEGORIES) {
        let cat = await categoryRepo.findOne({ where: { nom: c.nom } });
        if (!cat) {
            cat = await categoryRepo.save(categoryRepo.create(c));
            console.log(`   + ${c.nom}`);
        }
    }
    console.log('\n🌱 Création des fournisseurs...');
    for (const s of SUPPLIERS) {
        let supplier = await supplierRepo.findOne({ where: { code: s.code } });
        if (!supplier) {
            supplier = await supplierRepo.save(supplierRepo.create(s));
            console.log(`   + ${s.nom}`);
        }
    }
    console.log('\n🌱 Création des composants...');
    const categories = await categoryRepo.find();
    const suppliers = await supplierRepo.find();
    const warehouses = await warehouseRepo.find();
    for (const c of COMPONENTS) {
        let comp = await compRepo.findOne({ where: { reference: c.reference } });
        if (!comp) {
            comp = await compRepo.save(compRepo.create({
                ...c,
                category: categories[0],
                supplier: suppliers[0],
            }));
            console.log(`   + ${c.nom} (${c.reference})`);
        }
    }
    console.log('\n🌱 Création du stock initial...');
    const components = await compRepo.find();
    for (const wh of warehouses) {
        for (const comp of components) {
            const existingStock = await inventoryRepo.findOne({
                where: { warehouse: { id: wh.id }, component: { id: comp.id } },
            });
            if (!existingStock) {
                await inventoryRepo.save(inventoryRepo.create({
                    warehouse: wh,
                    component: comp,
                    quantity: 100,
                    reservedQty: 0,
                }));
            }
        }
    }
    console.log(`   ✓ Stock initial créé pour ${warehouses.length} entrepôts`);
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
    const allComponents = await compRepo.find({ take: 5 });
    if (allComponents.length >= 3) {
        let chaise = await productRepo.findOne({ where: { reference: 'CHAISE-001' } });
        if (!chaise) {
            chaise = await productRepo.save(productRepo.create({
                nom: 'Chaise de bureau',
                reference: 'CHAISE-001',
                description: 'Chaise ergonomique avec assise rembourrée',
                unite: 'unité',
                prixVente: 89900,
                coutMO: 5000,
                seuilAlerte: 10,
                category: catMap['Sièges'],
            }));
            console.log('   + Chaise de bureau (CHAISE-001)');
        }
        const existingBom = await bomRepo.find({ where: { product: { id: chaise.id } } });
        if (existingBom.length === 0) {
            const bomLines = [
                { product: chaise, component: allComponents[0], quantity: 4 },
                { product: chaise, component: allComponents[1], quantity: 1 },
                { product: chaise, component: allComponents[2], quantity: 8 },
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
    console.log('\n✅ Seed terminé avec succès !');
    console.log(`   📧 Email    : admin@erp.com`);
    console.log(`   🔑 Password : Admin@1234`);
    console.log(`   📊 ${ALL_PERMISSIONS.length} permissions créées`);
    console.log(`   👤 ${ROLES_DEF.length} rôles créés`);
    await app.close();
}
seed().catch((err) => {
    console.error('❌ Erreur seed :', err);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map