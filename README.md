# soundworks | create

[![npm version](https://badge.fury.io/js/@soundworks%2Fcreate.svg)](https://badge.fury.io/js/@soundworks%2Fcreate)

Interactive command line tools to create and manage [soundworks](https://soundworks.dev) applications.

_Tutorial_: [https://soundworks.dev/tutorials/getting-started.html](https://soundworks.dev/tutorials/getting-started.html)

## Usage

### Application generator

```sh
npx @soundworks/create@latest [app_name]
```

### Wizard in existing applications

```sh
npx soundworks
```

## Available Commands

```
Usage: wizard [options]

Options:
  -c, --create-client    create a new soundworks client
  -p, --install-plugins  install / uninstall soundworks plugins
  -l, --install-libs     install / uninstall related libs
  -f, --find-doc         find documentation about plugins and related libs
  -i, --config-infos     get config informations about you application
  -C, --create-env       create a new environment config file
  -b, --extend-build     extend the build settings (babel, webpack) of your project
  -e, --eject-launcher   eject the launcher and default views from `@soundworks/helpers`
  -d, --check-deps       check and update your dependencies
  -h, --help             display help for command
```

## Notes

### Development notes

To develop the application generator locally:

```sh
// link globally in `soundworks-create` directory:
sudo npm link
// create an app with --debug flag
npx @soundworks/create --debug
// later, unlink globally
sudo npm unlink --global @soundworks/create
npm ls --global
```

### Todos

- [ ] typescript template
- [ ] new client templates (connection screen, etc.)

## Credits

[https://soundworks.dev/credits.html](https://soundworks.dev/credits.html)

## License

[BSD-3-Clause](./LICENSE)
