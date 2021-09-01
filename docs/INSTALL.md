# Installing Pipcook

There are different ways to install [Pipcook][]:

- [Install via NPM][]. This is the best approach for most users. It will provide a stable version and pre-built packages are available for most platforms.
- [Build from source][]. This is best for users who want the latest-and-greatest features and aren’t afraid of running a brand-new code. This is also needed for users who wish to contribute to the project.

Before starting the installation, please make sure the following environments are correct:

- macOS, Linux, Windows (Parts of pipelines ready, see [PR 843](https://github.com/alibaba/pipcook/issues/843).)
- Node.js >= 12.17 or >= 14.0.0

## Install via NPM

Installing [Pipcook][] via NPM is easy, just run:

```sh
$ npm install -g @pipcook/cli
```

Then check if installed via `pipcook --help`.

## Install via Docker

You could also install pipcook with Docker. Just run command:

```sh
$ docker pull pipcook/pipcook:latest
```

After pulling successfully, run command below to start:

```sh
$ docker run -it pipcook/pipcook:latest /bin/bash
```

## Troubleshooting

If you have any installation problems, please feedback to [issue tracker](https://github.com/alibaba/pipcook/issues/new).

[Install via NPM]: #install-via-npm
[Install via Docker]: #install-via-docker
[Build from source]: contributing/guide-to-contributor#download-source
[Pipcook]: https://github.com/alibaba/pipcook
