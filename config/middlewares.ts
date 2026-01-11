export default [
  'strapi::errors', // 必须第一，用于捕获全栈错误
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:', 'http:'],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'market-assets.strapi.io',
            '*.cloudflarestorage.com',
            'media.olavin.com',
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'market-assets.strapi.io',
            '*.cloudflarestorage.com',
            'media.olavin.com',
          ],
          // 【关键修复】：Blocks 编辑器菜单属于 portal 弹出层，需要 unsafe-eval 权限
          'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https:'],
          'frame-src': ["'self'"],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::logger', // 标准位置：安全与 CORS 之后
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];