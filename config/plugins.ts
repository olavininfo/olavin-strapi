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

  // 修正：此处 Key 必须与安装的包名 strapi-plugin-strapi-algolia 匹配
  'strapi-algolia': {
    enabled: true,
    config: {
      apiKey: env('ALGOLIA_ADMIN_KEY'),
      applicationId: env('ALGOLIA_APP_ID'),
      contentTypes: [
        {
          name: 'api::blog-post.blog-post',
          id: 'documentId',
          // 逻辑注入：根据发布渠道动态决定推送到哪个索引
          index: (item) => {
            const channels = item.publishing_channels || [];
            // 查找 slug 为 public 的记录（注意：v5 传给插件的对象通常包含关联关系数据）
            const hasPublic = channels.some(c => c.slug === 'public');
            return hasPublic ? 'blog_post_public' : 'blog_post_member';
          },
          // 只同步已发布的文章
          filters: {
            status: 'published'
          },
          populate: ['publishing_channels'],
        },
      ],
    },
  },
});