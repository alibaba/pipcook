# Project Guide

A clear project scope can help us make better choices. Here we will clearly define the source code, configuration and documentation parts that need to be included in Pipcook. This project Pipcook as an open source project, we should welcome different types of contributions at different levels, which will include the scope of the project mentioned earlier. The last discussion is about the plugin ecosystem, I will describe the unit organization structure of our plugin ecosystem and how to integrate it with NPM and JavaScript to develop together.

### Project scope

The project "Pipcook" software includes the followings:

- source code of the framework, high-level apis, command-line tools and builtin plugins.
- documents and specifications of framework, high-level apis, command-line tools and built plugins.
- a Web launcher for plugins discovery, dataset selection, pipeline creation, model deployment, and visualization.

The **plugin** plays an important role in this project, pipeline does schedule some of plugins which are wrapped as component and working together to output the model or service to deploy. Each plugin needs to follow the below:

- **MUST** be a NPM package, which means some files of `package.json` and a main file, TypeScript(*.ts) is recommended by default.
- **SHOULD** have a README for introducing the plugin.
- **SHOULD** have `tsdoc/jsdoc` annotations or HTML version for API references.
- **SHOULD** have unit tests for code quality.

### Release Lifecycle

Pipcook uses [semver][] for release management, therefore the release generally refers to "Major", "Minor", and "Patch".

For the **major** version, time-based release is often after the software and ecosystem are relatively mature, so major will use feature-based. Each major version of pipcook often needs to define the features of that version first, and then define the milestones to complete.

For the **minor** version, under the major version target is basically determined, the iteration period could be relatively fixed, so it can be time-based. Therefore, we define a minor version as 2 weeks and an even number as stable.

For the **patch** version, it basically fixes the existing versions, so it needs to be divided into different situations to discuss. For the latest version (such as 0.7.x), we can decide whether to release it based on whether there are daily bugfixes. For historical versions (such as 0.3.x, 0.4.x), we need to determine the severity of the bug, the relevance of the project, and community feedback to operate manually.

### Contributions & Contributors

After understanding the project scope and plugins, let's take a look at what types of contributions and contributors pipcook will accept as an open source project.

- contribution to web launcher
- contribution to command-line tools
- contribution to framework and high-level apis
- contribution to built-in plugin

> In addition to the above, we'll describe user-land plugin at the section "plugin ecosystem".

Each **contribution** mentioned above **MUST** follow these rules:

- contributor submits a pull request to describe the technical details.
- changes in this pull request include some of source code, document and configuration.
- changes in this pull request pass all the related build instructions.
- changes in this pull request receive over 1 approval from project collaborators.
  - changes of framework and high-level apis does require *core collaborators*' approvals.
  - changes of built-in plugin does require the *built-in plugin collaborators*' approvals.

We have also classified the **contributors** as follows:

- contributor: someone who has the contributions in the project scope.
- collaborator: project maintainer who does make improvements, fix bugs, and review pull requests.
  - *core collaborator* maintains all the project scope, focusing on framework, high-level apis and release management.
  - *built-in plugin collaborator* maintains specific one or more built-in plugins.

### Plugin ecosystem

The composition and requirements of the plugin was mentioned in the previous chapter, so here we will define some rules between plugins, namely plugin ecosystem.

From the maintainer's perspective, plugins can be divided into built-in and community ones:

- built-in plugins are maintained by core collaborators and released with the Pipcook.
- each community plugin is maintained and released by the author himself/herself, Pipcook can download the specified plugins through git, npm or oss.
- private plugin is maintained by private organization or company itself.

To help Pipcook discover all the plugins, the project provides some rules to let the Web launcher discover community ones:

- add GitHub topic "pipcook-plugin", see https://github.com/topics/pipcook-plugin.
- add "pipcook-plugin" in the `package.json`'s "keywords", see https://www.npmjs.com/search?q=keywords:pipcook-plugin.
- create a pull request to add the plugin URI by updating the `COMMUNITY_PLUGINS.md`.
- (to be added).

Community plugins can also be submitted as built-in plugins through pull requests, but this requires nomination by a core collaborator and the approvals of at least 2 collaborators.

[semver]: https://semver.org/
