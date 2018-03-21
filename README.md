Setup:

1. Edit **package.json**, set `name`, `description`, `publish`, `repository.url`, `bugs.url`, `keywords`, and `license`
2. Edit **.jsdoc-conf.json**, set `systemName`
3. Change git remote: `git remote rm origin` then `git remote add origin new-repo`

Optional:

1. Rename **main.js**, and change **index.js** to include new name
2. Rename **test/mainTest.js**, make sure it ends with `Test.js`
3. Enable builds on TravisCI and Coveralls
