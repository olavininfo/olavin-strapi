export default ({ env }) => ({
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
      },
      // 核心修正：强制 Strapi 使用您的自定义域名输出 URL
      // 注意：必须包含完整的 https://
      baseUrl: 'https://media.olavin.com', 
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },
});