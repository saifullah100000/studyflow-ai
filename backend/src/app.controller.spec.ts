import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { beforeEach, describe, expect, it } from '@jest/globals';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return a healthy status', () => {
      const response = appController.getHealth();

      expect(response.status).toBe('ok');
      expect(response.service).toBe('studyflow-api');
      expect(response.timestamp).toBeDefined();
    });
  });
});
