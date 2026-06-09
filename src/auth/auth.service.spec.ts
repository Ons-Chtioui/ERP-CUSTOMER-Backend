import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import {
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// ─── Mock uuid avant tout import de auth.service ────────────────────────────
jest.mock('uuid', () => ({ v4: () => 'mock-uuid-1234' }));

import { AuthService } from './auth.service';
import { User } from '../users/user.entity';
import { LoginLog } from './entities/login-log.entity';
import { PasswordReset } from './entities/password-reset.entity';

// ─── Utilisateur de test ──────────────────────────────────────────────────────
const mockUser: Partial<User> = {
  id: 1,
  email: 'test@erp.com',
  password: bcrypt.hashSync('Password@123', 10),
  nom: 'Test',
  prenom: 'User',
  isActive: true,
  failedAttempts: 0,
  lockedUntil: null,
  role: {
    id: 1,
    nom: 'admin',
    label: 'Admin',
    permissions: [],
    users: [],
    createdAt: new Date(),
  },
  permissions: [],
};

const IP = '127.0.0.1';
const UA = 'Mozilla/5.0 Test';

// ─── Suite ───────────────────────────────────────────────────────────────────
describe('AuthService', () => {
  let service: AuthService;
  let usersRepo: jest.Mocked<Record<string, jest.Mock>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,

        // ── Repository<User> ──────────────────────────────────────
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn().mockResolvedValue({}),
            increment: jest.fn().mockResolvedValue({}),
          },
        },

        // ── Repository<LoginLog> ──────────────────────────────────
        {
          provide: getRepositoryToken(LoginLog),
          useValue: {
            create: jest.fn().mockReturnValue({}),
            save: jest.fn().mockResolvedValue({}),
            find: jest.fn().mockResolvedValue([]),
          },
        },

        // ── Repository<PasswordReset> ─────────────────────────────
        {
          provide: getRepositoryToken(PasswordReset),
          useValue: {
            create: jest.fn().mockReturnValue({}),
            save: jest.fn().mockResolvedValue({ id: 1 }),
            findOne: jest.fn(),
            update: jest.fn().mockResolvedValue({}),
            increment: jest.fn().mockResolvedValue({}),
            createQueryBuilder: jest.fn().mockReturnValue({
              update: jest.fn().mockReturnThis(),
              set: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              execute: jest.fn().mockResolvedValue({}),
            }),
          },
        },

        // ── JwtService ────────────────────────────────────────────
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock.jwt.token'),
          },
        },

        // ── ConfigService ─────────────────────────────────────────
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              const map: Record<string, string> = {
                JWT_ACCESS_SECRET: 'test_secret',
                JWT_ACCESS_EXPIRES: '15m',
                JWT_REFRESH_SECRET: 'test_refresh_secret',
                JWT_REFRESH_EXPIRES: '7d',
                FRONTEND_URL: 'http://localhost:3000',
              };
              return map[key] ?? null;
            }),
          },
        },

        // ── MailerService ─────────────────────────────────────────
        {
          provide: MailerService,
          useValue: { sendMail: jest.fn().mockResolvedValue({}) },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersRepo = module.get(getRepositoryToken(User));
  });

  afterEach(() => jest.clearAllMocks());

  // ─── TEST 1 : Login valide ──────────────────────────────────────────────────
  it('✅ devrait connecter un utilisateur avec des identifiants valides', async () => {
    usersRepo.findOne.mockResolvedValue(mockUser);

    const result = await service.login(
      { email: 'test@erp.com', password: 'Password@123' },
      IP,
      UA,
    );

    expect(result.accessToken).toBe('mock.jwt.token');
    expect(result.user.email).toBe('test@erp.com');
    expect(usersRepo.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ failedAttempts: 0, lockedUntil: null }),
    );
  });

  // ─── TEST 2 : Email inconnu ─────────────────────────────────────────────────
  it('❌ devrait rejeter si email inexistant', async () => {
    usersRepo.findOne.mockResolvedValue(null);

    await expect(
      service.login({ email: 'inconnu@erp.com', password: 'test' }, IP, UA),
    ).rejects.toThrow(UnauthorizedException);
  });

  // ─── TEST 3 : Mauvais mot de passe ─────────────────────────────────────────
  it('❌ devrait rejeter avec un mauvais mot de passe', async () => {
    usersRepo.findOne.mockResolvedValue({ ...mockUser, failedAttempts: 0 });

    await expect(
      service.login({ email: 'test@erp.com', password: 'MauvaisMotDePasse!' }, IP, UA),
    ).rejects.toThrow(UnauthorizedException);

    expect(usersRepo.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ failedAttempts: 1 }),
    );
  });

  // ─── TEST 4 : Compte désactivé ──────────────────────────────────────────────
  it('❌ devrait rejeter un compte désactivé', async () => {
    usersRepo.findOne.mockResolvedValue({ ...mockUser, isActive: false });

    await expect(
      service.login({ email: 'test@erp.com', password: 'Password@123' }, IP, UA),
    ).rejects.toThrow(ForbiddenException);
  });

  // ─── TEST 5 : Compte verrouillé ─────────────────────────────────────────────
  it('❌ devrait rejeter un compte verrouillé temporairement', async () => {
    const lockedUntil = new Date(Date.now() + 10 * 60 * 1000);
    usersRepo.findOne.mockResolvedValue({ ...mockUser, lockedUntil });

    await expect(
      service.login({ email: 'test@erp.com', password: 'Password@123' }, IP, UA),
    ).rejects.toThrow(ForbiddenException);
  });

  // ─── TEST 6 : Verrouillage après 5 échecs ──────────────────────────────────
  it('❌ devrait verrouiller le compte après 5 tentatives échouées', async () => {
    usersRepo.findOne.mockResolvedValue({ ...mockUser, failedAttempts: 4 });

    await expect(
      service.login({ email: 'test@erp.com', password: 'MauvaisMotDePasse!' }, IP, UA),
    ).rejects.toThrow(UnauthorizedException);

    expect(usersRepo.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        failedAttempts: 5,
        lockedUntil: expect.any(Date),
      }),
    );
  });
});
