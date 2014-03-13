__author__ = 'kohlmannj'

from nyt_api import ArticleSearch

search = ArticleSearch(
    root_path="/Users/kohlmannj/Dropbox/Documents/UDub/2014-01 Winter/CSE 512/Final Project/fp-mbesweth-kohlmann/flask/static/cache/ArticleSearch/",
    search_api_key="DBDF5A27451085ED9FC599DED425F0E4:8:53409433",
    debug=True
)

print search.search(
    fq=u'persons:("Obama, Barack")'
)
