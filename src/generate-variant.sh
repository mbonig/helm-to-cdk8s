helm template . -f "$1.yaml" > "../test/$1.snapshot.yaml"
