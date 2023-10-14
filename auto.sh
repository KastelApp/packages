#!/bin/bash

doing=$1 # Are we Publishing, Linting, Formatting, or Testing? etc etc

# Remove the first argument from the list of arguments
packags=${@:2}

# flags are anything with two dashes in front of it. The only supported flags are --public and --beta (these are for publishing)
flags=$(echo $packags | grep -o -- '--[^ ]*') # Get all the flags

# remove the flags from the list of packages
packags=$(echo $packags | sed -e 's/--[^ ]*//g')

access="private"
beta=false

packagesToInstall=""

if [ "$doing" == "install" ]; then
    packagesToInstall=$(echo $flags | grep -o -- '--install=[^ ]*' | sed -e 's/--install=//g' | sed -e 's/,/ /g')
    flags=$(echo $flags | sed -e 's/--install=[^ ]*//g')
fi

# if packages is just "all" then do ls to get all the packages in the packages folder
if [ "$packags" == "all" ]; then
    if [ "$doing" == "build" ] || [ "$doing" == "format" ] || [ "$doing" == "lint" ]; then
        yarn $doing
        exit 0
    fi
    packags=$(ls packages)
fi


if [ "$flags" != "" ]; then
    for flag in $flags; do

        if [ "$flag" != "--public" ] && [ "$flag" != "--beta" ]; then
            echo "Invalid flag $flag"
            exit 1
        fi

        if [ "$flag" == "--public" ]; then
            access="public"
        fi
        if [ "$flag" == "--beta" ]; then
            beta=true
        fi
    done
fi


if [ "$doing" != "publish" ] && [ "$doing" != "lint" ] && [ "$doing" != "format" ] && [ "$doing" != "build" ] && [ "$doing" != "install" ]; then
    echo "Invalid command"
    exit 1
fi

for package in $packags; do
    if [ -d "packages/$package" ]; then
        echo "Found package $package"

        if [ "$doing" == "publish" ]; then
            yarn workspace "@kastelll/$package" npm publish --access=$access --tag=$(if [ "$beta" == true ]; then echo "beta"; else echo "latest"; fi)
        fi

        if [ "$doing" == "lint" ]; then
            yarn workspace "@kastelll/$package" lint
        fi

        if [ "$doing" == "format" ]; then
            yarn workspace "@kastelll/$package" format
        fi

        if [ "$doing" == "build" ]; then
            yarn workspace "@kastelll/$package" build
        fi

        if [ "$doing" == "install" ]; then
            if [ "$packagesToInstall" == "" ]; then
                yarn workspace "@kastelll/$package" install
            else
                yarn workspace "@kastelll/$package" add $packagesToInstall
            fi
        fi

    else
        echo "Package $package not found"
        exit 1
    fi

done
