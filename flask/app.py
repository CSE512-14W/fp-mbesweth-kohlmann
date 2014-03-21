# coding=utf-8
__author__ = 'kohlmannj'

import codecs
import os
from flask import Flask, render_template, request, Response
from flask_util_js.flask_util_js import FlaskUtilJs
from nyt_api import ArticleSearch, reduce_json
import json
import urllib


def write_query_to_cache(query, queries):
    queries = load_query_cache()
    cache_path = app.config["QUERY_CACHE_PATH"]
    # Prepend to the queries list if it isn't there already
    if query not in queries:
        queries.insert(0, query)
        if app.config["DEBUG"]:
            print "Adding %s to list of cached queries." % query
    # Write everything back. Yes, this is inefficient.
    input_file = codecs.open(cache_path, encoding="utf-8", mode="w")
    json.dump(queries, input_file)
    input_file.close()
    if app.config["DEBUG"]:
        print "Wrote updated list of cached queries to disk."


def load_query_cache():
    queries = []
    cache_path = app.config["QUERY_CACHE_PATH"]
    # Try to load existing queries
    if os.path.exists(cache_path) and os.path.isfile(cache_path):
        input_file = codecs.open(cache_path, encoding="utf-8", mode="r")
        queries = json.load(input_file)
        input_file.close()
        if app.config["DEBUG"]:
            print "Loaded cached queries from disk."
    return queries


# App Setup
app = Flask(__name__)
app.config.from_object('config.DevelopmentConfig')

# flask_util.url_for() in JavaScript: https://github.com/kohlmannj/flask_util_js
fujs = FlaskUtilJs(app)

searchInst = ArticleSearch(
    root_path=app.config["ARTICLE_SEARCH_ROOT"],
    search_api_key=app.config["SEARCH_API_KEY"],
    debug=app.config["DEBUG"],
    replace=False
)

queries = load_query_cache()

@app.route('/')
def index():
    return render_template(
        'index.html',
        queries=queries
    )


@app.route('/search/<fq>', methods=['GET'])
def search(fq):
    return render_template(
        'index.html',
        fq=fq,
        queries=queries
    )


@app.route('/search.json', methods=['GET'])
def search_json():
    query_params = dict(request.args)
    # Early return for bad params
    if "fq" not in query_params:
        return json.dumps(None)
    query_params["fq"] = " AND ".join(
        [urllib.unquote(fq).decode('utf8') for fq in query_params["fq"]]
    )
    # Write the query to cache
    write_query_to_cache(query_params["fq"], queries)
    # Get the path to the full json path
    original_json_full_path = searchInst.search(**query_params)
    # original_json_full_path
    if original_json_full_path is not None:
        # Reformulate the JSON into whatever we're expecting on the other end
        reduced_json_full_path = reduce_json.reduce_json(
            input_path=original_json_full_path,
            output_dir=app.config["ARTICLE_SEARCH_ROOT"],
            replace=False
        )
        reduced_json_relative_path = reduced_json_full_path.replace(app.static_folder + "/", "")
        return app.send_static_file(reduced_json_relative_path)
    else:
        return json.dumps(None)


if __name__ == '__main__':
    app.run()
