import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, ParseIntPipe, UseGuards,
  UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { ComponentsService } from './components.service';
import { CreateComponentDto } from './dto/create-component.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

// Assurer que le dossier uploads existe
const UPLOAD_DIR = join(process.cwd(), 'uploads', 'components');
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

const imageStorage = diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}${extname(file.originalname).toLowerCase()}`);
  },
});

@Controller('components')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ComponentsController {
  constructor(private readonly svc: ComponentsService) {}

  @Get()
  @RequirePermissions('stock.view')
  findAll(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('supplierId') supplierId?: string,
  ) {
    return this.svc.findAll({
      search,
      categoryId: categoryId ? +categoryId : undefined,
      supplierId: supplierId ? +supplierId : undefined,
    });
  }

  @Get('categories')
  @RequirePermissions('stock.view')
  categories() { return this.svc.findAllCategories(); }

  @Get('suppliers')
  @RequirePermissions('stock.view')
  suppliers() { return this.svc.findAllSuppliers(); }

  @Get(':id')
  @RequirePermissions('stock.view')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.svc.findOne(id); }

  @Get(':id/stock')
  @RequirePermissions('stock.view')
  stock(@Param('id', ParseIntPipe) id: number) { return this.svc.getStockSummary(id); }

  @Post()
  @RequirePermissions('stock.create')
  create(@Body() dto: CreateComponentDto) { return this.svc.create(dto); }

  @Put(':id')
  @RequirePermissions('stock.edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateComponentDto>,
  ) { return this.svc.update(id, dto); }

  @Delete(':id')
  @RequirePermissions('stock.delete')
  remove(@Param('id', ParseIntPipe) id: number) { return this.svc.deactivate(id); }

  // ── Upload image ─────────────────────────────────────────────────
  @Post(':id/image')
  @RequirePermissions('stock.edit')
  @UseInterceptors(FileInterceptor('image', {
    storage: imageStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo max
    fileFilter: (_req, file, cb) => {
      const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
      if (!allowed.test(file.originalname)) {
        return cb(new BadRequestException('Format non supporté (jpg, png, gif, webp)'), false);
      }
      cb(null, true);
    },
  }))
  async uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Aucun fichier reçu');
    const imageUrl = `/uploads/components/${file.filename}`;
    const updated = await this.svc.updateImageUrl(id, imageUrl);
    return { imageUrl: updated.imageUrl };
  }

  @Post('categories')
  @RequirePermissions('stock.create')
  createCategory(@Body() b: { nom: string; description?: string }) {
    return this.svc.createCategory(b.nom, b.description);
  }

  @Post('suppliers')
  @RequirePermissions('stock.create')
  createSupplier(@Body() b: Partial<import('./entities/supplier.entity').Supplier>) {
    return this.svc.createSupplier(b);
  }
}
