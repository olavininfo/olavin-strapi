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
      indexPrefix: '', 
      contentTypes: [
        {
          name: 'api::blog-post.blog-post',
          id: 'documentId',
          // 设为占位符，禁用插件自带的不稳定分发逻辑
          index: 'sync_by_lifecycle', 
        },
      ],
    },
  },
});