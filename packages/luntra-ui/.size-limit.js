/*
 * Bundle size budgets, measured against the published `dist/` the way a
 * consumer's bundler would see it: tree-shaken, minified and brotlied, with
 * React excluded because it's a peer dependency nobody pays for twice.
 *
 * The limits sit just above the current numbers on purpose. A budget with
 * generous headroom never fires, which makes it decoration; this one turns a
 * size regression into a failing build with a number attached, at the commit
 * that caused it rather than six releases later.
 *
 * `import` matters. Measuring the whole barrel would tell us what the package
 * weighs, which nobody downloads; measuring a named import tells us what
 * someone using one component actually pays. The two Button entries are the
 * interesting pair — if importing from the barrel ever costs more than the
 * direct subpath, tree-shaking has broken and every consumer is silently
 * shipping components they never referenced.
 */
export default [
  {
    name: 'Button (named import from the barrel)',
    path: 'dist/components/index.js',
    import: '{ Button }',
    limit: '1.5 kB',
  },
  {
    name: 'Button (direct subpath)',
    path: 'dist/components/button/index.js',
    import: '{ Button }',
    limit: '1.5 kB',
  },
  {
    name: 'ThemeProvider',
    path: 'dist/components/index.js',
    import: '{ ThemeProvider }',
    limit: '1 kB',
  },
  {
    /*
     * The whole barrel, unshaken. Nobody should pay this, but if it ever
     * creeps far past the sum of its parts something has coupled the modules
     * together — a shared side-effecting import, usually.
     */
    name: 'Everything',
    path: 'dist/components/index.js',
    limit: '3 kB',
  },
];
