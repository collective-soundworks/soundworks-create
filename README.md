# soundworks | create

[![npm version](https://badge.fury.io/js/@soundworks%2Fcreate.svg)](https://badge.fury.io/js/@soundworks%2Fcreate)

Interactive command line tools to create and manage [soundworks](https://soundworks.dev) application.

_Tutorial_: [https://soundworks.dev/tutorials/getting-started.html](https://soundworks.dev/tutorials/getting-started.html)

## Usage

### Application generator

```sh
npx @soundworks/create@latest
```

### Wizard in existing applications

```sh
npx soundworks
```

## Notes

### Development notes

To develop the application generator locally:

```sh
// link globally
// in `soundworks-create` directory:
npm link
// to create an app
npx @soundworks/create
// unlink globally
npm unlink --global @soundworks/create
npm ls --global
```

### Todos

- [ ] typescript template
- [ ] new client templates (connection screen, etc.)

## Credits

[https://soundworks.dev/credits.html](https://soundworks.dev/credits.html)

## License

[BSD-3-Clause](./LICENSE)
