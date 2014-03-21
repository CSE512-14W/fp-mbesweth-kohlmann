# coding=utf-8
__author__ = 'kohlmannj'

import sys
import os
from nyt_api.reduce_json import reduce_json

# Get the input file
try:
    input_path = sys.argv[1]
except IndexError:
    print "No input path specified."
    input_path = None

# Get the output directory
try:
    # Try to get an output directory specified by a command line argument
    output_dir = sys.argv[2]
except IndexError:
    # Use the current directory
    print "Outputting reduced JSON file to the current directory."
    output_dir = os.getcwd()

result = reduce_json(
    input_path=input_path,
    output_dir=output_dir,
    replace=True,
    try_to_eliminate_duplicates=True
)

print "\n" + result
