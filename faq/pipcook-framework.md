# Frequently Asked Questions

## Where should I put the Pipcook JSON config file?
<a id="q1"></a>
Pipcook runs daemon behind the scene and provide the service to the user via command line tool or Pipboard. There is no restriction on the current working directory or where you should put your config file. You can run `pipcook run <url>` at any location and url is the path of your config file, which can be both local path or remote url.

## Why is it so slow to install Pipcook
<a id="q2"></a>
Currently the installation of Pipcook and plugins rely on npm registry and pip(python) registry. Probably these default registries have slow connection to you. You can specify `pipcook init -c <npm client>`, for example, `pipcook init -c cnpm` to change your npm client. Meanwhile, you can use `pipcook init --tuna` to use tuna pip registry.

## Can I use Pipcook in Electron?
<a id="q3"></a>
Thereotically as long as the environment supports Node.js >= 12.17 or >= 14.0.0 and corresponding N-API, you can run Pipcook smoothly. Meanwhile, Pipcook will support to produce WASM model so that you can easily integrate the model to your system.

## Does Pipcook support Windows platform?
<a id="q4"></a>
Not yet. We will support Windows soon.
