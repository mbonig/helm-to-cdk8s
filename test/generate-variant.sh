helm template ../src/ -f "../src/$1.yaml" > "$1.snapshot.yaml"
