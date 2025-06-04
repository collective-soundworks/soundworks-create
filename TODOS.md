
## Generalize over several templates

```
templates/
  js/
    template/
      config
      src
    infos.js
  ts/
    template/
    infos.js
```

- [ ] `infos.json`

```
  {
    name: 'js-minimal'
    description: "minimal template"
    clients: [
      {
        runtime: 'browser',
        name: 'controller',
        description: '...',
        path: 'src/clients/browser-controller.js' // could be a directory as well
      },
    ]
  }
```

- [ ] should allow get rid of the slpit between `app-templates` and `client-templates`
- [ ] get rid of `export.sh`
- [ ] allow to extend the list of templates by registering new directories, e.g.

```js
const templateDirectoryList = [`templates/js`, `templates/ts`, 'somewhere-else'];
const template = await chooseTemplate(templateDirectoryList);
```

