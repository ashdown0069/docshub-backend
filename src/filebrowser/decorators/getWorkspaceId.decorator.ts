import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const getWorkspaceId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    return req.params.workspaceId;
  },
);
