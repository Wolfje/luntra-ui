/*
 * Fails a pull request that changes published source without adding a
 * changeset.
 *
 * The failure this prevents is quiet rather than loud: the code merges, CI is
 * green, and the fix simply never reaches npm — because `changeset version`
 * only bumps what it was told about. Someone discovers it weeks later when the
 * bug they reported is still there in the latest release.
 *
 * `changeset status --since` is not used here because it treats *any* change
 * under a package as needing a version bump, which makes it impossible to
 * touch a test file without inventing a patch release. The rule below is the
 * one that actually matters: does the published artifact change?
 */
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

const BASE_REF = process.env.BASE_REF || 'main';

/*
 * Paths that change what consumers install. Tests, internal tooling and
 * markdown are deliberately excluded — a release whose only content is
 * "renamed a test variable" is noise in a changelog people are supposed to
 * read, and a changelog people skim is a changelog that hides real breakage.
 */
const PUBLISHED = [/^packages\/[^/]+\/src\//, /^packages\/[^/]+\/package\.json$/];

const EXEMPT = [
  /\.test\.[cm]?[jt]sx?$/,
  /\.spec\.[cm]?[jt]sx?$/,
  /^packages\/[^/]+\/src\/test\//,
  /\.md$/,
];

function changedFiles() {
  // The merge base, not the tip of the base branch: comparing against the tip
  // would attribute every commit landed since this branch was cut to this PR.
  const mergeBase = execFileSync('git', ['merge-base', `origin/${BASE_REF}`, 'HEAD'], {
    encoding: 'utf8',
  }).trim();

  return execFileSync('git', ['diff', '--name-only', `${mergeBase}...HEAD`], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
}

function addsChangeset(files) {
  // A changeset added *in this pull request*, not one already sitting in the
  // directory from someone else's unreleased work.
  return files.some((file) => /^\.changeset\/.+\.md$/.test(file) && !file.endsWith('README.md'));
}

const files = changedFiles();
const relevant = files.filter(
  (file) => PUBLISHED.some((re) => re.test(file)) && !EXEMPT.some((re) => re.test(file)),
);

if (relevant.length === 0) {
  console.log('No changes to published source. No changeset required.');
  process.exit(0);
}

if (addsChangeset(files)) {
  const pending = readdirSync('.changeset').filter((f) => f.endsWith('.md') && f !== 'README.md');
  console.log(`Changeset present (${pending.length} pending in .changeset/).`);
  process.exit(0);
}

console.error(
  [
    'This pull request changes published source but adds no changeset.',
    '',
    'Changed:',
    ...relevant.map((file) => `  ${file}`),
    '',
    'Run `pnpm changeset` and commit the generated file. Pick the bump that',
    'describes what a consumer has to do:',
    '',
    '  patch  they upgrade and nothing about their code changes',
    '  minor  they can use something new, but nothing they wrote breaks',
    '  major  something they wrote will stop working',
    '',
    'If the change genuinely does not affect consumers, `pnpm changeset --empty`',
    'records that decision rather than leaving it implied.',
  ].join('\n'),
);

process.exit(1);
