#!/bin/bash
set -eu

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <tar.gz_file_to_download_and_extract>"
    exit 1
fi

# Get the tar.gz file name from the argument
TAR_FILE="$1"

function on_exit() {
  # Cleanup the temporary tar.gz file
  rm -f "$TAR_FILE"
}
# Run on any exit
trap on_exit EXIT

# Attempt to download the cache file
aws ${S3_BUILD_CACHE_AWS_PARAMS:-} s3 cp "s3://aztec-ci-artifacts/build-cache/$TAR_FILE" "$TAR_FILE" --quiet

# Extract the cache file
tar -xzf "$TAR_FILE"

echo "Cache download and extraction complete."