export default [
  'strapi::errors',
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
          // 【核心修正】：增加 'blob:'，允许 Blocks 编辑器运行弹出菜单脚本
          'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'blob:', 'https:'],
          'frame-src': ["'self'"],
          'worker-src': ["'self'", 'blob:'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];