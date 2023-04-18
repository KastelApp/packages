#!/bin/bash

packags=$@

if [ $# -eq 0 ]; then
  echo "No arguments provided"
  exit 1
fi

echo "Number of Packages We Are Publishing: $#"
echo "Packages We Are Publishing: $packags"

for package in $packags; do

if [ -d "packages/$package" ]; then
    echo "Package $package exists"
    cd packages/$package
    yarn format
    yarn lint
    npm publish
    cd ../..
else
  echo "Package $package does not exist"
  exit 1
fi

done
