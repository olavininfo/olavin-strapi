export default ({ env }) => ({
  // 1. 媒体存储配置（已对齐 R2 逻辑）
  upload: {
    config: {
      provider: 'aws-s3',
      providerOptions: {
        s3Options: {
          credentials: {
            accessKeyId: env('S3_ACCESS_KEY_ID'),
            secretAccessKey: env('S3_ACCESS_SECRET'),
          },
          endpoint: env('S3_ENDPOINT'),
          region: env('S3_REGION'),
          forcePathStyle: true,
          params: {
            Bucket: env('S3_BUCKET'),
          },
        },
        // 修正：确保 baseUrl 在 providerOptions 根级
        baseUrl: 'https://media.olavin.com', 
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },

  // 2. 修正后的 Algolia 配置（注入绝对防御逻辑）
  'strapi-algolia': {
    enabled: true,
    config: {
      apiKey: env('ALGOLIA_ADMIN_KEY'),
      applicationId: env('ALGOLIA_APP_ID'),
      contentTypes: [
        {
          name: 'api::blog-post.blog-post',
          id: 'documentId',
          // 绝对防御：确保无论数据如何，都必须返回合法的索引字符串
          index: (item: any) => {
            const channels = item?.publishing_channels;
            const hasPublic = Array.isArray(channels) && channels.some(c => 
              (c && typeof c === 'object' && c.slug === 'public') || c === 'public'
            );
            return hasPublic ? 'blog_post_public' : 'blog_post_member';
          },
          filters: {
            status: 'published'
          },
          // v5 嵌套 populate 语法
          populate: {
            publishing_channels: {
              fields: ['slug']
            }
          },
        },
      ],
    },
  },
});