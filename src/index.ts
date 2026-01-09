import { Core } from '@strapi/strapi';

export default {
  register({ strapi }: { strapi: any }) {
    // 1. 注册 Document Service 全局中间件
    // 修正：必须是 async 函数，且必须调用 await next()
    strapi.documents.use(async (context, next) => {
      // 1. 获取全局请求上下文
      // @ts-ignore
      const requestContext = strapi.requestContext.get();

      // 【核心修正】：仅拦截 /api/ 开头的外部接口请求
      // 如果是后台管理界面的请求（URL 不含 /api/），则直接放行，不加任何过滤
      if (!requestContext || !requestContext.url.startsWith('/api/')) {
        return await next();
      }

      // 2. 仅拦截 Blog Post 相关的查询
      if (
        context.uid === 'api::blog-post.blog-post' &&
        (context.action === 'findMany' || context.action === 'findOne')
      ) {
        const appHeader = requestContext.headers?.['x-olavin-app'] || 'public';

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
    // Seeding 逻辑保持不变...
    // (此处略去之前的 seeding 代码，请保留您文件里已有的 seeding 部分)
  },
};