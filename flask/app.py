# coding=utf-8
__author__ = 'kohlmannj'

import os
from flask import Flask, render_template, request, Response
from flask_util_js.flask_util_js import FlaskUtilJs
from nyt_api import ArticleSearch, reduce_json
import json
import urllib

app = Flask(__name__)
app.config.from_object('config.DevelopmentConfig')
# flask_util.url_for() in JavaScript: https://github.com/kohlmannj/flask_util_js
fujs = FlaskUtilJs(app)
# article_search_root_path = os.path.join(app.static_folder, "cache", "ArticleSearch")

searchInst = ArticleSearch(
    root_path=app.config["ARTICLE_SEARCH_ROOT"],
    search_api_key=app.config["SEARCH_API_KEY"],
    debug=app.config["DEBUG"],
    replace=False
)

@app.route('/')
def index():
    return render_template(
        'index.html',
        sample_queries=app.config["SAMPLE_QUERIES"]
    )


@app.route('/search/<fq>', methods=['GET'])
def search(fq):
    return render_template(
        'index.html',
        fq=fq,
        sample_queries=app.config["SAMPLE_QUERIES"]
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
