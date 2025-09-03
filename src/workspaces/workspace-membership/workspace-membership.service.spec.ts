import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceMembershipService } from './workspace-membership.service';

describe('WorkspaceMembershipService', () => {
  let service: WorkspaceMembershipService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkspaceMembershipService],
    }).compile();

    service = module.get<WorkspaceMembershipService>(WorkspaceMembershipService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
