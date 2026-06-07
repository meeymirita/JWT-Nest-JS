import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthService } from "../auth.service";
import { ConfigService } from "@nestjs/config";
import { JwtPayload } from "../interfaces/jwt.interface";
import { Injectable } from "@nestjs/common";
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
        private readonly authService: AuthService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow('JWT_SECRET'),
            algorithms: ['HS256'],
        });
    }

    async validate(payload: JwtPayload) {
        return await this.authService.validate(payload.userId);
    }
}