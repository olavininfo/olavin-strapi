import { Core } from '@strapi/strapi';

export default {
  register({ strapi }: { strapi: any }) {
    // 1. 注册 Document Service 全局中间件
    // 修正：必须是 async 函数，且必须调用 await next()
    strapi.documents.use(async (context, next) => {
      // 修正：Strapi v5 的查询动作名称为 findMany 和 findOne
      if (
        context.uid === 'api::blog-post.blog-post' &&
        (context.action === 'findMany' || context.action === 'findOne')
      ) {
        // 获取全局请求上下文
        // @ts-ignore
        const requestContext = strapi.requestContext.get();
        const appHeader = requestContext?.headers?.['x-olavin-app'] || 'public';

        if (appHeader === 'public') {
          // 【官网模式】：仅限已发布的 public 渠道且时间已到
          context.params.filters = {
            ...(context.params.filters || {}),
            publishing_channels: { slug: { $eq: 'public' } },
            public_release_at: { $lte: new Date().toISOString() },
          };
          context.params.status = 'published';
        } else if (appHeader === 'member') {
          // 【私域模式】：仅限 member 渠道
          context.params.filters = {
            ...(context.params.filters || {}),
            publishing_channels: { slug: { $eq: 'member' } },
          };
        }
      }
      
      // 必须返回并等待下一个中间件
      return await next();
    });
  },

  async bootstrap({ strapi }: { strapi: any }) {
    // 维度数据自动初始化逻辑（保持不变）
    const seedData: Record<string, Array<{ name: string; slug: string }>> = {
      'api::publishing-channel.publishing-channel': [
        { name: 'Public (Website/SEO)', slug: 'public' },
        { name: 'Member (Private Site)', slug: 'member' },
      ],
      'api::audience-role.audience-role': [
        { name: 'Winemaker', slug: 'winemaker' },
        { name: 'Owner', slug: 'owner' },
        { name: 'Wine Industry Engineering Company', slug: 'wine-industry-engineering-company' },
      ],
      'api::problem-scenario.problem-scenario': [
        { name: 'Equipment Selection & Trade-offs', slug: 'equipment-selection-trade-offs' },
        { name: 'System Design & Engineering Logic', slug: 'system-design-engineering-logic' },
        { name: 'Fermentation Performance & Control', slug: 'fermentation-control' },
        { name: 'Space Optimization & Layout Efficiency', slug: 'space-optimization' },
        { name: 'Cost Efficiency & Long-term ROI', slug: 'cost-efficiency' },
        { name: 'Winery Experience & Visitor-friendly Design', slug: 'winery-experience' },
        { name: 'Reliability, Service & Local Support', slug: 'reliability-service' },
        { name: 'Product Value Proposition & Differentiation', slug: 'product-differentiation' },
      ],
      'api::product-family.product-family': [
        { name: 'Fermentation & Storage Tank Systems', slug: 'fermentation-storage-tank' },
        { name: 'Mobile & Flexible Tank Solutions', slug: 'mobile-tank' },
        { name: 'Winery Layout & Access Platforms', slug: 'layout-platforms' },
        { name: 'Winery Accessories & Process Utilities', slug: 'accessories-utilities' },
      ],
    };

    for (const uid of Object.keys(seedData)) {
      const records = seedData[uid];
      for (const record of records) {
        try {
          // @ts-ignore
          const existing = await strapi.documents(uid as any).findFirst({
            filters: { slug: record.slug },
          });

          if (!existing) {
            // @ts-ignore
            await strapi.documents(uid as any).create({
              data: record,
              status: 'published',
            });
            strapi.log.info(`🌱 Seeding: Created ${uid} -> ${record.slug}`);
          }
        } catch (error) {
          strapi.log.error(`❌ Seeding Error for ${uid}: ${error.message}`);
        }
      }
    }
  },
};