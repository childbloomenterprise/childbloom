// Edge middleware — returns 404 for scanner-bait paths so automated scanners
// don't report them as "exposed" just because the SPA catch-all returns 200.
// Runs at Vercel's edge before the rewrite layer.

const BLOCKED_EXACT = new Set([
  '/.env', '/.env.backup', '/.env.local', '/.env.production',
  '/.git/HEAD', '/.git/config', '/.git/COMMIT_EDITMSG',
  '/.htaccess', '/.svn/entries', '/.hg/hgrc',
  '/actuator', '/actuator/env', '/actuator/mappings',
  '/backup.sql', '/backup.zip', '/database.sql', '/db.sql', '/dump.sql',
  '/site.zip', '/www.zip',
  '/composer.json', '/config.json', '/config.yaml', '/config.yml',
  '/settings.json', '/webpack.config.js', '/app.config.js', '/requirements.txt',
  '/graphiql', '/metrics', '/server-info', '/server-status',
  '/swagger.json', '/swagger-ui.html', '/openapi.json', '/v1/api-docs',
  '/telescope', '/_debug',
  '/wp-config.php', '/wp-login.php',
]);

const BLOCKED_PREFIXES = [
  '/.env', '/.git/', '/.svn/', '/.hg/',
  '/wp-admin/', '/wp-login', '/wp-config',
  '/administrator/', '/phpmyadmin/', '/pma/', '/myadmin/',
  '/cpanel/', '/console/', '/panel/',
  '/debug/', '/_debug/',
  '/actuator/', '/telescope/',
];

export function middleware(request) {
  const { pathname } = new URL(request.url);

  if (
    BLOCKED_EXACT.has(pathname) ||
    BLOCKED_PREFIXES.some((p) => pathname.startsWith(p))
  ) {
    return new Response('Not Found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

export const config = {
  matcher: '/(.*)',
};
