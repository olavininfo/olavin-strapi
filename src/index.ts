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
    // 【核心修正 2】：手动接管 Algolia 同步
    strapi.db.lifecycles.subscribe({
      models: ['api::blog-post.blog-post'],
      async afterUpdate(event) {
        const { result } = event;
        
        // 延迟执行，确保数据库事务已完成
        setTimeout(async () => {
          try {
            // 手动获取包含关联数据的文章
            const entry = await strapi.documents('api::blog-post.blog-post').findOne({
              documentId: result.documentId,
              populate: ['publishing_channels']
            });

            // 仅在已发布状态下同步到 Algolia
            if (entry && entry.status === 'published') {
              const algoliaService = strapi.plugin('strapi-algolia').service('algolia');
              const isPublic = entry.publishing_channels?.some((c: any) => c.slug === 'public');
              const targetIndex = isPublic ? 'blog_post_public' : 'blog_post_member';
              
              // 调用插件服务进行同步
              await algoliaService.saveObject(entry, targetIndex);
              strapi.log.info(`🌱 Algolia Manual Sync: "${entry.title}" -> ${targetIndex}`);
            }
          } catch (err) {
            strapi.log.error(`❌ Algolia Manual Sync Failed: ${err.message}`);
          }
        }, 1000);
      },
    });

    // Seeding 逻辑保持不变...
  },
};