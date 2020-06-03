# Helm Chart to cdk8s migration example

This repository is my attempt to migrate a helm chart (for mysql) to a cdk8s module. If you'd like to read more about it
check out [the blog post](https://www.openconstructfoundation.org//helm-to-cdk8s/) on [the Open Construct Foundation](https://www.openconstructfoundation.org/).

## Design Notes

This code is not meant to be totally production worthy. There is a lot of refactoring I'd do to make things more 
readable and maintainable.

I tried to maintain reasonable parity with helm to encourage adoption.

## How to use

In its current state, you shouldn't. But if you want to use this an example for how to migrate a helm chart to cdk8s, 
go right ahead.

To synth:

```shell script
$ npm run build
```

## Values files

Helm has the concept of [Values](https://helm.sh/docs/chart_template_guide/values_files/) files, which can be provided via the '-f' flag. This cdk8s chart also supports this convention:

```shell script
$ npm run build -- -f src/variant-1.yaml
```

*Unlike helm, you need to get the '--' to pass values through npm and into the main.js runtime.*

## Namespace

Like helm, you can provide a namespace:

```shell script
$ npm run build -- --namespace=testing
```

## Release-Name

Like helm, you can set the release-name:

```shell script
$ npm run build -- -n some-release-name
```

## Contributing

Submit PRs or Issues [on github](https://github.com/mbonig/helm-to-cdk8s).
