import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceMembershipController } from './workspace-membership.controller';
import { WorkspaceMembershipService } from './workspace-membership.service';

describe('WorkspaceMembershipController', () => {
  let controller: WorkspaceMembershipController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkspaceMembershipController],
      providers: [WorkspaceMembershipService],
    }).compile();

    controller = module.get<WorkspaceMembershipController>(WorkspaceMembershipController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
