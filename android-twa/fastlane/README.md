fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## Android

### android build

```sh
[bundle exec] fastlane android build
```

Build signed AAB

### android internal

```sh
[bundle exec] fastlane android internal
```

Upload to Internal Testing

### android promote_alpha

```sh
[bundle exec] fastlane android promote_alpha
```

Upload directly to Closed Alpha track

### android promote_production

```sh
[bundle exec] fastlane android promote_production
```

Promote Alpha → Production

### android deploy

```sh
[bundle exec] fastlane android deploy
```

Full deploy: build → internal (run this for every new release)

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
