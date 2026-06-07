#!/bin/bash

# Check if graphify is installed
if ! command -v graphify &> /dev/null
then
    echo "graphify could not be found, installing..."
    # Assuming graphify is installed via pip
    pip install graphify
fi

graphify extract . --backend gemini
