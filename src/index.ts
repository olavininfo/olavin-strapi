import { Core } from '@strapi/strapi';

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    // 1. 注册 Document Service 全局中间件
    strapi.documents.use((context) => {
      // 仅拦截 Blog Post 的查询操作
      if (
        context.uid === 'api::blog-post.blog-post' &&
        (context.action === 'find' || context.action === 'findOne')
      ) {
        // 从 Strapi 全局请求上下文中获取 Header
        const requestContext = strapi.requestContext.get();
        const appHeader = requestContext?.headers?.['x-olavin-app'] || 'public';

        // 强行转换 params 类型以避免 TS 报属性不存在的错误
        const params = context.params as any;

        if (appHeader === 'public') {
          // 【官网模式】：仅限 public 渠道 + 已发布 + 时间到期
          params.filters = {
            ...(params.filters || {}),
            publishing_channels: { slug: { $eq: 'public' } },
            public_release_at: { $lte: new Date().toISOString() },
          };
          params.status = 'published';
        } else if (appHeader === 'member') {
          // 【私域模式】：仅限 member 渠道
          params.filters = {
            ...(params.filters || {}),
            publishing_channels: { slug: { $eq: 'member' } },
          };
        }
      }
    });
  },

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // 2. 自动初始化维度数据 (Seeding)
    // 使用 Record<string, any> 绕过尚未生成的 UID 类型检查
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
        // 使用 strapi.documents(uid as any) 解决 UID 字符串报错问题
        const existing = await strapi.documents(uid as any).findFirst({
          filters: { slug: record.slug },
        });

        if (!existing) {
          await strapi.documents(uid as any).create({
            data: record,
            status: 'published',
          });
          strapi.log.info(`🌱 Seeding: Created ${uid} -> ${record.slug}`);
        }
      }
    }
  },
};