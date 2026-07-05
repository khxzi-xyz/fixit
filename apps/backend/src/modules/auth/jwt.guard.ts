import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { requireDb } from '../../common/db.util';
import type { Role } from './auth.service';

export interface AuthUser {
  sub: string;
  role: Role;
}
export interface AuthedRequest {
  headers: Record<string, string | undefined>;
  user?: AuthUser;
}

/** Restrict a route to specific roles: @Roles('ADMIN'). */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    @Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('missing bearer token');

    try {
      const decoded = await this.jwt.verifyAsync(header.slice(7));
      req.user = { sub: decoded.sub, role: decoded.role || 'CONSUMER' } as AuthUser;
      
      // If the token is from Supabase Auth (role='authenticated'), fetch real role from our users table
      if ((req.user.role as string) === 'authenticated' && this.db) {
        const { data } = await this.db.from('users').select('role').eq('user_id', req.user.sub).single();
        if (data?.role) {
          req.user.role = data.role as Role;
        } else {
          // Fallback
          req.user.role = 'CONSUMER';
        }
      }
    } catch {
      // If local verification fails, try Supabase Auth verification
      if (this.db) {
        const { data, error } = await this.db.auth.getUser(header.slice(7));
        if (error || !data.user) {
          console.error("Supabase Auth verification failed:", error);
          throw new UnauthorizedException('invalid or expired token');
        }
        
        req.user = { sub: data.user.id, role: 'CONSUMER' } as AuthUser;
        // Fetch real role from our users table
        const { data: userData } = await this.db.from('users').select('role').eq('user_id', req.user.sub).single();
        if (userData?.role) {
          req.user.role = userData.role as Role;
        } else {
          // Auto-upsert missing user from Supabase to our local users table
          await this.db.from('users').upsert({
            user_id: data.user.id,
            email: data.user.email ?? null,
            phone_number: data.user.phone ?? ('+000' + data.user.id.slice(0, 8)),
            full_name: data.user.user_metadata?.full_name ?? 'User',
            role: 'CONSUMER'
          });
        }
      } else {
        throw new UnauthorizedException('invalid or expired token');
      }
    }

    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (required?.length) {
      const role = req.user.role;
      let hasAccess = required.includes(role);
      
      // Implicitly grant access based on role hierarchy
      if (!hasAccess) {
        if (required.includes('CONSUMER') && (role === 'VENDOR' || role === 'ADMIN')) {
          hasAccess = true;
        } else if (required.includes('VENDOR') && role === 'ADMIN') {
          hasAccess = true;
        }
      }

      if (!hasAccess) {
        throw new ForbiddenException(`requires role: ${required.join(', ')}`);
      }
    }
    return true;
  }
}
