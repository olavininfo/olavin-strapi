import { Core } from '@strapi/strapi';

export default {
  register({ strapi }: { strapi: any }) {
    // API 门禁逻辑（保持不变）
    strapi.documents.use(async (context, next) => {
      const requestContext = strapi.requestContext.get();
      if (!requestContext || !requestContext.url.startsWith('/api/')) {
        return await next();
      }

      if (
        context.uid === 'api::blog-post.blog-post' &&
        (context.action === 'findMany' || context.action === 'findOne')
      ) {
        const appHeader = requestContext.headers?.['x-olavin-app'] || 'public';
        if (appHeader === 'public') {
          context.params.filters = {
            ...(context.params.filters || {}),
            publishing_channels: { slug: { $eq: 'public' } },
            public_release_at: { $lte: new Date().toISOString() },
          };
          context.params.status = 'published';
        } else if (appHeader === 'member') {
          context.params.filters = {
            ...(context.params.filters || {}),
            publishing_channels: { slug: { $eq: 'member' } },
          };
        }
      }
      return await next();
    });
  },

  async bootstrap({ strapi }: { strapi: any }) {
    // 【关键修复】：利用生命周期手动触发同步，确保关系数据已加载
    strapi.db.lifecycles.subscribe({
      models: ['api::blog-post.blog-post'],
      async afterUpdate(event) {
        const { result } = event;
        
        // 1. 手动获取带有完整 Publishing Channels 的文章
        const entry = await strapi.documents('api::blog-post.blog-post').findOne({
          documentId: result.documentId,
          populate: ['publishing_channels']
        });

        if (entry && entry.status === 'published') {
          try {
            const algoliaService = strapi.plugin('strapi-algolia').service('algolia');
            const isPublic = entry.publishing_channels?.some((c: any) => c.slug === 'public');
            const targetIndex = isPublic ? 'blog_post_public' : 'blog_post_member';
            
            // 2. 强制同步到目标索引
            await algoliaService.saveObject(entry, targetIndex);
            strapi.log.info(`🌱 Algolia: Manually synced "${entry.title}" to ${targetIndex}`);
          } catch (err) {
            strapi.log.error(`❌ Algolia Sync Error: ${err.message}`);
          }
        }
      },
    });

    // Seeding 逻辑（保留您原有的 Seeding 代码）
    // ...
  },
};