/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'shared-must-not-import-features',
      comment: 'shared/ must not import from features/ (FSD layering violation)',
      severity: 'error',
      from: { path: '^shared/' },
      to: { path: '^features/' },
    },
    {
      name: 'shared-must-not-import-app',
      comment: 'shared/ must not import from app/ (FSD layering violation)',
      severity: 'error',
      from: { path: '^shared/' },
      to: { path: '^app/' },
    },
    {
      name: 'shared-must-not-import-server',
      comment: 'shared/ must not import from server/',
      severity: 'error',
      from: { path: '^shared/' },
      to: { path: '^server/' },
    },
    {
      name: 'app-must-not-import-shared-directly',
      comment: 'app/ route files must only import from features/, not shared/ (FSD layering)',
      severity: 'warn',
      from: { path: '^app/' },
      to: { path: '^shared/' },
    },
    {
      name: 'app-must-not-import-server',
      comment: 'app/ must not import from server/',
      severity: 'error',
      from: { path: '^app/' },
      to: { path: '^server/' },
    },
    {
      name: 'server-must-not-import-features',
      comment: 'server/ must not import from features/ (isolation)',
      severity: 'error',
      from: { path: '^server/' },
      to: { path: '^features/' },
    },
    {
      name: 'server-must-not-import-app',
      comment: 'server/ must not import from app/ (isolation)',
      severity: 'error',
      from: { path: '^server/' },
      to: { path: '^app/' },
    },
    {
      name: 'no-circular',
      comment: 'No circular dependencies allowed',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsConfig: {
      fileName: 'tsconfig.json',
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
      mainFields: ['main', 'types', 'typings'],
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/(?:@[^/]+/[^/]+|[^/]+)',
      },
    },
  },
};
