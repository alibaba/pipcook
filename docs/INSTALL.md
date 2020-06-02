# Installing Pipcook

There are different ways to install [Pipcook][]:

- [Install via NPM][]. This is the best approach for most users. It will provide a stable version and pre-built packages are available for most platforms.
- [Build from source][]. This is best for users who want the latest-and-greatest features and aren’t afraid of running a brand-new code. This is also needed for users who wish to contribute to the project.

Before starting the installation, please make sure the following environments are correct:

- macOS, Linux
- Node.js 12

## Install via NPM

Installing [Pipcook][] via NPM is easy, just run:

```sh
$ npm install -g @pipcook/pipcook-cli
```

Then check if installed via `pipcook --help`.

## Install via Docker

Install [Pipcook Dockerfile](https://github.com/alibaba/pipcook/blob/master/Dockerfile). Then open
Dockerfile's path and install the docker image.

```sh
$ git clone https://github.com/alibaba/pipcook.git && cd pipcook
$ docker build -t alibaba/pipcook .
```

Check if the docker image is installed successfully.

```sh
$ docker images
REPOSITORY                                    TAG                 IMAGE ID            CREATED             SIZE
alibaba/pipcook                               latest              c297c73d62d4        7 hours ago         3.67GB
```

And run:

```sh
$ docker run -it --name pipcook_test alibaba/pipcook /bin/bash
```

## Troubleshooting

If you have any installation problems, please feedback to [issue tracker](https://github.com/alibaba/pipcook/issues/new).

[Install via NPM]: #install-via-npm
[Install via Docker]: #install-via-docker
[Build from source]: contributing/guide-to-contributor#download-source
[Pipcook]: https://github.com/alibaba/pipcook
