# coding=utf-8
__author__ = 'kohlmannj'

import os
from collections import OrderedDict

class Config(object):
    DEBUG = False
    # NYT Article Search API Key
    # Request a key at http://developer.nytimes.com
    SEARCH_API_KEY = os.environ.get("SEARCH_API_KEY","")
    CACHE_ROOT = os.path.join(
        os.path.dirname(os.path.realpath(__file__)),
        "static",
        "cache"
    )
    ARTICLE_SEARCH_ROOT = os.path.join(
        CACHE_ROOT,
        "ArticleSearch"
    )
    QUERY_CACHE_PATH = os.path.join(
        CACHE_ROOT,
        "queries.json"
    )
    LIMIT_QUERIES = True


class DevelopmentConfig(Config):
    DEBUG = True
    LIMIT_QUERIES = False
