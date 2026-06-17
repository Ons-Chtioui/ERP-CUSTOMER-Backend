"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const client_entity_1 = require("./entities/client.entity");
let ClientsService = class ClientsService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    async generateCode() {
        const count = await this.repo.count();
        return `CLI-${String(count + 1).padStart(4, '0')}`;
    }
    async create(dto) {
        if (dto.email) {
            const existing = await this.repo.findOne({ where: { email: dto.email } });
            if (existing)
                throw new common_1.ConflictException(`Email "${dto.email}" déjà utilisé`);
        }
        return this.repo.save(this.repo.create({ ...dto, code: await this.generateCode() }));
    }
    async findAll(search) {
        if (search) {
            return this.repo.find({
                where: [
                    { name: (0, typeorm_2.ILike)(`%${search}%`) },
                    { email: (0, typeorm_2.ILike)(`%${search}%`) },
                    { code: (0, typeorm_2.ILike)(`%${search}%`) },
                ],
                order: { name: 'ASC' },
            });
        }
        return this.repo.find({ order: { name: 'ASC' } });
    }
    async findOne(id) {
        const client = await this.repo.findOne({ where: { id } });
        if (!client)
            throw new common_1.NotFoundException(`Client #${id} introuvable`);
        return client;
    }
    async update(id, dto) {
        const client = await this.findOne(id);
        if (dto.email && dto.email !== client.email) {
            const existing = await this.repo.findOne({ where: { email: dto.email } });
            if (existing)
                throw new common_1.ConflictException(`Email "${dto.email}" déjà utilisé`);
        }
        Object.assign(client, dto);
        return this.repo.save(client);
    }
    async remove(id) {
        const client = await this.findOne(id);
        await this.repo.remove(client);
    }
    async toggle(id) {
        const client = await this.findOne(id);
        client.isActive = !client.isActive;
        return this.repo.save(client);
    }
};
exports.ClientsService = ClientsService;
exports.ClientsService = ClientsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(client_entity_1.Client)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ClientsService);
//# sourceMappingURL=clients.service.js.map