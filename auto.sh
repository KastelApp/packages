#!/bin/bash

doing=$1 # Are we Publishing, Linting, Formatting, or Testing? etc etc

# Remove the first argument from the list of arguments
packags=${@:2}

if [ "$doing" != "publish" ] && [ "$doing" != "lint" ] && [ "$doing" != "format" ] && [ "$doing" != "build" ]; then
    echo "Invalid command"
    exit 1
fi

for package in $packags; do
    if [ -d "packages/$package" ]; then
        echo "Found package $package"
        
        if [ "$doing" == "publish" ]; then
            yarn workspace "@kastelll/$package" npm publish --access=public
        fi
        
        if [ "$doing" == "lint" ]; then
            yarn workspace "@kastelll/$package" lint
        fi
        
        if [ "$doing" == "format" ]; then
            yarn workspace "@kastelll/$package" format
        fi
        
        if [ "$doing" == "test" ]; then
            yarn workspace "@kastelll/$package" test
        fi
        
    else
        echo "Package $package not found"
        exit 1
    fi

done
