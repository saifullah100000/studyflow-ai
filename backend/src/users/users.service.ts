import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: Date;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async create(data: CreateUserData): Promise<PublicUser> {
    try {
      return await this.prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash: data.passwordHash,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }

      throw error;
    }
  }

  async findPublicById(id: string): Promise<PublicUser | null> {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }
}
