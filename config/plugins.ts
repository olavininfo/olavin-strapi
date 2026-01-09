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
      // 【关键修正 1】：禁止插件自动添加 production_ 前缀
      indexPrefix: '', 
      contentTypes: [
        {
          name: 'api::blog-post.blog-post',
          id: 'documentId',
          // 【关键修正 2】：更加健壮的索引分流逻辑
          index: (item: any) => {
            const channels = item.publishing_channels || [];
            // v5 插件在同步时，item 通常已经包含了 populate 后的数据
            const isPublic = channels.some((c: any) => 
              c.slug === 'public' || (typeof c === 'string' && c.includes('public'))
            );
            return isPublic ? 'blog_post_public' : 'blog_post_member';
          },
          filters: { status: 'published' },
          populate: {
            publishing_channels: { fields: ['slug'] }
          },
        },
      ],
    },
  },
});