import { Core } from '@strapi/strapi';

export default {
  register({ strapi }: { strapi: any }) {
    // 保留 API 门禁逻辑（这是成功的，不要动）
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
    // 【核心修正】：删掉之前的 lifecycles.subscribe 部分！！
    // 只保留 Seeding 逻辑
    const seedData: Record<string, Array<{ name: string; slug: string }>> = {
      'api::publishing-channel.publishing-channel': [
        { name: 'Public (Website/SEO)', slug: 'public' },
        { name: 'Member (Private Site)', slug: 'member' },
      ],
      // ... 其余维度数据保持不变
    };
    // ... 执行 seeding 的循环逻辑
  },
};