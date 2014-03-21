# coding=utf-8
__author__ = 'kohlmannj'


class Config(object):
    DEBUG = False
    # NYT Article Search API Key
    # Request a key at http://developer.nytimes.com
    SEARCH_API_KEY = "PASTE_API_KEY_HERE"


class DevelopmentConfig(Config):
    DEBUG = True
