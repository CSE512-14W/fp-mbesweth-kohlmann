# coding=utf-8
__author__ = 'kohlmannj'

import os


class Config(object):
    DEBUG = False
    # NYT Article Search API Key
    # Request a key at http://developer.nytimes.com
    SEARCH_API_KEY = "PASTE_API_KEY_HERE"
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


class DevelopmentConfig(Config):
    DEBUG = True
