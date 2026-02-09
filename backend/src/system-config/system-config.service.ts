import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const TOGGLE_KEYS = ['uploadProposalEnabled', 'reviewEnabled', 'uploadRevisionEnabled'];

@Injectable()
export class SystemConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllToggles() {
    const configs = await this.prisma.systemConfig.findMany({
      where: { configKey: { in: TOGGLE_KEYS } },
    });

    const result: Record<string, any> = {};
    for (const key of TOGGLE_KEYS) {
      const config = configs.find((c) => c.configKey === key);
      result[key] = config ? (config.configValue as any)?.enabled ?? false : false;
    }
    return result;
  }

  async getToggle(key: string) {
    if (!TOGGLE_KEYS.includes(key)) {
      throw new BadRequestException(`Toggle "${key}" tidak valid. Valid: ${TOGGLE_KEYS.join(', ')}`);
    }
    const config = await this.prisma.systemConfig.findUnique({
      where: { configKey: key },
    });
    return { key, enabled: config ? (config.configValue as any)?.enabled ?? false : false };
  }

  async updateToggle(key: string, enabled: boolean, adminUserId: string) {
    if (!TOGGLE_KEYS.includes(key)) {
      throw new BadRequestException(`Toggle "${key}" tidak valid`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Auto-exclusive: turn OFF others if turning ON
      if (enabled) {
        const otherKeys = TOGGLE_KEYS.filter((k) => k !== key);
        for (const otherKey of otherKeys) {
          await tx.systemConfig.upsert({
            where: { configKey: otherKey },
            update: { configValue: { enabled: false }, updatedBy: adminUserId },
            create: { configKey: otherKey, configValue: { enabled: false }, updatedBy: adminUserId },
          });
        }
      }

      // 2. Update target toggle
      await tx.systemConfig.upsert({
        where: { configKey: key },
        update: { configValue: { enabled }, updatedBy: adminUserId },
        create: { configKey: key, configValue: { enabled }, updatedBy: adminUserId },
      });

      // 3. Execute side effects
      if (key === 'reviewEnabled' && enabled) {
        // submitted → under_review
        await tx.proposal.updateMany({
          where: { status: 'submitted' },
          data: { status: 'under_review' },
        });
      }

      if (key === 'reviewEnabled' && !enabled) {
        // under_review → reviewed or not_reviewed based on review completion
        const underReviewProposals = await tx.proposal.findMany({
          where: { status: 'under_review' },
          include: {
            reviewerAssignments: {
              include: {
                penilaianAdministrasi: { select: { isComplete: true } },
                penilaianSubstansi: { select: { isComplete: true } },
              },
            },
          },
        });

        for (const proposal of underReviewProposals) {
          const allComplete = proposal.reviewerAssignments.length === 2 &&
            proposal.reviewerAssignments.every(
              (a) => a.penilaianAdministrasi?.isComplete && a.penilaianSubstansi?.isComplete,
            );

          await tx.proposal.update({
            where: { id: proposal.id },
            data: { status: allComplete ? 'reviewed' : 'not_reviewed' },
          });
        }
      }

      if (key === 'uploadRevisionEnabled' && enabled) {
        // reviewed → needs_revision (only for proposals that need revision)
        await tx.proposal.updateMany({
          where: { status: 'reviewed' },
          data: { status: 'needs_revision' },
        });
      }

      // Return updated state
      const allConfigs = await tx.systemConfig.findMany({
        where: { configKey: { in: TOGGLE_KEYS } },
      });
      const result: Record<string, any> = {};
      for (const k of TOGGLE_KEYS) {
        const config = allConfigs.find((c) => c.configKey === k);
        result[k] = config ? (config.configValue as any)?.enabled ?? false : false;
      }
      return result;
    });
  }
}
