# Changesets

Releases are driven by [changesets](https://github.com/changesets/changesets).

## Add a changeset

```sh
pnpm changeset
```

Pick packages, bump type (patch/minor/major), write summary. Commit the generated `.md`.

## Release flow

1. PR merged with a changeset → GitHub Action opens a "Version Packages" PR.
2. Merging the "Version Packages" PR triggers `npm publish` for every bumped package and pushes git tags.
