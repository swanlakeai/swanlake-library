import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();

		if (!request.headers.authorization) {
			return true;
		}

		try {
			return (await super.canActivate(context)) as boolean;
		} catch (error) {
			return false;
		}
	}

	handleRequest(err, user, info, context, status) {
		if (err || !user) {
			return null;
		}
		return user;
	}
}
