import { Core } from '@strapi/strapi';

export default {
  register({ strapi }: { strapi: any }) {
    // 【保留】API 门禁逻辑：这是稳定且必需的
    strapi.documents.use(async (context, next) => {
      const requestContext = strapi.requestContext.get();
      if (!requestContext || !requestContext.url.startsWith('/api/')) return await next();
      if (context.uid === 'api::blog-post.blog-post' && (context.action === 'findMany' || context.action === 'findOne')) {
        const appHeader = requestContext.headers?.['x-olavin-app'] || 'public';
        const params = context.params as any;
        if (appHeader === 'public') {
          params.filters = { ...params.filters, publishing_channels: { slug: { $eq: 'public' } }, public_release_at: { $lte: new Date().toISOString() } };
          params.status = 'published';
        } else if (appHeader === 'member') {
          params.filters = { ...params.filters, publishing_channels: { slug: { $eq: 'member' } } };
        }
      }
      return await next();
    });
  },

  async bootstrap({ strapi }: { strapi: any }) {
    // 【已移除】原本在这里的 Algolia 手动同步逻辑（生命周期钩子）

    // 【保留】Seeding 逻辑：确保基础维度数据存在
    const seedData: Record<string, any[]> = {
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
        { name: 'Product Value Proposition & Differentiation', slug: 'product-differentiation' }
      ],
      'api::product-family.product-family': [
        { name: 'Fermentation & Storage Tank Systems', slug: 'fermentation-storage-tank' },
        { name: 'Mobile & Flexible Tank Solutions', slug: 'mobile-tank' },
        { name: 'Winery Layout & Access Platforms', slug: 'layout-platforms' },
        { name: 'Winery Accessories & Process Utilities', slug: 'accessories-utilities' }
      ]
    };

    for (const uid of Object.keys(seedData)) {
      for (const record of seedData[uid]) {
        // @ts-ignore
        const existing = await strapi.documents(uid as any).findFirst({ filters: { slug: record.slug } });
        if (!existing) {
          // @ts-ignore
          await strapi.documents(uid as any).create({ data: record, status: 'published' });
        }
      }
    }
  },
};