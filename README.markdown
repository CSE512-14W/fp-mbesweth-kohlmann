Nested Year Timelines (NYT)
===============
[Michael Beswetherick](http://stewed.co/), [Joe Kohlmann](https://kohlmannj.com/) {mbesweth,kohlmann}@uw.edu

Nested Year Timelines is a hierarchical timeline visualization that supports exploring large sets of news articles retrieved from the [New York Times Article Search API](http://developer.nytimes.com/docs/read/article_search_api_v2).

[![Teaser Graphic](Teaser2Small.png)](http://keynotesavant.com/)

## Live Demo

You should definitely go play with Nested Year Timelines at [keynotesavant.com](http://keynotesavant.com/). (Be gentle and patient with that server, please!)

## Credits

* Design Concept: **Michael and Joe**
* Data: [The New York Times](http://developer.nytimes.com/)
* Prototype Implementation: **Michael**
* New York Times API Wrangling and Python-Whispering: **Joe**
* Spit-Shining: **Joe**
* Late Nights: **Michael and Joe**

## [Poster](https://github.com/CSE512-14W/fp-mbesweth-kohlmann/raw/master/final/poster-mbesweth-kohlmann.pdf)

## [Final Paper](https://github.com/CSE512-14W/fp-mbesweth-kohlmann/raw/master/final/paper-mbesweth-kohlmann.pdf)

## Running Instructions

Again, check out the live version of NYT at [keynotesavant.com](http://keynotesavant.com/) if you haven't already.

If you're about to clone this repository and try to get this working on your own, keep reading.

### System Requirements

This is a Python job, so you'll need the following software to run Nested Year Timelines:

* [Python 2.7.5](http://python.org) (probably doesn't work with Python 3)
* [Flask 0.10](http://flask.pocoo.org)
* [Requests: HTTP for Humans](http://docs.python-requests.org/en/latest/)
* Maybe some other fourth thing (Python will tell you, I promise)

### Configure the App with config.py

Once you've cloned the repository, check out the `flask` folder. Inside you'll find `config_example.py`, which you should **duplicate** and rename `config.py`. Open it up and you'll see something like this:

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

### Request an Article Search API Key from The New York Times

Visit [developer.nytimes.com](http://developer.nytimes.com), create a user account, and [register your application](http://developer.nytimes.com/apps/register) for use with the Article Search API.

NYT will give you an API key, which you should paste into `config.py` to set the value of `SEARCH_API_KEY` to a valid API key string.

### Run the Flask Server

If you're just on your local machine, invoke `python` on the command line to start the Flask web server on [http://localhost:5000](http://localhost:5000):

	$ cd path/to/repo
	$ cd flask
	$ python app.py
	Loaded cached queries from disk.
	 * Running on http://127.0.0.1:5000/
	 
### Appendix: Cache Files and Folders

Check out `flask/static/cache/` for three (count 'em, three) types of cache files:

1. `queries.json`, which lists recent queries (for which there may exist cached data)
2. In the `ArticleSearch` folder, `61c5cce1ba03475e.json` (or something like that) is a cached JSON file containing all the NYT Article Search API results for a certain query.
	* Which query does a certain file represent, you ask? Good question. There's a rudimentary caching scheme in place that uses the search query value to generate a file name, so your guess is as good as mine. Check out the function `nyt_api.ArticleSearch.get_hash_for_query` for more on how those file names are generated.
	* I can tell you that `61c5cce1ba03475e.json` contains the cached results for the query `fq=persons:("Obama, Barack")`, however.
	* These cache files take a long time to generate since we have to retrieve however many thousands of article results from the NYT Article Search API to create them. I'd let them stick around if you can spare the megabytes.
3. In the `ArticleSearch` folder, `64d2ae7086249faf_reduce_by_year_and_month_with_multimedia.json` is a cache file containing the reduced data set that actually gets loaded into Nested Year Timelines. **These are both smaller and easier to regenerate,** so get rid of them whenever you want.

### Uh, That's It

Things should be up and running. Don't forget to have fun!

## License

It's [BSD-new](http://en.wikipedia.org/wiki/BSD_licenses#3-clause_license_.28.22Revised_BSD_License.22.2C_.22New_BSD_License.22.2C_or_.22Modified_BSD_License.22.29), dude. Read our license here: [LICENSE](https://github.com/CSE512-14W/fp-mbesweth-kohlmann/raw/master/LICENSE.txt)
