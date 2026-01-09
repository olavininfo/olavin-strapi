import { Core } from '@strapi/strapi';

export default {
  register({ strapi }: { strapi: any }) {
    // API 门禁逻辑（保持不变，已验证通过）
    strapi.documents.use(async (context, next) => {
      const requestContext = strapi.requestContext.get();
      if (!requestContext || !requestContext.url.startsWith('/api/')) {
        return await next();
      }
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
    // 【终极修复 2】：利用生命周期手动“修正”索引分流
    strapi.db.lifecycles.subscribe({
      models: ['api::blog-post.blog-post'],
      async afterUpdate(event) {
        const { result } = event;
        
        // 关键补丁：增加延迟并改用 db.query，避开 v5 Document Service 的 Transaction 锁定冲突
        setTimeout(async () => {
          try {
            // 使用 db.query 绕过文档服务层，确保在事务完成后能安全读取
            const entry = await strapi.db.query('api::blog-post.blog-post').findOne({
              where: { documentId: result.documentId },
              populate: ['publishing_channels']
            });

            if (entry && entry.publishedAt) {
              const algoliaService = strapi.plugin('strapi-algolia').service('algolia');
              const channels = entry.publishing_channels || [];
              const isPublic = channels.some((c: any) => c.slug === 'public');
              const isMember = channels.some((c: any) => c.slug === 'member');
              
              // 逻辑 A：处理 Public 索引 (支持 Hybrid)
              if (isPublic) {
                await algoliaService.saveObject(entry, 'blog_post_public');
              } else {
                await algoliaService.deleteObject(entry.documentId, 'blog_post_public');
              }

              // 逻辑 B：处理 Member 索引 (支持 Hybrid)
              if (isMember) {
                await algoliaService.saveObject(entry, 'blog_post_member');
              } else {
                await algoliaService.deleteObject(entry.documentId, 'blog_post_member');
              }

              strapi.log.info(`🚀 Algolia 同步成功: "${entry.title}" (Public: ${isPublic}, Member: ${isMember})`);
            }
          } catch (err) {
            strapi.log.error(`❌ Algolia 分流失败: ${err.message}`);
          }
        }, 1500);
      },
    });

    // Seeding 逻辑保持不变...
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