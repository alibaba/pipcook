# Collaborator Guide

> This is a fork of [Node.js Collaborator Guide](https://github.com/nodejs/node/blob/master/doc/guides/collaborator-guide.md#handling-own-pull-requests).

This document explains how collaborators manage the Pipcook project. Collaborators should understand the [guidelines for new contributors](./guide-to-contributor.md).

## Issues and Pull Requests

Mind these guidelines, the opinions of other collaborators. Notify other qualified parties for more input on an issue or a pull request.

### Welcoming First-Time Contributors

Always show courtesy to individuals submitting issues and pull requests. Be welcoming to first-time contributors, identified by the GitHub `first-time contributor` badge.

For first-time contributors, check if the commit author is the same as the pull request author. This way, once their pull request lands, GitHub will show them as a _Contributor_. Ask if they have configured their git [username][git-username] and [email][git-email] to their liking.

### Closing Issues and Pull Requests

Collaborators may close any issue or pull request that is not relevant to the future of the Node.js project. Where this is unclear, leave the issue or pull request open for several days to allow for discussion. Where this does not yield evidence that the issue or pull request has relevance, close it. Remember that issues and pull requests can always be re-opened if necessary.

### Author ready pull requests

A pull request is _author ready_ when:

* There is a CI run in progress or completed.
* There is at least one collaborator approval.
* There are no outstanding review comments.

Please always add the `author ready` label to the pull request in that case. Please always remove it again as soon as the conditions are not met anymore.

### Handling own pull requests

As soon as the pull request is ready to land, please do so. This allows other collaborators to focus on other pull requests. If your pull request is not ready to land but is [author ready](#author-ready-pull-requests), add the `author ready` label. If you wish to land the pull request yourself, use the "assign yourself" link to self-assign it.

## Accepting Modifications

Contributors propose modifications to Pipcook using GitHub pull requests. This includes modifications proposed by TSC members and other Collaborators. A pull request must pass code review and CI before landing into the codebase.

### Code Reviews

At least one collaborator must approve a pull request before the pull request lands.

Approving a pull request indicates that the collaborator accepts responsibility for the change.

Approval must be from collaborators who are not authors of the change.

### Consensus Seeking

If there are no objecting collaborators, a pull request may land if it has the needed [approvals](#code-reviews), [CI](#testing-and-ci), and [wait time](#waiting-for-approvals). If a pull request meets all requirements except the [wait time](#waiting-for-approvals), please add the [`author ready`](#author-ready-pull-requests) label.

Where there is disagreement among collaborators, consensus should be sought if possible.

Collaborators should not block a pull request without providing a reason. Another Collaborator may ask an objecting Collaborator to explain their objection. If the objector is unresponsive, another collaborator may dismiss the objection.

#### Helpful resources

* [How to Do Code Reviews Like a Human (Part One)](https://mtlynch.io/human-code-reviews-1/)
* [How to Do Code Reviews Like a Human (Part Two)](https://mtlynch.io/human-code-reviews-2/)
* [Code Review Etiquette](https://css-tricks.com/code-review-etiquette/)

### Waiting for Approvals

Before landing pull requests, allow 24 hours for input from other collaborators. Certain types of pull requests can be fast-tracked and may land after a shorter delay. For example:

* Focused changes that affect only documentation and/or the test suite:
  * `good-first-issue` pull requests may also be suitable.
* Changes that fix regressions:
  * Regressions that break the workflow (red CI or broken compilation).
  * Regressions that happen right before a release, or reported soon after.

### Testing and CI

All fixes must have a test case that demonstrates the defect. The test should fail before the change, and pass after the change.

All pull requests must pass continuous integration tests. Code changes must pass on GitHub Actions.

Do not land any pull requests without a passing (green or yellow) CI run.

### Breaking Changes

At least two members must approve backward-incompatible changes to the master branch.

Examples of breaking changes include:

* Removal or redefinition of existing API arguments.
* Changing return values.
* Removing or modifying existing properties on an options argument.
* Adding or removing errors.
* Altering expected to time of an event.
* Changing the side effects of using a particular API.

##### Reverting commits

Revert commits with `git revert <HASH>` or `git revert <FROM>..<TO>`. The generated commit message will not have a subsystem and may violate line length rules. That is OK. Append the reason for the revert and any `Refs` or `Fixes` metadata. Raise a pull request like any other change.

## Landing Pull Requests

1. Avoid landing pull requests that have someone else as an assignee. Authors who wish to land their own pull requests will self-assign them. Sometimes, an author will delegate to someone else. If in doubt, ask the assignee whether it is okay to land.
2. Use GitHub's green ["Merge Pull Request"][] button.
3. Make sure CI is complete and green. If the CI is not green, check for unreliable tests and infrastructure failures.
4. Check that the commit message adheres to [commit message guidelines][].

For pull requests from first-time contributors, be [welcoming](#welcoming-first-time-contributors). Also, verify that their git settings are to their liking.

All commits should be self-contained, meaning every commit should pass all tests. This makes it much easier when bisecting to find a breaking change.

["Merge Pull Request"]: https://help.github.com/articles/merging-a-pull-request/#merging-a-pull-request-on-github
[backporting guide]: backporting-to-release-lines.md
[commit message guidelines]: contributing/pull-requests.md#commit-message-guidelines
[commit-example]: https://github.com/nodejs/node/commit/b636ba8186
[git-username]: https://help.github.com/articles/setting-your-username-in-git/
[git-email]: https://help.github.com/articles/setting-your-commit-email-address-in-git/
