# pipcook-cli

Pipcook-cli is a pipcook command line tool that allows you to quickly execute a series of pipcook operations, including project initialization, project check, project start, and project log viewing.

<a name="RhDhK"></a>
#### Command line tool installation

```typescript
sudo npm install @pipcook/pipcook-cli -g
```

<a name="MEdO8"></a>
#### Initialize a pipcook project

```typescript
pipcook init [OPTIONS]

-c: npm client，for example cnpm, tnpm，etc. default is npm
so if you want to use cnpm client, you can use:
pipcook init -c cnpm
```

<a name="p1aoX"></a>
#### View the pipcook-board

```typescript
pipcook board
```

