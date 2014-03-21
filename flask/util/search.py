# coding=utf-8
__author__ = 'kohlmannj'

import re
import sys
import os
# Add one directory up to the system path
root_path = os.path.realpath(os.path.join(
    os.path.dirname(__file__),
    ".."
))
sys.path.append(root_path)
from config import DevelopmentConfig as Config
from nyt_api import ArticleSearch

# Use the command line arguments as query parameters
query = {}
for arg in sys.argv:
    matches = re.search("([^=]+)=([^=]+)", arg)
    try:
        query_field = matches.group(1)
        query_value = unicode(matches.group(2))
        if query_field in query:
            query[query_field] += u" AND " + query_value
        else:
            query[query_field] = query_value
    # Skip this arg if the matches are bad
    except IndexError:
        continue
    except AttributeError:
        continue

# Instantiate an ArticleSearch object
search = ArticleSearch(
    root_path=os.path.join(
        root_path,
        "static",
        "cache",
        "ArticleSearch"
    ),
    search_api_key=Config.SEARCH_API_KEY,
    debug=Config.DEBUG,
    replace=True
)

# Run a search and print the path to the results file
output_path = search.search(**query)
print "\n" + output_path
