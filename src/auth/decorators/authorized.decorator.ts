import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { SafeUser } from '../interfaces/user.interface';

export const Authorized = createParamDecorator(
    (data: keyof SafeUser | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<Request & { user?: SafeUser }>();
        const user = request.user;

        return data ? user?.[data] : user;
    },
);