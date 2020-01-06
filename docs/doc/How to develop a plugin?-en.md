# How to develop a plugin?

pipcookwelcome developers to contribute to pipcook. This topic describes how to develop a plugin. The content in this topic is just a few suggestions, the specific plugins can be successfully run in pipcook as long as they comply with our plugin prototype specifications.


<a name="ff93a5f0"></a>
### Plugin Specification

---

First, we strongly recommend that you understand the plugin specifications defined by us. Only plug-ins that meet the interface defined by us can be accepted. For more information about the specifications of each plugin, see [Here](https://alibaba.github.io/pipcook/doc/developer%20guide-en) for plugin development specifications


<a name="bf4fba37"></a>
### Plugin development environment initialization

---

The pipcook cli tool provides a convenient way to initialize plugins to develop workspaces. You only need to run the following command:

```typescript
pipcook plugin-dev -t <plugin type>
cd template-plugin
npm install
```

The plug-in type can be:

- dataAccess
- dataCollect
- dataProcess
- modelEvaluate
- modelLoad
- modelTrain

You can initialize a development environment, which contains the following structure

- template-plugin
  - src
    - Index. ts // plug-in code main entry
  - Package. json // npm project configuration and dependency files
  - . Npmignore // npm release configuration file
  - Tsconfig. json // typescript compilation configuration file


<a name="b7c0bfff"></a>
### Debugging

---

During the development process, if you want to view the intermediate state of your plug-in code running, we recommend that you first make a mock data for the plug-in input, which must comply with the relevant prototype interface. If you feel that your plug-in has been developed, you can go to the pipcook project directory and run

```typescript
npm link ${root dir}
```

Install the plug-in to the pipcook project, and then create a test file in the examples file to link your plug-in to other related plug-ins/
