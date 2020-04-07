# Get Started with CLI

Pipcook-cli is a pipcook command line tool that allows you to quickly execute a series of pipcook operations, including project initialization, project check, project start, and project log viewing.

## Installation

```sh
$ npm install @pipcook/pipcook-cli -g
```

## Project Init

```sh
$ pipcook --help
pipcook init [OPTIONS]
-c: npm client，for example cnpm, tnpm，etc. default is npm
so if you want to use cnpm client, you can use:
pipcook init -c cnpm
```

## View GUI Tools

```sh
$ pipcook board
```

## Start pipeline by config file

```sh
$ pipcook run [config-file]
```
