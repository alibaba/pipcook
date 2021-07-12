# Project Guide

A clear project scope can help us make better choices. Here we will clearly define the source code, configuration and documentation parts that need to be included in Pipcook. This project Pipcook as an open source project, we should welcome different types of contributions at different levels, which will include the scope of the project mentioned earlier. The last discussion is about the script ecosystem, I will describe the unit organization structure of our script ecosystem and how to integrate it with NPM and JavaScript to develop together.

### Project scope

The project "Pipcook" software includes the followings:

- source code of the framework, high-level apis, command-line tools and scripts.
- documents and specifications of framework, high-level apis, command-line tools and built scripts.
- a Web launcher for scripts discovery, dataset selection, pipeline creation, model deployment, and visualization.

The **script** plays an important role in this project, pipeline does schedule some of scripts which are wrapped as component and working together to output the model or service to deploy. Each script needs to follow the below:

- **MUST** be a NPM package, which means some files of `package.json` and a main file, TypeScript(*.ts) is recommended by default.
- **SHOULD** have a README for introducing the script.
- **SHOULD** have `tsdoc/jsdoc` annotations or HTML version for API references.
- **SHOULD** have unit tests for code quality.

### Release Lifecycle

Pipcook uses [semver][] for release management, therefore the release generally refers to "Major", "Minor", and "Patch".

For the **major** version, time-based release is often after the software and ecosystem are relatively mature, so major will use feature-based. Each major version of pipcook often needs to define the features of that version first, and then define the milestones to complete.

For the **minor** version, under the major version target is basically determined, the iteration period could be relatively fixed, so it can be time-based. Therefore, we define a minor version as 2 weeks and an even number as stable.

For the **patch** version, it basically fixes the existing versions, so it needs to be divided into different situations to discuss. For the latest version (such as 0.7.x), we can decide whether to release it based on whether there are daily bugfixes. For historical versions (such as 0.3.x, 0.4.x), we need to determine the severity of the bug, the relevance of the project, and community feedback to operate manually.

### Contributions & Contributors

After understanding the project scope and scripts, let's take a look at what types of contributions and contributors pipcook will accept as an open source project.

- contribution to web launcher
- contribution to command-line tools
- contribution to framework and high-level apis
- contribution to built-in script

> In addition to the above, we'll describe user-land script at the section "script ecosystem".

Each **contribution** mentioned above **MUST** follow these rules:

- contributor submits a pull request to describe the technical details.
- changes in this pull request include some of source code, document and configuration.
- changes in this pull request pass all the related build instructions.
- changes in this pull request receive over 1 approval from project collaborators.
  - changes of framework and high-level apis does require *core collaborators*' approvals.
  - changes of built-in script does require the *built-in script collaborators*' approvals.

We have also classified the **contributors** as follows:

- contributor: someone who has the contributions in the project scope.
- collaborator: project maintainer who does make improvements, fix bugs, and review pull requests.
  - *core collaborator* maintains all the project scope, focusing on framework, high-level apis and release management.
  - *built-in script collaborator* maintains specific one or more built-in scripts.

### Script ecosystem

The composition and requirements of the script was mentioned in the previous chapter, so here we will define some rules between scripts, namely script ecosystem.

From the maintainer's perspective, scripts can be divided into built-in and community ones:

- built-in scripts are maintained by core collaborators and released with the Pipcook.
- each community script is maintained and released by the author himself/herself, Pipcook can fetch the specified scripts through `http`, `https` or `file` protocol.
- private private is maintained by private organization or company itself.

To help Pipcook discover all the scripts, the project provides some rules to let the Web launcher discover community ones:

- add GitHub topic "pipcook-script", see https://github.com/topics/pipcook-script.
- create a pull request to add the script URI by updating the `COMMUNITY_SCRIPTS.md`.
- (to be added).

Community scripts can also be submitted as built-in scripts through pull requests, but this requires nomination by a core collaborator and the approvals of at least 2 collaborators.

[semver]: https://semver.org/

### Beta Release

The beta release will be built and published to npm every midnight if there is any commit in the past day.
The aim of having such a release is to provide a quick fix to existing bugs and access to new/experimental features that are not suitable to deploy under the production environment.

#### Usage

You can directly use the following command:
```bash
$ npm install @pipcook/pipcook-cli@beta -g
```

Or

```bash
$ npm install --tag beta @pipcook/pipcook-cli -g
```
