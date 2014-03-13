# coding=utf-8

import os
from flask import Flask, render_template, request, Response
from flask_util_js.flask_util_js import FlaskUtilJs
from nyt_api import ArticleSearch, reduce_json
import json

app = Flask(__name__)
# flask_util.url_for() in JavaScript: https://github.com/kohlmannj/flask_util_js
fujs = FlaskUtilJs(app)
article_search_root_path = os.path.join(app.static_folder, "cache", "ArticleSearch")

searchInst = ArticleSearch(
    root_path=article_search_root_path,
    search_api_key="DBDF5A27451085ED9FC599DED425F0E4:8:53409433",
    debug=True
)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search.json', methods=['GET'])
def search():
    query_params = dict(request.args)
    query_params["fq"] = query_params["fq"][0]
    # Get the path to the full json path
    original_json_full_path = searchInst.search(**query_params)
    # original_json_full_path
    if original_json_full_path is not None:
        # Reformulate the JSON into whatever we're expecting on the other end
        reduced_json_full_path = reduce_json.reduce_by_year_with_multimedia(
            original_json_full_path,
            article_search_root_path
        )
        reduced_json_relative_path = reduced_json_full_path.replace(app.static_folder + "/", "")
        return app.send_static_file(reduced_json_relative_path)
    else:
        return json.dumps({})

if __name__ == '__main__':
    app.run()
