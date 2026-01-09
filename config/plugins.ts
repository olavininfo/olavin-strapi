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
          // 增强版防御性索引判定逻辑
          index: (item: any) => {
            const defaultIndex = 'blog_post_member';
            try {
              // 在 v5 的某些生命周期中，publishing_channels 可能不存在或结构不同
              const channels = item.publishing_channels;
              
              if (Array.isArray(channels)) {
                const isPublic = channels.some(c => 
                  (typeof c === 'object' && c.slug === 'public') || c === 'public'
                );
                return isPublic ? 'blog_post_public' : defaultIndex;
              }
              
              return defaultIndex;
            } catch (e) {
              return defaultIndex;
            }
          },
          filters: {
            status: 'published'
          },
          // v5 标准对象 populate 格式
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